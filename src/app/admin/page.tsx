import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  CircleCheck,
  Clock3,
  HandCoins,
  Percent,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Stat, StatusBadge } from "@/components/ui";
import { COMMISSION_SPLIT, withdrawalMethodLabel } from "@/lib/constants";
import { formatFCFA, formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vue d'ensemble",
};

export default async function AdminHomePage() {
  const [
    memberCount,
    pendingPurchases,
    pendingWithdrawals,
    creditedAgg,
    withdrawnAgg,
    activeStores,
    approvedPurchases,
    revenueAgg,
    latestPurchases,
    latestWithdrawals,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.purchase.count({ where: { status: "PENDING" } }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.walletTransaction.aggregate({ where: { kind: "CREDIT" }, _sum: { amount: true } }),
    prisma.walletTransaction.aggregate({ where: { kind: "DEBIT" }, _sum: { amount: true } }),
    prisma.store.count({ where: { active: true } }),
    prisma.purchase.count({ where: { status: "APPROVED" } }),
    prisma.purchase.aggregate({
      where: { status: "APPROVED" },
      _sum: {
        amount: true,
        commission: true,
        cashUpShare: true,
        feeShare: true,
        pointsShare: true,
      },
    }),
    prisma.purchase.findMany({
      where: { status: "PENDING" },
      include: { store: true, user: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
    prisma.withdrawal.findMany({
      where: { status: "PENDING" },
      include: { user: true },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
  ]);

  const totalCredited = creditedAgg._sum.amount ?? 0;
  const totalWithdrawn = withdrawnAgg._sum.amount ?? 0;
  const revenue = revenueAgg._sum;
  const totalSales = revenue.amount ?? 0;
  const totalCommission = revenue.commission ?? 0;
  const totalCashUp = revenue.cashUpShare ?? 0;
  const totalFees = revenue.feeShare ?? 0;
  const totalPoints = revenue.pointsShare ?? 0;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Achats à valider"
          value={formatNumber(pendingPurchases)}
          hint="Déclarations en attente de contrôle"
          icon={<ShoppingBag className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Retraits à traiter"
          value={formatNumber(pendingWithdrawals)}
          hint="Versements Mobile Money en attente"
          icon={<HandCoins className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Cashback versé"
          value={formatFCFA(totalCredited)}
          hint={`${formatNumber(approvedPurchases)} achats validés`}
          icon={<Wallet className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Retraits payés"
          value={formatFCFA(totalWithdrawn)}
          hint="Sorties Mobile Money confirmées"
          icon={<CircleCheck className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Membres"
          value={formatNumber(memberCount)}
          hint="Comptes MEMBERS actifs et suspendus"
          icon={<Users className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Boutiques actives"
          value={formatNumber(activeStores)}
          hint="Visibles dans le catalogue public"
          icon={<Store className="size-4.5" strokeWidth={1.9} />}
        />
      </div>

      <section className="card mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <TrendingUp className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
            Revenus &amp; commissions
          </h2>
          <Link
            href="/admin/revenus"
            className="text-xs font-semibold text-brand-700 hover:underline"
          >
            Détail par boutique
          </Link>
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          Chaque achat validé fait l&apos;objet d&apos;une commission de 10 % à 30 %, répartie{" "}
          {COMMISSION_SPLIT.cashUp} % CashUp · {COMMISSION_SPLIT.fees} % frais ·{" "}
          {COMMISSION_SPLIT.points} % points membres.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Commission perçue"
            value={formatFCFA(totalCommission)}
            hint={`Sur ${formatFCFA(totalSales)} de ventes validées`}
            icon={<Percent className="size-4.5" strokeWidth={1.9} />}
          />
          <Stat
            label="Revenu CashUp"
            value={formatFCFA(totalCashUp)}
            hint={`${COMMISSION_SPLIT.cashUp} % de la commission`}
            icon={<Wallet className="size-4.5" strokeWidth={1.9} />}
          />
          <Stat
            label="Frais de transaction"
            value={formatFCFA(totalFees)}
            hint={`${COMMISSION_SPLIT.fees} % de la commission`}
            icon={<CircleCheck className="size-4.5" strokeWidth={1.9} />}
          />
          <Stat
            label="Points versés"
            value={formatNumber(totalPoints)}
            hint={`${COMMISSION_SPLIT.points} % de la commission · versés aux membres`}
            icon={<Star className="size-4.5" strokeWidth={1.9} />}
          />
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <Clock3 className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
              Achats en attente (les plus anciens)
            </h2>
            <Link href="/admin/achats" className="text-xs font-semibold text-brand-700 hover:underline">
              Tout traiter
            </Link>
          </div>

          {latestPurchases.length === 0 ? (
            <p className="mt-4 rounded-xl bg-acid-100 px-4 py-3 text-sm font-semibold text-acid-700 ring-1 ring-acid-300 ring-inset">
              Aucun achat en attente : tout est à jour.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-cloud-100">
              {latestPurchases.map((purchase) => (
                <li key={purchase.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {purchase.store.name} · {formatFCFA(purchase.amount)}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {purchase.user.name} — déclaré le {formatDate(purchase.createdAt)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-brand-700 tabular-nums">
                    +{formatFCFA(purchase.cashback)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <HandCoins className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
              Retraits en attente (les plus anciens)
            </h2>
            <Link
              href="/admin/retraits"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Tout traiter
            </Link>
          </div>

          {latestWithdrawals.length === 0 ? (
            <p className="mt-4 rounded-xl bg-acid-100 px-4 py-3 text-sm font-semibold text-acid-700 ring-1 ring-acid-300 ring-inset">
              Aucun retrait en attente : tout est à jour.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-cloud-100">
              {latestWithdrawals.map((withdrawal) => (
                <li key={withdrawal.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {withdrawal.user.name} · {formatFCFA(withdrawal.amount)}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {withdrawalMethodLabel(withdrawal.method)} · {withdrawal.phone}
                    </p>
                  </div>
                  <StatusBadge status="PENDING" />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/achats" className="btn btn-primary">
          Valider les achats
          <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
        </Link>
        <Link href="/admin/retraits" className="btn btn-secondary">
          Traiter les retraits
        </Link>
        <Link href="/admin/boutiques" className="btn btn-secondary">
          Gérer le catalogue
        </Link>
      </div>
    </>
  );
}
