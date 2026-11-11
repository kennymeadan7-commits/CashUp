// Crée (ou met à jour) le compte administrateur Cashup en production.
// Idempotent : relancer la commande réinitialise le mot de passe de l'admin.
//
// Usage :
//   ADMIN_EMAIL="admin@votredomaine.bj" ADMIN_PASSWORD="..." npm run admin:setup
//
// Le script lit DATABASE_URL (URL PostgreSQL directe de préférence) et ne
// touche à aucun autre compte.

import { randomBytes, scryptSync } from "node:crypto";

const { PrismaClient } = await import("@prisma/client");

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";
const name = process.env.ADMIN_NAME ?? "Administration Cashup";
const phone = (process.env.ADMIN_PHONE ?? "").replace(/\s+/g, "");
const city = process.env.ADMIN_CITY ?? "Cotonou";

if (!email || !password) {
  console.error(
    "Variables manquantes : ADMIN_EMAIL et ADMIN_PASSWORD sont obligatoires.\n" +
      'Exemple : ADMIN_EMAIL="admin@votredomaine.bj" ADMIN_PASSWORD="mot-de-passe-long" npm run admin:setup',
  );
  process.exit(1);
}

if (password.length < 10) {
  console.error("ADMIN_PASSWORD doit contenir au moins 10 caractères.");
  process.exit(1);
}

function hashPassword(value) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(value, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const prisma = new PrismaClient();

try {
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: "ADMIN",
        suspended: false,
        passwordHash: hashPassword(password),
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(city ? { city } : {}),
      },
    });
    console.log(`Compte administrateur mis à jour : ${email}`);
  } else {
    await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || "+22997000000",
        city,
        role: "ADMIN",
        passwordHash: hashPassword(password),
      },
    });
    console.log(`Compte administrateur créé : ${email}`);
  }
} catch (error) {
  console.error("Échec de la création du compte administrateur :", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
