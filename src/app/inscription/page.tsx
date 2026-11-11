import Link from "next/link";
import { redirect } from "next/navigation";
import { CircleCheck, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPath } from "@/lib/roles";

export const metadata = {
  title: "Créer un compte gratuit",
  robots: { index: false, follow: false },
};

const PERKS = [
  {
    icon: ReceiptText,
    title: "Déclarez en 30 secondes",
    text: "Boutique, montant, date, reçu : le cashback est calculé automatiquement.",
  },
  {
    icon: CircleCheck,
    title: "Suivi en direct",
    text: "Chaque étape de vos achats et retraits est visible dans votre espace.",
  },
  {
    icon: ShieldCheck,
    title: "Données protégées",
    text: "Mots de passe chiffrés, sessions sécurisées, aucune donnée bancaire stockée.",
  },
];

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect(dashboardPath(user.role));
  }

  return (
    <div className="hero-grid">
      <div className="container-page grid gap-10 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
        <div className="mx-auto w-full max-w-md">
          <p className="eyebrow">Inscription gratuite</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Créez votre compte Cashup
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            Une minute suffit pour commencer à gagner du cashback sur vos achats.
          </p>

          <div className="mt-7 rounded-2xl border border-cloud-200 bg-white p-6 shadow-lift">
            <RegisterForm />
          </div>

          {process.env.NODE_ENV !== "production" && (
            <div className="mt-5 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4 text-xs leading-relaxed text-brand-900">
              <p className="flex items-center gap-1.5 font-bold">
                <Sparkles className="size-3.5 text-acid-600" strokeWidth={2.2} aria-hidden="true" />
                Envie de tester sans s&apos;inscrire ?
              </p>
              <p className="mt-1.5">
                Compte membre : <span className="font-mono">membre@cashup.bj</span> · mot de passe{" "}
                <span className="font-mono">demo1234</span>
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
              Rejoignez Cashup
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight font-bold">
              Le cashback béninois, simple et sans surprise.
            </h2>

            <ul className="mt-8 space-y-4">
              {PERKS.map((item) => {
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

            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { value: "2–12 %", label: "de cashback" },
                { value: "0 FCFA", label: "de frais" },
                { value: "48 h", label: "de traitement" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-white/10 p-4 text-center ring-1 ring-white/15 ring-inset"
                >
                  <p className="font-display text-xl font-bold text-acid-300">{stat.value}</p>
                  <p className="mt-1 text-[11px] text-brand-100">{stat.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-10 text-sm text-brand-100">
              Déjà membre ?{" "}
              <Link
                href="/connexion"
                className="font-semibold text-white underline underline-offset-4"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
