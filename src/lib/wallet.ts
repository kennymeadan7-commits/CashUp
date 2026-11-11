import type { Offer, Store } from "@prisma/client";
import { prisma } from "@/lib/db";

// ---------------------------------------------------------------------------
// Règles de calcul du cashback
// ---------------------------------------------------------------------------

type CashbackRule = {
  cashbackType: string; // PERCENT | FIXED
  cashbackRate: number | null; // taux en %
  cashbackFixed: number | null; // montant fixe en FCFA
};

/** Cashback pour une règle donnée (taux en % ou montant fixe). */
export function cashbackOf(rule: CashbackRule, amount: number): number {
  if (rule.cashbackType === "FIXED") {
    return Math.max(0, Math.round(rule.cashbackFixed ?? 0));
  }
  const rate = rule.cashbackRate ?? 0;
  return Math.max(0, Math.round((amount * rate) / 100));
}

function offerApplicable(offer: Offer, at: Date): boolean {
  if (!offer.active) return false;
  if (at.getTime() < offer.startsAt.getTime()) return false;
  if (offer.endsAt && at.getTime() > offer.endsAt.getTime()) return false;
  return true;
}

/**
 * Calcule le cashback d'un achat : la meilleure règle applicable entre le taux
 * par défaut de la boutique et ses offres en cours de validité.
 */
export function bestCashbackFor(
  store: Pick<Store, "cashbackType" | "cashbackRate" | "cashbackFixed">,
  offers: Offer[],
  amount: number,
  purchasedAt: Date,
): { cashback: number; offerId: string | null } {
  let best = { cashback: cashbackOf(store, amount), offerId: null as string | null };

  for (const offer of offers) {
    if (!offerApplicable(offer, purchasedAt)) continue;
    const cashback = cashbackOf(offer, amount);
    if (cashback > best.cashback) best = { cashback, offerId: offer.id };
  }

  return best;
}

// ---------------------------------------------------------------------------
// Portefeuille
// ---------------------------------------------------------------------------

export type WalletSummary = {
  /** Solde confirmé : crédits (cashback validé) − débits (retraits payés). */
  balance: number;
  /** Somme des retraits en attente de traitement (fonds réservés). */
  pendingWithdrawals: number;
  /** Solde réellement retirable : balance − retraits en attente. */
  available: number;
  /** Cashback des achats en attente de validation admin. */
  pendingCashback: number;
  /** Total des gains encaissés depuis le début. */
  totalEarned: number;
  /** Total retiré vers Mobile Money. */
  totalWithdrawn: number;
};

export async function getWallet(userId: string): Promise<WalletSummary> {
  const [credits, debits, pendingWithdrawals, pendingCashback] = await Promise.all([
    prisma.walletTransaction.aggregate({
      where: { userId, kind: "CREDIT" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { userId, kind: "DEBIT" },
      _sum: { amount: true },
    }),
    prisma.withdrawal.aggregate({
      where: { userId, status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.purchase.aggregate({
      where: { userId, status: "PENDING" },
      _sum: { cashback: true },
    }),
  ]);

  const totalEarned = credits._sum.amount ?? 0;
  const totalWithdrawn = debits._sum.amount ?? 0;
  const reserved = pendingWithdrawals._sum.amount ?? 0;
  const balance = totalEarned - totalWithdrawn;

  return {
    balance,
    pendingWithdrawals: reserved,
    available: Math.max(0, balance - reserved),
    pendingCashback: pendingCashback._sum.cashback ?? 0,
    totalEarned,
    totalWithdrawn,
  };
}
