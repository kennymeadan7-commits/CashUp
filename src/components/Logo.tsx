import Link from "next/link";

export function Logo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="Cashup — accueil">
      <span
        className={`relative grid size-10 shrink-0 place-items-center rounded-2xl shadow-sm ring-1 ring-inset transition-transform duration-300 group-hover:-rotate-3 ${
          light
            ? "bg-white/10 text-white ring-white/20"
            : "bg-brand-600 text-white ring-brand-700"
        }`}
      >
        <svg viewBox="0 0 32 32" className="size-6" fill="none" aria-hidden="true">
          <path
            d="M22.5 10.5a7.5 7.5 0 1 0 0 11"
            stroke="currentColor"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <path
            d="M19 13.5 24 8.5m0 0h-4.5M24 8.5V13"
            stroke="#c2ea3f"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span
            className={`block font-display text-2xl font-bold tracking-tight ${
              light ? "text-white" : "text-ink"
            }`}
          >
            Cashup
          </span>
          <span
            className={`mt-0.5 block text-[10px] font-bold tracking-[0.18em] uppercase ${
              light ? "text-acid-300" : "text-brand-600"
            }`}
          >
            Cashback · Bénin
          </span>
        </span>
      )}
    </Link>
  );
}
