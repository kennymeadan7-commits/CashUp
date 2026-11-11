import Link from "next/link";
import type { Metadata } from "next";
import { ExternalLink, ShieldCheck, UserRound } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-guard";
import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  const [pendingPurchases, pendingWithdrawals, pendingVouchers, queuedMessages] = await Promise.all([
    prisma.purchase.count({ where: { status: "PENDING" } }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.voucher.count({ where: { status: "ACTIVE" } }),
    prisma.messageOutbox.count({ where: { status: "QUEUED" } }),
  ]);

  return (
    <div className="container-page py-8 tabular-nums sm:py-10">
      <div className="dark-panel px-6 py-6 sm:px-8">
        <div className="pattern-grid absolute inset-0 opacity-25" aria-hidden="true" />
        <div
          className="absolute -top-20 -right-10 size-56 rounded-full bg-acid-400/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.18em] text-acid-400 uppercase">
              <ShieldCheck className="size-3.5" strokeWidth={2} aria-hidden="true" />
              Espace réservé
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              Administration Cashup
            </h1>
            <p className="mt-1.5 text-sm text-brand-100">
              Connecté en tant que <span className="font-semibold text-white">{admin.name}</span> ·
              validation des achats, retraits et catalogue.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="btn btn-sm bg-white/10 text-white ring-1 ring-white/20 ring-inset hover:bg-white/20"
            >
              <ExternalLink className="size-3.5" strokeWidth={1.9} aria-hidden="true" />
              Voir le site
            </Link>
            <Link
              href="/tableau-de-bord/profil"
              className="btn btn-sm bg-white text-ink hover:bg-cloud-100"
            >
              <UserRound className="size-3.5" strokeWidth={1.9} aria-hidden="true" />
              Mon profil
            </Link>
          </div>
        </div>
      </div>

      <AdminNav
        items={[
          { href: "/admin", label: "Vue d'ensemble" },
          { href: "/admin/achats", label: "Achats", count: pendingPurchases },
          { href: "/admin/retraits", label: "Retraits", count: pendingWithdrawals },
          { href: "/admin/boutiques", label: "Boutiques" },
          { href: "/admin/revenus", label: "Revenus" },
          { href: "/admin/bons", label: "Bons", count: pendingVouchers },
          { href: "/admin/utilisateurs", label: "Utilisateurs" },
          { href: "/admin/outbox", label: "Boîte d'envoi", count: queuedMessages },
        ]}
      />

      <div className="mt-6">{children}</div>
    </div>
  );
}
