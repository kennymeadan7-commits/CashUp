"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-guard";
import { MIN_WITHDRAWAL, WITHDRAWAL_METHODS, withdrawalMethodLabel } from "@/lib/constants";
import { checkRateLimit, hitRateLimit } from "@/lib/rate-limit";
import {
  notify,
  withdrawalPaidNotification,
  withdrawalReceivedNotification,
  withdrawalRejectedNotification,
} from "@/lib/notifications";
import { back, ok, str, toInt, waitMessage } from "@/lib/actions/shared";

export type WithdrawalState = { error?: string };

const MAX_PHONE_DIGITS = 15;
const WITHDRAWAL_WINDOW_MS = 60 * 60 * 1000;
const WITHDRAWAL_LIMIT = 5;

/**
 * Demande de retrait des gains vers Mobile Money.
 * Les fonds sont réservés (retrait PENDING) jusqu'au traitement admin.
 */
export async function requestWithdrawalAction(
  _prev: WithdrawalState,
  formData: FormData,
): Promise<WithdrawalState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent("/tableau-de-bord/retraits")}`);
  }
  if (user.suspended) {
    return { error: "Ce compte est suspendu." };
  }

  const amount = toInt(str(formData, "amount"));
  const method = str(formData, "method");
  const phone = str(formData, "phone").replace(/\s+/g, "");

  const methodValid = WITHDRAWAL_METHODS.some((m) => m.value === method);
  if (!methodValid) {
    return { error: "Choisissez un opérateur Mobile Money." };
  }
  if (amount === null || amount < MIN_WITHDRAWAL) {
    return { error: `Le montant minimum de retrait est de ${MIN_WITHDRAWAL} FCFA.` };
  }
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > MAX_PHONE_DIGITS) {
    return { error: "Numéro Mobile Money invalide (8 à 15 chiffres)." };
  }

  // Limite de débit : protège les demandes de retrait en rafale.
  const rateKey = `withdraw:${user.id}`;
  const retryAfter = checkRateLimit(rateKey, WITHDRAWAL_LIMIT, WITHDRAWAL_WINDOW_MS);
  if (retryAfter !== null) return { error: waitMessage(retryAfter) };
  hitRateLimit(rateKey, WITHDRAWAL_WINDOW_MS);

  // Vérification du solde dans la même transaction que la création :
  // deux retraits simultanaires ne peuvent pas dépasser le disponible.
  let failure: string | null = null;

  await prisma.$transaction(async (tx) => {
    const [credits, debits, pending] = await Promise.all([
      tx.walletTransaction.aggregate({
        where: { userId: user.id, kind: "CREDIT" },
        _sum: { amount: true },
      }),
      tx.walletTransaction.aggregate({
        where: { userId: user.id, kind: "DEBIT" },
        _sum: { amount: true },
      }),
      tx.withdrawal.aggregate({
        where: { userId: user.id, status: "PENDING" },
        _sum: { amount: true },
      }),
    ]);

    const available =
      (credits._sum.amount ?? 0) - (debits._sum.amount ?? 0) - (pending._sum.amount ?? 0);

    if (amount > available) {
      failure = `Solde disponible insuffisant (${Math.max(0, available)} FCFA disponibles).`;
      return;
    }

    await tx.withdrawal.create({
      data: {
        userId: user.id,
        amount,
        method,
        phone: digits,
        status: "PENDING",
      },
    });
  });

  if (failure) return { error: failure };

  await notify({
    userId: user.id,
    recipient: { email: user.email, phone: user.phone },
    content: withdrawalReceivedNotification({
      name: user.name,
      amount,
      method,
    }),
  });

  revalidatePath("/tableau-de-bord");
  revalidatePath("/tableau-de-bord/retraits");
  revalidatePath("/admin/retraits");
  ok(
    "/tableau-de-bord/retraits",
    `Demande de retrait de ${amount} FCFA envoyée : traitement sous 48 h ouvrées.`,
  );
}

/** Marque un retrait comme payé ou rejeté (admin). */
export async function processWithdrawalAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const withdrawalId = str(formData, "withdrawalId");
  const decision = str(formData, "decision");
  const adminNote = str(formData, "adminNote").slice(0, 300);
  const target = "/admin/retraits";

  if (decision !== "PAID" && decision !== "REJECTED") {
    back(target, "Décision invalide.");
  }
  if (decision === "REJECTED" && adminNote.length < 3) {
    back(target, "Indiquez un motif de rejet.");
  }

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { user: { select: { name: true, email: true, phone: true } } },
  });
  if (!withdrawal) back(target, "Retrait introuvable.");
  if (withdrawal.status !== "PENDING") back(target, "Ce retrait a déjà été traité.");

  const applied = await prisma.$transaction(async (tx) => {
    const updated = await tx.withdrawal.updateMany({
      where: { id: withdrawal.id, status: "PENDING" },
      data: {
        status: decision,
        adminNote: adminNote || null,
        processedById: admin.id,
        processedAt: new Date(),
      },
    });
    if (updated.count === 0) return false;

    if (decision === "PAID") {
      await tx.walletTransaction.create({
        data: {
          userId: withdrawal.userId,
          kind: "DEBIT",
          amount: withdrawal.amount,
          label: `Retrait ${withdrawalMethodLabel(withdrawal.method)}`,
          withdrawalId: withdrawal.id,
        },
      });
    }
    return true;
  });

  if (!applied) back(target, "Ce retrait a déjà été traité.");

  await notify({
    userId: withdrawal.userId,
    recipient: { email: withdrawal.user.email, phone: withdrawal.user.phone },
    content:
      decision === "PAID"
        ? withdrawalPaidNotification({
            name: withdrawal.user.name,
            amount: withdrawal.amount,
            method: withdrawal.method,
            phone: withdrawal.phone,
          })
        : withdrawalRejectedNotification({
            name: withdrawal.user.name,
            amount: withdrawal.amount,
            reason: adminNote || "Demande non conforme.",
          }),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/retraits");
  revalidatePath("/tableau-de-bord");
  revalidatePath("/tableau-de-bord/retraits");
  ok(
    target,
    decision === "PAID"
      ? `Retrait de ${withdrawal.amount} FCFA marqué comme versé.`
      : "Retrait rejeté : les fonds sont de nouveau disponibles.",
  );
}
