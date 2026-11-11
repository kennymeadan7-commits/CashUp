"use client";

import { useActionState } from "react";
import { CircleAlert, HandCoins, Info } from "lucide-react";
import { requestWithdrawalAction, type WithdrawalState } from "@/lib/actions/withdrawals";
import { MIN_WITHDRAWAL, WITHDRAWAL_METHODS } from "@/lib/constants";
import { formatFCFA, formatPhone } from "@/lib/format";

export function WithdrawalForm({
  available,
  defaultPhone,
}: {
  available: number;
  defaultPhone: string;
}) {
  const [state, formAction, pending] = useActionState<WithdrawalState, FormData>(
    requestWithdrawalAction,
    {},
  );

  const canWithdraw = available >= MIN_WITHDRAWAL;

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
        Disponible :{" "}
        <span className="font-bold text-ink tabular-nums">{formatFCFA(available)}</span> — minimum{" "}
        {formatFCFA(MIN_WITHDRAWAL)}.
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="amount" className="label">
            Montant à retirer (FCFA)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            inputMode="numeric"
            min={MIN_WITHDRAWAL}
            max={available}
            step={1}
            required
            disabled={!canWithdraw}
            className="field tabular-nums"
            placeholder={String(MIN_WITHDRAWAL)}
          />
        </div>

        <div>
          <label htmlFor="method" className="label">
            Opérateur
          </label>
          <select id="method" name="method" required defaultValue="MTN_MONEY" className="field">
            {WITHDRAWAL_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="label">
          Numéro Mobile Money bénéficiaire
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          defaultValue={defaultPhone}
          className="field tabular-nums"
          placeholder="+229 97 12 34 56"
        />
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-muted">
          <Info className="size-3.5 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
          Vérifiez le numéro : le versement est fait sur ce compte, sans frais.
        </p>
      </div>

      <button type="submit" disabled={pending || !canWithdraw} className="btn btn-primary w-full">
        <HandCoins className="size-4" strokeWidth={2} aria-hidden="true" />
        {pending ? "Envoi de la demande…" : "Demander ce retrait"}
      </button>

      {!canWithdraw && (
        <p className="text-center text-xs text-ink-muted">
          Il vous manque {formatFCFA(MIN_WITHDRAWAL - available)} pour atteindre le minimum de
          retrait.
        </p>
      )}
    </form>
  );
}
