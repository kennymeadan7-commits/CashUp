import Link from "next/link";
import type { Metadata } from "next";
import { CheckCheck, SearchX, ShoppingBag, XCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { PURCHASE_STATUS_LABEL } from "@/lib/constants";
import { reviewPurchaseAction } from "@/lib/actions/purchases";
import { EmptyState, Flash, PageHeader, StatusBadge } from "@/components/ui";
import { SearchField } from "@/components/admin/SearchField";
import { avatarColor, formatFCFA, formatDate, initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Validation des achats",
};

const FILTERS = [
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Validés" },
  { value: "REJECTED", label: "Refusés" },
  { value: "ALL", label: "Tous" },
];

type SearchParams = Promise<{ ok?: string; erreur?: string; statut?: string; q?: string }>;

export default async function AdminPurchasesPage({ searchParams }: { searchParams: SearchParams }) {
  const flash = await searchParams;
  const statut = FILTERS.some((f) => f.value === flash.statut) ? flash.statut! : "PENDING";
  const q = (flash.q ?? "").trim().slice(0, 60);

  const purchases = await prisma.purchase.findMany({
    where: {
      ...(statut === "ALL" ? {} : { status: statut }),
      ...(q
        ? {
            OR: [
              { user: { name: { contains: q } } },
              { user: { email: { contains: q } } },
              { store: { name: { contains: q } } },
              { receiptRef: { contains: q } },
            ],
          }
        : {}),
    },
    include: { store: true, user: true, reviewedBy: true },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: 100,
  });

  return (
    <>
      <PageHeader
        eyebrow="Contrôle"
        title="Achats déclarés"
        description="Vérifiez les reçus déclarés : la validation crédite immédiatement le portefeuille du membre."
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Filtrer par statut">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/achats?statut=${filter.value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`btn btn-sm ${statut === filter.value ? "btn-primary" : "btn-secondary"}`}
            aria-current={statut === filter.value ? "page" : undefined}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <SearchField
        q={q}
        placeholder="Rechercher un membre, une boutique ou un n° de reçu…"
        ariaLabel="Rechercher un achat déclaré"
        hidden={{ statut }}
        clearHref={`/admin/achats?statut=${statut}`}
      />

      <div className="mt-6 space-y-4">
        {purchases.length === 0 ? (
          q ? (
            <EmptyState
              icon={SearchX}
              title={`Aucun résultat pour « ${q} »`}
              description="Vérifiez l'orthographe, ou élargissez la recherche en passant le filtre sur « Tous »."
            />
          ) : (
            <EmptyState
              icon={ShoppingBag}
              title="Aucun achat dans ce filtre"
              description="Les nouvelles déclarations apparaissent ici automatiquement."
            />
          )
        ) : (
          purchases.map((purchase) => (
            <article key={purchase.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white ${avatarColor(purchase.userId)}`}
                    aria-hidden="true"
                  >
                    {initials(purchase.user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">
                      {purchase.user.name} — {purchase.store.name}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {purchase.user.email} · déclaré le {formatDate(purchase.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Achat du {formatDate(purchase.purchasedAt)} · reçu{" "}
                      <span className="font-mono">{purchase.receiptRef}</span>
                    </p>
                    {purchase.note && (
                      <p className="mt-1.5 rounded-lg bg-cloud-100 px-3 py-2 text-xs text-ink-soft ring-1 ring-cloud-200 ring-inset">
                        <span className="font-bold">Note du membre :</span> {purchase.note}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 text-right">
                  <span className="text-sm font-bold text-ink tabular-nums">
                    Dépensé {formatFCFA(purchase.amount)}
                  </span>
                  <span className="text-sm font-bold text-brand-700 tabular-nums">
                    Cashback {formatFCFA(purchase.cashback)}
                  </span>
                  <StatusBadge
                    status={purchase.status}
                    label={PURCHASE_STATUS_LABEL[purchase.status]}
                  />
                </div>
              </div>

              {purchase.status === "PENDING" ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-cloud-100 pt-4 lg:flex-row lg:items-end lg:justify-between">
                  <form action={reviewPurchaseAction} className="flex flex-1 items-end gap-2">
                    <input type="hidden" name="purchaseId" value={purchase.id} />
                    <input type="hidden" name="decision" value="REJECTED" />
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`adminNote-${purchase.id}`}
                        className="mb-1.5 block text-xs font-bold text-ink"
                      >
                        Motif de refus{" "}
                        <span className="font-normal text-ink-muted">(requis si refus)</span>
                      </label>
                      <input
                        id={`adminNote-${purchase.id}`}
                        name="adminNote"
                        type="text"
                        maxLength={300}
                        className="field"
                        placeholder="Ex : référence du reçu introuvable…"
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary btn-sm">
                      <XCircle className="size-4" strokeWidth={2} aria-hidden="true" />
                      Refuser
                    </button>
                  </form>

                  <form action={reviewPurchaseAction}>
                    <input type="hidden" name="purchaseId" value={purchase.id} />
                    <input type="hidden" name="decision" value="APPROVED" />
                    <button type="submit" className="btn btn-primary btn-sm">
                      <CheckCheck className="size-4" strokeWidth={2.2} aria-hidden="true" />
                      Valider le cashback
                    </button>
                  </form>
                </div>
              ) : (
                (purchase.adminNote || purchase.reviewedBy) && (
                  <div className="mt-4 border-t border-cloud-100 pt-3 text-xs text-ink-muted">
                    {purchase.adminNote && (
                      <p>
                        <span className="font-bold">Motif :</span> {purchase.adminNote}
                      </p>
                    )}
                    <p>
                      Traité par {purchase.reviewedBy?.name ?? "l'équipe"}
                      {purchase.reviewedAt ? ` le ${formatDate(purchase.reviewedAt)}` : ""}
                    </p>
                  </div>
                )
              )}
            </article>
          ))
        )}
      </div>
    </>
  );
}
