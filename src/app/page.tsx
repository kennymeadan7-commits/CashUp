import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Car,
  CheckCircle2,
  Dumbbell,
  GraduationCap,
  HeartPulse,
  Mail,
  MapPin,
  Plane,
  Phone,
  Receipt,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sofa,
  Sparkles,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { StoreCard } from "@/components/StoreCard";
import { SectionHeading, Stat } from "@/components/ui";
import { CATEGORIES } from "@/lib/constants";
import { formatFCFA, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  alimentation: ShoppingBasket,
  restaurants: UtensilsCrossed,
  mode: Shirt,
  beaute: Sparkles,
  electronique: Smartphone,
  sante: HeartPulse,
  maison: Sofa,
  voyage: Plane,
  hotels: BedDouble,
  automobile: Car,
  sport: Dumbbell,
  education: GraduationCap,
};

const CONTACT = {
  phone: "41 47 62 94",
  phoneHref: "tel:+22941476294",
  email: "precieuxyovogan1@gmail.com",
};

const STEPS = [
  {
    icon: ShoppingBasket,
    title: "1. Choisissez votre boutique",
    text: "Parcourez le catalogue : supermarchés, pharmacies, restaurants, électronique… et repérez le taux de cashback.",
  },
  {
    icon: Receipt,
    title: "2. Déclarez votre achat",
    text: "Montant, date et référence du reçu suffisent : Cashup calcule votre cashback automatiquement.",
  },
  {
    icon: Wallet,
    title: "3. Encaissez en FCFA",
    text: "Votre cashback est validé par l'équipe, puis retirable dès 5 000 FCFA sur MTN MoMo, Moov Money ou Celtiis Cash.",
  },
];

export default async function HomePage() {
  const [storeCount, memberCount, creditedAgg, featured, extra] = await Promise.all([
    prisma.store.count({ where: { active: true } }),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.walletTransaction.aggregate({ where: { kind: "CREDIT" }, _sum: { amount: true } }),
    prisma.store.findMany({
      where: { active: true, featured: true },
      include: { offers: { where: { active: true } } },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
    prisma.store.findMany({
      where: { active: true, featured: false },
      include: { offers: { where: { active: true } } },
      orderBy: { createdAt: "asc" },
      take: 6,
    }),
  ]);

  const stores = [...featured, ...extra].slice(0, 6);
  const totalCredited = creditedAgg._sum.amount ?? 0;

  return (
    <>
      {/* Hero */}
      <section className="hero-grid">
        <div className="container-page grid items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="animate-rise">
            <p className="eyebrow">Cashback · 100 % béninois</p>
            <h1 className="mt-3 font-display text-[clamp(2.3rem,7vw,4rem)] leading-[1.02] font-bold tracking-tight text-ink">
              Achetez comme d&apos;habitude.
              <br />
              <span className="text-brand-600">Cashup vous rembourse</span> une partie.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
              Supermarché, pharmacie, restaurant, téléphone… déclarez vos achats chez nos partenaires
              et encaissez votre cashback sur Mobile Money, en FCFA.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/inscription" className="btn btn-primary btn-lg">
                Créer mon compte gratuit
                <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
              </Link>
              <Link href="/boutiques" className="btn btn-secondary btn-lg">
                Voir les {formatNumber(storeCount)} boutiques
              </Link>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-cloud-200 pt-6">
              <div>
                <dt className="text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">
                  Boutiques
                </dt>
                <dd className="mt-1 text-2xl font-bold text-ink tabular-nums">
                  {formatNumber(storeCount)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">
                  Membres
                </dt>
                <dd className="mt-1 text-2xl font-bold text-ink tabular-nums">
                  {formatNumber(memberCount)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">
                  Cashback versé
                </dt>
                <dd className="mt-1 text-2xl font-bold text-ink tabular-nums">
                  {formatFCFA(totalCredited)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Aperçu du portefeuille */}
          <div className="animate-rise relative mx-auto w-full max-w-md">
            <div
              className="absolute -top-6 -right-4 size-32 rounded-full bg-acid-400/40 blur-3xl"
              aria-hidden="true"
            />
            <div className="dark-panel relative p-6 shadow-panel">
              <div className="pattern-grid absolute inset-0 opacity-30" aria-hidden="true" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold tracking-[0.18em] text-acid-300 uppercase">
                    Portefeuille Cashup
                  </p>
                  <Wallet className="size-4 text-acid-400" strokeWidth={2} aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm text-brand-100">Solde disponible</p>
                <p className="font-display text-4xl font-bold tabular-nums">148 500 FCFA</p>
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-acid-400/15 px-2.5 py-1 text-xs font-semibold text-acid-300 ring-1 ring-acid-400/30 ring-inset">
                  <CheckCircle2 className="size-3.5" strokeWidth={2.2} aria-hidden="true" />
                  2 400 FCFA en attente de validation
                </p>

                <ul className="mt-6 space-y-3">
                  {[
                    { label: "Cashback Kponli Supermarché", amount: "+2 400 FCFA", positive: true },
                    { label: "Retrait Moov Money", amount: "−10 000 FCFA", positive: false },
                    { label: "Cashback Chez Tantie", amount: "+1 200 FCFA", positive: true },
                  ].map((row) => (
                    <li
                      key={row.label}
                      className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-3.5 py-3 text-sm ring-1 ring-white/10 ring-inset"
                    >
                      <span className="truncate text-brand-100">{row.label}</span>
                      <span
                        className={`shrink-0 font-bold tabular-nums ${
                          row.positive ? "text-acid-300" : "text-white"
                        }`}
                      >
                        {row.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="container-page py-14 sm:py-20">
        <SectionHeading
          eyebrow="Simple comme bonjour"
          title="Trois étapes, zéro prise de tête"
          description="Pas de carte bancaire, pas d'abonnement : vous achetez, vous déclarez, vous encaissez."
          action={
            <Link href="/comment-ca-marche" className="btn btn-outline">
              Détails et FAQ
            </Link>
          }
        />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="card card-hover">
                <span className="grid size-11 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset">
                  <Icon className="size-5" strokeWidth={1.9} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Catégories */}
      <section className="bg-cloud-100/70 py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Catalogue"
            title="Tous vos commerces, au même endroit"
            description="Douze catégories de partenaires, de l'alimentation à l'éducation."
            action={
              <Link href="/boutiques" className="btn btn-outline">
                Tout voir
              </Link>
            }
          />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.slug] ?? ShoppingBasket;
              return (
                <Link
                  key={category.slug}
                  href={`/boutiques?categorie=${category.slug}`}
                  className="group flex items-center gap-3 rounded-2xl border border-cloud-200 bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset transition-colors group-hover:bg-acid-100 group-hover:text-acid-700 group-hover:ring-acid-300">
                    <Icon className="size-4.5" strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">
                      {category.label}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">
                      {category.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Boutiques en vedette */}
      <section className="container-page py-14 sm:py-20">
        <SectionHeading
          eyebrow="Partenaires"
          title="Les boutiques du moment"
          description="Cashback de 2 % à 12 % selon les commerces, avec des offres boostées à durée limitée."
          action={
            <Link href="/boutiques" className="btn btn-outline">
              Voir toutes les boutiques
            </Link>
          }
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pb-6">
        <div className="dark-panel px-6 py-12 text-center sm:px-10">
          <div className="pattern-grid absolute inset-0 opacity-25" aria-hidden="true" />
          <div
            className="absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-acid-400/15 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.2em] text-acid-400 uppercase">
              Gratuit, sans engagement
            </p>
            <h2 className="mt-3 font-display text-3xl leading-tight font-bold sm:text-4xl">
              Vos achats du quotidien méritent de rapporter.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-100 sm:text-base">
              Créez votre compte en moins d&apos;une minute, déclarez votre premier achat et suivez
              votre cashback grandir en direct.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/inscription" className="btn btn-lime btn-lg">
                Commencer gratuitement
                <ArrowRight className="size-4" strokeWidth={2.2} aria-hidden="true" />
              </Link>
              <Link
                href="/comment-ca-marche"
                className="btn btn-lg bg-white/10 text-white ring-1 ring-white/20 ring-inset hover:bg-white/20"
              >
                Comment ça marche
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section className="container-page grid gap-4 py-14 sm:grid-cols-3 sm:py-16">
        <Stat
          label="Cashback versé"
          value={formatFCFA(totalCredited)}
          hint="Depuis le lancement de la plateforme"
          icon={<Wallet className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Boutiques partenaires"
          value={formatNumber(storeCount)}
          hint="Dans 14 villes du Bénin et en ligne"
          icon={<ShoppingBasket className="size-4.5" strokeWidth={1.9} />}
        />
        <Stat
          label="Membres Cashup"
          value={formatNumber(memberCount)}
          hint="Inscription gratuite, retrait dès 5 000 FCFA"
          icon={<CheckCircle2 className="size-4.5" strokeWidth={1.9} />}
        />
      </section>
      {/* Contact */}
      <section className="bg-cloud-100/70 py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Une question ?"
            title="Contactez-nous"
            description="Une question sur votre cashback, un partenariat ou la démonstration ? Écrivez-nous, nous répondons rapidement."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:max-w-3xl">
            <a
              href={CONTACT.phoneHref}
              className="card card-hover flex items-start gap-4"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset">
                <Phone className="size-5" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">
                  Téléphone
                </span>
                <span className="mt-1 block truncate text-base font-bold text-ink">
                  {CONTACT.phone}
                </span>
                <span className="mt-0.5 block text-sm text-ink-muted">
                  Du lundi au samedi, 8 h – 19 h
                </span>
              </span>
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              className="card card-hover flex items-start gap-4"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100 ring-inset">
                <Mail className="size-5" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-bold tracking-[0.14em] text-ink-muted uppercase">
                  E-mail
                </span>
                <span className="mt-1 block truncate text-base font-bold text-ink">
                  {CONTACT.email}
                </span>
                <span className="mt-0.5 block text-sm text-ink-muted">
                  Réponse sous 24 h ouvrées
                </span>
              </span>
            </a>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-ink-muted">
            <MapPin className="size-4 shrink-0 text-brand-600" strokeWidth={1.9} aria-hidden="true" />
            Cotonou, Bénin — joignable aussi via WhatsApp sur le numéro ci-dessus.
          </p>
        </div>
      </section>
    </>
  );
}
