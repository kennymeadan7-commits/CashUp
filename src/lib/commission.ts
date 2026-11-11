import { COMMISSION_SPLIT } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Répartition de la commission partenaire (business plan)
// ---------------------------------------------------------------------------

export type CommissionShares = {
  /** Taux appliqué, en %. */
  rate: number;
  /** Commission totale prélevée sur la vente, en FCFA. */
  commission: number;
  /** 50 % — revenu conservé par CashUp. */
  cashUp: number;
  /** 20 % — frais de transaction. */
  fees: number;
  /** 30 % — points de fidélité versés au membre. */
  points: number;
};

/**
 * Découpe la commission d'une vente selon la règle 50 / 20 / 30 du plan.
 * Le solde non arrondi (arrondis de centimes) revient aux points : la somme
 * des trois parts est toujours strictement égale à la commission.
 */
export function splitCommission(amount: number, rate: number): CommissionShares {
  const commission = Math.max(0, Math.round((amount * rate) / 100));
  const cashUp = Math.round((commission * COMMISSION_SPLIT.cashUp) / 100);
  const fees = Math.round((commission * COMMISSION_SPLIT.fees) / 100);
  const points = commission - cashUp - fees;
  return { rate, commission, cashUp, fees, points };
}
