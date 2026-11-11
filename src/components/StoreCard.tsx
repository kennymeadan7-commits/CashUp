import Link from "next/link";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import type { Offer, Store } from "@prisma/client";
import { categoryLabel } from "@/lib/constants";
import { formatFCFA, formatRate } from "@/lib/format";

type StoreCardProps = {
  store: Store & { offers?: Offer[] };
};

/** Affiche le cashback principal d'une boutique (taux ou montant fixe). */
export function cashbackLabel(store: Pick<Store, "cashbackType" | "cashbackRate" | "cashbackFixed">): string {
  if (store.cashbackType === "FIXED") {
    return `${formatFCFA(store.cashbackFixed ?? 0)} / achat`;
  }
  return formatRate(store.cashbackRate);
}

export function StoreCard({ store }: StoreCardProps) {
  const activeOffers = store.offers?.length ?? 0;

  return (
    <Link
      href={`/boutiques/${store.slug}`}
      className="card card-hover group flex h-full flex-col p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="grid size-12 shrink-0 place-items-center rounded-2xl text-sm font-bold text-white shadow-sm ring-1 ring-black/5 ring-inset"
          style={{ backgroundColor: store.color }}
          aria-hidden="true"
        >
          {store.name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("")}
        </span>
        <span className="pill bg-acid-100 text-acid-700 ring-1 ring-acid-300 ring-inset">
          {cashbackLabel(store)}
        </span>
      </div>

      <div className="mt-4 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-ink transition-colors group-hover:text-brand-700">
            {store.name}
          </h3>
          {store.featured && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 ring-1 ring-brand-100 ring-inset"
              title="Boutique en vedette"
            >
              <Star className="size-3 fill-current" aria-hidden="true" />
              Vedette
            </span>
          )}
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">
          {store.description}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-cloud-100 pt-3 text-xs text-ink-muted">
        <span className="font-semibold text-brand-700">{categoryLabel(store.category)}</span>
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" strokeWidth={1.8} aria-hidden="true" />
          {store.city ?? "En ligne · tout le Bénin"}
        </span>
        {activeOffers > 0 && (
          <span className="inline-flex items-center gap-1 font-semibold text-acid-700">
            <ArrowUpRight className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
            {activeOffers} offre{activeOffers > 1 ? "s" : ""} boostée{activeOffers > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
