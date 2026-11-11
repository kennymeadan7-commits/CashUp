"use client";

import { useActionState, useState } from "react";
import { CircleAlert, Plus } from "lucide-react";
import { createOfferAction, type StoreState } from "@/lib/actions/stores";

export function OfferForm({ storeId }: { storeId: string }) {
  const [state, formAction, pending] = useActionState<StoreState, FormData>(createOfferAction, {});
  const [cashbackType, setCashbackType] = useState("PERCENT");

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="storeId" value={storeId} />

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
        <label htmlFor="title" className="label">
          Titre de l&apos;offre
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          minLength={3}
          maxLength={120}
          className="field"
          placeholder="Double cashback ce week-end !"
        />
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description <span className="font-normal text-ink-muted">(optionnel)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={2}
          maxLength={300}
          className="field resize-none"
          placeholder="Conditions de l'offre…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="cashbackType" className="label">
            Type
          </label>
          <select
            id="cashbackType"
            name="cashbackType"
            value={cashbackType}
            onChange={(event) => setCashbackType(event.target.value)}
            className="field"
          >
            <option value="PERCENT">Pourcentage</option>
            <option value="FIXED">Montant fixe</option>
          </select>
        </div>

        {cashbackType === "PERCENT" ? (
          <div>
            <label htmlFor="cashbackRate" className="label">
              Taux boosté (%)
            </label>
            <input
              id="cashbackRate"
              name="cashbackRate"
              type="number"
              min={0.1}
              max={100}
              step={0.1}
              required
              defaultValue={10}
              className="field tabular-nums"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="cashbackFixed" className="label">
              Montant fixe (FCFA)
            </label>
            <input
              id="cashbackFixed"
              name="cashbackFixed"
              type="number"
              min={50}
              step={50}
              required
              defaultValue={500}
              className="field tabular-nums"
            />
          </div>
        )}

        <div>
          <label htmlFor="startsAt" className="label">
            Début
          </label>
          <input id="startsAt" name="startsAt" type="date" required className="field" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="endsAt" className="label">
            Fin <span className="font-normal text-ink-muted">(vide = sans fin)</span>
          </label>
          <input id="endsAt" name="endsAt" type="date" className="field" />
        </div>
        <div className="flex items-end">
          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            <Plus className="size-4" strokeWidth={2.2} aria-hidden="true" />
            {pending ? "Ajout…" : "Ajouter l'offre"}
          </button>
        </div>
      </div>
    </form>
  );
}
