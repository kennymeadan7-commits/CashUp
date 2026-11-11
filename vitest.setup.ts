// Environnement commun aux tests : la base SQLite locale est utilisée par les
// tests qui importent Prisma (aucune donnée n'y est modifiée hors transactions
// explicites).
process.env.DATABASE_URL ??= "file:./dev.db";
