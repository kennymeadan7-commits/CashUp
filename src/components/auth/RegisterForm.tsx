"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, CircleAlert, Lock, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { registerAction, type AuthState } from "@/lib/actions/auth";
import { CITIES } from "@/lib/constants";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(registerAction, {});

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
        <div className="relative">
          <UserRound
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="field pl-10"
            placeholder="Aïcha Houngbédji"
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="label">
          Adresse e-mail
        </label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="field pl-10"
            placeholder="vous@exemple.bj"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="label">
            Téléphone
          </label>
          <div className="relative">
            <Phone
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              className="field pl-10"
              placeholder="97 12 34 56"
            />
          </div>
        </div>

        <div>
          <label htmlFor="city" className="label">
            Ville
          </label>
          <div className="relative">
            <MapPin
              className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
              strokeWidth={1.8}
              aria-hidden="true"
            />
            <select id="city" name="city" required defaultValue="Cotonou" className="field pl-10">
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="password" className="label">
          Mot de passe
        </label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="field pl-10"
            placeholder="6 caractères minimum"
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Création du compte…" : "Créer mon compte gratuit"}
        <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
      </button>

      <p className="text-center text-sm text-ink-muted">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="font-semibold text-brand-700 hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
