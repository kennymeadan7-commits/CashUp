// Affiche les soldes du membre de démonstration après les 3 paiements testés.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const user = await prisma.user.findUnique({ where: { email: "membre@cashup.bj" } });

const [credits, debits, earned, spent, purchases, payments] = await Promise.all([
  prisma.walletTransaction.aggregate({ where: { userId: user.id, kind: "CREDIT" }, _sum: { amount: true } }),
  prisma.walletTransaction.aggregate({ where: { userId: user.id, kind: "DEBIT" }, _sum: { amount: true } }),
  prisma.pointTransaction.aggregate({ where: { userId: user.id, kind: "EARN" }, _sum: { amount: true } }),
  prisma.pointTransaction.aggregate({ where: { userId: user.id, kind: "SPEND" }, _sum: { amount: true } }),
  prisma.purchase.findMany({ where: { userId: user.id, status: "APPROVED" }, select: { storeId: true, amount: true, cashback: true, receiptRef: true } }),
  prisma.paymentRequest.findMany({ where: { userId: user.id }, select: { code: true, mode: true, status: true, amount: true } }),
]);

console.log(`Solde portefeuille : ${(credits._sum.amount ?? 0)} - ${(debits._sum.amount ?? 0)} = ${(credits._sum.amount ?? 0) - (debits._sum.amount ?? 0)} FCFA`);
console.log(`Points : ${(earned._sum.amount ?? 0)} - ${(spent._sum.amount ?? 0)} = ${(earned._sum.amount ?? 0) - (spent._sum.amount ?? 0)} pts`);
console.log(`Achats validés : ${purchases.length}`);
console.log(`Paiements : ${payments.map((p) => `${p.code}/${p.mode}/${p.status}/${p.amount}`).join(" | ")}`);

await prisma.$disconnect();
