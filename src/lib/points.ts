import { prisma } from "@/lib/db";
import { splitCommission } from "@/lib/commission";

// ---------------------------------------------------------------------------
// Points de fidélité : 30 % de la commission de chaque achat validé.
// 1 point = 1 FCFA, convertible en bon d'achat chez un partenaire.
// ---------------------------------------------------------------------------

export type PointsSummary = {
  /** Points disponibles : gagnés − consommés par conversion. */
  balance: number;
  /** Total des points gagnés sur les achats validés. */
  earned: number;
  /** Total des points convertis en bons d'achat. */
  spent: number;
};

export async function getPoints(userId: string): Promise<PointsSummary> {
  const [earned, spent] = await Promise.all([
    prisma.pointTransaction.aggregate({
      where: { userId, kind: "EARN" },
      _sum: { amount: true },
    }),
    prisma.pointTransaction.aggregate({
      where: { userId, kind: "SPEND" },
      _sum: { amount: true },
    }),
  ]);

  const totalEarned = earned._sum.amount ?? 0;
  const totalSpent = spent._sum.amount ?? 0;

  return {
    balance: totalEarned - totalSpent,
    earned: totalEarned,
    spent: totalSpent,
  };
}

export type PendingPoints = {
  /** Nombre d'achats déclarés en attente de validation. */
  count: number;
  /** Points estimés qui seront versés à l'approbation (30 % de la commission). */
  points: number;
};

/**
 * Estimation des points en attente : la commission n'est figée qu'à
 * l'approbation, on recalcule donc avec le taux actuel de chaque boutique.
 */
export async function getPendingPoints(userId: string): Promise<PendingPoints> {
  const pending = await prisma.purchase.findMany({
    where: { userId, status: "PENDING" },
    select: { amount: true, store: { select: { commissionRate: true } } },
  });

  const points = pending.reduce(
    (sum, purchase) =>
      sum + splitCommission(purchase.amount, purchase.store.commissionRate).points,
    0,
  );

  return { count: pending.length, points };
}

// Alphabet sans caractère ambigu (ni O, ni 0, ni I, ni 1) pour les codes
// lus à voix haute en boutique.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Génère un code de bon d'achat du type CU-7K2M-9QFX. */
export function generateVoucherCode(): string {
  const chunk = () =>
    Array.from(
      { length: 4 },
      () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)],
    ).join("");
  return `CU-${chunk()}-${chunk()}`;
}
