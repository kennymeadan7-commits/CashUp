import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, CalendarClock, Globe, MapPin, Phone, ReceiptText } from "lucide-react";
import { prisma } from "@/lib/db";
import { StoreCard, cashbackLabel } from "@/components/StoreCard";
import { getCurrentUser } from "@/lib/auth";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import { formatDate, formatRate } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const store = await prisma.store.findUnique({ where: { slug } });
  if (!store) return { title: "Boutique introuvable" };
  return {
    title: `${store.name} — cashback ${cashbackLabel(store)}`,
    description: `${store.description} Profitez de ${cashbackLabel(store)} de cashback chez ${store.name} avec Cashup.`,
  };
}

export default async function StorePage({ params }: { params: Params }) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const store = await prisma.store.findUnique({
    where: { slug },
    include: { offers: { where: { active: true }, orderBy: { startsAt: "desc" } } },
  });

  if (!store || !store.active) notFound();

  const now = Date.now();
  const liveOffers = store.offers.filter(
    (offer) =>
      offer.startsAt.getTime() <= now && (!offer.endsAt || offer.endsAt.getTime() >= now),
  );

  const siblings = await prisma.store.findMany({
    where: { active: true, category: store.category, id: { not: store.id } },
    include: { offers: { where: { active: true } } },
    take: 3,
    orderBy: { createdAt: "asc" },
  });

  const category = CATEGORIES.find((c) => c.slug === store.category);
  const declareHref = user
    ? `/tableau-de-bord/achats/nouveau?store=${store.slug}`
    : `/connexion?next=${encodeURIComponent(`/boutiques/${store.slug}`)}`;

  return (
    <div className="container-page py-10 sm:py-14">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-ink-muted" aria-label="Fil d'ariane">
        <Link href="/boutiques" className="font-semibold text-brand-700 hover:underline">
          Boutiques
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/boutiques?categorie=${store.category}`}
          className="font-semibold text-brand-700 hover:underline"
        >
          {categoryLabel(store.category)}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{store.name}</span>
      </nav>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-start gap-4">
            <span
              className="grid size-16 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white shadow-sm ring-1 ring-black/5 ring-inset"
              style={{ backgroundColor: store.color }}
              aria-hidden="true"
            >
              {store.name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
                  {store.name}
                </h1>
                {store.featured && (
                  <span className="pill bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset">
                    En vedette
                  </span>
                )}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                <Link
                  href={`/boutiques?categorie=${store.category}`}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  {category?.label ?? categoryLabel(store.category)}
                </Link>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
                  {store.city ?? "Vente en ligne · tout le Bénin"}
                </span>
              </p>
            </div>
            <span className="pill bg-acid-100 text-acid-700 ring-1 ring-acid-300 ring-inset">
              {cashbackLabel(store)}
            </span>
          </div>

          <p className="mt-6 leading-relaxed text-ink-soft">{store.description}</p>

          <dl className="mt-6 grid gap-3 border-t border-cloud-100 pt-5 text-sm sm:grid-cols-2">
            {store.address && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" strokeWidth={1.9} aria-hidden="true" />
                <div>
                  <dt className="text-xs font-bold tracking-wide text-ink-muted uppercase">Adresse</dt>
                  <dd className="text-ink">{store.address}</dd>
                </div>
              </div>
            )}
            {store.website && (
              <div className="flex items-start gap-2">
                <Globe className="mt-0.5 size-4 shrink-0 text-brand-600" strokeWidth={1.9} aria-hidden="true" />
                <div className="min-w-0">
                  <dt className="text-xs font-bold tracking-wide text-ink-muted uppercase">Site web</dt>
                  <dd className="truncate">
                    <a
                      href={store.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {store.website.replace(/^https?:\/\//, "")}
                    </a>
                  </dd>
                </div>
              </div>
            )}
            {store.phone && (
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-600" strokeWidth={1.9} aria-hidden="true" />
                <div>
                  <dt className="text-xs font-bold tracking-wide text-ink-muted uppercase">Téléphone</dt>
                  <dd className="text-ink">{store.phone}</dd>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <ReceiptText className="mt-0.5 size-4 shrink-0 text-brand-600" strokeWidth={1.9} aria-hidden="true" />
              <div>
                <dt className="text-xs font-bold tracking-wide text-ink-muted uppercase">
                  Cashback de base
                </dt>
                <dd className="text-ink">
                  {store.cashbackType === "FIXED"
                    ? `${store.cashbackFixed ?? 0} FCFA par achat`
                    : formatRate(store.cashbackRate)}
                </dd>
              </div>
            </div>
          </dl>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={declareHref} className="btn btn-primary btn-lg">
              Déclarer un achat ici
              <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
            </Link>
            <Link href="/boutiques" className="btn btn-secondary btn-lg">
              Autres boutiques
            </Link>
          </div>
          {!user && (
            <p className="mt-3 text-xs text-ink-muted">
              Un compte gratuit est nécessaire pour déclarer vos achats et suivre votre cashback.
            </p>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <CalendarClock className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
              Offres en cours
            </h2>
            {liveOffers.length === 0 ? (
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Pas d&apos;offre boostée en ce moment : le cashback de base s&apos;applique à tous
                vos achats déclarés.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {liveOffers.map((offer) => (
                  <li
                    key={offer.id}
                    className="rounded-xl border border-acid-200 bg-acid-100/60 p-4 ring-1 ring-acid-300/50 ring-inset"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-ink">{offer.title}</p>
                      <span className="pill bg-white text-acid-700 ring-1 ring-acid-300 ring-inset">
                        {offer.cashbackType === "FIXED"
                          ? `${offer.cashbackFixed ?? 0} FCFA`
                          : formatRate(offer.cashbackRate ?? 0)}
                      </span>
                    </div>
                    {offer.description && (
                      <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
                        {offer.description}
                      </p>
                    )}
                    <p className="mt-2 text-[11px] font-semibold text-ink-muted">
                      Du {formatDate(offer.startsAt)}
                      {offer.endsAt ? ` au ${formatDate(offer.endsAt)}` : " · sans date de fin"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-base font-bold text-ink">Comment profiter ici</h2>
            <ol className="mt-3 space-y-2.5 text-sm text-ink-muted">
              <li className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  1
                </span>
                Effectuez votre achat en boutique ou en ligne, gardez le reçu.
              </li>
              <li className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  2
                </span>
                Déclarez-le depuis votre portefeuille : montant, date, référence.
              </li>
              <li className="flex gap-2.5">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  3
                </span>
                L&apos;équipe valide sous 48 h : votre cashback est crédité en FCFA.
              </li>
            </ol>
            <Link href={declareHref} className="btn btn-lime mt-5 w-full">
              Déclarer mon achat
            </Link>
          </div>
        </div>
      </div>

      {siblings.length > 0 && (
        <section className="mt-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">À découvrir aussi</p>
              <h2 className="section-title">Autres boutiques {categoryLabel(store.category).toLowerCase()}</h2>
            </div>
            <Link href={`/boutiques?categorie=${store.category}`} className="btn btn-outline">
              Tout voir
            </Link>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.map((sibling) => (
              <StoreCard key={sibling.id} store={sibling} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
