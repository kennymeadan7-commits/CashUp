import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ScanLine } from "lucide-react";
import { requirePayer } from "@/lib/payer-guard";
import { PageHeader } from "@/components/ui";
import { QrScanner } from "@/components/payments/QrScanner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Scanner un QR code",
};

export default async function ScannerPage() {
  await requirePayer("/payer/scanner");

  return (
    <>
      <PageHeader
        eyebrow="Parcours de paiement"
        title="Scanner le QR du commerçant"
        description="Autorisez la caméra, cadredez le QR affiché à la caisse : le code marchand est rempli automatiquement."
        actions={
          <Link href="/payer" className="btn btn-outline btn-sm">
            <ArrowLeft className="size-4" strokeWidth={2.2} aria-hidden="true" />
            Saisir un code à la place
          </Link>
        }
      />

      <QrScanner />

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-muted">
        <ScanLine className="size-3.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
        Le scan ne remplit que le code marchand : montant et mode de paiement restent à votre
        choix.
      </p>
    </>
  );
}
