export type Category = {
  slug: string;
  label: string;
  description: string;
};

export const CATEGORIES: Category[] = [
  { slug: "alimentation", label: "Alimentation", description: "Supermarchés, marchés, produits frais" },
  { slug: "restaurants", label: "Restaurants", description: "Restaurants, bars, livraison" },
  { slug: "mode", label: "Mode & accessoires", description: "Vêtements, chaussures, sacs" },
  { slug: "beaute", label: "Beauté & coiffure", description: "Cosmétiques, salons, soins" },
  { slug: "electronique", label: "Électronique", description: "Téléphones, ordinateurs, accessoires" },
  { slug: "sante", label: "Santé", description: "Pharmacies, laboratoires, cliniques" },
  { slug: "maison", label: "Maison & jardin", description: "Meubles, décoration, bricolage" },
  { slug: "voyage", label: "Voyage & transport", description: "Billets, taxis, locations" },
  { slug: "hotels", label: "Hôtels & séjours", description: "Hôtels, villas, guest houses" },
  { slug: "automobile", label: "Automobile & moto", description: "Pièces, entretien, accessoires" },
  { slug: "sport", label: "Sport & loisirs", description: "Équipement, salles, détente" },
  { slug: "education", label: "Éducation", description: "Formations, écoles, cours particuliers" },
];

export const CATEGORY_SLUGS = CATEGORIES.map((c) => c.slug);

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function categoryLabel(slug: string): string {
  return getCategory(slug)?.label ?? slug;
}

export const CITIES = [
  "Cotonou",
  "Abomey-Calavi",
  "Porto-Novo",
  "Parakou",
  "Bohicon",
  "Abomey",
  "Ouidah",
  "Natitingou",
  "Djougou",
  "Lokossa",
  "Savalou",
  "Kandi",
  "Malanville",
  "Pobè",
];

// ---------------------------------------------------------------------------
// Limites métier
// ---------------------------------------------------------------------------

/** Montant minimum d'un retrait Mobile Money. */
export const MIN_WITHDRAWAL = 5000;
/** Montant minimum d'un achat déclaré. */
export const MIN_PURCHASE_AMOUNT = 500;
/** Garde-fou contre les saisies aberrantes (10 millions de FCFA). */
export const MAX_PURCHASE_AMOUNT = 10_000_000;

// ---------------------------------------------------------------------------
// Statuts
// ---------------------------------------------------------------------------

export const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "En attente",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  APPROVED: {
    label: "Validé",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  REJECTED: {
    label: "Refusé",
    className: "bg-rose-100 text-rose-700 ring-rose-200",
  },
  PAID: {
    label: "Payé",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  CONFIRMED: {
    label: "Confirmé",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  CANCELLED: {
    label: "Annulé",
    className: "bg-cloud-100 text-ink-muted ring-cloud-200",
  },
  ACTIVE: {
    label: "Disponible",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  USED: {
    label: "Utilisé",
    className: "bg-cloud-100 text-ink-muted ring-cloud-200",
  },
  // Boîte d'envoi e-mail / SMS
  QUEUED: {
    label: "En file d'attente",
    className: "bg-amber-100 text-amber-800 ring-amber-200",
  },
  SENT: {
    label: "Envoyé",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  },
  FAILED: {
    label: "Échec",
    className: "bg-rose-100 text-rose-700 ring-rose-200",
  },
};

export function statusMeta(status: string) {
  return STATUS_META[status] ?? STATUS_META.PENDING;
}

export const PURCHASE_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente de validation",
  APPROVED: "Cashback validé",
  REJECTED: "Refusé",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente de confirmation",
  CONFIRMED: "Paiement confirmé",
  CANCELLED: "Annulé",
};

export const WITHDRAWAL_STATUS_LABEL: Record<string, string> = {
  PENDING: "En attente de traitement",
  PAID: "Versé sur Mobile Money",
  REJECTED: "Rejeté",
};

export const WITHDRAWAL_METHODS = [
  { value: "MTN_MONEY", label: "MTN MoMo" },
  { value: "MOOV_MONEY", label: "Moov Money" },
  { value: "CELTIIS_CASH", label: "Celtiis Cash" },
] as const;

export function withdrawalMethodLabel(value: string): string {
  return WITHDRAWAL_METHODS.find((m) => m.value === value)?.label ?? value;
}

// Modes de paiement du parcours « Payer » (voir /payer).
export const PAYMENT_MODES = [
  { value: "CASH", label: "Paiement en espèces", hint: "Le commerçant confirme la réception" },
  { value: "WALLET", label: "Payer avec mon solde Cashup", hint: "Débit immédiat du portefeuille" },
  { value: "POINTS", label: "Payer avec mes Points Cashup", hint: "1 point = 1 FCFA" },
] as const;

export function paymentModeLabel(value: string): string {
  return PAYMENT_MODES.find((m) => m.value === value)?.label ?? value;
}

// ---------------------------------------------------------------------------
// Modèle économique (business plan)
// ---------------------------------------------------------------------------

/** Commission partenaires : fourchette négociée selon le secteur (10 à 30 %). */
export const MIN_COMMISSION_RATE = 10;
export const MAX_COMMISSION_RATE = 30;
/** Taux de commission illustratif utilisé par défaut (hypothèse du plan). */
export const DEFAULT_COMMISSION_RATE = 20;

/** Répartition de la commission : 50 % CashUp / 20 % frais / 30 % points. */
export const COMMISSION_SPLIT = {
  cashUp: 50,
  fees: 20,
  points: 30,
} as const;

// ---------------------------------------------------------------------------
// Points de fidélité
// ---------------------------------------------------------------------------

/** Valeur d'un point : 1 point = 1 FCFA (conversion en bon d'achat). */
export const POINTS_VALUE_FCFA = 1;
/** Conversion minimum, exprimée en points. */
export const MIN_POINTS_CONVERSION = 1000;
