"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, CircleAlert, Lock, Mail } from "lucide-react";
import { loginAction, type AuthState } from "@/lib/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}

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
            autoComplete="current-password"
            className="field pl-10"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full">
        {pending ? "Connexion…" : "Se connecter"}
        <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
      </button>

      <p className="text-center text-sm text-ink-muted">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-brand-700 hover:underline">
          Créer un compte gratuit
        </Link>
      </p>
    </form>
  );
}
