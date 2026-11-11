"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { requireMarchand } from "@/lib/marchand-guard";
import { MAX_PURCHASE_AMOUNT, MIN_PURCHASE_AMOUNT } from "@/lib/constants";
import { bestCashbackFor, getWallet } from "@/lib/wallet";
import { getPoints } from "@/lib/points";
import { splitCommission } from "@/lib/commission";
import { notify, purchaseApprovedNotification } from "@/lib/notifications";
import { back, ok, str, toInt } from "@/lib/actions/shared";

const PAYMENT_MODES = ["CASH", "WALLET", "POINTS"];
const MAX_CODE_ATTEMPTS = 6;

function generatePaymentCode(): string {
  const digits = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `PAY-${digits()}`;
}

/**
 * Crée une demande de paiement (parcours membre « Payer »).
 * Le paiement reste PENDING jusqu'à la confirmation du commerçant.
 */
export async function createPaymentAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent("/payer")}`);

  const code = str(formData, "code");
  const amount = toInt(str(formData, "amount"));
  const mode = str(formData, "mode");
  const pin = str(formData, "pin");

  const retryUrl = `/payer/confirmation?code=${encodeURIComponent(code)}&amount=${amount ?? ""}&mode=${encodeURIComponent(mode)}`;

  const store = await prisma.store.findUnique({ where: { code } });
  if (!store || !store.active) back(retryUrl, "Code marchand introuvable ou boutique inactive.");
  if (amount === null || amount < MIN_PURCHASE_AMOUNT || amount > MAX_PURCHASE_AMOUNT) {
    back(retryUrl, `Le montant doit être compris entre ${MIN_PURCHASE_AMOUNT} et ${MAX_PURCHASE_AMOUNT} FCFA.`);
  }
  if (!PAYMENT_MODES.includes(mode)) back(retryUrl, "Mode de paiement invalide.");
  if (!/^\d{6}$/.test(pin)) back(retryUrl, "Le code PIN CashUp comporte 6 chiffres.");
  if (user.suspended) back(retryUrl, "Ce compte est suspendu.");

  // Contrôle des fonds disponibles selon le mode choisi.
  if (mode === "WALLET") {
    const wallet = await getWallet(user.id);
    if (wallet.available < amount) {
      back(retryUrl, `Solde insuffisant : ${wallet.available} FCFA disponibles pour vos ${amount} FCFA.`);
    }
  }
  if (mode === "POINTS") {
    const points = await getPoints(user.id);
    if (points.balance < amount) {
      back(retryUrl, `Points insuffisants : ${points.balance} points disponibles pour ce paiement de ${amount} points.`);
    }
  }

  let paymentId: string | null = null;
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS && !paymentId; attempt += 1) {
    const paymentCode = generatePaymentCode();
    const existing = await prisma.paymentRequest.findUnique({ where: { code: paymentCode } });
    if (existing) continue;
    const created = await prisma.paymentRequest.create({
      data: {
        code: paymentCode,
        userId: user.id,
        storeId: store.id,
        amount,
        mode,
        status: "PENDING",
      },
    });
    paymentId = created.id;
  }
  if (!paymentId) back(retryUrl, "Impossible de générer une référence de paiement, réessayez.");

  revalidatePath("/marchand");
  redirect(`/payer/suivi?id=${paymentId}`);
}

/**
 * Confirme la réception d'un paiement (espace commerçant).
 * Dans la même transaction : achat APPROVED + cashback crédité + points versés.
 */
export async function confirmPaymentAction(formData: FormData): Promise<void> {
  const marchand = await requireMarchand();
  const paymentId = str(formData, "paymentId");
  const target = "/marchand";

  const payment = await prisma.paymentRequest.findUnique({
    where: { id: paymentId },
    include: {
      store: true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
  });
  if (!payment) back(target, "Paiement introuvable.");
  if (payment.status !== "PENDING") back(target, "Ce paiement a déjà été traité.");

  // Recontrôle des fonds au moment de la confirmation.
  if (payment.mode === "WALLET") {
    const wallet = await getWallet(payment.userId);
    if (wallet.available < payment.amount) {
      await prisma.paymentRequest.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      back(target, `Solde du membre insuffisant : le paiement de ${payment.amount} FCFA a été annulé.`);
    }
  }
  if (payment.mode === "POINTS") {
    const points = await getPoints(payment.userId);
    if (points.balance < payment.amount) {
      await prisma.paymentRequest.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: { status: "CANCELLED" },
      });
      back(target, `Points du membre insuffisants : le paiement de ${payment.amount} points a été annulé.`);
    }
  }

  const offers = await prisma.offer.findMany({
    where: { storeId: payment.storeId, active: true },
  });
  const { cashback, offerId } = bestCashbackFor(payment.store, offers, payment.amount, new Date());
  const shares = splitCommission(payment.amount, payment.store.commissionRate);
  const now = new Date();

  const applied = await prisma.$transaction(async (tx) => {
    const updated = await tx.paymentRequest.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "CONFIRMED", confirmedById: marchand.id, confirmedAt: now },
    });
    if (updated.count === 0) return null;

    const purchase = await tx.purchase.create({
      data: {
        userId: payment.userId,
        storeId: payment.storeId,
        offerId,
        amount: payment.amount,
        cashback,
        receiptRef: `Paiement ${payment.code}`,
        purchasedAt: now,
        note: `Paiement ${payment.mode} via Cashup`,
        status: "APPROVED",
        reviewedById: marchand.id,
        reviewedAt: now,
        commissionRate: shares.rate,
        commission: shares.commission,
        cashUpShare: shares.cashUp,
        feeShare: shares.fees,
        pointsShare: shares.points,
      },
    });

    if (payment.mode === "WALLET") {
      // Solde Cashup : débit immédiat du portefeuille.
      await tx.walletTransaction.create({
        data: {
          userId: payment.userId,
          kind: "DEBIT",
          amount: payment.amount,
          label: `Paiement ${payment.store.name}`,
          paymentRequestId: payment.id,
        },
      });
    } else if (payment.mode === "POINTS") {
      // Points Cashup : débit des points (1 point = 1 FCFA).
      await tx.pointTransaction.create({
        data: {
          userId: payment.userId,
          kind: "SPEND",
          amount: payment.amount,
          label: `Paiement ${payment.store.name}`,
          paymentRequestId: payment.id,
        },
      });
    }

    // Cashback crédité quels que soient le mode et l'espèce réglée.
    if (cashback > 0) {
      await tx.walletTransaction.create({
        data: {
          userId: payment.userId,
          kind: "CREDIT",
          amount: cashback,
          label: `Cashback ${payment.store.name}`,
          purchaseId: purchase.id,
        },
      });
    }

    if (shares.points > 0) {
      await tx.pointTransaction.create({
        data: {
          userId: payment.userId,
          kind: "EARN",
          amount: shares.points,
          label: `Points ${payment.store.name}`,
          purchaseId: purchase.id,
        },
      });
    }

    return purchase;
  });

  if (!applied) back(target, "Ce paiement a déjà été traité.");

  await notify({
    userId: payment.userId,
    recipient: { email: payment.user.email, phone: payment.user.phone },
    content: purchaseApprovedNotification({
      name: payment.user.name,
      storeName: payment.store.name,
      cashback,
      points: shares.points,
    }),
  });

  revalidatePath("/marchand");
  revalidatePath("/payer/suivi");
  revalidatePath("/tableau-de-bord");
  revalidatePath("/tableau-de-bord/achats");
  revalidatePath("/admin");
  revalidatePath("/admin/achats");
  ok(
    target,
    `Paiement confirmé : ${payment.amount} FCFA encaissés, ${cashback} FCFA de cashback crédités à ${payment.user.name}.`,
  );
}

/** Annule un paiement en attente (membre ou commerçant). */
export async function cancelPaymentAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect(`/connexion?next=${encodeURIComponent("/payer")}`);

  const paymentId = str(formData, "paymentId");
  const payment = await prisma.paymentRequest.findUnique({ where: { id: paymentId } });
  if (!payment) back("/payer", "Paiement introuvable.");

  const isMerchant = user.role === "MARCHAND" || user.role === "ADMIN";
  if (payment.userId !== user.id && !isMerchant) back("/tableau-de-bord", "Action non autorisée.");
  if (payment.status !== "PENDING") {
    back(isMerchant ? "/marchand" : `/payer/suivi?id=${payment.id}`, "Ce paiement a déjà été traité.");
  }

  await prisma.paymentRequest.updateMany({
    where: { id: payment.id, status: "PENDING" },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/marchand");
  const target = isMerchant ? "/marchand" : `/payer/suivi?id=${payment.id}`;
  ok(target, "Paiement annulé.");
}
