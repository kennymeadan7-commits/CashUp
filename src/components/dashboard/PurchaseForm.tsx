"use client";

import { useActionState, useState } from "react";
import { CircleAlert, Info, Star, Wallet } from "lucide-react";
import { declarePurchaseAction, type PurchaseState } from "@/lib/actions/purchases";
import { splitCommission } from "@/lib/commission";
import { formatFCFA, formatNumber, formatRate } from "@/lib/format";

type StoreOption = {
  id: string;
  name: string;
  city: string | null;
  cashbackType: string;
  cashbackRate: number;
  cashbackFixed: number | null;
  commissionRate: number;
  slug: string;
};

export function PurchaseForm({
  stores,
  defaultStoreId,
}: {
  stores: StoreOption[];
  defaultStoreId?: string;
}) {
  const [state, formAction, pending] = useActionState<PurchaseState, FormData>(
    declarePurchaseAction,
    {},
  );
  const [storeId, setStoreId] = useState(defaultStoreId ?? stores[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const selected = stores.find((store) => store.id === storeId);

  const parsedAmount = Number(amount.replace(/\s/g, "")) || 0;
  const hasAmount = parsedAmount >= 500;

  const cashbackHint = selected
    ? selected.cashbackType === "FIXED"
      ? `${formatFCFA(selected.cashbackFixed ?? 0)} de cashback par achat déclaré`
      : `${formatRate(selected.cashbackRate)} de cashback sur le montant déclaré`
    : "";

  const estimatedCashback =
    selected && hasAmount
      ? selected.cashbackType === "FIXED"
        ? (selected.cashbackFixed ?? 0)
        : Math.round((parsedAmount * selected.cashbackRate) / 100)
      : null;

  const estimatedPoints =
    selected && hasAmount
      ? splitCommission(parsedAmount, selected.commissionRate).points
      : null;

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200 ring-inset"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="storeId" className="label">
          Boutique
        </label>
        <select
          id="storeId"
          name="storeId"
          required
          value={storeId}
          onChange={(event) => setStoreId(event.target.value)}
          className="field"
        >
          {stores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name}
              {store.city ? ` — ${store.city}` : " — en ligne"}
            </option>
          ))}
        </select>
        {selected && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
            <Info className="size-3.5 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
            {cashbackHint}
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="label">
            Montant dépensé (FCFA)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={500}
            max={10000000}
            step={1}
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="field tabular-nums"
            placeholder="12500"
          />
        </div>

        <div>
          <label htmlFor="purchasedAt" className="label">
            Date de l&apos;achat
          </label>
          <input id="purchasedAt" name="purchasedAt" type="date" required className="field" />
        </div>
      </div>

      {estimatedCashback !== null && estimatedPoints !== null && (
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-xl bg-acid-100 px-4 py-3 text-sm ring-1 ring-acid-300 ring-inset"
          aria-live="polite"
        >
          <span className="flex items-center gap-1.5 font-semibold text-acid-700">
            <Wallet className="size-4" strokeWidth={2} aria-hidden="true" />
            ≈ {formatFCFA(estimatedCashback)} de cashback
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-ink">
            <Star className="size-4 fill-current text-acid-600" strokeWidth={2} aria-hidden="true" />
            ≈ {formatNumber(estimatedPoints)} points de fidélité
          </span>
          <span className="w-full text-xs font-normal text-ink-muted">
            Estimation après validation : 30 % de la commission de la boutique.
          </span>
        </div>
      )}

      <div>
        <label htmlFor="receiptRef" className="label">
          Référence du reçu
        </label>
        <input
          id="receiptRef"
          name="receiptRef"
          type="text"
          required
          maxLength={60}
          minLength={3}
          className="field"
          placeholder="N° de ticket, référence de commande…"
        />
        <p className="mt-1.5 text-xs text-ink-muted">
          Conservez le reçu : il peut être demandé en cas de contrôle.
        </p>
      </div>

      <div>
        <label htmlFor="note" className="label">
          Note <span className="font-normal text-ink-muted">(optionnel)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={300}
          className="field resize-none"
          placeholder="Précision utile : numéro de commande, articles achetés…"
        />
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        <Wallet className="size-4" strokeWidth={2} aria-hidden="true" />
        {pending ? "Envoi de la déclaration…" : "Déclarer cet achat"}
      </button>
    </form>
  );
}
