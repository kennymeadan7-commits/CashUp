import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-lg text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-cloud-100 text-ink-muted ring-1 ring-cloud-200 ring-inset">
          <SearchX className="size-6" strokeWidth={1.8} aria-hidden="true" />
        </span>
        <p className="eyebrow mt-5">Erreur 404</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink">
          Cette page n&apos;existe pas
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Le lien est peut-être obsolète, ou la page a été déplacée.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/boutiques" className="btn btn-primary">
            Voir les boutiques
          </Link>
          <Link href="/" className="btn btn-secondary">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
