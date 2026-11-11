// Seed de démonstration Cashup.
// Données réalistes pour le marché béninois : boutiques, offres, achats,
// retraits Mobile Money et écritures de portefeuille cohérentes.
//
// Usage : npm run db:seed  (ou npm run db:reset pour repartir de zéro)

import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "demo1234";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
const daysAhead = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

// Commission négociée selon le secteur (plan économique : 10 à 30 %).
const COMMISSION_BY_CATEGORY: Record<string, number> = {
  alimentation: 15,
  restaurants: 20,
  mode: 25,
  beaute: 25,
  electronique: 10,
  sante: 15,
  maison: 20,
  voyage: 15,
  hotels: 20,
  automobile: 15,
  sport: 20,
  education: 20,
};

// Répartition 50 % CashUp / 20 % frais / 30 % points (identique à src/lib/commission.ts).
function splitCommission(amount: number, rate: number) {
  const commission = Math.max(0, Math.round((amount * rate) / 100));
  const cashUp = Math.round((commission * 50) / 100);
  const fees = Math.round((commission * 20) / 100);
  return { rate, commission, cashUp, fees, points: commission - cashUp - fees };
}

const METHOD_LABELS: Record<string, string> = {
  MTN_MONEY: "Retrait MTN MoMo",
  MOOV_MONEY: "Retrait Moov Money",
  CELTIIS_CASH: "Retrait Celtiis Cash",
};

type StoreSeed = {
  key: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  city: string | null;
  address: string | null;
  website: string | null;
  phone: string | null;
  cashbackType: "PERCENT" | "FIXED";
  cashbackRate: number;
  cashbackFixed: number | null;
  color: string;
  featured?: boolean;
  active?: boolean;
  createdAtDaysAgo: number;
};

const STORES: StoreSeed[] = [
  {
    key: "kponli",
    slug: "kponli-supermarche",
    name: "Kponli Supermarché",
    description:
      "Supermarché de quartier ouvert 7j/7 à Cotonou : produits frais, épicerie, boissons et produits d'hygiène. Carte de fidélité acceptée en caisse.",
    category: "alimentation",
    city: "Cotonou",
    address: "Boulevard de la Marina, Cotonou",
    website: "https://kponli.bj",
    phone: "+229 97 11 22 33",
    cashbackType: "PERCENT",
    cashbackRate: 5,
    cashbackFixed: null,
    color: "#0f766e",
    featured: true,
    createdAtDaysAgo: 210,
  },
  {
    key: "tantie",
    slug: "chez-tantie",
    name: "Chez Tantie",
    description:
      "Maquis traditionnel à Cotonou : riz gras, poulet DG, poisson braisé et jus de bissap maison. Livraison possible sur le quartier le soir.",
    category: "restaurants",
    city: "Cotonou",
    address: "Rue 12.043, Fidjrossè, Cotonou",
    website: null,
    phone: "+229 96 44 55 66",
    cashbackType: "PERCENT",
    cashbackRate: 8,
    cashbackFixed: null,
    color: "#b45309",
    featured: true,
    createdAtDaysAgo: 180,
  },
  {
    key: "colombe",
    slug: "pharmacie-la-colombe",
    name: "Pharmacie La Colombe",
    description:
      "Pharmacie d'officine à Abomey-Calavi : médicaments génériques, parapharmacie, tests rapides et conseil pharmacien 7j/7.",
    category: "sante",
    city: "Abomey-Calavi",
    address: "Carrefour Godomey, Abomey-Calavi",
    website: null,
    phone: "+229 95 77 88 99",
    cashbackType: "PERCENT",
    cashbackRate: 4,
    cashbackFixed: null,
    color: "#0e7490",
    createdAtDaysAgo: 150,
  },
  {
    key: "techdjoue",
    slug: "techdjoue",
    name: "TechDjoué",
    description:
      "E-commerce béninois : smartphones, ordinateurs, accessoires et objets connectés. Livraison gratuite à Cotonou et Calavi, paiement à la livraison.",
    category: "electronique",
    city: null,
    address: null,
    website: "https://techdjoue.bj",
    phone: "+229 97 00 11 22",
    cashbackType: "PERCENT",
    cashbackRate: 2.5,
    cashbackFixed: null,
    color: "#4348d8",
    featured: true,
    createdAtDaysAgo: 120,
  },
  {
    key: "belleepoque",
    slug: "belle-epoque-mode",
    name: "Belle Époque Mode",
    description:
      "Boutique de mode et d'accessoires à Cotonou : tenues en pagne wax, chaussures, sacs et retouches sur mesure par la couturière du magasin.",
    category: "mode",
    city: "Cotonou",
    address: "Marché Dantokpa, allée B, Cotonou",
    website: null,
    phone: "+229 94 33 44 55",
    cashbackType: "PERCENT",
    cashbackRate: 10,
    cashbackFixed: null,
    color: "#9d174d",
    createdAtDaysAgo: 95,
  },
  {
    key: "awa",
    slug: "salon-awa-beaute",
    name: "Salon Awa Beauté",
    description:
      "Salon de coiffure et soins à Porto-Novo : tresses, tissage, coloration, ongles et soins du visage. Réservation par téléphone ou WhatsApp.",
    category: "beaute",
    city: "Porto-Novo",
    address: "Rue des Écoles, Porto-Novo",
    website: null,
    phone: "+229 95 12 34 56",
    cashbackType: "PERCENT",
    cashbackRate: 12,
    cashbackFixed: null,
    color: "#be123c",
    createdAtDaysAgo: 80,
  },
  {
    key: "hounsa",
    slug: "maison-jardin-hounsa",
    name: "Maison & Jardin Hounsa",
    description:
      "Quincaillerie et jardinage à Abomey-Calavi : meubles, luminaires, outillage, pots et plants. Livraison sur toute la zone métropolitaine.",
    category: "maison",
    city: "Abomey-Calavi",
    address: "Route de Porto-Novo, Zogbadjè",
    website: "https://hounsa.bj",
    phone: "+229 96 55 66 77",
    cashbackType: "PERCENT",
    cashbackRate: 6,
    cashbackFixed: null,
    color: "#4d7c0f",
    createdAtDaysAgo: 70,
  },
  {
    key: "karo",
    slug: "villa-karo-hotel",
    name: "Villa Karo Hôtel",
    description:
      "Hôtel et villas à Ouidah, à quelques minutes de la plage : chambres climatisées, piscine, petit-déjeuner inclus et accueil groupes.",
    category: "hotels",
    city: "Ouidah",
    address: "Route des Pêches, Ouidah",
    website: "https://villakaro.bj",
    phone: "+229 97 88 77 66",
    cashbackType: "PERCENT",
    cashbackRate: 6,
    cashbackFixed: null,
    color: "#2e3290",
    createdAtDaysAgo: 60,
  },
  {
    key: "motor",
    slug: "garage-motor-plus",
    name: "Garage Motor Plus",
    description:
      "Entretien et réparation auto et moto à Parakou : vidange, freinage, pneumatiques, diagnostic électronique. Devis avant intervention.",
    category: "automobile",
    city: "Parakou",
    address: "Quartier Zongo, Parakou",
    website: null,
    phone: "+229 94 66 77 88",
    cashbackType: "PERCENT",
    cashbackRate: 3,
    cashbackFixed: null,
    color: "#3730a3",
    createdAtDaysAgo: 55,
  },
  {
    key: "fitzone",
    slug: "fitzone-gym",
    name: "FitZone Gym",
    description:
      "Salle de sport à Cotonou : musculation, cardio, cours collectifs et coach personnalisé. Abonnements mensuels et entrées à la séance.",
    category: "sport",
    city: "Cotonou",
    address: "Akpakpa Dodomè, Cotonou",
    website: null,
    phone: "+229 95 99 00 11",
    cashbackType: "FIXED",
    cashbackRate: 0,
    cashbackFixed: 500,
    color: "#86b00a",
    createdAtDaysAgo: 45,
  },
  {
    key: "codecode",
    slug: "code-and-code-academy",
    name: "Code & Code Academy",
    description:
      "Formation en ligne et en présentiel : informatique bureautique, développement web, digital marketing. Formations certifiantes en 8 à 12 semaines.",
    category: "education",
    city: null,
    address: null,
    website: "https://codeandcode.africa",
    phone: "+229 96 12 34 56",
    cashbackType: "PERCENT",
    cashbackRate: 7,
    cashbackFixed: null,
    color: "#6d28d9",
    createdAtDaysAgo: 40,
  },
  {
    key: "wings",
    slug: "wings-travel",
    name: "Wings Travel",
    description:
      "Agence de voyages à Cotonou : billets d'avion, réservations d'hôtels, visas et circuits. Assistance WhatsApp 7j/7 pour vos déplacements.",
    category: "voyage",
    city: "Cotonou",
    address: "Rue du Commerce, Cotonou",
    website: "https://wingstravel.bj",
    phone: "+229 97 44 33 22",
    cashbackType: "PERCENT",
    cashbackRate: 4,
    cashbackFixed: null,
    color: "#0e7490",
    createdAtDaysAgo: 35,
  },
  {
    key: "grace",
    slug: "superette-la-grace",
    name: "Superette La Grâce",
    description:
      "Superette de quartier à Bohicon : produits de première nécessité, glaces et boissons. Partenariat en cours de renouvellement.",
    category: "alimentation",
    city: "Bohicon",
    address: "Marché central, Bohicon",
    website: null,
    phone: "+229 95 22 33 44",
    cashbackType: "PERCENT",
    cashbackRate: 4,
    cashbackFixed: null,
    color: "#86b00a",
    active: false,
    createdAtDaysAgo: 30,
  },
];

type OfferSeed = {
  key: string;
  storeKey: string;
  title: string;
  description: string;
  cashbackType: "PERCENT" | "FIXED";
  cashbackRate: number | null;
  cashbackFixed: number | null;
  startsAt: Date;
  endsAt: Date | null;
  active: boolean;
};

const OFFERS: OfferSeed[] = [
  {
    key: "kponli-samedi",
    storeKey: "kponli",
    title: "Double cashback le samedi",
    description: "Le taux passe à 10 % sur tous vos achats samedis, sans montant minimum.",
    cashbackType: "PERCENT",
    cashbackRate: 10,
    cashbackFixed: null,
    startsAt: daysAgo(5),
    endsAt: daysAhead(10),
    active: true,
  },
  {
    key: "techdjoue-soldes",
    storeKey: "techdjoue",
    title: "Soldes techno : cashback doublé",
    description: "Le taux passe de 2,5 % à 5 % sur les smartphones et accessoires.",
    cashbackType: "PERCENT",
    cashbackRate: 5,
    cashbackFixed: null,
    startsAt: daysAgo(3),
    endsAt: daysAhead(20),
    active: true,
  },
  {
    key: "awa-bienvenue",
    storeKey: "awa",
    title: "1 000 FCFA offerts pour votre première visite",
    description: "Cumulable avec le cashback de base dès 8 000 FCFA de prestation.",
    cashbackType: "FIXED",
    cashbackRate: null,
    cashbackFixed: 1000,
    startsAt: daysAgo(1),
    endsAt: daysAhead(14),
    active: true,
  },
  {
    key: "tantie-menu",
    storeKey: "tantie",
    title: "Menu du maquis à 15 %",
    description: "Offre de lancement terminée : le cashback de base de 8 % s'applique à nouveau.",
    cashbackType: "PERCENT",
    cashbackRate: 15,
    cashbackFixed: null,
    startsAt: daysAgo(60),
    endsAt: daysAgo(30),
    active: true,
  },
  {
    key: "belleepoque-wax",
    storeKey: "belleepoque",
    title: "Lancement collection wax : 15 %",
    description: "Prochaine collection en pagne wax, du lancement jusqu'à la fin du mois.",
    cashbackType: "PERCENT",
    cashbackRate: 15,
    cashbackFixed: null,
    startsAt: daysAhead(7),
    endsAt: daysAhead(30),
    active: true,
  },
  {
    key: "karo-haute-saison",
    storeKey: "karo",
    title: "Haute saison : 9 %",
    description: "Offre désactivée par l'administration (négociation tarifaire en cours).",
    cashbackType: "PERCENT",
    cashbackRate: 9,
    cashbackFixed: null,
    startsAt: daysAgo(20),
    endsAt: daysAhead(40),
    active: false,
  },
];

type PurchaseSeed = {
  userKey: string;
  storeKey: string;
  offerKey?: string;
  amount: number;
  cashback: number;
  receiptRef: string;
  purchasedAtDaysAgo: number;
  createdAtDaysAgo: number;
  note?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNote?: string;
};

const PURCHASES: PurchaseSeed[] = [
  // Rachidatou — portefeuille bien alimenté
  {
    userKey: "membre",
    storeKey: "kponli",
    amount: 24500,
    cashback: 1225,
    receiptRef: "TK-88421",
    purchasedAtDaysAgo: 12,
    createdAtDaysAgo: 12,
    status: "APPROVED",
  },
  {
    userKey: "membre",
    storeKey: "tantie",
    amount: 15000,
    cashback: 1200,
    receiptRef: "MC-2210",
    purchasedAtDaysAgo: 9,
    createdAtDaysAgo: 9,
    note: "Repas d'équipe à 6 personnes.",
    status: "APPROVED",
  },
  {
    userKey: "membre",
    storeKey: "colombe",
    amount: 4200,
    cashback: 168,
    receiptRef: "PH-5567",
    purchasedAtDaysAgo: 6,
    createdAtDaysAgo: 6,
    status: "APPROVED",
  },
  {
    userKey: "membre",
    storeKey: "techdjoue",
    amount: 85000,
    cashback: 2125,
    receiptRef: "CMD-100234",
    purchasedAtDaysAgo: 20,
    createdAtDaysAgo: 19,
    note: "Commande payée par MoMo à la livraison.",
    status: "APPROVED",
  },
  {
    userKey: "membre",
    storeKey: "belleepoque",
    amount: 22000,
    cashback: 2200,
    receiptRef: "BP-3312",
    purchasedAtDaysAgo: 4,
    createdAtDaysAgo: 4,
    status: "APPROVED",
  },
  {
    userKey: "membre",
    storeKey: "karo",
    amount: 60000,
    cashback: 3600,
    receiptRef: "HK-7781",
    purchasedAtDaysAgo: 15,
    createdAtDaysAgo: 14,
    note: "Week-end à deux, chambre supérieure.",
    status: "APPROVED",
  },
  {
    userKey: "membre",
    storeKey: "motor",
    amount: 35000,
    cashback: 1050,
    receiptRef: "GP-1187",
    purchasedAtDaysAgo: 25,
    createdAtDaysAgo: 24,
    status: "APPROVED",
  },
  // En attente de validation
  {
    userKey: "membre",
    storeKey: "kponli",
    offerKey: "kponli-samedi",
    amount: 9000,
    cashback: 900,
    receiptRef: "TK-90112",
    purchasedAtDaysAgo: 1,
    createdAtDaysAgo: 1,
    note: "Courses hebdomadaires, achat fait un samedi.",
    status: "PENDING",
  },
  {
    userKey: "membre",
    storeKey: "tantie",
    amount: 8000,
    cashback: 640,
    receiptRef: "MC-2299",
    purchasedAtDaysAgo: 2,
    createdAtDaysAgo: 2,
    status: "PENDING",
  },
  // Refusé
  {
    userKey: "membre",
    storeKey: "fitzone",
    amount: 15000,
    cashback: 500,
    receiptRef: "FZ-0042",
    purchasedAtDaysAgo: 8,
    createdAtDaysAgo: 8,
    status: "REJECTED",
    adminNote: "Reçu illisible : merci de renvoyer une photo nette du ticket de caisse.",
  },
  // Gildas
  {
    userKey: "gildas",
    storeKey: "kponli",
    amount: 18000,
    cashback: 900,
    receiptRef: "TK-87100",
    purchasedAtDaysAgo: 10,
    createdAtDaysAgo: 10,
    status: "APPROVED",
  },
  {
    userKey: "gildas",
    storeKey: "awa",
    amount: 12000,
    cashback: 1440,
    receiptRef: "AB-1180",
    purchasedAtDaysAgo: 3,
    createdAtDaysAgo: 3,
    note: "Tresses et pose de vernis.",
    status: "APPROVED",
  },
  {
    userKey: "gildas",
    storeKey: "wings",
    amount: 45000,
    cashback: 1800,
    receiptRef: "WT-6621",
    purchasedAtDaysAgo: 1,
    createdAtDaysAgo: 1,
    note: "Billet Cotonou – Abidjan.",
    status: "PENDING",
  },
  // Adjovi
  {
    userKey: "adjovi",
    storeKey: "codecode",
    amount: 50000,
    cashback: 3500,
    receiptRef: "CCA-2024-118",
    purchasedAtDaysAgo: 2,
    createdAtDaysAgo: 2,
    note: "Formation développement web, 1re tranche.",
    status: "APPROVED",
  },
];

type WithdrawalSeed = {
  userKey: string;
  amount: number;
  method: "MTN_MONEY" | "MOOV_MONEY" | "CELTIIS_CASH";
  phone: string;
  createdAtDaysAgo: number;
  processedAtDaysAgo?: number;
  status: "PENDING" | "PAID" | "REJECTED";
  adminNote?: string;
};

const WITHDRAWALS: WithdrawalSeed[] = [
  {
    userKey: "membre",
    amount: 5000,
    method: "CELTIIS_CASH",
    phone: "+22997123456",
    createdAtDaysAgo: 6,
    processedAtDaysAgo: 5,
    status: "PAID",
  },
  {
    userKey: "membre",
    amount: 5000,
    method: "MOOV_MONEY",
    phone: "+22996445566",
    createdAtDaysAgo: 1,
    status: "PENDING",
  },
  {
    userKey: "membre",
    amount: 6000,
    method: "MTN_MONEY",
    phone: "+22990000001",
    createdAtDaysAgo: 30,
    processedAtDaysAgo: 29,
    status: "REJECTED",
    adminNote: "Numéro MoMo introuvable : vérifiez le numéro bénéficiaire puis relancez la demande.",
  },
];

type VoucherSeed = {
  userKey: string;
  code: string;
  pointsCost: number;
  createdAtDaysAgo: number;
  usedAtDaysAgo?: number;
};

const VOUCHERS: VoucherSeed[] = [
  {
    userKey: "membre",
    code: "CU-K7PM-2QFX",
    pointsCost: 2000,
    createdAtDaysAgo: 5,
  },
  {
    userKey: "membre",
    code: "CU-9TRD-5HNM",
    pointsCost: 1000,
    createdAtDaysAgo: 20,
    usedAtDaysAgo: 15,
  },
  {
    userKey: "gildas",
    code: "CU-4WJP-8ZKB",
    pointsCost: 1000,
    createdAtDaysAgo: 8,
  },
];

async function main() {
  console.log("🧹 Nettoyage de la base…");
  await prisma.pointTransaction.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.store.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  console.log("👤 Création des comptes…");
  const passwordHash = hashPassword(DEMO_PASSWORD);

  const admin = await prisma.user.create({
    data: {
      name: "Équipe Cashup",
      email: "admin@cashup.bj",
      phone: "+22990000000",
      city: "Cotonou",
      role: "ADMIN",
      passwordHash,
      createdAt: daysAgo(300),
    },
  });

  const users: Record<string, string> = {};

  const members: { key: string; name: string; email: string; phone: string; city: string; createdAtDaysAgo: number; suspended?: boolean }[] = [
    {
      key: "membre",
      name: "Rachidatou Allassane",
      email: "membre@cashup.bj",
      phone: "+22997123456",
      city: "Cotonou",
      createdAtDaysAgo: 120,
    },
    {
      key: "gildas",
      name: "Sylvain Kodjo",
      email: "sylvain.kodjo@cashup.bj",
      phone: "+22996445566",
      city: "Abomey-Calavi",
      createdAtDaysAgo: 60,
    },
    {
      key: "adjovi",
      name: "Adjovi Zinsou",
      email: "adjovi.zinsou@cashup.bj",
      phone: "+22994778899",
      city: "Porto-Novo",
      createdAtDaysAgo: 15,
    },
    {
      key: "suspendu",
      name: "François Dossou",
      email: "francois.dossou@cashup.bj",
      phone: "+22995112233",
      city: "Parakou",
      createdAtDaysAgo: 45,
      suspended: true,
    },
  ];

  for (const member of members) {
    const user = await prisma.user.create({
      data: {
        name: member.name,
        email: member.email,
        phone: member.phone,
        city: member.city,
        role: "MEMBER",
        passwordHash,
        suspended: member.suspended ?? false,
        createdAt: daysAgo(member.createdAtDaysAgo),
      },
    });
    users[member.key] = user.id;
  }

  console.log("🏪 Création des boutiques…");
  const stores: Record<string, string> = {};

  for (const store of STORES) {
    const created = await prisma.store.create({
      data: {
        slug: store.slug,
        name: store.name,
        description: store.description,
        category: store.category,
        city: store.city,
        address: store.address,
        website: store.website,
        phone: store.phone,
        cashbackType: store.cashbackType,
        cashbackRate: store.cashbackRate,
        cashbackFixed: store.cashbackFixed,
        commissionRate: COMMISSION_BY_CATEGORY[store.category] ?? 20,
        color: store.color,
        featured: store.featured ?? false,
        active: store.active ?? true,
        createdAt: daysAgo(store.createdAtDaysAgo),
      },
    });
    stores[store.key] = created.id;
  }

  console.log("🏷️  Création des offres…");
  const offers: Record<string, string> = {};

  for (const offer of OFFERS) {
    const created = await prisma.offer.create({
      data: {
        storeId: stores[offer.storeKey],
        title: offer.title,
        description: offer.description,
        cashbackType: offer.cashbackType,
        cashbackRate: offer.cashbackRate,
        cashbackFixed: offer.cashbackFixed,
        startsAt: offer.startsAt,
        endsAt: offer.endsAt,
        active: offer.active,
      },
    });
    offers[offer.key] = created.id;
  }

  console.log("🧾 Création des achats, commissions et écritures…");

  for (const purchase of PURCHASES) {
    const createdAt = daysAgo(purchase.createdAtDaysAgo);
    const reviewedAt =
      purchase.status === "PENDING" ? null : new Date(createdAt.getTime() + 6 * 60 * 60 * 1000);

    const store = STORES.find((s) => s.key === purchase.storeKey)!;
    const rate = COMMISSION_BY_CATEGORY[store.category] ?? 20;
    const shares = purchase.status === "APPROVED" ? splitCommission(purchase.amount, rate) : null;

    const created = await prisma.purchase.create({
      data: {
        userId: users[purchase.userKey],
        storeId: stores[purchase.storeKey],
        offerId: purchase.offerKey ? offers[purchase.offerKey] : null,
        amount: purchase.amount,
        cashback: purchase.cashback,
        receiptRef: purchase.receiptRef,
        purchasedAt: daysAgo(purchase.purchasedAtDaysAgo),
        note: purchase.note ?? null,
        status: purchase.status,
        adminNote: purchase.adminNote ?? null,
        reviewedById: purchase.status === "PENDING" ? null : admin.id,
        reviewedAt,
        commissionRate: shares?.rate ?? null,
        commission: shares?.commission ?? null,
        cashUpShare: shares?.cashUp ?? null,
        feeShare: shares?.fees ?? null,
        pointsShare: shares?.points ?? null,
        createdAt,
      },
    });

    if (purchase.status === "APPROVED" && shares) {
      await prisma.walletTransaction.create({
        data: {
          userId: users[purchase.userKey],
          kind: "CREDIT",
          amount: purchase.cashback,
          label: `Cashback ${store.name}`,
          purchaseId: created.id,
          createdAt: reviewedAt ?? createdAt,
        },
      });

      if (shares.points > 0) {
        await prisma.pointTransaction.create({
          data: {
            userId: users[purchase.userKey],
            kind: "EARN",
            amount: shares.points,
            label: `Points ${store.name}`,
            purchaseId: created.id,
            createdAt: reviewedAt ?? createdAt,
          },
        });
      }
    }
  }

  console.log("💸 Création des retraits…");

  for (const withdrawal of WITHDRAWALS) {
    const createdAt = daysAgo(withdrawal.createdAtDaysAgo);
    const processedAt =
      withdrawal.processedAtDaysAgo !== undefined
        ? daysAgo(withdrawal.processedAtDaysAgo)
        : null;

    const created = await prisma.withdrawal.create({
      data: {
        userId: users[withdrawal.userKey],
        amount: withdrawal.amount,
        method: withdrawal.method,
        phone: withdrawal.phone.replace(/\s+/g, ""),
        status: withdrawal.status,
        adminNote: withdrawal.adminNote ?? null,
        processedById: withdrawal.status === "PENDING" ? null : admin.id,
        processedAt,
        createdAt,
      },
    });

    if (withdrawal.status === "PAID") {
      await prisma.walletTransaction.create({
        data: {
          userId: users[withdrawal.userKey],
          kind: "DEBIT",
          amount: withdrawal.amount,
          label: METHOD_LABELS[withdrawal.method] ?? "Retrait Mobile Money",
          withdrawalId: created.id,
          createdAt: processedAt ?? createdAt,
        },
      });
    }
  }

  console.log("🎁 Conversion des points en bons d'achat…");

  for (const voucher of VOUCHERS) {
    const createdAt = daysAgo(voucher.createdAtDaysAgo);
    const usedAt = voucher.usedAtDaysAgo !== undefined ? daysAgo(voucher.usedAtDaysAgo) : null;

    const created = await prisma.voucher.create({
      data: {
        userId: users[voucher.userKey],
        code: voucher.code,
        pointsCost: voucher.pointsCost,
        value: voucher.pointsCost,
        status: usedAt ? "USED" : "ACTIVE",
        usedAt,
        createdAt,
      },
    });

    await prisma.pointTransaction.create({
      data: {
        userId: users[voucher.userKey],
        kind: "SPEND",
        amount: voucher.pointsCost,
        label: `Conversion en bon d'achat ${created.code}`,
        voucherId: created.id,
        createdAt,
      },
    });
  }

  const [credits, debits, revenueAgg, pointsAgg, voucherCount] = await Promise.all([
    prisma.walletTransaction.aggregate({ where: { kind: "CREDIT" }, _sum: { amount: true } }),
    prisma.walletTransaction.aggregate({ where: { kind: "DEBIT" }, _sum: { amount: true } }),
    prisma.purchase.aggregate({
      where: { status: "APPROVED" },
      _sum: { commission: true, cashUpShare: true, feeShare: true, pointsShare: true },
    }),
    prisma.pointTransaction.aggregate({ where: { kind: "EARN" }, _sum: { amount: true } }),
    prisma.voucher.count(),
  ]);

  console.log("");
  console.log("✅ Seed terminé :");
  console.log(
    `   ${STORES.length} boutiques, ${OFFERS.length} offres, ${PURCHASES.length} achats, ${WITHDRAWALS.length} retraits, ${voucherCount} bons.`,
  );
  console.log(
    `   Cashback versé : ${(credits._sum.amount ?? 0).toLocaleString("fr-FR")} FCFA · Retraits payés : ${(debits._sum.amount ?? 0).toLocaleString("fr-FR")} FCFA`,
  );
  console.log(
    `   Commission : ${(revenueAgg._sum.commission ?? 0).toLocaleString("fr-FR")} FCFA (CashUp ${(revenueAgg._sum.cashUpShare ?? 0).toLocaleString("fr-FR")} · frais ${(revenueAgg._sum.feeShare ?? 0).toLocaleString("fr-FR")} · points ${(revenueAgg._sum.pointsShare ?? 0).toLocaleString("fr-FR")})`,
  );
  console.log(`   Points gagnés : ${(pointsAgg._sum.amount ?? 0).toLocaleString("fr-FR")}`);
  console.log("");
  console.log("   Membre  : membre@cashup.bj / demo1234");
  console.log("   Admin   : admin@cashup.bj / demo1234");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
