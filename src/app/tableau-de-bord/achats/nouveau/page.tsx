import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft, Info, ReceiptText } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PurchaseForm } from "@/components/dashboard/PurchaseForm";
import { PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Déclarer un achat",
};

type SearchParams = Promise<{ store?: string }>;

export default async function NewPurchasePage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const params = await searchParams;

  const stores = await prisma.store.findMany({
    where: { active: true },
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      city: true,
      cashbackType: true,
      cashbackRate: true,
      cashbackFixed: true,
      commissionRate: true,
      slug: true,
    },
  });

  if (stores.length === 0) notFound();

  const preset = params.store ? stores.find((store) => store.slug === params.store) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Nouvelle déclaration"
        title="Déclarer un achat"
        description="Renseignez votre achat : le cashback est calculé automatiquement au taux en vigueur le jour de l'achat."
        actions={
          <Link href="/tableau-de-bord/achats" className="btn btn-secondary">
            <ArrowLeft className="size-4" strokeWidth={2} aria-hidden="true" />
            Mes achats
          </Link>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="card p-6">
          <PurchaseForm stores={stores} defaultStoreId={preset?.id} />
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <Info className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
              Bon à savoir
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-acid-500" aria-hidden="true" />
                Gardez votre reçu ou votre confirmation de paiement : une référence est demandée.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-acid-500" aria-hidden="true" />
                Les achats de plus de 90 jours ne peuvent plus être déclarés.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-acid-500" aria-hidden="true" />
                Validation sous 48 h ouvrées : le cashback est crédité uniquement après contrôle.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-acid-500" aria-hidden="true" />
                Si une offre boostée est en cours, c&apos;est le meilleur taux qui s&apos;applique.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-cloud-200 bg-cloud-100/70 p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <ReceiptText className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
              Qu&apos;est-ce qui est accepté comme preuve ?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-ink-muted">
              Numéro de ticket de caisse, référence de commande en ligne, capture du paiement Mobile
              Money… tout identifiant permettant de retrouver l&apos;achat chez le partenaire.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
