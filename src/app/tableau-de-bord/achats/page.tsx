import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PURCHASE_STATUS_LABEL } from "@/lib/constants";
import { EmptyState, Flash, PageHeader, StatusBadge } from "@/components/ui";
import { formatFCFA, formatDate, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes achats",
};

const FILTERS = [
  { value: "", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Validés" },
  { value: "REJECTED", label: "Refusés" },
];

type SearchParams = Promise<{ ok?: string; erreur?: string; statut?: string }>;

export default async function PurchasesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const flash = await searchParams;

  const statut = FILTERS.some((f) => f.value === flash.statut) ? (flash.statut ?? "") : "";

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, ...(statut ? { status: statut } : {}) },
    include: { store: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        eyebrow="Historique"
        title="Mes achats déclarés"
        description="Chaque achat est vérifié par l'équipe Cashup avant créditation du cashback."
        actions={
          <Link href="/tableau-de-bord/achats/nouveau" className="btn btn-primary">
            <Plus className="size-4" strokeWidth={2.2} aria-hidden="true" />
            Déclarer un achat
          </Link>
        }
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Filtrer par statut">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={filter.value ? `/tableau-de-bord/achats?statut=${filter.value}` : "/tableau-de-bord/achats"}
            className={`btn btn-sm ${statut === filter.value ? "btn-primary" : "btn-secondary"}`}
            aria-current={statut === filter.value ? "page" : undefined}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {purchases.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={statut ? "Aucun achat dans ce filtre" : "Aucun achat déclaré"}
            description={
              statut
                ? "Essayez un autre statut pour retrouver vos achats."
                : "Déclarez votre premier achat : la boutique, le montant et la référence du reçu suffisent."
            }
            actionLabel="Déclarer un achat"
            actionHref="/tableau-de-bord/achats/nouveau"
          />
        ) : (
          <ul className="space-y-3">
            {purchases.map((purchase) => (
              <li key={purchase.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white shadow-sm ring-1 ring-black/5 ring-inset"
                      style={{ backgroundColor: purchase.store.color }}
                      aria-hidden="true"
                    >
                      {purchase.store.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() ?? "")
                        .join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink">{purchase.store.name}</p>
                      <p className="text-xs text-ink-muted">
                        Achat du {formatDate(purchase.purchasedAt)} · reçu{" "}
                        <span className="font-mono">{purchase.receiptRef}</span>
                      </p>
                      <p className="mt-1 text-xs text-ink-muted">
                        Déclaré le {formatShortDate(purchase.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 text-right">
                    <span className="text-sm font-bold text-ink tabular-nums">
                      {formatFCFA(purchase.amount)}
                    </span>
                    <span className="text-sm font-bold text-brand-700 tabular-nums">
                      + {formatFCFA(purchase.cashback)} de cashback
                    </span>
                    <StatusBadge
                      status={purchase.status}
                      label={PURCHASE_STATUS_LABEL[purchase.status]}
                    />
                  </div>
                </div>

                {purchase.adminNote && (
                  <p
                    className={`mt-3 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      purchase.status === "REJECTED"
                        ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100 ring-inset"
                        : "bg-cloud-100 text-ink-soft ring-1 ring-cloud-200 ring-inset"
                    }`}
                  >
                    <span className="font-bold">Équipe Cashup :</span> {purchase.adminNote}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
