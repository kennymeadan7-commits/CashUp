"use client";

import { useActionState, useState } from "react";
import { CircleAlert, Plus, Save } from "lucide-react";
import { createStoreAction, updateStoreAction, type StoreState } from "@/lib/actions/stores";
import { CATEGORIES, CITIES } from "@/lib/constants";

export type StoreValues = {
  id: string;
  slug: string;
  name: string;
  category: string;
  city: string;
  address: string;
  website: string;
  phone: string;
  description: string;
  cashbackType: string;
  cashbackRate: number;
  cashbackFixed: number | null;
  commissionRate: number;
  color: string;
  featured: boolean;
  active: boolean;
};

export function StoreForm({
  store,
  submitLabel,
}: {
  store?: StoreValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<StoreState, FormData>(
    store ? updateStoreAction : createStoreAction,
    {},
  );
  const [cashbackType, setCashbackType] = useState(store?.cashbackType ?? "PERCENT");

  return (
    <form action={formAction} className="space-y-4">
      {store && <input type="hidden" name="id" value={store.id} />}

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 ring-1 ring-rose-200 ring-inset"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">
            Nom de la boutique
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={80}
            defaultValue={store?.name}
            className="field"
            placeholder="Kponli Supermarché"
          />
        </div>

        <div>
          <label htmlFor="slug" className="label">
            Slug <span className="font-normal text-ink-muted">(URL, optionnel)</span>
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            maxLength={60}
            defaultValue={store?.slug}
            className="field"
            placeholder="généré automatiquement"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="label">
            Catégorie
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue={store?.category ?? CATEGORIES[0].slug}
            className="field"
          >
            {CATEGORIES.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="city" className="label">
            Ville <span className="font-normal text-ink-muted">(vide = en ligne)</span>
          </label>
          <select id="city" name="city" defaultValue={store?.city ?? ""} className="field">
            <option value="">Tout le Bénin / en ligne</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={3}
          minLength={20}
          maxLength={500}
          defaultValue={store?.description}
          className="field resize-none"
          placeholder="Supermarché de quartier ouvert 7j/7…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="address" className="label">
            Adresse
          </label>
          <input
            id="address"
            name="address"
            type="text"
            maxLength={160}
            defaultValue={store?.address ?? ""}
            className="field"
            placeholder="Rue 12.045, Cotonou"
          />
        </div>

        <div>
          <label htmlFor="phone" className="label">
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={30}
            defaultValue={store?.phone ?? ""}
            className="field"
            placeholder="+229 97 00 00 00"
          />
        </div>

        <div>
          <label htmlFor="website" className="label">
            Site web
          </label>
          <input
            id="website"
            name="website"
            type="url"
            maxLength={200}
            defaultValue={store?.website ?? ""}
            className="field"
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cashbackType" className="label">
            Type de cashback
          </label>
          <select
            id="cashbackType"
            name="cashbackType"
            value={cashbackType}
            onChange={(event) => setCashbackType(event.target.value)}
            className="field"
          >
            <option value="PERCENT">Pourcentage du montant</option>
            <option value="FIXED">Montant fixe par achat</option>
          </select>
        </div>

        {cashbackType === "PERCENT" ? (
          <div>
            <label htmlFor="cashbackRate" className="label">
              Taux (%)
            </label>
            <input
              id="cashbackRate"
              name="cashbackRate"
              type="number"
              min={0.1}
              max={100}
              step={0.1}
              required
              defaultValue={store?.cashbackType === "PERCENT" ? store.cashbackRate : 5}
              className="field tabular-nums"
              placeholder="5"
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
              defaultValue={store?.cashbackType === "FIXED" ? (store.cashbackFixed ?? 500) : 500}
              className="field tabular-nums"
              placeholder="500"
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="commissionRate" className="label">
            Taux de commission (%)
          </label>
          <input
            id="commissionRate"
            name="commissionRate"
            type="number"
            min={10}
            max={30}
            step={1}
            required
            defaultValue={store?.commissionRate ?? 20}
            className="field tabular-nums"
            placeholder="20"
          />
          <p className="mt-1.5 text-xs text-ink-muted">
            10 % à 30 % selon le secteur. Répartition : 50 % CashUp · 20 % frais · 30 % points
            membres.
          </p>
        </div>

        <div>
          <label htmlFor="color" className="label">
            Couleur du logo
          </label>
          <input
            id="color"
            name="color"
            type="color"
            defaultValue={store?.color ?? "#4348d8"}
            className="field h-[46px] cursor-pointer p-1.5"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={store?.featured ?? false}
            className="size-4 accent-brand-600"
          />
          Mettre en vedette
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            name="active"
            defaultChecked={store?.active ?? true}
            className="size-4 accent-brand-600"
          />
          Boutique active (visible au public)
        </label>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary">
        {store ? (
          <Save className="size-4" strokeWidth={2} aria-hidden="true" />
        ) : (
          <Plus className="size-4" strokeWidth={2.2} aria-hidden="true" />
        )}
        {pending ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}
