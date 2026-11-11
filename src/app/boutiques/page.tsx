import Link from "next/link";
import type { Metadata } from "next";
import { Search, Store as StoreIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { StoreCard } from "@/components/StoreCard";
import { EmptyState, PageHeader } from "@/components/ui";
import { CATEGORIES, CATEGORY_SLUGS, CITIES, categoryLabel } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutiques partenaires",
  description:
    "Découvrez les commerces partenaires Cashup au Bénin : supermarchés, pharmacies, restaurants, électronique et plus, avec de 2 % à 12 % de cashback.",
};

type SearchParams = Promise<{ q?: string; categorie?: string; ville?: string }>;

export default async function StoresPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const q = (params.q ?? "").trim().slice(0, 60);
  const category =
    params.categorie && CATEGORY_SLUGS.includes(params.categorie) ? params.categorie : "";
  const city = params.ville && CITIES.includes(params.ville) ? params.ville : "";

  const stores = await prisma.store.findMany({
    where: {
      active: true,
      ...(category ? { category } : {}),
      ...(city ? { city } : {}),
      ...(q
        ? { OR: [{ name: { contains: q } }, { description: { contains: q } }] }
        : {}),
    },
    include: { offers: { where: { active: true } } },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
  });

  const hasFilters = Boolean(q || category || city);

  return (
    <div className="container-page py-10 sm:py-14">
      <PageHeader
        eyebrow="Catalogue"
        title="Boutiques partenaires"
        description="Repérez le taux de cashback de chaque commerce, ouvrez la fiche et déclarez vos achats pour les valider."
        actions={
          <Link href="/comment-ca-marche" className="btn btn-secondary">
            Comment ça marche
          </Link>
        }
      />

      <form
        method="get"
        className="mt-8 rounded-2xl border border-cloud-200 bg-white p-4 shadow-soft sm:p-5"
      >
        <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto]">
          <div className="relative">
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
              placeholder="Rechercher une boutique…"
              aria-label="Rechercher une boutique"
            />
          </div>

          <select
            name="categorie"
            defaultValue={category}
            className="field"
            aria-label="Filtrer par catégorie"
          >
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            name="ville"
            defaultValue={city}
            className="field"
            aria-label="Filtrer par ville"
          >
            <option value="">Toutes les villes</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button type="submit" className="btn btn-primary">
            Filtrer
          </button>
        </div>

        {hasFilters && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span>
              {formatNumber(stores.length)} boutique{stores.length > 1 ? "s" : ""} trouvée
              {stores.length > 1 ? "s" : ""}
            </span>
            {category && <span className="pill bg-brand-50 text-brand-700">{categoryLabel(category)}</span>}
            {city && <span className="pill bg-cloud-100 text-ink-soft">{city}</span>}
            {q && <span className="pill bg-cloud-100 text-ink-soft">« {q} »</span>}
            <Link href="/boutiques" className="font-semibold text-brand-700 hover:underline">
              Tout effacer
            </Link>
          </div>
        )}
      </form>

      <div className="mt-8">
        {stores.length === 0 ? (
          <EmptyState
            icon={StoreIcon}
            title="Aucune boutique ne correspond"
            description="Essayez une autre catégorie, une autre ville ou un mot-clé différent."
            actionLabel="Voir tout le catalogue"
            actionHref="/boutiques"
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
