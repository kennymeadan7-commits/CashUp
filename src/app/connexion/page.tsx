import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleCheck, ShieldCheck, Smartphone, Sparkles, Wallet } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPath } from "@/lib/roles";

export const metadata = {
  title: "Connexion",
  robots: { index: false, follow: false },
};

const BENEFITS = [
  {
    icon: Wallet,
    title: "Cashback en FCFA",
    text: "Chaque achat validé crédite votre portefeuille, sans frais cachés.",
  },
  {
    icon: Smartphone,
    title: "Retrait Mobile Money",
    text: "MTN MoMo, Moov Money ou Celtiis Cash, dès 5 000 FCFA, traitement sous 48 h.",
  },
  {
    icon: CircleCheck,
    title: "Validation humaine",
    text: "Votre cashback est vérifié par notre équipe : pas de robot qui refuse.",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(dashboardPath(user.role));
  }

  const { next } = await searchParams;

  return (
    <div className="hero-grid">
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
        <div className="mx-auto w-full max-w-md">
          <p className="eyebrow">Bon retour</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Connectez-vous à votre portefeuille
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Retrouvez vos achats déclarés, votre cashback et vos retraits.
          </p>

          <div className="mt-7 rounded-2xl border border-cloud-200 bg-white p-6 shadow-lift">
            <LoginForm next={next} />
          </div>

          {process.env.NODE_ENV !== "production" && (
            <div className="mt-5 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4 text-xs leading-relaxed text-brand-900">
              <p className="flex items-center gap-1.5 font-bold">
                <Sparkles className="size-3.5 text-acid-600" strokeWidth={2.2} aria-hidden="true" />
                Comptes de démonstration
              </p>
              <p className="mt-1.5">
                Membre : <span className="font-mono">membre@cashup.bj</span> · Admin :{" "}
                <span className="font-mono">admin@cashup.bj</span>
              </p>
              <p>
                Mot de passe : <span className="font-mono">demo1234</span>
              </p>
            </div>
          )}
        </div>

        <div className="hero-showcase relative hidden overflow-hidden rounded-[2rem] border border-brand-800 p-8 text-white shadow-panel lg:block">
          <div className="pattern-grid absolute inset-0 opacity-30" aria-hidden="true" />
          <div
            className="absolute -top-24 -right-16 size-72 rounded-full bg-acid-400/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative">
            <p className="text-[11px] font-bold tracking-[0.2em] text-acid-400 uppercase">
              Cashup · Bénin
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight font-bold">
              Vos courses de la semaine peuvent déjà rapporter.
            </h2>

            <ul className="mt-8 space-y-4">
              {BENEFITS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.title} className="flex gap-3">
                    <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl bg-white/10 text-acid-400 ring-1 ring-white/15 ring-inset">
                      <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="mt-0.5 text-sm text-brand-100">{item.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="mt-10 rounded-2xl bg-white/10 p-5 ring-1 ring-white/15 ring-inset">
              <p className="font-display text-2xl leading-snug">
                « J&apos;ai retiré 12 500 FCFA sur mon MoMo avec mes achats du mois. »
              </p>
              <p className="mt-3 flex items-center gap-2 text-xs text-brand-200">
                <ShieldCheck className="size-4 text-acid-400" aria-hidden="true" />
                Koffi A. — Abomey-Calavi
              </p>
            </div>

            <p className="mt-10 text-sm text-brand-100">
              Pas encore de compte ?{" "}
              <Link
                href="/inscription"
                className="font-semibold text-white underline underline-offset-4"
              >
                Créer un compte gratuitement
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
