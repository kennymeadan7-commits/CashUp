import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Clock3,
  ReceiptText,
  Smartphone,
  Wallet,
} from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/ui";
import { MIN_WITHDRAWAL } from "@/lib/constants";
import { CONTACT } from "@/lib/contact";
import { formatFCFA } from "@/lib/format";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description:
    "Comment fonctionne le cashback Cashup : déclaration d'achat, validation sous 48 h, retrait Mobile Money dès 5 000 FCFA, points de fidélité convertibles en bons d'achat. Toutes les règles expliquées.",
};

const STEPS = [
  {
    icon: BadgeCheck,
    title: "1. Créer votre compte gratuit",
    text: "Nom, e-mail, téléphone et ville : l'inscription prend moins d'une minute, sans carte bancaire ni abonnement.",
  },
  {
    icon: ReceiptText,
    title: "2. Faire vos achats habituels",
    text: "Chez un partenaire Cashup, en boutique ou en ligne. Gardez toujours votre reçu ou votre confirmation de paiement.",
  },
  {
    icon: Wallet,
    title: "3. Déclarer l'achat en 30 secondes",
    text: "Indiquez la boutique, le montant, la date et la référence du reçu. Le cashback est calculé automatiquement au taux en vigueur.",
  },
  {
    icon: Smartphone,
    title: "4. Encaisser sur Mobile Money",
    text: "Après validation, votre solde augmente et vos points de fidélité sont versés. Dès 5 000 FCFA disponibles, demandez un retrait sur MTN MoMo, Moov Money ou Celtiis Cash.",
  },
];

const RULES = [
  {
    icon: Clock3,
    title: "Validation sous 48 h ouvrées",
    text: "Chaque déclaration est vérifiée par l'équipe Cashup avant d'être créditée.",
  },
  {
    icon: ReceiptText,
    title: "Reçu obligatoire",
    text: "Référence du ticket, numéro de commande ou capture du paiement : tout ce qui prouve l'achat.",
  },
  {
    icon: Wallet,
    title: `Retrait dès ${formatFCFA(MIN_WITHDRAWAL)}`,
    text: "Aucun frais de retrait : le montant demandé est celui qui arrive sur votre numéro.",
  },
  {
    icon: CircleAlert,
    title: "Anti-fraude",
    text: "Achat déclaré sans preuve, montant incohérent ou reçu réutilisé : la déclaration est refusée avec motif.",
  },
];

const FAQ = [
  {
    q: "Le cashback est-il vraiment gratuit ?",
    a: "Oui. Cashup est rémunéré par les commerces partenaires, pas par les membres. Créer un compte, déclarer ses achats et retirer ses gains ne coûte rien.",
  },
  {
    q: "Combien de temps faut-il pour recevoir mon cashback ?",
    a: "Les déclarations sont traitées sous 48 heures ouvrées. Vous recevez le montant en FCFA dans votre portefeuille Cashup dès la validation.",
  },
  {
    q: "Comment se fait le retrait ?",
    a: "Vous demandez un retrait vers MTN MoMo, Moov Money ou Celtiis Cash depuis votre espace. L'équipe le traite sous 48 h ouvrées, sans frais, dès 5 000 FCFA.",
  },
  {
    q: "Comment fonctionnent les points de fidélité ?",
    a: "Chaque achat validé vous verse 30 % de la commission de la boutique en points. 1 point vaut 1 FCFA : dès 1 000 points, convertissez-les en bon d'achat à présenter chez un partenaire Cashup.",
  },
  {
    q: "Comment Cashup gagne-t-il de l'argent ?",
    a: "Les commerces partenaires versent une commission de 10 % à 30 % sur chaque achat validé, uniquement quand ils gagnent un client. Elle est répartie ainsi : 50 % pour le fonctionnement de Cashup, 20 % de frais de transaction et 30 % reversés aux membres en points de fidélité.",
  },
  {
    q: "Que faire si mon achat est refusé ?",
    a: "Le motif du refus s'affiche dans votre historique d'achats : pièce manquante, date trop ancienne, montant incohérent… Vous pouvez corriger et re-déclarer si le problème est résolu.",
  },
  {
    q: "Puis-je déclarer un achat fait en ligne ?",
    a: "Oui : indiquez la référence de commande ou le numéro de confirmation du paiement à la place du ticket de caisse.",
  },
  {
    q: "Le cashback est-il cumulable avec les offres boostées ?",
    a: "Quand une offre est en cours, c'est le meilleur taux applicable qui s'applique à votre achat : Cashup choisit automatiquement ce qui vous arrange le plus.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="hero-grid">
        <div className="container-page py-12 lg:py-16">
          <div className="max-w-3xl">
            <p className="eyebrow">Guide complet</p>
            <h1 className="mt-3 font-display text-[clamp(2.1rem,6vw,3.4rem)] leading-[1.05] font-bold tracking-tight text-ink">
              Comment fonctionne Cashup ?
            </h1>
            <p className="mt-4 text-base leading-relaxed text-ink-muted sm:text-lg">
              Du reçu de caisse au versement Mobile Money : voici exactement comment gagner de
              l&apos;argent sur vos achats du quotidien, sans rien changer à vos habitudes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/inscription" className="btn btn-primary btn-lg">
                Créer mon compte gratuit
                <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
              </Link>
              <Link href="/boutiques" className="btn btn-secondary btn-lg">
                Voir les boutiques
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-14 sm:py-18">
        <SectionHeading
          eyebrow="Les étapes"
          title="Quatre étapes, de l'inscription au versement"
          description="Tout se passe sur Cashup : aucune application supplémentaire à installer."
        />
        <ol className="mt-10 grid gap-5 md:grid-cols-2">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="card card-hover">
                <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset">
                  <Icon className="size-5" strokeWidth={1.9} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.text}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="bg-cloud-100/70 py-14 sm:py-18">
        <div className="container-page">
          <SectionHeading
            eyebrow="Les règles du jeu"
            title="Transparent, du premier FCFA au dernier"
            description="Pas de frais cachés, pas de plafond de gains : uniquement des règles claires pour protéger tout le monde."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RULES.map((rule) => {
              const Icon = rule.icon;
              return (
                <div key={rule.title} className="rounded-2xl border border-cloud-200 bg-white p-5 shadow-soft">
                  <span className="grid size-10 place-items-center rounded-xl bg-acid-100 text-acid-700 ring-1 ring-acid-300 ring-inset">
                    <Icon className="size-4.5" strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-sm font-bold text-ink">{rule.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{rule.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-8 py-14 sm:py-18 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow mb-2">FAQ</p>
          <h2 className="section-title">Questions fréquentes</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Une question qui n&apos;est pas ici ? Écrivez-nous à{" "}
            <a
              href={`mailto:${CONTACT.email}`}
              className="font-semibold text-brand-700 hover:underline"
            >
              {CONTACT.email}
            </a>{" "}
            : nous répondons sous 24 h.
          </p>
          <Link href="/inscription" className="btn btn-lime mt-6">
            Je commence maintenant
            <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
          </Link>
        </div>

        <div className="space-y-3">
          {FAQ.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-cloud-200 bg-white px-5 py-4 shadow-soft">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-ink">
                {item.q}
                <span
                  className="grid size-6 shrink-0 place-items-center rounded-full bg-cloud-100 text-ink-soft transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
