import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  CircleAlert,
  Coins,
  MapPin,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePayer } from "@/lib/payer-guard";
import { bestCashbackFor, getWallet } from "@/lib/wallet";
import { getPoints } from "@/lib/points";
import { splitCommission } from "@/lib/commission";
import {
  MAX_PURCHASE_AMOUNT,
  MIN_PURCHASE_AMOUNT,
  PAYMENT_MODES,
  paymentModeLabel,
} from "@/lib/constants";
import { Flash } from "@/components/ui";
import { createPaymentAction } from "@/lib/actions/payments";
import { formatFCFA, formatNumber, formatRate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmer le paiement",
};

type SearchParams = Promise<{
  code?: string;
  amount?: string;
  mode?: string;
  erreur?: string;
}>;

export default async function PaymentConfirmationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requirePayer("/payer/confirmation");
  const params = await searchParams;

  const code = (params.code ?? "").trim();
  const rawAmount = (params.amount ?? "").replace(/\s/g, "");
  const amount = rawAmount === "" ? Number.NaN : Number(rawAmount);
  const mode = (params.mode ?? "CASH").toUpperCase();

  if (!/^\d{4}$/.test(code)) {
    redirect(`/payer?erreur=${encodeURIComponent("Saisissez un code marchand à 4 chiffres.")}`);
  }
  if (!Number.isInteger(amount) || amount < MIN_PURCHASE_AMOUNT || amount > MAX_PURCHASE_AMOUNT) {
    redirect(
      `/payer?erreur=${encodeURIComponent(
        `Le montant doit être compris entre ${MIN_PURCHASE_AMOUNT} et ${MAX_PURCHASE_AMOUNT} FCFA.`,
      )}`,
    );
  }
  if (!PAYMENT_MODES.some((option) => option.value === mode)) {
    redirect(`/payer?erreur=${encodeURIComponent("Mode de paiement invalide.")}`);
  }

  const store = await prisma.store.findUnique({
    where: { code },
    include: { offers: { where: { active: true } } },
  });
  if (!store || !store.active) {
    redirect(
      `/payer?erreur=${encodeURIComponent("Code marchand introuvable ou boutique inactive.")}`,
    );
  }

  const [wallet, points] = await Promise.all([getWallet(user.id), getPoints(user.id)]);
  const { cashback } = bestCashbackFor(store, store.offers, amount, new Date());
  const shares = splitCommission(amount, store.commissionRate);

  const debitsWallet = mode === "WALLET";
  const debitsPoints = mode === "POINTS";
  const walletAfter = wallet.available - (debitsWallet ? amount : 0) + cashback;
  const pointsAfter = points.balance - (debitsPoints ? amount : 0);
  const insufficient =
    (debitsWallet && wallet.available < amount) ||
    (debitsPoints && points.balance < amount);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow mb-2">Étape 2 sur 2</p>
          <h1 className="font-display text-3xl leading-[1.08] font-bold tracking-tight text-ink sm:text-4xl">
            Confirmer le paiement
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Vérifiez le récapitulatif puis validez avec votre code PIN CashUp.
          </p>
        </div>
        <Link href="/payer" className="btn btn-secondary">
          <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
          Annuler
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        <Flash error={params.erreur} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card p-6">
          <div className="flex items-start gap-3">
            <span
              className="grid size-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-white shadow-sm ring-1 ring-black/5 ring-inset"
              style={{ backgroundColor: store.color }}
              aria-hidden="true"
            >
              {store.name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-ink">{store.name}</p>
              <p className="flex items-center gap-1 text-xs text-ink-muted">
                <MapPin className="size-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                <span className="truncate">{store.address ?? store.city ?? "Bénin"}</span>
              </p>
            </div>
            <span className="ml-auto rounded-lg bg-cloud-100 px-2.5 py-1.5 font-mono text-sm font-bold text-ink tabular-nums ring-1 ring-cloud-200 ring-inset">
              {code}
            </span>
          </div>

          <div className="mt-6 rounded-2xl bg-cloud-100/70 p-5 text-center">
            <p className="text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">
              Montant à payer
            </p>
            <p className="mt-2 font-display text-4xl font-bold tracking-tight text-ink tabular-nums">
              {formatFCFA(amount)}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-brand-700">
              {paymentModeLabel(mode)}
            </p>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-acid-100 px-4 py-3 ring-1 ring-acid-300 ring-inset">
              <dt className="flex items-center gap-2 font-semibold text-acid-700">
                <Wallet className="size-4" strokeWidth={2} aria-hidden="true" />
                Cashback immédiat
              </dt>
              <dd className="font-bold text-acid-700 tabular-nums">+ {formatFCFA(cashback)}</dd>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-cloud-100 px-4 py-3">
              <dt className="flex items-center gap-2 font-semibold text-ink">
                <Star className="size-4 fill-current text-acid-500" strokeWidth={2} aria-hidden="true" />
                Points de fidélité
              </dt>
              <dd className="font-bold text-ink tabular-nums">+ {formatNumber(shares.points)} pts</dd>
            </div>

            {debitsWallet && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-cloud-100 px-4 py-3">
                <dt className="text-ink-muted">Solde Cashup</dt>
                <dd className="font-bold text-ink tabular-nums">
                  {formatFCFA(wallet.available)} → {formatFCFA(walletAfter)}
                </dd>
              </div>
            )}

            {debitsPoints && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-cloud-100 px-4 py-3">
                <dt className="text-ink-muted">Points Cashup</dt>
                <dd className="font-bold text-ink tabular-nums">
                  {formatNumber(points.balance)} → {formatNumber(pointsAfter)} pts
                </dd>
              </div>
            )}

            {!debitsWallet && !debitsPoints && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-cloud-100 px-4 py-3">
                <dt className="text-ink-muted">Réglage</dt>
                <dd className="font-bold text-ink">Espèces au comptoir</dd>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 rounded-xl bg-cloud-100 px-4 py-3">
              <dt className="text-ink-muted">Commission partenaire</dt>
              <dd className="font-bold text-ink tabular-nums">
                {formatRate(store.commissionRate)} · {formatFCFA(shares.commission)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
            <Coins className="mt-0.5 size-4 shrink-0 text-brand-600" strokeWidth={1.8} aria-hidden="true" />
            Répartition 50/20/30 : {formatFCFA(shares.cashUp)} Cashup ·{" "}
            {formatFCFA(shares.fees)} frais · {formatNumber(shares.points)} points pour vous.
          </p>
        </div>

        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <ShieldCheck className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
            Valider avec votre PIN
          </h2>

          {insufficient && (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200 ring-inset"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
              {debitsWallet
                ? `Solde insuffisant : ${formatFCFA(wallet.available)} disponibles pour ${formatFCFA(amount)}.`
                : `Points insuffisants : ${formatNumber(points.balance)} disponibles pour ${formatNumber(amount)} points.`}
            </p>
          )}

          <form action={createPaymentAction} className="mt-5 space-y-4">
            <input type="hidden" name="code" value={code} />
            <input type="hidden" name="amount" value={String(amount)} />
            <input type="hidden" name="mode" value={mode} />

            <div>
              <label htmlFor="pin" className="label">
                Code PIN CashUp
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                required
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                autoComplete="off"
                className="field text-center font-mono text-2xl tracking-[0.45em] tabular-nums"
                placeholder="••••••"
                aria-describedby="pin-hint"
              />
              <p id="pin-hint" className="mt-1.5 text-xs text-ink-muted">
                Démo : saisissez 6 chiffres (ex. 123456). Aucun code n&apos;est enregistré.
              </p>
            </div>

            <button type="submit" disabled={insufficient} className="btn btn-primary w-full">
              <ShieldCheck className="size-4" strokeWidth={2.2} aria-hidden="true" />
              Payer {formatFCFA(amount)}
            </button>

            <p className="text-center text-xs leading-relaxed text-ink-muted">
              Le commerçant confirme la réception depuis son espace : le cashback est crédité à
              cet instant.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}
