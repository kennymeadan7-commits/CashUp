// Vérifie l'état complet d'un paiement de démonstration (défaut : PAY-2775).
// Usage : node scripts/verify-demo-payment.mjs [CODE_PAIEMENT]
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const code = process.argv[2] ?? "PAY-2775";

const pay = await prisma.paymentRequest.findFirst({
  where: { code },
  include: { store: true, user: true },
});
if (!pay) {
  console.log(`${code} introuvable`);
  process.exit(1);
}
console.log(
  `PaymentRequest: ${pay.code} | ${pay.status} | ${pay.amount} FCFA | ${pay.mode} | boutique ${pay.store.name} | confirmé: ${pay.confirmedById ? "oui" : "non"}`,
);

const purchase = await prisma.purchase.findFirst({
  where: { receiptRef: `Paiement ${code}` },
});
console.log(
  `Purchase: ${purchase.status} | montant ${purchase.amount} | cashback ${purchase.cashback} | commission ${purchase.commission} (${purchase.commissionRate}%) | CashUp ${purchase.cashUpShare} | frais ${purchase.feeShare} | points ${purchase.pointsShare}`,
);

const wallets = await prisma.walletTransaction.findMany({
  where: { OR: [{ purchaseId: purchase.id }, { paymentRequestId: pay.id }] },
});
console.log("Wallet:", wallets.map((w) => `${w.kind} ${w.amount} (${w.label})`).join(" | "));

const points = await prisma.pointTransaction.findMany({
  where: { OR: [{ purchaseId: purchase.id }, { paymentRequestId: pay.id }] },
});
console.log("Points:", points.map((x) => `${x.kind} ${x.amount} (${x.label})`).join(" | "));

const notif = await prisma.notification.findFirst({
  where: { userId: pay.userId },
  orderBy: { createdAt: "desc" },
});
console.log(`Notification: ${notif.kind} | ${notif.title}`);

const outbox = await prisma.messageOutbox.findMany({
  where: { userId: pay.userId },
  orderBy: { createdAt: "desc" },
  take: 4,
});
console.log(
  "Outbox:",
  outbox.map((m) => `${m.channel} -> ${m.to} [${m.status}]`).join(" | "),
);

await prisma.$disconnect();
