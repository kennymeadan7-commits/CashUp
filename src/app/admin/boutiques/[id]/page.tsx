import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, Plus, Power, Store as StoreIcon, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { deleteOfferAction, toggleOfferAction } from "@/lib/actions/stores";
import { StoreForm } from "@/components/admin/StoreForm";
import { OfferForm } from "@/components/admin/OfferForm";
import { Flash, PageHeader } from "@/components/ui";
import { categoryLabel } from "@/lib/constants";
import { formatDate, formatFCFA, formatNumber, formatRate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modifier une boutique",
};

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ ok?: string; erreur?: string }>;

function offerLabel(offer: {
  cashbackType: string;
  cashbackRate: number | null;
  cashbackFixed: number | null;
}): string {
  if (offer.cashbackType === "FIXED") return `${formatFCFA(offer.cashbackFixed ?? 0)}`;
  return formatRate(offer.cashbackRate ?? 0);
}

export default async function AdminStoreEditPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const flash = await searchParams;

  const store = await prisma.store.findUnique({
    where: { id },
    include: {
      offers: { orderBy: { startsAt: "desc" } },
      _count: { select: { purchases: true } },
    },
  });

  if (!store) notFound();

  const now = Date.now();
  const stats = await prisma.purchase.aggregate({
    where: { storeId: store.id, status: "APPROVED" },
    _sum: { cashback: true },
    _count: true,
  });

  return (
    <>
      <PageHeader
        eyebrow={categoryLabel(store.category)}
        title={store.name}
        description={`${formatFCFA(stats._sum.cashback ?? 0)} de cashback versé sur ${formatNumber(stats._count)} achats validés.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/boutiques" className="btn btn-secondary">
              <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
              Toutes les boutiques
            </Link>
            <Link href={`/boutiques/${store.slug}`} className="btn btn-ghost" target="_blank">
              Voir la fiche publique
            </Link>
          </div>
        }
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <StoreIcon className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
              Informations de la boutique
            </h2>
            <div className="mb-5 mt-4 rounded-xl bg-cloud-100 px-4 py-3 text-xs text-ink-soft ring-1 ring-cloud-200 ring-inset">
              Créée le {formatDate(store.createdAt)} · dernière mise à jour le{" "}
              {formatDate(store.updatedAt)} ·{" "}
              {store.active ? "visible au public" : "masquée du catalogue"}.
            </div>
            <StoreForm
              store={{
                id: store.id,
                slug: store.slug,
                name: store.name,
                category: store.category,
                city: store.city ?? "",
                address: store.address ?? "",
                website: store.website ?? "",
                phone: store.phone ?? "",
                description: store.description,
                cashbackType: store.cashbackType,
                cashbackRate: store.cashbackRate,
                cashbackFixed: store.cashbackFixed,
                commissionRate: store.commissionRate,
                color: store.color,
                featured: store.featured,
                active: store.active,
              }}
              submitLabel="Enregistrer les modifications"
            />
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <CalendarClock className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
              Offres à durée limitée
            </h2>
            <p className="mb-4 mt-1 text-xs text-ink-muted">
              Si plusieurs règles sont en vigueur le jour de l&apos;achat, c&apos;est la plus
              avantageuse qui s&apos;applique.
            </p>

            {store.offers.length === 0 ? (
              <p className="rounded-xl bg-cloud-100 px-4 py-3 text-xs text-ink-muted ring-1 ring-cloud-200 ring-inset">
                Aucune offre : le cashback de base de la boutique s&apos;applique seul.
              </p>
            ) : (
              <ul className="space-y-3">
                {store.offers.map((offer) => {
                  const live =
                    offer.active &&
                    offer.startsAt.getTime() <= now &&
                    (!offer.endsAt || offer.endsAt.getTime() >= now);
                  return (
                    <li
                      key={offer.id}
                      className="rounded-xl border border-cloud-200 bg-white p-4 ring-1 ring-cloud-100 ring-inset"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink">{offer.title}</p>
                          <p className="mt-0.5 text-[11px] text-ink-muted">
                            Du {formatDate(offer.startsAt)}
                            {offer.endsAt ? ` au ${formatDate(offer.endsAt)}` : " · sans fin"}
                          </p>
                        </div>
                        <span className="pill shrink-0 bg-acid-100 text-acid-700 ring-1 ring-acid-300 ring-inset">
                          {offerLabel(offer)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cloud-100 pt-3">
                        <span
                          className={`pill px-2 py-0.5 text-[10px] ring-1 ring-inset ${
                            live
                              ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                              : offer.active
                                ? "bg-amber-100 text-amber-800 ring-amber-200"
                                : "bg-cloud-100 text-ink-muted ring-cloud-200"
                          }`}
                        >
                          {live ? "En cours" : offer.active ? "Planifiée / terminée" : "Désactivée"}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <form action={toggleOfferAction}>
                            <input type="hidden" name="id" value={offer.id} />
                            <button type="submit" className="btn btn-ghost btn-sm">
                              <Power className="size-3.5" strokeWidth={2} aria-hidden="true" />
                              {offer.active ? "Désactiver" : "Activer"}
                            </button>
                          </form>
                          <form action={deleteOfferAction}>
                            <input type="hidden" name="id" value={offer.id} />
                            <button
                              type="submit"
                              className="btn btn-ghost btn-sm text-rose-600 hover:bg-rose-50"
                              title="Supprimer l'offre"
                            >
                              <Trash2 className="size-3.5" strokeWidth={2} aria-hidden="true" />
                            </button>
                          </form>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <Plus className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
              Ajouter une offre
            </h2>
            <div className="mt-4">
              <OfferForm storeId={store.id} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
