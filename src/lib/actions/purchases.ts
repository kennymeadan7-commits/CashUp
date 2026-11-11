"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-guard";
import { MAX_PURCHASE_AMOUNT, MIN_PURCHASE_AMOUNT } from "@/lib/constants";
import { bestCashbackFor } from "@/lib/wallet";
import { splitCommission } from "@/lib/commission";
import { notify, purchaseApprovedNotification, purchaseRejectedNotification } from "@/lib/notifications";
import { back, ok, parseDate, str, toInt } from "@/lib/actions/shared";

export type PurchaseState = { error?: string };

const MAX_RECEIPT_LENGTH = 60;
const MAX_NOTE_LENGTH = 300;
const MAX_AGE_DAYS = 90;

/**
 * Déclare un achat : le cashback est calculé côté serveur (meilleure règle
 * applicable) puis l'achat attend la validation d'un administrateur.
 */
export async function declarePurchaseAction(
  _prev: PurchaseState,
  formData: FormData,
): Promise<PurchaseState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/connexion?next=${encodeURIComponent("/tableau-de-bord/achats/nouveau")}`);
  }
  if (user.suspended) {
    return { error: "Ce compte est suspendu." };
  }

  const storeId = str(formData, "storeId");
  const amount = toInt(str(formData, "amount"));
  const receiptRef = str(formData, "receiptRef");
  const purchasedAt = parseDate(str(formData, "purchasedAt"));
  const note = str(formData, "note");

  const store = storeId ? await prisma.store.findUnique({ where: { id: storeId } }) : null;
  if (!store || !store.active) {
    return { error: "Choisissez une boutique partenaire active." };
  }
  if (amount === null || amount < MIN_PURCHASE_AMOUNT || amount > MAX_PURCHASE_AMOUNT) {
    return {
      error: `Le montant doit être compris entre ${MIN_PURCHASE_AMOUNT} et ${MAX_PURCHASE_AMOUNT} FCFA.`,
    };
  }
  if (receiptRef.length < 3) {
    return { error: "Indiquez la référence du reçu ou du ticket de caisse." };
  }
  if (receiptRef.length > MAX_RECEIPT_LENGTH) {
    return { error: "La référence du reçu est trop longue." };
  }
  if (!purchasedAt) {
    return { error: "Indiquez la date de votre achat." };
  }
  const now = Date.now();
  if (purchasedAt.getTime() > now + 24 * 60 * 60 * 1000) {
    return { error: "La date d'achat ne peut pas être dans le futur." };
  }
  if (now - purchasedAt.getTime() > MAX_AGE_DAYS * 24 * 60 * 60 * 1000) {
    return { error: `Les achats de plus de ${MAX_AGE_DAYS} jours ne peuvent plus être déclarés.` };
  }
  if (note.length > MAX_NOTE_LENGTH) {
    return { error: "Votre note est trop longue (300 caractères maximum)." };
  }

  const offers = await prisma.offer.findMany({ where: { storeId: store.id, active: true } });
  const { cashback, offerId } = bestCashbackFor(store, offers, amount, purchasedAt);

  if (cashback <= 0) {
    return { error: "Cette boutique ne propose pas de cashback sur ce type d'achat." };
  }

  await prisma.purchase.create({
    data: {
      userId: user.id,
      storeId: store.id,
      offerId,
      amount,
      cashback,
      receiptRef,
      purchasedAt,
      note: note || null,
      status: "PENDING",
    },
  });

  revalidatePath("/tableau-de-bord");
  revalidatePath("/tableau-de-bord/achats");
  revalidatePath("/admin/achats");
  ok(
    "/tableau-de-bord/achats",
    `Achat déclaré : ${cashback} FCFA de cashback en attente de validation.`,
  );
}

/**
 * Valide ou refuse un achat déclaré (admin).
 * L'approbation crédite le portefeuille du membre dans la même transaction.
 */
export async function reviewPurchaseAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const purchaseId = str(formData, "purchaseId");
  const decision = str(formData, "decision");
  const adminNote = str(formData, "adminNote").slice(0, 300);
  const target = "/admin/achats";

  if (decision !== "APPROVED" && decision !== "REJECTED") {
    back(target, "Décision invalide.");
  }
  if (decision === "REJECTED" && adminNote.length < 3) {
    back(target, "Indiquez un motif de refus.");
  }

  const purchase = await prisma.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      store: true,
      user: { select: { name: true, email: true, phone: true } },
    },
  });
  if (!purchase) back(target, "Achat introuvable.");
  if (purchase.status !== "PENDING") back(target, "Cet achat a déjà été traité.");

  // Commission de la boutique (10–30 %) répartie 50/20/30 à l'approbation.
  const shares =
    decision === "APPROVED" ? splitCommission(purchase.amount, purchase.store.commissionRate) : null;

  const applied = await prisma.$transaction(async (tx) => {
    const updated = await tx.purchase.updateMany({
      where: { id: purchase.id, status: "PENDING" },
      data: {
        status: decision,
        adminNote: adminNote || null,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        ...(shares
          ? {
              commissionRate: shares.rate,
              commission: shares.commission,
              cashUpShare: shares.cashUp,
              feeShare: shares.fees,
              pointsShare: shares.points,
            }
          : {}),
      },
    });
    if (updated.count === 0) return false;

    if (decision === "APPROVED" && shares) {
      await tx.walletTransaction.create({
        data: {
          userId: purchase.userId,
          kind: "CREDIT",
          amount: purchase.cashback,
          label: `Cashback ${purchase.store.name}`,
          purchaseId: purchase.id,
        },
      });

      if (shares.points > 0) {
        await tx.pointTransaction.create({
          data: {
            userId: purchase.userId,
            kind: "EARN",
            amount: shares.points,
            label: `Points ${purchase.store.name}`,
            purchaseId: purchase.id,
          },
        });
      }
    }
    return true;
  });

  if (!applied) back(target, "Cet achat a déjà été traité.");

  // Notification du membre (in-app + e-mail/SMS) avant la redirection.
  await notify({
    userId: purchase.userId,
    recipient: { email: purchase.user.email, phone: purchase.user.phone },
    content:
      decision === "APPROVED"
        ? purchaseApprovedNotification({
            name: purchase.user.name,
            storeName: purchase.store.name,
            cashback: purchase.cashback,
            points: shares?.points ?? 0,
          })
        : purchaseRejectedNotification({
            name: purchase.user.name,
            storeName: purchase.store.name,
            reason: adminNote || "Achat non conforme aux critères de la plateforme.",
          }),
  });

  revalidatePath("/admin");
  revalidatePath("/admin/achats");
  revalidatePath("/tableau-de-bord");
  revalidatePath("/tableau-de-bord/achats");
  ok(
    target,
    decision === "APPROVED"
      ? `Achat validé : ${purchase.cashback} FCFA crédités et ${shares?.points ?? 0} points de fidélité versés.`
      : "Achat refusé : le membre a été notifié du motif.",
  );
}
