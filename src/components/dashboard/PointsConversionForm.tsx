"use client";

import { useState } from "react";
import { useActionState } from "react";
import { CircleAlert, Info, Ticket } from "lucide-react";
import { convertPointsAction, type PointsState } from "@/lib/actions/points";
import { MIN_POINTS_CONVERSION, POINTS_VALUE_FCFA } from "@/lib/constants";
import { formatFCFA, formatNumber } from "@/lib/format";

export function PointsConversionForm({ balance }: { balance: number }) {
  const [state, formAction, pending] = useActionState<PointsState, FormData>(
    convertPointsAction,
    {},
  );
  const [amount, setAmount] = useState("");

  const canConvert = balance >= MIN_POINTS_CONVERSION;
  const parsed = Number(amount.replace(/\s/g, "")) || 0;
  const valid = parsed >= MIN_POINTS_CONVERSION && parsed <= balance;

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

      <div className="rounded-xl bg-cloud-100 px-4 py-3 text-sm text-ink-soft ring-1 ring-cloud-200 ring-inset">
        Points disponibles :{" "}
        <span className="font-bold text-ink tabular-nums">{formatNumber(balance)}</span> — minimum{" "}
        {formatNumber(MIN_POINTS_CONVERSION)}.
      </div>

      <div>
        <label htmlFor="points-amount" className="label">
          Points à convertir
        </label>
        <input
          id="points-amount"
          name="amount"
          type="number"
          inputMode="numeric"
          min={MIN_POINTS_CONVERSION}
          max={balance}
          step={1}
          required
          disabled={!canConvert}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="field tabular-nums"
          placeholder={String(MIN_POINTS_CONVERSION)}
        />

        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={!canConvert}
            onClick={() => setAmount(String(MIN_POINTS_CONVERSION))}
            className="btn btn-secondary btn-sm flex-1"
          >
            Minimum
          </button>
          <button
            type="button"
            disabled={!canConvert}
            onClick={() => setAmount(String(balance))}
            className="btn btn-secondary btn-sm flex-1"
          >
            Tout convertir
          </button>
        </div>

        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
          <Info className="size-3.5 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
          {parsed > 0 && valid ? (
            <span className="font-semibold text-ink">
              Bon de {formatFCFA(parsed * POINTS_VALUE_FCFA)} immédiatement disponible.
            </span>
          ) : (
            <>1 point = {formatFCFA(POINTS_VALUE_FCFA)} : votre bon aura exactement cette valeur.</>
          )}
        </p>
      </div>

      <button type="submit" disabled={pending || !canConvert} className="btn btn-primary w-full">
        <Ticket className="size-4" strokeWidth={2} aria-hidden="true" />
        {pending ? "Conversion en cours…" : "Convertir en bon d'achat"}
      </button>

      {!canConvert && (
        <p className="text-center text-xs text-ink-muted">
          Il vous manque {formatNumber(MIN_POINTS_CONVERSION - balance)} points pour convertir.
        </p>
      )}
    </form>
  );
}
