import Link from "next/link";
import { Search, X } from "lucide-react";

/**
 * Barre de recherche GET pour les listes du back-office.
 * Le formulaire recharge la page avec `?q=…` (et les paramètres conservés
 * via `hidden`), ce qui fonctionne sans JavaScript.
 */
export function SearchField({
  q,
  placeholder,
  ariaLabel,
  hidden,
  clearHref,
}: {
  q: string;
  placeholder: string;
  ariaLabel?: string;
  hidden?: Record<string, string>;
  clearHref?: string;
}) {
  return (
    <form
      method="get"
      className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-cloud-200 bg-white p-4 shadow-soft"
    >
      <div className="relative min-w-56 flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-muted"
          strokeWidth={1.8}
          aria-hidden="true"
        />
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={60}
          className="field pl-10"
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
        />
      </div>

      {hidden &&
        Object.entries(hidden).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}

      <button type="submit" className="btn btn-dark btn-sm">
        Rechercher
      </button>

      {q && clearHref && (
        <Link href={clearHref} className="btn btn-ghost btn-sm">
          <X className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
          Effacer
        </Link>
      )}
    </form>
  );
}
