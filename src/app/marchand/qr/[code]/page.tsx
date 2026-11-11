import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ScanLine, Smartphone, Wallet } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireMarchand } from "@/lib/marchand-guard";
import { getRequestOrigin } from "@/lib/origin";
import { storeQrPayload } from "@/lib/qr";
import { qrDataUrl } from "@/lib/qr-image";
import { formatFCFA, formatRate } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "QR code de la boutique",
};

type Params = Promise<{ code: string }>;

export default async function MarchandQrPage({ params }: { params: Params }) {
  await requireMarchand();
  const { code } = await params;

  const store = await prisma.store.findFirst({
    where: { code, active: true },
    select: {
      code: true,
      name: true,
      color: true,
      city: true,
      cashbackType: true,
      cashbackRate: true,
      cashbackFixed: true,
    },
  });
  if (!store?.code) notFound();

  const origin = await getRequestOrigin();
  const payload = storeQrPayload(store.code, origin);
  const qr = await qrDataUrl(payload, 640);

  const cashbackLabel =
    store.cashbackType === "FIXED"
      ? `${formatFCFA(store.cashbackFixed ?? 0)} de cashback par achat`
      : `${formatRate(store.cashbackRate)} de cashback sur chaque achat`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/marchand" className="btn btn-outline btn-sm">
          <ArrowLeft className="size-4" strokeWidth={2.2} aria-hidden="true" />
          Retour à l&apos;espace marchand
        </Link>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200 ring-inset">
          Affichez cet écran à la caisse
        </span>
      </div>

      <div className="mx-auto mt-6 max-w-lg">
        <div className="overflow-hidden rounded-3xl border border-cloud-200 bg-white shadow-soft">
          <div
            className="flex items-center gap-3 px-6 py-5 text-white"
            style={{ backgroundColor: store.color }}
          >
            <span
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15 text-sm font-bold ring-1 ring-white/30 ring-inset"
              aria-hidden="true"
            >
              {store.name
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0]?.toUpperCase() ?? "")
                .join("")}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-bold">{store.name}</p>
              <p className="truncate text-xs text-white/85">
                {store.city ?? "Bénin"} · {cashbackLabel}
              </p>
            </div>
          </div>

          <div className="px-6 py-7 text-center">
            <p className="eyebrow">Scannez pour payer</p>
            <img
              src={qr}
              alt={`QR code de paiement ${store.name}`}
              width={320}
              height={320}
              className="mx-auto mt-4 size-72 rounded-2xl bg-white ring-1 ring-cloud-200 ring-inset sm:size-80"
            />

            <p className="mt-5 font-mono text-3xl font-bold text-ink tabular-nums tracking-[0.2em]">
              {store.code}
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              Code à saisir manuellement si la caméra ne fonctionne pas
            </p>

            <ol className="mt-6 space-y-2.5 rounded-2xl bg-cloud-100 px-4 py-4 text-left text-xs leading-relaxed text-ink-muted">
              <li className="flex gap-2.5">
                <ScanLine className="mt-0.5 size-4 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
                Le client ouvre « Payer » et scanne ce QR code.
              </li>
              <li className="flex gap-2.5">
                <Smartphone className="mt-0.5 size-4 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
                Il saisit le montant et valide avec son code PIN CashUp.
              </li>
              <li className="flex gap-2.5">
                <Wallet className="mt-0.5 size-4 shrink-0 text-brand-600" strokeWidth={2} aria-hidden="true" />
                Vous confirmez la réception ici : son cashback est crédité
                immédiatement.
              </li>
            </ol>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-ink-muted">
          QR personnel de {store.name} — ne le partagez pas en dehors de votre caisse.
        </p>
      </div>
    </>
  );
}
