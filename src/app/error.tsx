"use client";

import Link from "next/link";
import { CircleAlert, RefreshCw, WifiOff } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Panne réseau côté navigateur : le message parle à l'utilisateur final.
  const isNetworkError = /fetch|network|Failed to fetch|load failed/i.test(error.message);

  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 ring-inset">
          {isNetworkError ? (
            <WifiOff className="size-6" strokeWidth={1.8} aria-hidden="true" />
          ) : (
            <CircleAlert className="size-6" strokeWidth={1.8} aria-hidden="true" />
          )}
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink">
          {isNetworkError ? "Connexion interrompue" : "Une erreur est survenue"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {isNetworkError ? (
            <>
              Impossible de joindre Cashup. Vérifiez votre connexion internet (Wi-Fi ou forfait
              mobile), puis réessayez — aucune donnée n&apos;a été perdue.
            </>
          ) : (
            <>
              Le service a rencontré un problème inattendu. Vous pouvez réessayer, ou revenir à
              l&apos;accueil.
            </>
          )}
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-ink-muted">Référence : {error.digest}</p>
        )}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RefreshCw className="size-4" strokeWidth={2} aria-hidden="true" />
            Réessayer
          </button>
          <Link href="/" className="btn btn-secondary">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
