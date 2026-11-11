import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, MapPin, QrCode, ScanLine, Star, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requirePayer } from "@/lib/payer-guard";
import { getWallet } from "@/lib/wallet";
import { getPoints } from "@/lib/points";
import { MAX_PURCHASE_AMOUNT, MIN_PURCHASE_AMOUNT, PAYMENT_MODES } from "@/lib/constants";
import { Flash, PageHeader } from "@/components/ui";
import { formatFCFA, formatNumber, formatRate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payer",
};

type SearchParams = Promise<{ ok?: string; erreur?: string; code?: string }>;

export default async function PayerPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requirePayer();
  const params = await searchParams;

  const [stores, wallet, points] = await Promise.all([
    prisma.store.findMany({
      where: { active: true, code: { not: null } },
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      select: {
        name: true,
        code: true,
        city: true,
        address: true,
        color: true,
        cashbackType: true,
        cashbackRate: true,
        cashbackFixed: true,
      },
    }),
    getWallet(user.id),
    getPoints(user.id),
  ]);

  const prefill =
    params.code && stores.some((store) => store.code === params.code) ? params.code : "";

  return (
    <>
      <PageHeader
        eyebrow="Parcours de paiement"
        title="Payer chez un partenaire"
        description="Saisissez le code affiché chez le commerçant : le cashback tombe à la confirmation du paiement."
      />

      <div className="mt-6 space-y-4">
        <Flash ok={params.ok} error={params.erreur} />
      </div>

      <div className="mt-6">
        <Link
          href="/payer/scanner"
          className="card card-hover flex items-center gap-4 border-brand-200 bg-brand-50 p-5 hover:border-brand-300"
        >
          <span
            className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <ScanLine className="size-6" strokeWidth={2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ink">
              Scanner le QR code du commerçant
            </span>
            <span className="block text-xs text-ink-muted">
              Avec la caméra : le code marchand se remplit tout seul.
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 text-brand-700" strokeWidth={2.2} aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <QrCode className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
            Nouveau paiement
          </h2>

          <form method="get" action="/payer/confirmation" className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="code" className="label">
                  Code marchand
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  required
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  defaultValue={prefill}
                  className="field text-center font-mono text-lg tracking-[0.3em] tabular-nums"
                  placeholder="7842"
                  autoComplete="off"
                />
              </div>

              <div>
                <label htmlFor="amount" className="label">
                  Montant à payer (FCFA)
                </label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  required
                  inputMode="numeric"
                  min={MIN_PURCHASE_AMOUNT}
                  max={MAX_PURCHASE_AMOUNT}
                  step={1}
                  className="field tabular-nums"
                  placeholder="2500"
                />
              </div>
            </div>

            <fieldset>
              <legend className="label">Mode de paiement</legend>
              <div className="space-y-2.5">
                {PAYMENT_MODES.map((mode, index) => (
                  <label
                    key={mode.value}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-cloud-200 bg-white p-3.5 transition-colors has-[:checked]:border-brand-400 has-[:checked]:bg-brand-50 has-[:checked]:ring-1 has-[:checked]:ring-brand-200 has-[:checked]:ring-inset hover:border-cloud-300"
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={mode.value}
                      defaultChecked={index === 0}
                      className="mt-0.5 size-4 shrink-0 accent-brand-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-ink">{mode.label}</span>
                      <span className="block text-xs text-ink-muted">{mode.hint}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <button type="submit" className="btn btn-primary w-full">
              Continuer
              <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
            </button>
          </form>
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="text-base font-bold text-ink">Votre compte</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-ink-muted">
                  <Wallet className="size-4 text-brand-600" strokeWidth={1.9} aria-hidden="true" />
                  Solde Cashup
                </dt>
                <dd className="font-bold text-ink tabular-nums">{formatFCFA(wallet.available)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="flex items-center gap-2 text-ink-muted">
                  <Star
                    className="size-4 fill-current text-acid-500"
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                  Points Cashup
                </dt>
                <dd className="font-bold text-ink tabular-nums">
                  {formatNumber(points.balance)} pts
                </dd>
              </div>
            </dl>
            <p className="mt-4 rounded-xl bg-cloud-100 px-3.5 py-2.5 text-xs leading-relaxed text-ink-muted">
              1 point = 1 FCFA. Les paiements en espèces ou en solde créditent le cashback
              immédiatement.
            </p>
          </div>

          <div className="rounded-2xl border border-cloud-200 bg-cloud-100/70 p-5">
            <p className="text-sm font-bold text-ink">Comment ça marche</p>
            <ol className="mt-3 space-y-2 text-xs leading-relaxed text-ink-muted">
              <li>1. Scannez le QR du commerçant (ou saisissez son code) et le montant.</li>
              <li>2. Validez avec votre code PIN CashUp (6 chiffres).</li>
              <li>3. Le commerçant confirme la réception : cashback crédité.</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">À proximité</p>
            <h2 className="section-title mt-2 text-2xl sm:text-3xl">Nos boutiques partenaires</h2>
          </div>
          <Link href="/boutiques" className="btn btn-outline btn-sm">
            Voir toutes les boutiques
          </Link>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <li key={store.code}>
              <Link
                href={`/payer?code=${store.code}`}
                className="card card-hover block p-5"
                aria-label={`Payer chez ${store.name} avec le code ${store.code}`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white shadow-sm ring-1 ring-black/5 ring-inset"
                    style={{ backgroundColor: store.color }}
                    aria-hidden="true"
                  >
                    {store.name
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? "")
                      .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{store.name}</p>
                    <p className="flex items-center gap-1 text-xs text-ink-muted">
                      <MapPin className="size-3.5 shrink-0" strokeWidth={1.8} aria-hidden="true" />
                      <span className="truncate">{store.address ?? store.city ?? "Bénin"}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="rounded-lg bg-cloud-100 px-2.5 py-1.5 font-mono text-sm font-bold text-ink tabular-nums ring-1 ring-cloud-200 ring-inset">
                    {store.code}
                  </span>
                  <span className="text-xs font-semibold text-brand-700 tabular-nums">
                    {store.cashbackType === "FIXED"
                      ? `${formatFCFA(store.cashbackFixed ?? 0)} / achat`
                      : `${formatRate(store.cashbackRate)} de cashback`}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
