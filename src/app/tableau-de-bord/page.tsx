import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CircleCheck,
  Clock3,
  HandCoins,
  Plus,
  Receipt,
  Star,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getWallet } from "@/lib/wallet";
import { getPoints, getPendingPoints } from "@/lib/points";
import { EmptyState, Flash, PageHeader, Stat, StatusBadge } from "@/components/ui";
import { formatFCFA, formatDate, formatNumber, formatShortDate, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon portefeuille",
};

type SearchParams = Promise<{ ok?: string; erreur?: string; bienvenue?: string }>;

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const flash = await searchParams;

  const [wallet, points, pendingPoints, transactions, purchases] = await Promise.all([
    getWallet(user.id),
    getPoints(user.id),
    getPendingPoints(user.id),
    prisma.walletTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.purchase.findMany({
      where: { userId: user.id },
      include: { store: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={`Bonjour, ${user.name.split(" ")[0]}`}
        title="Mon portefeuille Cashup"
        description="Votre solde, vos gains en attente et vos dernières opérations en FCFA."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/tableau-de-bord/achats/nouveau" className="btn btn-primary">
              <Plus className="size-4" strokeWidth={2.2} aria-hidden="true" />
              Déclarer un achat
            </Link>
            <Link href="/tableau-de-bord/retraits" className="btn btn-secondary">
              <HandCoins className="size-4" strokeWidth={2} aria-hidden="true" />
              Retirer
            </Link>
          </div>
        }
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
        {flash.bienvenue && (
          <Flash ok="Bienvenue sur Cashup ! Déclarez votre premier achat pour démarrer." />
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Solde total"
          value={formatFCFA(wallet.balance)}
          hint="Crédits validés − retraits payés"
          icon={<Wallet className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Disponible"
          value={formatFCFA(wallet.available)}
          hint="Retirable immédiatement (min. 5 000 FCFA)"
          icon={<HandCoins className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="En attente de validation"
          value={formatFCFA(wallet.pendingCashback)}
          hint="Achats déclarés en cours d'examen"
          icon={<Clock3 className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Total gagné"
          value={formatFCFA(wallet.totalEarned)}
          hint={`Dont ${formatFCFA(wallet.totalWithdrawn)} déjà retirés`}
          icon={<CircleCheck className="size-4.5" strokeWidth={1.9} />}
        />
      </div>

      {(points.balance > 0 || pendingPoints.points > 0) && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 ring-1 ring-brand-200 ring-inset">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-800">
            <Star className="size-4.5 shrink-0 fill-current" strokeWidth={2} aria-hidden="true" />
            <span className="tabular-nums">{formatNumber(points.balance)} points de fidélité</span>
            — convertibles en bons d&apos;achat chez nos partenaires.
            {pendingPoints.points > 0 && (
              <span className="font-normal text-brand-700">
                (+{formatNumber(pendingPoints.points)} en attente de validation)
              </span>
            )}
          </p>
          <Link href="/tableau-de-bord/points" className="btn btn-dark btn-sm">
            Voir mes points
            <ArrowRight className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
      )}

      {wallet.available >= 5000 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-acid-300 bg-acid-100 px-5 py-4 ring-1 ring-acid-300 ring-inset">
          <p className="flex items-center gap-2 text-sm font-semibold text-acid-700">
            <HandCoins className="size-4.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            {formatFCFA(wallet.available)} disponibles : vous pouvez demander un retrait Mobile
            Money dès maintenant.
          </p>
          <Link href="/tableau-de-bord/retraits" className="btn btn-dark btn-sm">
            Demander un retrait
            <ArrowRight className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink">Dernières opérations</h2>
            <span className="text-xs text-ink-muted">Portefeuille</span>
          </div>

          {transactions.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Aucune opération pour l'instant"
                description="Vos cashback validés et vos retraits apparaîtront ici."
                actionLabel="Déclarer un achat"
                actionHref="/tableau-de-bord/achats/nouveau"
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-cloud-100">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{tx.label}</p>
                    <p className="text-xs text-ink-muted">
                      {formatDate(tx.createdAt)} · {timeAgo(tx.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold tabular-nums ${
                      tx.kind === "CREDIT" ? "text-acid-700" : "text-ink"
                    }`}
                  >
                    {tx.kind === "CREDIT" ? "+" : "−"}
                    {formatFCFA(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink">Mes derniers achats</h2>
            <Link
              href="/tableau-de-bord/achats"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Tout voir
            </Link>
          </div>

          {purchases.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Receipt}
                title="Aucun achat déclaré"
                description="Déclarez votre premier achat pour commencer à gagner du cashback."
                actionLabel="Déclarer un achat"
                actionHref="/tableau-de-bord/achats/nouveau"
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-cloud-100">
              {purchases.map((purchase) => (
                <li key={purchase.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{purchase.store.name}</p>
                    <p className="text-xs text-ink-muted">
                      {formatShortDate(purchase.purchasedAt)} · {formatFCFA(purchase.amount)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold text-brand-700 tabular-nums">
                      +{formatFCFA(purchase.cashback)}
                    </span>
                    <StatusBadge status={purchase.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
