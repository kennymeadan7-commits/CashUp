// Prépare la base de démonstration Cashup :
//   1. attribue un code marchand (4 chiffres) à chaque boutique ;
//   2. crée (ou met à jour) le compte marchand de démonstration.
//
// Idempotent : relancer la commande ne change rien d'autre.
//
// Usage : node scripts/seed-demo.mjs

import { randomBytes, scryptSync } from "node:crypto";

const { PrismaClient } = await import("@prisma/client");

const CODES = {
  "kponli-supermarche": "7842",
  "chez-tantie": "4107",
  "pharmacie-la-colombe": "2205",
  techdjoue: "6390",
  "belle-epoque-mode": "5518",
  "salon-awa-beaute": "3074",
  "maison-jardin-hounsa": "8841",
  "villa-karo-hotel": "1963",
  "garage-motor-plus": "7726",
  "fitzone-gym": "4450",
  "code-and-code-academy": "9182",
  "wings-travel": "2637",
  "superette-la-grace": "5041",
};

function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(value, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();

try {
  const stores = await prisma.store.findMany({ select: { id: true, slug: true, code: true } });
  let codes = 0;
  for (const store of stores) {
    const code = CODES[store.slug];
    if (code && store.code !== code) {
      await prisma.store.update({ where: { id: store.id }, data: { code } });
      codes += 1;
    }
  }
  console.log(`Codes marchands mis à jour : ${codes}`);

  const email = "marchand@cashup.bj";
  const existing = await prisma.user.findUnique({ where: { email } });
  const data = {
    name: "ETS La Grace",
    role: "MARCHAND",
    suspended: false,
    passwordHash: hashPassword("demo1234"),
    phone: "+22997000009",
    city: "Cotonou",
  };
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data });
    console.log(`Compte marchand mis à jour : ${email} / demo1234`);
  } else {
    await prisma.user.create({ data: { email, ...data } });
    console.log(`Compte marchand créé : ${email} / demo1234`);
  }
} catch (error) {
  console.error("Échec de la préparation de la démo :", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
