// Génère prisma/schema.sqlite.prisma à partir du schéma de référence
// (PostgreSQL). Le fichier produit sert uniquement au développement local :
// il permet de continuer à utiliser SQLite sans dupliquer les modèles.
//
// Usage : node scripts/make-sqlite-schema.mjs

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "prisma", "schema.prisma");
const targetPath = path.join(root, "prisma", "schema.sqlite.prisma");

const source = await readFile(sourcePath, "utf8");

const generatorIndex = source.indexOf("generator client {");
if (generatorIndex === -1) {
  throw new Error("Bloc « generator client » introuvable dans prisma/schema.prisma");
}

const withoutHeader = source.slice(generatorIndex);
const sqliteDatasource = `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`;

const datasourcePattern = /datasource db \{[\s\S]*?\n\}/;
if (!datasourcePattern.test(withoutHeader)) {
  throw new Error("Bloc « datasource db » introuvable dans prisma/schema.prisma");
}

const output = `// FICHIER GÉNÉRÉ — NE PAS MODIFIER À LA MAIN.
// Version SQLite locale de prisma/schema.prisma (référence PostgreSQL).
// Régénéré automatiquement par scripts/make-sqlite-schema.mjs.
// Les modèles doivent être modifiés uniquement dans prisma/schema.prisma.

${withoutHeader.replace(datasourcePattern, sqliteDatasource)}`;

await writeFile(targetPath, output, "utf8");
console.log("prisma/schema.sqlite.prisma généré (SQLite, développement local).");
