import type { Metadata } from "next";
import { Clock3, Gift, Sparkles, Star, Ticket } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getPendingPoints, getPoints } from "@/lib/points";
import { POINTS_VALUE_FCFA } from "@/lib/constants";
import { EmptyState, Flash, PageHeader, Stat, StatusBadge } from "@/components/ui";
import { formatFCFA, formatDate, formatNumber, timeAgo } from "@/lib/format";
import { PointsConversionForm } from "@/components/dashboard/PointsConversionForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes points & bons d'achat",
};

type SearchParams = Promise<{ ok?: string; erreur?: string }>;

export default async function PointsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const flash = await searchParams;

  const [points, pendingPoints, transactions, vouchers] = await Promise.all([
    getPoints(user.id),
    getPendingPoints(user.id),
    prisma.pointTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.voucher.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const activeVouchers = vouchers.filter((voucher) => voucher.status === "ACTIVE");

  return (
    <>
      <PageHeader
        eyebrow="Fidélité"
        title="Mes points & bons d'achat"
        description="Chaque achat validé vous verse 30 % de la commission de la boutique en points. Convertissez-les en bons à présenter chez nos partenaires."
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Points disponibles"
          value={formatNumber(points.balance)}
          hint={`Équivalent ${formatFCFA(points.balance * POINTS_VALUE_FCFA)}`}
          icon={<Star className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="En attente"
          value={formatNumber(pendingPoints.points)}
          hint={`${pendingPoints.count} achat${pendingPoints.count > 1 ? "s" : ""} en cours de validation`}
          icon={<Clock3 className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Points gagnés"
          value={formatNumber(points.earned)}
          hint="30 % des commissions partenaires"
          icon={<Sparkles className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Bons actifs"
          value={formatNumber(activeVouchers.length)}
          hint={`${vouchers.length} bon${vouchers.length > 1 ? "s" : ""} émis au total`}
          icon={<Ticket className="size-4.5" strokeWidth={1.9} />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink">Mes bons d&apos;achat</h2>
            <span className="text-xs text-ink-muted">Présentez le code en boutique</span>
          </div>

          {vouchers.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Gift}
                title="Aucun bon d'achat"
                description="Cumulez des points puis convertissez-les ici : 1 point = 1 FCFA, utilisable chez un partenaire."
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-cloud-100">
              {vouchers.map((voucher) => (
                <li key={voucher.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold tracking-wider text-ink">
                      {voucher.code}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {formatNumber(voucher.pointsCost)} points · émis le{" "}
                      {formatDate(voucher.createdAt)}
                      {voucher.status === "USED" && voucher.usedAt
                        ? ` · utilisé le ${formatDate(voucher.usedAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold text-brand-700 tabular-nums">
                      {formatFCFA(voucher.value)}
                    </span>
                    <StatusBadge status={voucher.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card sticky-cta h-fit p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <Gift className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
            Convertir mes points
          </h2>
          <p className="mb-4 mt-1 text-xs text-ink-muted">
            Le bon est immédiatement disponible dans votre liste, à présenter chez le commerçant.
          </p>
          <PointsConversionForm balance={points.balance} />
        </section>
      </div>

      <section className="card mt-8 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">Historique de mes points</h2>
          <span className="text-xs text-ink-muted">Gains et conversions</span>
        </div>

        {transactions.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Sparkles}
              title="Aucun point pour l'instant"
              description="Vos points sont versés dès qu'un administrateur valide un achat déclaré."
            />
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-cloud-100">
            {transactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{transaction.label}</p>
                  <p className="text-xs text-ink-muted">
                    {formatDate(transaction.createdAt)} · {timeAgo(transaction.createdAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${
                    transaction.kind === "EARN" ? "text-acid-700" : "text-ink"
                  }`}
                >
                  {transaction.kind === "EARN" ? "+" : "−"}
                  {formatNumber(transaction.amount)} pts
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
