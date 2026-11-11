import type { Metadata } from "next";
import { BadgeCheck, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { Flash, PageHeader } from "@/components/ui";
import { formatDate, formatPhone } from "@/lib/format";
import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { PasswordForm } from "@/components/dashboard/PasswordForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon profil",
};

type SearchParams = Promise<{ ok?: string; erreur?: string }>;

export default async function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const flash = await searchParams;

  return (
    <>
      <PageHeader
        eyebrow="Compte"
        title="Mon profil"
        description="Vos coordonnées servent au contact support et au versement Mobile Money."
      />

      <div className="mt-6 space-y-4">
        <Flash ok={flash.ok} error={flash.erreur} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-base font-bold text-ink">Informations personnelles</h2>
            <div className="mb-5 mt-4 rounded-xl bg-cloud-100 px-4 py-3 text-sm text-ink-soft ring-1 ring-cloud-200 ring-inset">
              <p className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-brand-600" strokeWidth={1.9} aria-hidden="true" />
                <span className="truncate">{user.email}</span>
              </p>
              <p className="mt-1.5 flex items-center gap-2">
                <BadgeCheck className="size-4 shrink-0 text-brand-600" strokeWidth={1.9} aria-hidden="true" />
                Membre depuis le {formatDate(user.createdAt)}
              </p>
            </div>
            <ProfileForm user={{ name: user.name, phone: user.phone, city: user.city }} />
          </section>

          <section className="card p-6">
            <h2 className="text-base font-bold text-ink">Sécurité</h2>
            <p className="mb-4 mt-1 text-xs text-ink-muted">
              Choisissez un mot de passe unique, d&apos;au moins 6 caractères.
            </p>
            <PasswordForm />
          </section>
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-ink">
              <ShieldCheck className="size-4.5 text-brand-600" strokeWidth={2} aria-hidden="true" />
              Vos données
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-acid-500" aria-hidden="true" />
                Aucune donnée bancaire n&apos;est stockée : les retraits se font sur votre numéro
                Mobile Money.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-acid-500" aria-hidden="true" />
                Votre mot de passe est chiffré (scrypt) et vos sessions expirent après 30 jours.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-acid-500" aria-hidden="true" />
                Pour supprimer votre compte ou vos données, écrivez à bonjour@cashup.bj.
              </li>
            </ul>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-bold text-ink">Coordonnées Cashup</h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-muted">
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-brand-600" strokeWidth={1.9} aria-hidden="true" />
                <a href="mailto:bonjour@cashup.bj" className="font-semibold text-brand-700 hover:underline">
                  bonjour@cashup.bj
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-brand-600" strokeWidth={1.9} aria-hidden="true" />
                <span className="tabular-nums">{formatPhone("+22990000000")}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 shrink-0 text-brand-600" strokeWidth={1.9} aria-hidden="true" />
                Cotonou, Bénin
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
