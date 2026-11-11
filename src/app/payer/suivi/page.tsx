import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CircleCheck,
  CircleX,
  LoaderCircle,
  Star,
  Store as StoreIcon,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePayer } from "@/lib/payer-guard";
import { isMarchand } from "@/lib/roles";
import { PAYMENT_STATUS_LABEL, paymentModeLabel } from "@/lib/constants";
import { Flash, StatusBadge } from "@/components/ui";
import { AutoRefresh } from "@/components/payments/AutoRefresh";
import { cancelPaymentAction } from "@/lib/actions/payments";
import { getWallet } from "@/lib/wallet";
import { getPoints } from "@/lib/points";
import { formatFCFA, formatNumber, timeAgo } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Suivi du paiement",
};

type SearchParams = Promise<{ id?: string; ok?: string; erreur?: string }>;

export default async function PaymentTrackingPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePayer("/payer/suivi");
  const params = await searchParams;

  const id = (params.id ?? "").trim();
  if (!id) {
    redirect(`/payer?erreur=${encodeURIComponent("Référence de paiement manquante.")}`);
  }

  const payment = await prisma.paymentRequest.findUnique({
    where: { id },
    include: { store: true },
  });
  if (!payment) {
    redirect(`/payer?erreur=${encodeURIComponent("Paiement introuvable.")}`);
  }
  if (payment.userId !== user.id && !isMarchand(user.role)) {
    redirect(`/payer?erreur=${encodeURIComponent("Ce paiement ne vous appartient pas.")}`);
  }

  const isOwn = payment.userId === user.id;
  const backToPayer = (
    <Link href="/payer" className="btn btn-secondary">
      Retour à Payer
    </Link>
  );

  // --- En attente de la confirmation du commerçant (polling 2 s) -----------
  if (payment.status === "PENDING") {
    return (
      <>
        <AutoRefresh />
        <div className="mx-auto max-w-lg">
          <div className="card p-8 text-center">
            <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-amber-100 text-amber-700 ring-1 ring-amber-200 ring-inset">
              <LoaderCircle className="size-8 animate-spin" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <p className="eyebrow mt-5">Étape en cours</p>
            <h1 className="mt-2 font-display text-2xl leading-tight font-bold tracking-tight text-ink sm:text-3xl">
              En attente du commerçant
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              Ne quittez pas cette page : <strong className="text-ink">{payment.store.name}</strong>{" "}
              doit confirmer la réception de votre paiement. La page se met à jour toute seule.
            </p>

            <div className="mt-6 rounded-2xl bg-cloud-100/70 p-5">
              <p className="font-display text-3xl font-bold tracking-tight text-ink tabular-nums">
                {formatFCFA(payment.amount)}
              </p>
              <p className="mt-1 text-xs font-semibold text-brand-700">
                {paymentModeLabel(payment.mode)} · {payment.code}
              </p>
              <p className="mt-3 text-xs text-ink-muted">Créé {timeAgo(payment.createdAt)}</p>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2">
              <StatusBadge
                status={payment.status}
                label={PAYMENT_STATUS_LABEL[payment.status]}
              />
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <form action={cancelPaymentAction}>
                <input type="hidden" name="paymentId" value={payment.id} />
                <button type="submit" className="btn btn-secondary w-full sm:w-auto">
                  <CircleX className="size-4" strokeWidth={2} aria-hidden="true" />
                  Annuler le paiement
                </button>
              </form>
              {backToPayer}
            </div>
          </div>
        </div>
      </>
    );
  }

  // --- Paiement annulé -----------------------------------------------------
  if (payment.status === "CANCELLED") {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card p-8 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-cloud-100 text-ink-muted ring-1 ring-cloud-200 ring-inset">
            <CircleX className="size-8" strokeWidth={1.7} aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold tracking-tight text-ink">
            Paiement annulé
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            La demande {payment.code} chez {payment.store.name} a été annulée. Aucun montant
            n&apos;a été débité.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={`/payer?code=${payment.store.code ?? ""}`} className="btn btn-primary">
              Réessayer
              <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
            </Link>
            {backToPayer}
          </div>
        </div>
      </div>
    );
  }

  // --- Paiement confirmé : cashback crédité -------------------------------
  const purchase = await prisma.purchase.findFirst({
    where: { receiptRef: `Paiement ${payment.code}` },
    select: { cashback: true, pointsShare: true },
  });
  const [wallet, points] = isOwn
    ? await Promise.all([getWallet(user.id), getPoints(user.id)])
    : [null, null];

  const cashback = purchase?.cashback ?? 0;
  const earnedPoints = purchase?.pointsShare ?? 0;

  return (
    <div className="mx-auto max-w-lg">
      <div className="card overflow-hidden p-0">
        <div className="bg-acid-100 px-8 py-7 text-center ring-1 ring-acid-300 ring-inset">
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white text-acid-700 shadow-soft ring-1 ring-acid-300 ring-inset">
            <CircleCheck className="size-8" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <p className="eyebrow mt-4 text-acid-700">Paiement confirmé</p>
          <h1 className="mt-2 font-display text-2xl leading-tight font-bold tracking-tight text-ink sm:text-3xl">
            {formatFCFA(payment.amount)} réglés
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            chez {payment.store.name} · {payment.code}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-acid-100 px-4 py-3.5 ring-1 ring-acid-300 ring-inset">
            <span className="flex items-center gap-2 text-sm font-semibold text-acid-700">
              <Wallet className="size-4" strokeWidth={2} aria-hidden="true" />
              Cashback crédité
            </span>
            <span className="font-bold text-acid-700 tabular-nums">+ {formatFCFA(cashback)}</span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-cloud-100 px-4 py-3.5">
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Star className="size-4 fill-current text-acid-500" strokeWidth={2} aria-hidden="true" />
              Points de fidélité
            </span>
            <span className="font-bold text-ink tabular-nums">
              + {formatNumber(earnedPoints)} pts
            </span>
          </div>

          {wallet && points && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-cloud-200 bg-white p-4 text-center">
                <p className="text-[11px] font-bold tracking-[0.12em] text-ink-muted uppercase">
                  Solde
                </p>
                <p className="mt-1.5 text-lg font-bold text-ink tabular-nums">
                  {formatFCFA(wallet.available)}
                </p>
              </div>
              <div className="rounded-2xl border border-cloud-200 bg-white p-4 text-center">
                <p className="text-[11px] font-bold tracking-[0.12em] text-ink-muted uppercase">
                  Points
                </p>
                <p className="mt-1.5 text-lg font-bold text-ink tabular-nums">
                  {formatNumber(points.balance)}
                </p>
              </div>
            </div>
          )}

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
            <StoreIcon className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
            Confirmation {payment.confirmedAt ? timeAgo(payment.confirmedAt) : "à l’instant"} ·{" "}
            {paymentModeLabel(payment.mode)}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/tableau-de-bord" className="btn btn-primary">
              <Wallet className="size-4" strokeWidth={2} aria-hidden="true" />
              Voir mon portefeuille
            </Link>
            <Link href="/payer" className="btn btn-secondary">
              Payer un autre achat
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Flash ok={params.ok} error={params.erreur} />
      </div>
    </div>
  );
}
