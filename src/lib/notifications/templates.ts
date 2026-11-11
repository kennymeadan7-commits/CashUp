// Gabarits de notifications Cashup — module PUR (aucun accès base, aucun
// réseau) : testable unitairement et réutilisé pour l'affichage in-app,
// l'e-mail et le SMS.
//
// Chaque gabarit produit :
//   title / body / href  → affichage dans la cloche et la page notifications
//   subject              → ligne d'objet de l'e-mail
//   sms                  → variante courte (si le canal SMS est pertinent)

import { formatFCFA } from "@/lib/format";
import { withdrawalMethodLabel } from "@/lib/constants";

export const NOTIFICATION_KINDS = [
  "WELCOME",
  "PURCHASE_APPROVED",
  "PURCHASE_REJECTED",
  "WITHDRAWAL_RECEIVED",
  "WITHDRAWAL_PAID",
  "WITHDRAWAL_REJECTED",
  "POINTS_CONVERTED",
  "VOUCHER_USED",
] as const;

export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

export type NotificationContent = {
  kind: NotificationKind;
  title: string;
  body: string;
  href: string;
  subject: string;
  /** Variante SMS (optionnelle) : elle est envoyée en plus de l'e-mail. */
  sms?: string;
};

const SIGNATURE = "Cashup — le cashback du Bénin";

export function isNotificationKind(value: string): value is NotificationKind {
  return (NOTIFICATION_KINDS as readonly string[]).includes(value);
}

/** Ajoute la signature au corps d'un e-mail. */
function mail(body: string): string {
  return `${body}\n\n— ${SIGNATURE}`;
}

export function welcomeNotification(input: { name: string }): NotificationContent {
  const first = input.name.split(" ")[0];
  return {
    kind: "WELCOME",
    title: "Bienvenue sur Cashup 🎉",
    body: mail(
      `Bonjour ${first},\n\nVotre compte est créé. Déclarez votre premier achat chez une boutique partenaire : le cashback est validé sous 48 h ouvrées et versé sur votre portefeuille en FCFA.`,
    ),
    href: "/comment-ca-marche",
    subject: "Bienvenue sur Cashup — votre cashback commence ici",
  };
}

export function purchaseApprovedNotification(input: {
  name: string;
  storeName: string;
  cashback: number;
  points: number;
}): NotificationContent {
  const first = input.name.split(" ")[0];
  return {
    kind: "PURCHASE_APPROVED",
    title: `Achat validé : ${formatFCFA(input.cashback)} de cashback`,
    body: mail(
      `Bonjour ${first},\n\nVotre achat chez ${input.storeName} a été validé.\n\n• Cashback crédité : ${formatFCFA(input.cashback)}\n• Points de fidélité : ${input.points} (30 % de la commission)\n\nLe montant est disponible sur votre portefeuille pour un retrait Mobile Money.`,
    ),
    href: "/tableau-de-bord/achats",
    subject: `Achat validé — ${formatFCFA(input.cashback)} crédités`,
    sms: `Cashup : achat chez ${input.storeName} validé, +${input.cashback} FCFA et ${input.points} points. Retrait Mobile Money disponible.`,
  };
}

export function purchaseRejectedNotification(input: {
  name: string;
  storeName: string;
  reason: string;
}): NotificationContent {
  const first = input.name.split(" ")[0];
  return {
    kind: "PURCHASE_REJECTED",
    title: "Achat refusé",
    body: mail(
      `Bonjour ${first},\n\nVotre achat déclaré chez ${input.storeName} n'a pas été retenu.\n\nMotif : ${input.reason}\n\nVous pouvez déclarer un nouveau achat avec une référence de reçu valide.`,
    ),
    href: "/tableau-de-bord/achats",
    subject: "Achat refusé — motif du refus",
    sms: `Cashup : votre achat chez ${input.storeName} a été refusé. Motif : ${input.reason}`,
  };
}

export function withdrawalReceivedNotification(input: {
  name: string;
  amount: number;
  method: string;
}): NotificationContent {
  const first = input.name.split(" ")[0];
  const label = withdrawalMethodLabel(input.method);
  return {
    kind: "WITHDRAWAL_RECEIVED",
    title: `Demande de retrait de ${formatFCFA(input.amount)} reçue`,
    body: mail(
      `Bonjour ${first},\n\nVotre demande de retrait de ${formatFCFA(input.amount)} vers ${label} est enregistrée.\n\nTraitement sous 48 h ouvrées : vous serez prévenu dès que les fonds sont versés.`,
    ),
    href: "/tableau-de-bord/retraits",
    subject: `Retrait de ${formatFCFA(input.amount)} enregistré`,
  };
}

export function withdrawalPaidNotification(input: {
  name: string;
  amount: number;
  method: string;
  phone: string;
}): NotificationContent {
  const first = input.name.split(" ")[0];
  const label = withdrawalMethodLabel(input.method);
  return {
    kind: "WITHDRAWAL_PAID",
    title: `Retrait de ${formatFCFA(input.amount)} versé`,
    body: mail(
      `Bonjour ${first},\n\nVotre retrait de ${formatFCFA(input.amount)} a été versé sur votre compte ${label} ${input.phone}.\n\nLes fonds sont débités de votre portefeuille.`,
    ),
    href: "/tableau-de-bord/retraits",
    subject: `Retrait versé — ${formatFCFA(input.amount)}`,
    sms: `Cashup : ${input.amount} FCFA envoyés sur ${label} ${input.phone}.`,
  };
}

export function withdrawalRejectedNotification(input: {
  name: string;
  amount: number;
  reason: string;
}): NotificationContent {
  const first = input.name.split(" ")[0];
  return {
    kind: "WITHDRAWAL_REJECTED",
    title: "Retrait refusé : fonds de nouveau disponibles",
    body: mail(
      `Bonjour ${first},\n\nVotre demande de retrait de ${formatFCFA(input.amount)} a été refusée.\n\nMotif : ${input.reason}\n\nLes fonds sont de nouveau disponibles sur votre portefeuille.`,
    ),
    href: "/tableau-de-bord/retraits",
    subject: "Retrait refusé — motif du refus",
    sms: `Cashup : retrait de ${input.amount} FCFA refuse. Motif : ${input.reason}`,
  };
}

export function pointsConvertedNotification(input: {
  name: string;
  points: number;
  value: number;
  code: string;
}): NotificationContent {
  const first = input.name.split(" ")[0];
  return {
    kind: "POINTS_CONVERTED",
    title: `Bon d'achat ${input.code} créé`,
    body: mail(
      `Bonjour ${first},\n\n${input.points} points convertis en bon d'achat de ${formatFCFA(input.value)}.\n\nCode à présenter en boutique : ${input.code}\n\nLe bon reste valable tant qu'il n'est pas utilisé.`,
    ),
    href: "/tableau-de-bord/points",
    subject: `Votre bon d'achat ${input.code} (${formatFCFA(input.value)})`,
    sms: `Cashup : bon de ${input.value} FCFA cree, code ${input.code}. A presenter chez votre partenaire.`,
  };
}

export function voucherUsedNotification(input: {
  name: string;
  code: string;
  value: number;
}): NotificationContent {
  const first = input.name.split(" ")[0];
  return {
    kind: "VOUCHER_USED",
    title: `Bon ${input.code} utilisé en boutique`,
    body: mail(
      `Bonjour ${first},\n\nVotre bon ${input.code} d'une valeur de ${formatFCFA(input.value)} a été utilisé chez un partenaire.\n\nVous pouvez suivre l'état de vos bons depuis votre portefeuille.`,
    ),
    href: "/tableau-de-bord/points",
    subject: `Bon ${input.code} utilisé — ${formatFCFA(input.value)}`,
  };
}
