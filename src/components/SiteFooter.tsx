import Link from "next/link";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CATEGORIES, CITIES, WITHDRAWAL_METHODS } from "@/lib/constants";
import { CONTACT } from "@/lib/contact";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-brand-950 pb-[calc(4rem+env(safe-area-inset-bottom))] text-white md:pb-0">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-100/80">
            La plateforme de cashback du Bénin : achetez chez vos commerces habituels, déclarez vos
            achats et encaissez vos gains en FCFA sur Mobile Money.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand-100 ring-1 ring-white/15 ring-inset">
            <MapPin className="size-3.5 text-acid-400" aria-hidden="true" /> Cotonou · Bénin
          </p>
        </div>

        <div>
          <h2 className="text-[11px] font-bold tracking-[0.18em] text-acid-400 uppercase">
            Explorer
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-brand-100/80">
            <li>
              <Link href="/boutiques" className="transition-colors hover:text-white">
                Toutes les boutiques
              </Link>
            </li>
            <li>
              <Link href="/comment-ca-marche" className="transition-colors hover:text-white">
                Comment ça marche
              </Link>
            </li>
            <li>
              <Link href="/connexion" className="transition-colors hover:text-white">
                Connexion
              </Link>
            </li>
            <li>
              <Link href="/inscription" className="transition-colors hover:text-white">
                Créer un compte gratuit
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-[11px] font-bold tracking-[0.18em] text-acid-400 uppercase">
            Catégories
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-brand-100/80">
            {CATEGORIES.slice(0, 6).map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/boutiques?categorie=${category.slug}`}
                  className="transition-colors hover:text-white"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[11px] font-bold tracking-[0.18em] text-acid-400 uppercase">Aide</h2>
          <div className="mt-4 rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 ring-inset">
            <p className="flex items-center gap-2 text-xs font-semibold text-white">
              <ShieldCheck className="size-4 text-acid-400" aria-hidden="true" /> Une question sur
              un retrait ?
            </p>
            <a
              href={`mailto:${CONTACT.email}`}
              className="mt-2 flex items-center gap-2 text-sm font-semibold text-white hover:underline"
            >
              <Mail className="size-3.5 text-brand-200" aria-hidden="true" /> {CONTACT.email}
            </a>
            <a
              href={CONTACT.phoneHref}
              className="mt-1 flex items-center gap-2 text-sm text-brand-100/80 hover:text-white"
            >
              <Phone className="size-3.5 text-brand-200" aria-hidden="true" /> {CONTACT.phoneDisplay}
            </a>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-brand-100/60">
            Villes : {CITIES.slice(0, 6).join(" · ")}…
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-5 text-xs text-brand-100/60 sm:flex-row">
          <p>© {new Date().getFullYear()} Cashup. Tous droits réservés.</p>
          <p className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            {WITHDRAWAL_METHODS.map((operator) => (
              <span
                key={operator.value}
                className="rounded-full bg-white/5 px-2.5 py-1 font-medium text-brand-100/70 ring-1 ring-white/10 ring-inset"
              >
                {operator.label}
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
