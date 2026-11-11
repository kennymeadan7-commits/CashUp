import type { Metadata } from "next";
import Link from "next/link";
import { BellRing, CircleCheck, QrCode, Store as StoreIcon, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireMarchand } from "@/lib/marchand-guard";
import { getRequestOrigin } from "@/lib/origin";
import { storeQrPayload } from "@/lib/qr";
import { qrDataUrl } from "@/lib/qr-image";
import {
  PAYMENT_STATUS_LABEL,
  PAYMENT_MODES,
  paymentModeLabel,
} from "@/lib/constants";
import { EmptyState, Flash, PageHeader, StatusBadge } from "@/components/ui";
import { AutoRefresh } from "@/components/payments/AutoRefresh";
import { confirmPaymentAction, cancelPaymentAction } from "@/lib/actions/payments";
import { formatFCFA, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Espace commerçant",
};

type SearchParams = Promise<{ ok?: string; erreur?: string }>;

export default async function MarchandPage({ searchParams }: { searchParams: SearchParams }) {
  await requireMarchand();
  const params = await searchParams;

  const [pending, recent, stores] = await Promise.all([
    prisma.paymentRequest.findMany({
      where: { status: "PENDING" },
      include: {
        store: { select: { name: true, code: true, color: true } },
        user: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.paymentRequest.findMany({
      where: { status: { in: ["CONFIRMED", "CANCELLED"] } },
      include: {
        store: { select: { name: true, color: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.store.findMany({
      where: { active: true, code: { not: null } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      select: {
        code: true,
        name: true,
        color: true,
        cashbackType: true,
        cashbackRate: true,
        cashbackFixed: true,
      },
    }),
  ]);

  const origin = await getRequestOrigin();
  const storesWithCode = stores.filter(
    (store): store is (typeof stores)[number] & { code: string } => store.code !== null,
  );
  const qrImages = await Promise.all(
    storesWithCode.map((store) => qrDataUrl(storeQrPayload(store.code, origin), 320)),
  );

  return (
    <>
      <AutoRefresh />

      <PageHeader
        eyebrow="Temps réel"
        title="Paiements à confirmer"
        description="Chaque demande initiée depuis « Payer » arrive ici. Confirmez la réception : le cashback du client est crédité instantanément."
      />

      <div className="mt-6 space-y-4">
        <Flash ok={params.ok} error={params.erreur} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {PAYMENT_MODES.map((mode) => (
          <div key={mode.value} className="rounded-2xl border border-cloud-200 bg-white p-4 shadow-soft">
            <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">
              {mode.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-ink tabular-nums">
              {formatFCFA(
                pending.filter((payment) => payment.mode === mode.value).reduce((sum, p) => sum + p.amount, 0),
              )}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              {pending.filter((payment) => payment.mode === mode.value).length} en attente
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <QrCode className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
          Mes QR codes
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-muted">
          Affichez ce QR à la caisse : le client ouvre « Payer », scanne, saisit le montant et
          valide avec son PIN. Cliquez pour l&apos;agrandir.
        </p>

        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {storesWithCode.map((store, index) => (
            <li key={store.code}>
              <Link
                href={`/marchand/qr/${store.code}`}
                className="card card-hover flex flex-col items-center gap-3 p-4 text-center"
                aria-label={`Agrandir le QR code de ${store.name}`}
              >
                <img
                  src={qrImages[index]}
                  alt={`QR code de ${store.name}`}
                  width={128}
                  height={128}
                  className="size-32 rounded-lg bg-white"
                />
                <span className="min-w-0 w-full">
                  <span className="block truncate text-sm font-bold text-ink">{store.name}</span>
                  <span className="mt-1 block font-mono text-xs font-bold text-ink-muted tabular-nums">
                    {store.code}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <BellRing className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
          Demandes en attente
          {pending.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200 ring-inset">
              {pending.length}
            </span>
          )}
        </h2>

        <div className="mt-4">
          {pending.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Aucune demande en attente"
              description="Ouvrez « Payer » dans un second navigateur ou sur le téléphone du client : la demande apparaîtra ici en quelques secondes."
            />
          ) : (
            <ul className="space-y-3">
              {pending.map((payment) => (
                <li key={payment.id} className="card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className="grid size-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white shadow-sm ring-1 ring-black/5 ring-inset"
                        style={{ backgroundColor: payment.store.color }}
                        aria-hidden="true"
                      >
                        {payment.store.name
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase() ?? "")
                          .join("")}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink">
                          {payment.store.name}
                          {payment.store.code && (
                            <span className="ml-2 rounded-md bg-cloud-100 px-1.5 py-0.5 font-mono text-xs text-ink-muted ring-1 ring-cloud-200 ring-inset">
                              {payment.store.code}
                            </span>
                          )}
                        </p>
                        <p className="truncate text-xs text-ink-muted">
                          {payment.user.name} · {paymentModeLabel(payment.mode)} ·{" "}
                          {timeAgo(payment.createdAt)}
                        </p>
                        <p className="mt-1 font-mono text-xs text-ink-muted">{payment.code}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-right">
                      <span className="text-lg font-bold text-ink tabular-nums">
                        {formatFCFA(payment.amount)}
                      </span>
                      <StatusBadge
                        status={payment.status}
                        label={PAYMENT_STATUS_LABEL[payment.status]}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                    <form action={confirmPaymentAction} className="flex-1">
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <button type="submit" className="btn btn-primary w-full">
                        <CircleCheck className="size-4" strokeWidth={2.2} aria-hidden="true" />
                        Confirmer la réception
                      </button>
                    </form>
                    <form action={cancelPaymentAction} className="sm:w-48">
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <button type="submit" className="btn btn-secondary w-full">
                        Refuser
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="flex items-center gap-2 text-base font-bold text-ink">
          <StoreIcon className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
          Derniers paiements traités
        </h2>

        <div className="mt-4">
          {recent.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-cloud-300 bg-white/70 px-6 py-8 text-center text-sm text-ink-muted">
              Aucun paiement traité pour l&apos;instant.
            </p>
          ) : (
            <ul className="divide-y divide-cloud-100 overflow-hidden rounded-2xl border border-cloud-200 bg-white shadow-soft">
              {recent.map((payment) => (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold text-white ring-1 ring-black/5 ring-inset"
                      style={{ backgroundColor: payment.store.color }}
                      aria-hidden="true"
                    >
                      {payment.store.name
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase() ?? "")
                        .join("")}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {payment.store.name} · {payment.user.name}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {timeAgo(payment.createdAt)} · {payment.code}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-ink tabular-nums">
                      {formatFCFA(payment.amount)}
                    </span>
                    <StatusBadge
                      status={payment.status}
                      label={PAYMENT_STATUS_LABEL[payment.status]}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
