"use client";

import { useActionState } from "react";
import { CircleAlert, Save } from "lucide-react";
import { updateProfileAction, type ProfileState } from "@/lib/actions/profile";
import { CITIES } from "@/lib/constants";

export function ProfileForm({
  user,
}: {
  user: { name: string; phone: string; city: string };
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    {},
  );

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
        <label htmlFor="name" className="label">
          Nom complet
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          minLength={2}
          defaultValue={user.name}
          autoComplete="name"
          className="field"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="label">
            Téléphone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            defaultValue={user.phone}
            autoComplete="tel"
            className="field tabular-nums"
          />
        </div>

        <div>
          <label htmlFor="city" className="label">
            Ville
          </label>
          <select id="city" name="city" required defaultValue={user.city} className="field">
            {CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary">
        <Save className="size-4" strokeWidth={2} aria-hidden="true" />
        {pending ? "Enregistrement…" : "Enregistrer mes informations"}
      </button>
    </form>
  );
}
