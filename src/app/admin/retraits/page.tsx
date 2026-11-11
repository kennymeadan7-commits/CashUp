import Link from "next/link";
import type { Metadata } from "next";
import { Banknote, CheckCheck, Receipt, XCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { WITHDRAWAL_STATUS_LABEL, withdrawalMethodLabel } from "@/lib/constants";
import { processWithdrawalAction } from "@/lib/actions/withdrawals";
import { EmptyState, Flash, PageHeader, StatusBadge } from "@/components/ui";
import { avatarColor, formatFCFA, formatDate, initials, formatPhone } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Traitement des retraits",
};

const FILTERS = [
  { value: "PENDING", label: "En attente" },
  { value: "PAID", label: "Payés" },
  { value: "REJECTED", label: "Rejetés" },
  { value: "ALL", label: "Tous" },
];

type SearchParams = Promise<{ ok?: string; erreur?: string; statut?: string }>;

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const flash = await searchParams;
  const statut = FILTERS.some((f) => f.value === flash.statut) ? flash.statut! : "PENDING";

  const withdrawals = await prisma.withdrawal.findMany({
    where: statut === "ALL" ? {} : { status: statut },
    include: { user: true, processedBy: true },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: 100,
  });

  return (
    <>
      <PageHeader
        eyebrow="Versements"
        title="Retraits Mobile Money"
        description="Marquez un retrait comme payé après avoir effectué le versement sur MTN MoMo, Moov Money ou Celtiis Cash."
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2" aria-label="Filtrer par statut">
        {FILTERS.map((filter) => (
          <Link
            key={filter.value}
            href={`/admin/retraits?statut=${filter.value}`}
            className={`btn btn-sm ${statut === filter.value ? "btn-primary" : "btn-secondary"}`}
            aria-current={statut === filter.value ? "page" : undefined}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {withdrawals.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Aucun retrait dans ce filtre"
            description="Les nouvelles demandes des membres apparaissent ici automatiquement."
          />
        ) : (
          withdrawals.map((withdrawal) => (
            <article key={withdrawal.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white ${avatarColor(withdrawal.userId)}`}
                    aria-hidden="true"
                  >
                    {initials(withdrawal.user.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-ink">{withdrawal.user.name}</p>
                    <p className="text-xs text-ink-muted">
                      {withdrawal.user.email} · demandé le {formatDate(withdrawal.createdAt)}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {withdrawalMethodLabel(withdrawal.method)} ·{" "}
                      <span className="tabular-nums">{formatPhone(withdrawal.phone)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 text-right">
                  <span className="text-lg font-bold text-ink tabular-nums">
                    {formatFCFA(withdrawal.amount)}
                  </span>
                  <StatusBadge
                    status={withdrawal.status}
                    label={WITHDRAWAL_STATUS_LABEL[withdrawal.status]}
                  />
                </div>
              </div>

              {withdrawal.status === "PENDING" ? (
                <div className="mt-4 flex flex-col gap-3 border-t border-cloud-100 pt-4 lg:flex-row lg:items-end lg:justify-between">
                  <form action={processWithdrawalAction} className="flex flex-1 items-end gap-2">
                    <input type="hidden" name="withdrawalId" value={withdrawal.id} />
                    <input type="hidden" name="decision" value="REJECTED" />
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`adminNote-${withdrawal.id}`}
                        className="mb-1.5 block text-xs font-bold text-ink"
                      >
                        Motif de rejet{" "}
                        <span className="font-normal text-ink-muted">(requis si rejet)</span>
                      </label>
                      <input
                        id={`adminNote-${withdrawal.id}`}
                        name="adminNote"
                        type="text"
                        maxLength={300}
                        className="field"
                        placeholder="Ex : numéro Mobile Money invalide…"
                      />
                    </div>
                    <button type="submit" className="btn btn-secondary btn-sm">
                      <XCircle className="size-4" strokeWidth={2} aria-hidden="true" />
                      Rejeter
                    </button>
                  </form>

                  <form action={processWithdrawalAction}>
                    <input type="hidden" name="withdrawalId" value={withdrawal.id} />
                    <input type="hidden" name="decision" value="PAID" />
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Banknote className="size-4" strokeWidth={2.2} aria-hidden="true" />
                      Marquer comme payé
                    </button>
                  </form>
                </div>
              ) : (
                (withdrawal.adminNote || withdrawal.processedBy) && (
                  <div className="mt-4 border-t border-cloud-100 pt-3 text-xs text-ink-muted">
                    {withdrawal.adminNote && (
                      <p>
                        <span className="font-bold">Motif :</span> {withdrawal.adminNote}
                      </p>
                    )}
                    <p>
                      Traité par {withdrawal.processedBy?.name ?? "l'équipe"}
                      {withdrawal.processedAt ? ` le ${formatDate(withdrawal.processedAt)}` : ""}
                    </p>
                  </div>
                )
              )}
            </article>
          ))
        )}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-ink-muted">
        <CheckCheck className="size-4 text-acid-600" strokeWidth={2} aria-hidden="true" />
        Pensez à effectuer le versement Mobile Money avant de marquer la demande comme payée : le
        débit est immédiat et définitif.
      </p>
    </>
  );
}
