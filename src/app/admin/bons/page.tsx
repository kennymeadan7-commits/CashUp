import type { Metadata } from "next";
import { Gift, SearchX, Ticket } from "lucide-react";
import { prisma } from "@/lib/db";
import { markVoucherUsedAction } from "@/lib/actions/points";
import { EmptyState, Flash, PageHeader, Stat, StatusBadge } from "@/components/ui";
import { SearchField } from "@/components/admin/SearchField";
import { formatFCFA, formatDate, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bons d'achat",
};

type SearchParams = Promise<{ ok?: string; erreur?: string; q?: string }>;

export default async function AdminVouchersPage({ searchParams }: { searchParams: SearchParams }) {
  const flash = await searchParams;
  const q = (flash.q ?? "").trim().slice(0, 60);

  const [vouchers, activeStats, totalEmitted] = await Promise.all([
    prisma.voucher.findMany({
      where: q
        ? {
            OR: [
              { code: { contains: q } },
              { user: { name: { contains: q } } },
              { user: { email: { contains: q } } },
            ],
          }
        : {},
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.voucher.aggregate({
      where: { status: "ACTIVE" },
      _count: true,
      _sum: { value: true },
    }),
    prisma.voucher.count(),
  ]);

  const activeCount = activeStats._count;
  const totalValue = activeStats._sum.value ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Fidélité"
        title="Bons d'achat"
        description="Les membres convertissent leurs points en bons présentés chez le partenaire. Validez le bon au moment de l'encaissement."
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Bons à valider"
          value={formatNumber(activeCount)}
          hint="Présentés en boutique, non encore utilisés"
          icon={<Ticket className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Valeur en circulation"
          value={formatFCFA(totalValue)}
          hint="Points engagés sur les bons actifs"
          icon={<Gift className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Bons émis"
          value={formatNumber(totalEmitted)}
          hint="Depuis l'ouverture de la plateforme"
          icon={<Ticket className="size-4.5" strokeWidth={1.9} />}
        />
      </div>

      <SearchField
        q={q}
        placeholder="Rechercher par code (CU-…) ou par membre…"
        ariaLabel="Rechercher un bon d'achat"
        clearHref="/admin/bons"
      />

      <section className="card mt-8 p-6">
        <h2 className="text-base font-bold text-ink">
          {q ? `Résultats pour « ${q} »` : "Tous les bons"}
        </h2>

        {vouchers.length === 0 ? (
          <div className="mt-4">
            {q ? (
              <EmptyState
                icon={SearchX}
                title={`Aucun bon trouvé pour « ${q} »`}
                description="Vérifiez le code complet (CU-XXXX-XXXX) ou le nom du membre."
              />
            ) : (
              <EmptyState
                icon={Gift}
                title="Aucun bon d'achat"
                description="Les bons apparaîtront ici dès qu'un membre convertira ses points de fidélité."
              />
            )}
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-cloud-100">
            {vouchers.map((voucher) => (
              <li key={voucher.id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-bold tracking-wider text-ink">
                      {voucher.code}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {voucher.user.name} · {formatNumber(voucher.pointsCost)} points · émis le{" "}
                      {formatDate(voucher.createdAt)}
                      {voucher.status === "USED" && voucher.usedAt
                        ? ` · utilisé le ${formatDate(voucher.usedAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-bold text-brand-700 tabular-nums">
                        {formatFCFA(voucher.value)}
                      </span>
                      <StatusBadge status={voucher.status} />
                    </div>
                    {voucher.status === "ACTIVE" && (
                      <form action={markVoucherUsedAction}>
                        <input type="hidden" name="voucherId" value={voucher.id} />
                        <button type="submit" className="btn btn-secondary btn-sm">
                          Marquer utilisé
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
