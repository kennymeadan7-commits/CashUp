import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Percent, Star, TrendingUp, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { Stat } from "@/components/ui";
import { COMMISSION_SPLIT } from "@/lib/constants";
import { formatFCFA, formatNumber, formatRate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Revenus & commissions",
};

type StoreRevenue = {
  id: string;
  name: string;
  rate: number;
  count: number;
  sales: number;
  commission: number;
  cashUp: number;
  fees: number;
  points: number;
};

export default async function AdminRevenuePage() {
  const [revenueAgg, groups, stores] = await Promise.all([
    prisma.purchase.aggregate({
      where: { status: "APPROVED" },
      _sum: {
        amount: true,
        commission: true,
        cashUpShare: true,
        feeShare: true,
        pointsShare: true,
      },
      _count: true,
    }),
    prisma.purchase.groupBy({
      by: ["storeId"],
      where: { status: "APPROVED" },
      _sum: {
        amount: true,
        commission: true,
        cashUpShare: true,
        feeShare: true,
        pointsShare: true,
      },
      _count: true,
    }),
    prisma.store.findMany({
      select: { id: true, name: true, commissionRate: true },
    }),
  ]);

  const storeById = new Map(stores.map((store) => [store.id, store]));

  const rows: StoreRevenue[] = groups
    .map((group) => {
      const store = storeById.get(group.storeId);
      return {
        id: group.storeId,
        name: store?.name ?? "Boutique supprimée",
        rate: store?.commissionRate ?? 0,
        count: group._count,
        sales: group._sum.amount ?? 0,
        commission: group._sum.commission ?? 0,
        cashUp: group._sum.cashUpShare ?? 0,
        fees: group._sum.feeShare ?? 0,
        points: group._sum.pointsShare ?? 0,
      };
    })
    .sort((a, b) => b.commission - a.commission);

  const totalSales = revenueAgg._sum.amount ?? 0;
  const totalCommission = revenueAgg._sum.commission ?? 0;
  const totalCashUp = revenueAgg._sum.cashUpShare ?? 0;
  const totalFees = revenueAgg._sum.feeShare ?? 0;
  const totalPoints = revenueAgg._sum.pointsShare ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <p className="eyebrow mb-2">Modèle économique</p>
          <h1 className="font-display text-3xl leading-[1.08] font-bold tracking-tight text-ink sm:text-4xl">
            Revenus &amp; commissions
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Commission de 10 % à 30 % selon le secteur, prélevée uniquement sur les achats validés
            puis répartie {COMMISSION_SPLIT.cashUp} / {COMMISSION_SPLIT.fees} /{" "}
            {COMMISSION_SPLIT.points}.
          </p>
        </div>
        <Link href="/admin/boutiques" className="btn btn-secondary">
          Gérer les taux de commission
          <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Ventes validées"
          value={formatFCFA(totalSales)}
          hint={`${formatNumber(revenueAgg._count)} achats approuvés`}
          icon={<TrendingUp className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Commission totale"
          value={formatFCFA(totalCommission)}
          hint={`Taux moyen ${formatRate(totalSales > 0 ? (totalCommission / totalSales) * 100 : 0)}`}
          icon={<Percent className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Revenu CashUp"
          value={formatFCFA(totalCashUp)}
          hint={`${COMMISSION_SPLIT.cashUp} % de la commission`}
          icon={<Wallet className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Points versés"
          value={formatNumber(totalPoints)}
          hint={`${COMMISSION_SPLIT.points} % de la commission · 1 point = 1 FCFA`}
          icon={<Star className="size-4.5" strokeWidth={1.9} />}
        />
      </div>

      <section className="card mt-8 p-6">
        <h2 className="text-base font-bold text-ink">Répartition d&apos;une commission</h2>
        <p className="mt-1 text-xs text-ink-muted">
          Règle fixée par le plan économique : la somme des trois parts est toujours égale à la
          commission perçue.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 ring-1 ring-brand-100 ring-inset">
            <p className="text-[11px] font-bold tracking-[0.14em] text-brand-700 uppercase">
              {COMMISSION_SPLIT.cashUp} % · CashUp
            </p>
            <p className="mt-2 font-sans text-2xl font-semibold text-ink tabular-nums">
              {formatFCFA(totalCashUp)}
            </p>
            <p className="mt-1 text-xs text-ink-muted">Revenu conservé (coûts &amp; trésorerie)</p>
          </div>
          <div className="rounded-2xl border border-cloud-200 bg-cloud-100 p-4 ring-1 ring-cloud-200 ring-inset">
            <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">
              {COMMISSION_SPLIT.fees} % · Frais
            </p>
            <p className="mt-2 font-sans text-2xl font-semibold text-ink tabular-nums">
              {formatFCFA(totalFees)}
            </p>
            <p className="mt-1 text-xs text-ink-muted">Frais de transaction Mobile Money</p>
          </div>
          <div className="rounded-2xl border border-acid-300 bg-acid-100 p-4 ring-1 ring-acid-300 ring-inset">
            <p className="text-[11px] font-bold tracking-[0.14em] text-acid-700 uppercase">
              {COMMISSION_SPLIT.points} % · Points
            </p>
            <p className="mt-2 font-sans text-2xl font-semibold text-ink tabular-nums">
              {formatNumber(totalPoints)} pts
            </p>
            <p className="mt-1 text-xs text-ink-muted">Fidélisation des membres</p>
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-cloud-100 px-4 py-3 text-xs leading-relaxed text-ink-soft ring-1 ring-cloud-200 ring-inset">
          <span className="font-bold text-ink">Exemple du plan :</span> une vente de 10 000 FCFA à 20
          % de commission génère 2 000 FCFA, dont 1 000 FCFA pour CashUp, 400 FCFA de frais et 600
          FCFA de points pour le membre.
        </p>
      </section>

      <section className="card mt-8 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">Détail par boutique</h2>
          <span className="text-xs text-ink-muted">{rows.length} partenaire{rows.length > 1 ? "s" : ""} avec ventes</span>
        </div>

        {rows.length === 0 ? (
          <p className="mt-4 rounded-xl bg-acid-100 px-4 py-3 text-sm font-semibold text-acid-700 ring-1 ring-acid-300 ring-inset">
            Aucun achat validé : la première commission apparaîtra dès la première validation.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-cloud-100">
            {rows.map((row) => (
              <li key={row.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{row.name}</p>
                    <p className="mt-0.5 text-xs text-ink-muted tabular-nums">
                      {formatNumber(row.count)} achat{row.count > 1 ? "s" : ""} ·{" "}
                      {formatFCFA(row.sales)} de ventes
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-sm font-bold text-brand-700 tabular-nums">
                      {formatFCFA(row.commission)}
                    </span>
                    <span className="pill bg-cloud-100 px-2 py-0.5 text-[10px] text-ink-soft ring-1 ring-cloud-200 ring-inset">
                      commission {formatRate(row.rate)}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-xs text-ink-muted tabular-nums">
                  CashUp {formatFCFA(row.cashUp)} · frais {formatFCFA(row.fees)} · points{" "}
                  {formatNumber(row.points)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
