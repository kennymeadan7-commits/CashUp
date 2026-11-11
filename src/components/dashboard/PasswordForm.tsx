"use client";

import { useActionState } from "react";
import { CircleAlert, KeyRound } from "lucide-react";
import { changePasswordAction, type ProfileState } from "@/lib/actions/profile";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    changePasswordAction,
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
        <label htmlFor="currentPassword" className="label">
          Mot de passe actuel
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="field"
          placeholder="••••••••"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="newPassword" className="label">
            Nouveau mot de passe
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="field"
            placeholder="6 caractères minimum"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="label">
            Confirmation
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="field"
            placeholder="Retapez le mot de passe"
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-secondary">
        <KeyRound className="size-4" strokeWidth={2} aria-hidden="true" />
        {pending ? "Mise à jour…" : "Changer mon mot de passe"}
      </button>
    </form>
  );
}
