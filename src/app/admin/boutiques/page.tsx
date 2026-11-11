import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Eye, EyeOff, Pencil, Plus, Store as StoreIcon } from "lucide-react";
import { prisma } from "@/lib/db";
import { toggleStoreAction } from "@/lib/actions/stores";
import { StoreForm } from "@/components/admin/StoreForm";
import { Flash, PageHeader } from "@/components/ui";
import { categoryLabel } from "@/lib/constants";
import { formatFCFA, formatNumber, formatRate, formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Boutiques partenaires",
};

type SearchParams = Promise<{ ok?: string; erreur?: string }>;

export default async function AdminStoresPage({ searchParams }: { searchParams: SearchParams }) {
  const flash = await searchParams;

  const stores = await prisma.store.findMany({
    include: { _count: { select: { offers: true, purchases: true } } },
    orderBy: [{ active: "desc" }, { featured: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Boutiques partenaires"
        description="Ajoutez, modifiez et mettez en avant les commerces du catalogue. Pas de suppression : désactivez une boutique pour la masquer."
        actions={
          <span className="pill bg-cloud-100 text-ink-soft ring-1 ring-cloud-200 ring-inset">
            {formatNumber(stores.length)} au total
          </span>
        }
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-3">
          {stores.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-cloud-300 bg-white/70 px-6 py-12 text-center">
              <StoreIcon className="mx-auto size-6 text-ink-muted" strokeWidth={1.7} aria-hidden="true" />
              <h3 className="mt-3 text-lg font-bold text-ink">Aucune boutique</h3>
              <p className="mt-1 text-sm text-ink-muted">
                Créez la première partenaire avec le formulaire ci-contre.
              </p>
            </div>
          ) : (
            stores.map((store) => (
              <article
                key={store.id}
                className={`card flex flex-wrap items-center gap-4 p-4 ${
                  store.active ? "" : "opacity-70"
                }`}
              >
                <span
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-xs font-bold text-white shadow-sm ring-1 ring-black/5 ring-inset"
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
                    <Link
                      href={`/admin/boutiques/${store.id}`}
                      className="truncate text-sm font-bold text-ink hover:text-brand-700 hover:underline"
                    >
                      {store.name}
                    </Link>
                    {store.featured && (
                      <span className="pill bg-brand-50 px-2 py-0.5 text-[10px] text-brand-700 ring-1 ring-brand-100 ring-inset">
                        Vedette
                      </span>
                    )}
                    <span
                      className={`pill px-2 py-0.5 text-[10px] ring-1 ring-inset ${
                        store.active
                          ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
                          : "bg-cloud-100 text-ink-muted ring-cloud-200"
                      }`}
                    >
                      {store.active ? "Active" : "Masquée"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink-muted">
                    {categoryLabel(store.category)} · {store.city ?? "En ligne"} ·{" "}
                    {store.cashbackType === "FIXED"
                      ? `${formatFCFA(store.cashbackFixed ?? 0)} / achat`
                      : `${store.cashbackRate} %`}{" "}
                    · commission {formatRate(store.commissionRate)} · créée le{" "}
                    {formatShortDate(store.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-xs text-ink-muted">
                  <span className="tabular-nums">
                    {formatNumber(store._count.offers)} offre{store._count.offers > 1 ? "s" : ""}
                  </span>
                  <span className="tabular-nums">
                    {formatNumber(store._count.purchases)} achat
                    {store._count.purchases > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/boutiques/${store.id}`}
                    className="btn btn-secondary btn-sm"
                    title="Modifier"
                  >
                    <Pencil className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    Modifier
                  </Link>
                  <form action={toggleStoreAction}>
                    <input type="hidden" name="id" value={store.id} />
                    <button
                      type="submit"
                      className="btn btn-ghost btn-sm"
                      title={store.active ? "Masquer du catalogue" : "Remettre en ligne"}
                    >
                      {store.active ? (
                        <EyeOff className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      ) : (
                        <Eye className="size-3.5" strokeWidth={2} aria-hidden="true" />
                      )}
                      {store.active ? "Masquer" : "Activer"}
                    </button>
                  </form>
                  <Link
                    href={`/boutiques/${store.slug}`}
                    className="btn btn-ghost btn-sm"
                    title="Voir la fiche publique"
                    target="_blank"
                  >
                    <ArrowUpRight className="size-3.5" strokeWidth={2} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>

        <section className="card sticky-cta h-fit p-6">
          <h2 className="flex items-center gap-2 text-base font-bold text-ink">
            <Plus className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
            Nouvelle boutique
          </h2>
          <p className="mb-4 mt-1 text-xs text-ink-muted">
            Le cashback de base s&apos;applique à tous les achats déclarés ; les offres boostées
            viennent s&apos;ajouter depuis la fiche de la boutique.
          </p>
          <StoreForm submitLabel="Créer la boutique" />
        </section>
      </div>
    </>
  );
}
