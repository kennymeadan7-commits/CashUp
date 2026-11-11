import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

// Génère le PDF du scénario de démo investisseurs.
// Usage : node scripts/generate-demo-scenario.mjs [sortie.pdf]

const OUT = path.resolve(process.argv[2] ?? "docs/scenario-demo.pdf");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const M = 46; // marge
const BRAND = "#4348d8";
const BRAND_DARK = "#3639a8";
const INK = "#101828";
const MUTED = "#667085";
const FAINT = "#98A2B3";
const GREEN = "#067647";
const GREEN_BG = "#ECFDF3";
const GREEN_BORDER = "#ABEFC6";
const AMBER_BG = "#FFFAEB";
const AMBER_BORDER = "#FEDF89";
const AMBER = "#B54708";
const GREY_BG = "#F9FAFB";
const BORDER = "#E4E7EC";

const F = "Helvetica";
const FB = "Helvetica-Bold";

const doc = new PDFDocument({
  size: "A4",
  margin: M,
  bufferPages: true,
  info: {
    Title: "Cashup — Scénario de démo investisseurs",
    Author: "Cashup",
    Subject: "Démo MVP cashback Bénin",
  },
});
doc.pipe(fs.createWriteStream(OUT));

const W = doc.page.width - M * 2;
const BOTTOM = () => doc.page.height - 56;
let y = 0;

function ensure(h) {
  if (y + h <= BOTTOM()) return;
  doc.addPage();
  y = M;
  doc.font(F).fontSize(8).fillColor(BRAND);
  doc.text("Cashup · Scénario de démo investisseurs", M, y, {
    width: W,
    characterSpacing: 0.4,
  });
  y += 20;
  doc.fillColor(INK);
}

function section(num, label) {
  ensure(34);
  doc.roundedRect(M, y, 20, 20, 5).fill(BRAND);
  doc.fillColor("#FFFFFF").font(FB).fontSize(11).text(String(num), M, y + 4.5, {
    width: 20,
    align: "center",
  });
  doc.fillColor(INK).font(FB).fontSize(13).text(label, M + 30, y + 3, {
    width: W - 30,
  });
  y += 30;
}

function paragraph(text, opts = {}) {
  const font = opts.bold ? FB : F;
  const size = opts.size ?? 10.5;
  const color = opts.color ?? MUTED;
  const gap = opts.gap ?? 6;
  doc.font(font).fontSize(size);
  const h = doc.heightOfString(text, { width: opts.width ?? W, lineGap: 3 });
  ensure(h + gap);
  doc.fillColor(color).text(text, opts.x ?? M, y, {
    width: opts.width ?? W,
    lineGap: 3,
  });
  y += h + gap;
}

function bullet(text, color = MUTED) {
  const width = W - 16;
  doc.font(F).fontSize(10.5);
  const h = doc.heightOfString(text, { width, lineGap: 3 });
  ensure(h + 5);
  doc.fillColor(BRAND).font(FB).fontSize(10.5).text("•", M, y, { width: 12 });
  doc.fillColor(color).font(F).fontSize(10.5).text(text, M + 16, y, {
    width,
    lineGap: 3,
  });
  y += h + 5;
}

function step(n, who, title, body, repli) {
  const pad = 14;
  const innerW = W - pad * 2;
  doc.font(FB).fontSize(8.5);
  const badgeText = `ÉTAPE ${n} · ${who}`;
  const badgeW = doc.widthOfString(badgeText, { characterSpacing: 0.9 }) + 18;
  doc.font(FB).fontSize(12.5);
  const titleH = doc.heightOfString(title, { width: innerW });
  doc.font(F).fontSize(10.5);
  const bodyH = doc.heightOfString(body, { width: innerW, lineGap: 3.5 });
  let repliH = 0;
  if (repli) {
    doc.font(F).fontSize(9.5);
    repliH = doc.heightOfString(repli, { width: innerW, lineGap: 3 }) + 10;
  }
  const h = pad + 17 + 7 + titleH + 5 + bodyH + (repliH ? repliH + 6 : 0) + pad;
  ensure(h + 12);

  const y0 = y;
  doc.roundedRect(M, y0, W, h, 10).fillAndStroke(GREY_BG, BORDER);
  doc.roundedRect(M, y0, 4.5, h, 2).fill(who === "MARCHAND" ? GREEN : BRAND);

  doc
    .roundedRect(M + pad, y0 + pad, badgeW, 15, 7.5)
    .fill(who === "MARCHAND" ? GREEN_BG : "#EEF2FF");
  doc
    .fillColor(who === "MARCHAND" ? GREEN : BRAND_DARK)
    .font(FB)
    .fontSize(8.5)
    .text(badgeText, M + pad + 9, y0 + pad + 4, { characterSpacing: 0.9 });

  doc.fillColor(INK).font(FB).fontSize(12.5).text(title, M + pad, y0 + pad + 22, {
    width: innerW,
  });
  let cursor = y0 + pad + 22 + titleH + 5;
  doc.fillColor(MUTED).font(F).fontSize(10.5).text(body, M + pad, cursor, {
    width: innerW,
    lineGap: 3.5,
  });
  cursor += bodyH;
  if (repli) {
    cursor += 6;
    doc.roundedRect(M + pad, cursor, innerW, repliH, 6).fill("#FFF7ED");
    doc.fillColor(AMBER).font(F).fontSize(9.5).text(repli, M + pad + 10, cursor + 5, {
      width: innerW - 20,
      lineGap: 3,
    });
  }
  y = y0 + h + 12;
}

function box(title, lines, palette) {
  const pad = 14;
  const innerW = W - pad * 2;
  doc.font(FB).fontSize(11);
  const titleH = doc.heightOfString(title, { width: innerW });
  doc.font(F).fontSize(10.5);
  const text = lines.join("\n");
  const bodyH = doc.heightOfString(text, { width: innerW, lineGap: 4 });
  const h = pad + titleH + 7 + bodyH + pad;
  ensure(h + 12);
  doc.roundedRect(M, y, W, h, 10).fillAndStroke(palette.bg, palette.border);
  doc.fillColor(palette.title).font(FB).fontSize(11).text(title, M + pad, y + pad, {
    width: innerW,
  });
  doc.fillColor(MUTED).font(F).fontSize(10.5).text(text, M + pad, y + pad + titleH + 7, {
    width: innerW,
    lineGap: 4,
  });
  y += h + 12;
}

function row(label, value) {
  ensure(22);
  doc.fillColor(MUTED).font(F).fontSize(10.5).text(label, M, y, { width: W * 0.52 });
  doc.fillColor(INK).font(FB).fontSize(10.5).text(value, M + W * 0.52, y, {
    width: W * 0.48,
    align: "right",
  });
  y += 8;
  doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.5).strokeColor(BORDER).stroke();
  y += 8;
}

// ---------------------------------------------------------------------------
// PAGE 1 — bandeau + préparation + scénario
// ---------------------------------------------------------------------------

doc.rect(0, 0, doc.page.width, 104).fill(BRAND);
doc.rect(0, 104, doc.page.width, 4).fill(BRAND_DARK);
doc.fillColor("#FFFFFF").font(FB).fontSize(22).text("Scénario de démo investisseurs", M, 30, {
  width: W,
});
doc
  .fillColor("#D6D9FF")
  .font(F)
  .fontSize(11)
  .text("Cashup — MVP cashback Bénin · ce soir · durée ~7 minutes", M, 62, { width: W });
doc
  .fillColor("#FFFFFF")
  .font(FB)
  .fontSize(9.5)
  .text("PARCOURS « PAYER » : SCAN QR · PIN · CONFIRMATION MARCHAND · CASHBACK INSTANTANÉ", M, 80, {
    width: W,
    characterSpacing: 0.3,
  });
y = 124;

section(1, "Préparation — 2 minutes avant");
bullet(
  "Chrome, côté membre : ouvrir http://localhost:3100/payer puis se connecter à membre@cashup.bj (mot de passe : demo1234).",
);
bullet(
  "Edge ou fenêtre privée, côté marchand : ouvrir http://localhost:3100/marchand avec marchand@cashup.bj (demo1234), section « Mes QR codes », cliquer Kponli Supermarché pour agrandir l'affiche (code 7842).",
);
bullet(
  "Les deux écrans visibles côte à côte : le marchand tient l'affiche à l'écran, le membre la scanne.",
);
bullet(
  "PIN de démo : n'importe quel code à 6 chiffres (123456) — le PIN n'est jamais stocké.",
);
bullet(
  "Serveur : npm start -- -p 3100 (déjà lancé). Santé du projet : npm run typecheck, npm run test (68 tests verts), npm run build.",
);

y += 6;
section(2, "Le scénario — 5 étapes");

step(
  1,
  "MEMBRE",
  "Scanner le QR du commerçant",
  "Depuis « Payer », grand bouton « Scanner le QR du commerçant ». Autoriser la caméra, puis viser le QR Kponli affiché dans l'autre navigateur : le code 7842 se remplit automatiquement et l'on retombe sur « Payer » avec le code pré-rempli. Le membre reste libre du montant et du mode de paiement.",
  "Repli instantané : bloc « Sans caméra ? » sous la vidéo, saisir 7842 puis Continuer. Même scénario, 5 secondes de perdues.",
);
step(
  2,
  "MEMBRE",
  "Montant et validation PIN",
  "Montant 2 500 FCFA, mode « Espèces », Continuer. Écran de récapitulatif : cashback estimé +250 FCFA, +112 points, commission partenaire 375 FCFA, solde avant / après. Saisir le PIN 123456 puis « Payer 2 500 FCFA ».",
);
step(
  3,
  "MEMBRE",
  "En attente du commerçant",
  "Page « En attente du commerçant » : la demande (PAY-XXXX) est créée, l'écran se rafraîchit tout seul toutes les 2 secondes. Bouton « Annuler le paiement » disponible. Ne pas quitter la page.",
);
step(
  4,
  "MARCHAND",
  "Confirmer la réception",
  "Sur /marchand, la demande apparaît en tête de « Demandes en attente ». Cliquer « Confirmer la réception » : bandeau vert « Paiement confirmé : 2500 FCFA encaissés, 250 FCFA de cashback crédités ». Refuser est possible en un clic (annule côté membre).",
);
step(
  5,
  "MEMBRE",
  "Résultat immédiat",
  "L'écran membre bascule tout seul sur « PAIEMENT CONFIRMÉ » : +250 FCFA, +112 points, confirmation à l'instant. Phrase clé à dire : « le cashback est crédité à la confirmation du paiement, pas à la fin du mois. »",
);

y += 4;
section(3, "Chiffres du scénario (à connaître par cœur)");
row("Montant payé", "2 500 FCFA");
row("Cashback membre (10 %)", "+250 FCFA, immédiat");
row("Points membre", "+112 pts (1 pt = 1 FCFA)");
row("Commission partenaire (15 %)", "375 FCFA");
row("Répartition 50 / 20 / 30", "188 CashUp · 75 frais · 112 points");
row("Chaîne technique", "CONFIRMED puis APPROVED puis notification");

// ---------------------------------------------------------------------------
// PAGE 2 — plan B, variants, références
// ---------------------------------------------------------------------------

ensure(200);
section(4, "Plan B — si quelque chose accroche");
box(
  "Les 3 pièges connus (ne jamais perdre plus de 30 secondes dessus)",
  [
    "1. Caméra refusée, absente ou bloquée : le bloc « Sans caméra ? » prend le relais, on saisit 7842, le scénario continue. La caméra réelle se teste 2 minutes avant, dans Chrome.",
    "2. Onglet bloqué sur « Chargement de la page… » : F5. Bug connu des onglets en arrière-plan uniquement — dans une fenêtre visible, cela n'arrive pas.",
    "3. Rôles mélangés : les navigateurs partagent la session — UN SEUL RÔLE PAR NAVIGATEUR. Sinon le marchand « devient » membre et paie lui-même (c'est arrivé en test).",
  ],
  { bg: AMBER_BG, border: AMBER_BORDER, title: AMBER },
);
bullet("Serveur arrêté : npm start -- -p 3100 depuis J:\\JAVA\\cashup (redémarrage ~1 s).");
bullet("Code marchand introuvable ou boutique inactive : seules les 12 boutiques actives acceptent un paiement (La Grâce, 5041, est désactivée volontairement).");
bullet("Un seul écran disponible : impossible de scanner son propre QR — prévoir deux navigateurs (Chrome + onglet privé suffisent).");

y += 8;
section(5, "Pour rallonger si le temps reste (au choix)");
bullet("Variante solde : mode « Payer avec mon solde CashUp » : débit visible sur le relevé, cashback toujours créditée.");
bullet("Variante points : mode « Payer avec mes points CashUp » : SPEND sur les points + cashback en FCFA.");
bullet("Notifications : cloche en haut à droite, puis /admin/outbox — e-mail et SMS en file (QUEUED), le tout sans clé d'API.");
bullet("Espace marchand complet : liste des demandes, statistiques par mode, historique, et 12 QR codes + affiche grand format /marchand/qr/7842.");
bullet("Administration : /admin — boutiques, offres, achats, retraits, revenus, utilisateurs.");

y += 8;
section(6, "Références rapides");
box(
  "Tout ce qu'il faut sous la main",
  [
    "Comptes : membre@cashup.bj · marchand@cashup.bj · admin@cashup.bj — mot de passe demo1234",
    "Code du scénario : Kponli Supermarché = 7842 (cashback 10 %, commission 15 %)",
    "PIN de démo : 123456 (n'importe quel code à 6 chiffres)",
    "URLs : /payer · /payer/scanner · /payer/confirmation · /payer/suivi · /marchand · /marchand/qr/7842",
    "Vérifications : npm run typecheck · npm run test (68) · npm run build · scripts/verify-demo-payment.mjs",
  ],
  { bg: "#EEF2FF", border: "#C7D2FE", title: BRAND_DARK },
);

y += 4;
paragraph(
  "Démo figée à ce stade : les 5 améliorations d'origine, les notifications (in-app + e-mail/SMS avec outbox) et les tests + CI sont livrés ; le mode QR vient d'être ajouté et validé (68 tests, build vert, parcours complet rejoué).",
  { color: FAINT, size: 9.5 },
);

// ---------------------------------------------------------------------------
// Pieds de page
// ---------------------------------------------------------------------------

const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i += 1) {
  doc.switchToPage(i);
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc
    .font(F)
    .fontSize(8)
    .fillColor(FAINT)
    .text(
      `Cashup · scénario de démo investisseurs · 10/11/2026 · page ${i + 1} / ${range.count}`,
      M,
      doc.page.height - 26,
      { width: W, align: "center", lineBreak: false },
    );
  doc.page.margins.bottom = savedBottom;
}

doc.end();
console.log(`PDF généré : ${OUT}`);
