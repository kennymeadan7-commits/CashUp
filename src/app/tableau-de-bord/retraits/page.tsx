import type { Metadata } from "next";
import { HandCoins, Receipt } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getWallet } from "@/lib/wallet";
import { WITHDRAWAL_STATUS_LABEL, withdrawalMethodLabel } from "@/lib/constants";
import { EmptyState, Flash, PageHeader, Stat, StatusBadge } from "@/components/ui";
import { formatFCFA, formatDate, formatPhone } from "@/lib/format";
import { WithdrawalForm } from "@/components/dashboard/WithdrawalForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes retraits",
};

type SearchParams = Promise<{ ok?: string; erreur?: string }>;

export default async function WithdrawalsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const flash = await searchParams;

  const [wallet, withdrawals] = await Promise.all([
    getWallet(user.id),
    prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;

  return (
    <>
      <PageHeader
        eyebrow="Versements"
        title="Mes retraits"
        description="Vos gains sont versés sur MTN MoMo, Moov Money ou Celtiis Cash, sans frais, dès 5 000 FCFA."
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="Disponible"
          value={formatFCFA(wallet.available)}
          hint="Retirable maintenant"
          icon={<HandCoins className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="En attente de retrait"
          value={formatFCFA(wallet.pendingWithdrawals)}
          hint={`${pendingCount} demande${pendingCount > 1 ? "s" : ""} en cours de traitement`}
          icon={<Receipt className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Total retiré"
          value={formatFCFA(wallet.totalWithdrawn)}
          hint="Depuis l'ouverture de votre compte"
          icon={<HandCoins className="size-4.5" strokeWidth={1.9} />}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-6">
          <h2 className="text-base font-bold text-ink">Historique de mes retraits</h2>

          {withdrawals.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Receipt}
                title="Aucune demande de retrait"
                description="Dès que votre solde disponible atteint 5 000 FCFA, demandez votre premier versement Mobile Money."
              />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-cloud-100">
              {withdrawals.map((withdrawal) => (
                <li key={withdrawal.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-ink tabular-nums">
                        {formatFCFA(withdrawal.amount)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {withdrawalMethodLabel(withdrawal.method)} · {formatPhone(withdrawal.phone)}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        Demandé le {formatDate(withdrawal.createdAt)}
                        {withdrawal.processedAt &&
                          ` · traité le ${formatDate(withdrawal.processedAt)}`}
                      </p>
                    </div>
                    <StatusBadge
                      status={withdrawal.status}
                      label={WITHDRAWAL_STATUS_LABEL[withdrawal.status]}
                    />
                  </div>
                  {withdrawal.adminNote && (
                    <p
                      className={`mt-2 rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        withdrawal.status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100 ring-inset"
                          : "bg-cloud-100 text-ink-soft ring-1 ring-cloud-200 ring-inset"
                      }`}
                    >
                      <span className="font-bold">Équipe Cashup :</span> {withdrawal.adminNote}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card sticky-cta h-fit p-6">
          <h2 className="text-base font-bold text-ink">Nouvelle demande</h2>
          <p className="mb-4 mt-1 text-xs text-ink-muted">
            Traitement sous 48 h ouvrées, puis versement immédiat sur votre numéro.
          </p>
          <WithdrawalForm available={wallet.available} defaultPhone={user.phone} />
        </section>
      </div>
    </>
  );
}
