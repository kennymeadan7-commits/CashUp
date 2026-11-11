import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";

// Guide de démo "version simple" : destiné à une personne non informaticienne.
// Aucun jargon, aucune ligne de commande : on clique, on regarde, on dit.
// Usage : node scripts/generate-demo-guide.mjs [sortie.pdf]

const OUT = path.resolve(process.argv[2] ?? "docs/guide-demo-pas-a-pas.pdf");
fs.mkdirSync(path.dirname(OUT), { recursive: true });

const M = 48; // marge
const BRAND = "#4348d8";
const BRAND_DARK = "#3639a8";
const INK = "#101828";
const MUTED = "#475467";
const FAINT = "#98A2B3";
const GREEN = "#067647";
const GREEN_BG = "#ECFDF3";
const GREEN_BORDER = "#ABEFC6";
const AMBER_BG = "#FFFAEB";
const AMBER_BORDER = "#FEDF89";
const AMBER = "#B54708";
const BLUE_BG = "#EEF2FF";
const BLUE_BORDER = "#C7D2FE";

const F = "Helvetica";
const FB = "Helvetica-Bold";

const doc = new PDFDocument({
  size: "A4",
  margin: M,
  bufferPages: true,
  info: {
    Title: "Cashup — Guide de démo pas à pas",
    Author: "Cashup",
    Subject: "Démo cashback Bénin, guide pour débutant",
  },
});
doc.pipe(fs.createWriteStream(OUT));

const W = doc.page.width - M * 2;
const BOTTOM = () => doc.page.height - 58;
let y = 0;

function ensure(h) {
  if (y + h <= BOTTOM()) return;
  doc.addPage();
  y = M;
  doc.font(F).fontSize(9).fillColor(BRAND);
  doc.text("Guide de démo Cashup — pas à pas", M, y, { width: W });
  y += 22;
  doc.fillColor(INK);
}

function section(label) {
  ensure(38);
  doc.roundedRect(M, y, W, 26, 6).fill(BRAND);
  doc.fillColor("#FFFFFF").font(FB).fontSize(13).text(label, M + 12, y + 6, {
    width: W - 24,
  });
  y += 36;
}

function bullet(text, opts = {}) {
  const width = W - 18;
  const size = opts.size ?? 11.5;
  doc.font(opts.bold ? FB : F).fontSize(size);
  const h = doc.heightOfString(text, { width, lineGap: 4 });
  ensure(h + 7);
  doc.fillColor(BRAND).font(FB).fontSize(size).text("•", M, y, { width: 12 });
  doc.fillColor(opts.color ?? MUTED)
    .font(opts.bold ? FB : F)
    .fontSize(size)
    .text(text, M + 18, y, { width, lineGap: 4 });
  y += h + 7;
}

/** Encadré « Ce que vous devez voir » (vert) ou information (bleu). */
function checkpoint(text) {
  const pad = 12;
  const innerW = W - pad * 2 - 96;
  doc.font(FB).fontSize(11);
  const h = Math.max(
    doc.heightOfString(text, { width: innerW, lineGap: 3 }) + pad * 2,
    40,
  );
  ensure(h + 10);
  doc.roundedRect(M, y, W, h, 8).fillAndStroke(GREEN_BG, GREEN_BORDER);
  doc.roundedRect(M + 10, y + 10, 86, 18, 9).fill(GREEN);
  doc.fillColor("#FFFFFF").font(FB).fontSize(8.5).text("À VOIR", M + 10, y + 14.5, {
    width: 86,
    align: "center",
    characterSpacing: 0.8,
  });
  doc.fillColor(GREEN).font(FB).fontSize(11).text(text, M + 106, y + pad, {
    width: innerW,
    lineGap: 3,
  });
  y += h + 12;
}

function warnBox(title, lines) {
  const pad = 13;
  const innerW = W - pad * 2;
  doc.font(FB).fontSize(11.5);
  const titleH = doc.heightOfString(title, { width: innerW });
  doc.font(F).fontSize(11);
  const text = lines.map((l) => `• ${l}`).join("\n");
  const bodyH = doc.heightOfString(text, { width: innerW, lineGap: 4 });
  const h = pad + titleH + 7 + bodyH + pad;
  ensure(h + 12);
  doc.roundedRect(M, y, W, h, 8).fillAndStroke(AMBER_BG, AMBER_BORDER);
  doc.fillColor(AMBER).font(FB).fontSize(11.5).text(title, M + pad, y + pad, {
    width: innerW,
  });
  doc.fillColor(MUTED).font(F).fontSize(11).text(text, M + pad, y + pad + titleH + 7, {
    width: innerW,
    lineGap: 4,
  });
  y += h + 12;
}

function infoBox(title, lines) {
  const pad = 13;
  const innerW = W - pad * 2;
  doc.font(FB).fontSize(11.5);
  const titleH = doc.heightOfString(title, { width: innerW });
  doc.font(F).fontSize(11);
  const text = lines.join("\n");
  const bodyH = doc.heightOfString(text, { width: innerW, lineGap: 4 });
  const h = pad + titleH + 7 + bodyH + pad;
  ensure(h + 12);
  doc.roundedRect(M, y, W, h, 8).fillAndStroke(BLUE_BG, BLUE_BORDER);
  doc.fillColor(BRAND_DARK).font(FB).fontSize(11.5).text(title, M + pad, y + pad, {
    width: innerW,
  });
  doc.fillColor(MUTED).font(F).fontSize(11).text(text, M + pad, y + pad + titleH + 7, {
    width: innerW,
    lineGap: 4,
  });
  y += h + 12;
}

function step(num, who, title, lines, voir) {
  const pad = 14;
  const innerW = W - pad * 2;
  const whoColor = who === "COMMERCANT" ? GREEN : BRAND;

  doc.font(FB).fontSize(15);
  const titleH = doc.heightOfString(`${num}. ${title}`, { width: innerW - 90 });
  doc.font(F).fontSize(11.5);
  const bodyText = lines.map((l) => `• ${l}`).join("\n");
  const bodyH = doc.heightOfString(bodyText, { width: innerW, lineGap: 4.5 });
  let voirH = 0;
  if (voir) {
    doc.font(FB).fontSize(10.5);
    voirH = doc.heightOfString(`À VOIR : ${voir}`, { width: innerW - 20, lineGap: 3 }) + 22;
  }
  const h = pad + Math.max(titleH, 20) + 8 + bodyH + (voirH ? voirH + 8 : 0) + pad;
  ensure(h + 14);

  const y0 = y;
  doc.roundedRect(M, y0, W, h, 10).fillAndStroke("#F9FAFB", "#E4E7EC");
  doc.roundedRect(M, y0, 5, h, 2.5).fill(whoColor);

  // pastille d'étape
  doc.circle(M + pad + 13, y0 + pad + 8, 13).fill(whoColor);
  doc.fillColor("#FFFFFF").font(FB).fontSize(13).text(String(num), M + pad, y0 + pad + 1.5, {
    width: 26,
    align: "center",
  });
  // badge du rôle
  const roleText = who === "COMMERCANT" ? "ÉCRAN DU COMMERCANT" : "ÉCRAN DU CLIENT";
  doc.font(FB).fontSize(8.5);
  const roleW = doc.widthOfString(roleText, { characterSpacing: 0.7 }) + 18;
  doc.roundedRect(M + innerW - roleW + pad, y0 + pad, roleW, 17, 8.5).fill(
    who === "COMMERCANT" ? GREEN_BG : BLUE_BG,
  );
  doc.fillColor(whoColor).font(FB).fontSize(8.5).text(roleText, M + innerW - roleW + pad, y0 + pad + 5, {
    width: roleW,
    align: "center",
    characterSpacing: 0.7,
  });

  doc.fillColor(INK).font(FB).fontSize(15).text(`${num}. ${title}`, M + pad + 34, y0 + pad + 1, {
    width: innerW - 40 - roleW,
  });
  let cursor = y0 + pad + titleH + 8;
  doc.fillColor(MUTED).font(F).fontSize(11.5).text(bodyText, M + pad, cursor, {
    width: innerW,
    lineGap: 4.5,
  });
  cursor += bodyH;
  if (voir) {
    cursor += 8;
    doc.roundedRect(M + pad, cursor, innerW, voirH - 8, 6).fillAndStroke(GREEN_BG, GREEN_BORDER);
    doc.fillColor(GREEN).font(FB).fontSize(10.5).text(`À VOIR : ${voir}`, M + pad + 12, cursor + 7, {
      width: innerW - 24,
      lineGap: 3,
    });
  }
  y = y0 + h + 14;
}

function row(label, value) {
  ensure(24);
  doc.fillColor(MUTED).font(F).fontSize(11.5).text(label, M, y, { width: W * 0.55 });
  doc.fillColor(INK).font(FB).fontSize(11.5).text(value, M + W * 0.55, y, {
    width: W * 0.45,
    align: "right",
  });
  y += 9;
  doc.moveTo(M, y).lineTo(M + W, y).lineWidth(0.5).strokeColor("#E4E7EC").stroke();
  y += 9;
}

function qa(question, answer) {
  const innerW = W - 4;
  doc.font(FB).fontSize(11.5);
  const qH = doc.heightOfString(`Q. ${question}`, { width: innerW });
  doc.font(F).fontSize(11);
  const aH = doc.heightOfString(answer, { width: innerW, lineGap: 3 });
  ensure(qH + aH + 12);
  doc.fillColor(BRAND_DARK).font(FB).fontSize(11.5).text(`Q. ${question}`, M + 4, y, {
    width: innerW,
  });
  y += qH + 3;
  doc.fillColor(MUTED).font(F).fontSize(11).text(answer, M + 4, y, {
    width: innerW,
    lineGap: 3,
  });
  y += aH + 10;
}

// ---------------------------------------------------------------------------
// EN-TÊTE
// ---------------------------------------------------------------------------

doc.rect(0, 0, doc.page.width, 108).fill(BRAND);
doc.rect(0, 108, doc.page.width, 4).fill(BRAND_DARK);
doc.fillColor("#FFFFFF").font(FB).fontSize(24).text("Guide de démo Cashup", M, 28, { width: W });
doc
  .fillColor("#D6D9FF")
  .font(F)
  .fontSize(12)
  .text("Version pas à pas, sans jargon — pour suivre ou refaire la démo seul(e), en 5 minutes", M, 64, {
    width: W,
  });
doc
  .fillColor("#FFFFFF")
  .font(FB)
  .fontSize(10)
  .text("UN CLIENT SCANNE UN QR CODE, PAIE, ET REÇOIT SON CASHBACK IMMÉDIATEMENT", M, 86, {
    width: W,
    characterSpacing: 0.3,
  });
y = 130;

// ---------------------------------------------------------------------------
// L'histoire + préparation
// ---------------------------------------------------------------------------

section("D'abord, l'histoire en 3 phrases");
bullet("1. Un client voit le QR code affiché à la caisse : il le scanne avec la caméra de son écran.", {
  size: 12,
  color: INK,
});
bullet("2. Il entre le montant et son code secret : sa demande part instantanément chez le commerçant.", {
  size: 12,
  color: INK,
});
bullet("3. Le commerçant clique sur « Confirmer » : le client reçoit son cashback tout de suite.", {
  size: 12,
  color: INK,
});

y += 6;
section("Avant de commencer (une seule fois)");
bullet(
  "Ouvrez deux fenêtres côte à côte sur l'ordinateur de la démo : à GAUCHE le client, à DROITE le commerçant. C'est plus clair pour tout le monde.",
);
bullet(
  "Les comptes existent déjà et sont connectés : membre@cashup.bj (côté client) et marchand@cashup.bj (côté commerçant). Mot de passe : demo1234.",
);
bullet(
  "Le code secret du client (le « PIN ») : n'importe quel nombre à 6 chiffres. Nous utiliserons 123456.",
);
infoBox("Les deux adresses à ouvrir", [
  "Côté client (Chrome) :  http://localhost:3100/payer",
  "Côté commerçant (Chrome ou fenêtre privée) :  http://localhost:3100/marchand",
  "Astuce : si une page reste blanche ou affiche « Chargement… », appuyez sur la touche F5. Cela suffit presque toujours.",
]);

// ---------------------------------------------------------------------------
// LES 5 ÉTAPES
// ---------------------------------------------------------------------------

y += 4;
section("Les 5 étapes de la démo");

step(1, "CLIENT", "Ouvrir le scanner", [
  "Dans Chrome, ouvrez la page « Payer » (adresse ci-dessus).",
  "Cliquez sur le grand encadré bleu « Scanner le QR code du commerçant ».",
  "Si le navigateur demande l'autorisation d'utiliser la caméra, cliquez sur « Autoriser ».",
], "une image de caméra avec un cadre carré au centre de l'écran.");

step(2, "CLIENT", "Scanner le QR code du magasin", [
  "Sur l'écran du commerçant : section « Mes QR codes », cliquez sur Kponli Supermarché : un grand QR code s'affiche à l'écran.",
  "Placez ce QR code devant la caméra du côté client — le code se remplit tout seul.",
  "Pas de caméra qui marche ? Dans le bloc « Sans caméra ? », tapez 7842 puis cliquez « Continuer ».",
], "le client revient tout seul sur « Payer », avec le code 7842 déjà rempli.");

step(3, "CLIENT", "Payer 2 500 FCFA", [
  "Dans « Montant à payer », tapez 2500. Laissez le premier mode (« Espèces »). Cliquez « Continuer ».",
  "Sur l'écran récapitulatif, montrez la ligne cashback : 250 FCFA promis AVANT même de payer.",
  "Tapez le code secret 123456, puis cliquez sur « Payer 2 500 FCFA ».",
], "l'écran « En attente du commerçant ». Laissez la page ouverte : elle se met à jour toute seule.");

step(4, "COMMERCANT", "Confirmer la réception", [
  "Sur l'écran du commerçant, une demande en attente est apparue en haut de la page.",
  "Cliquez sur le bouton « Confirmer la réception ».",
  "Rien à saisir, rien à valider ailleurs : un seul clic.",
], "un bandeau vert : « Paiement confirmé : 2 500 FCFA encaissés, 250 FCFA de cashback crédités ».");

step(5, "CLIENT", "Recevoir son cashback", [
  "Sans rien faire de plus, l'écran du client change tout seul.",
  "Montrez les deux lignes : +250 FCFA et +112 points.",
  "Phrase à dire : « Le cashback est crédité immédiatement, à la confirmation. Pas en fin de mois. »",
], "l'écran « PAIEMENT CONFIRMÉ » avec +250 FCFA et +112 points.");

// ---------------------------------------------------------------------------
// PLAN B + mots + chiffres + questions
// ---------------------------------------------------------------------------

y += 4;
section("Si quelque chose bloque — deux gestes suffisent");
warnBox("Ne paniquez jamais : voici les 4 cas et leur solution", [
  "La caméra ne s'affiche pas : dans « Sans caméra ? », tapez 7842 puis Continuer. Le scénario continue normalement.",
  "Une page est blanche ou bloquée : appuyez sur F5 (ou l'icône rafraîchir en haut du navigateur).",
  "Les deux comptes se retrouvent sur le même écran : ouvrez une fenêtre de navigation privée (Ctrl + Maj + N) et reconnectez le deuxième compte.",
  "Tout est fermé : rouvrez simplement les deux adresses de l'encadré bleu au début du guide.",
]);

y += 4;
section("Les 6 mots à connaître");
bullet("Cashback : une partie de l'argent rendue au client après son achat.", { color: INK });
bullet("Cashup : le site qui organise tout ça au Bénin.", { color: INK });
bullet("QR code : le carré noir et blanc qu'on scanne avec une caméra.", { color: INK });
bullet("PIN : le code secret du client, 6 chiffres (123456 en démonstration).", { color: INK });
bullet("Marchand : le commerçant qui confirme avoir bien reçu l'argent.", { color: INK });
bullet("Points : une récompense en plus — 1 point = 1 FCFA.", { color: INK });

y += 6;
section("Les chiffres de la démonstration");
row("L'achat du client", "2 500 FCFA");
row("Ce que le client reçoit", "250 FCFA (10 %) + 112 points");
row("Quand ?", "Immédiatement, à la confirmation");
row("Commission du magasin (15 %)", "375 FCFA");
row("Répartition de cette commission", "188 Cashup · 75 frais · 112 points");

y += 6;
section("Questions possibles — réponses courtes");
qa(
  "C'est vraiment fonctionnel ?",
  "Oui. Les comptes, les soldes, les notifications et les messages existent réellement dans la démonstration. Seul le paiement Mobile Money (MTN MoMo…) est simulé pour l'instant : c'est la partie la plus coûteuse à connecter.",
);
qa(
  "D'où vient le cashback ?",
  "D'une commission payée par le magasin sur chaque vente, partagée entre Cashup et le partenaire. Le client n'a rien à faire, ni rien à payer.",
);
qa(
  "Et si le client n'a pas de caméra ?",
  "Il tape le code à 4 chiffres affiché sous le QR code (ici 7842). Le reste du parcours est identique.",
);
qa(
  "Combien de temps dure le parcours ?",
  "Moins d'une minute, du scan au cashback crédité.",
);
qa(
  "Et côté commerçant, ça demande quoi ?",
  "Un seul clic sur « Confirmer la réception ». Il voit l'historique, les montants et ses QR codes sur la même page.",
);

y += 4;
infoBox("En une phrase pour conclure", [
  "« Cashup reverse au client une partie de son achat, dès que le commerçant confirme — sans application à installer, sans carte, sur n'importe quel téléphone. »",
]);

// ---------------------------------------------------------------------------
// PIEDS DE PAGE
// ---------------------------------------------------------------------------

const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i += 1) {
  doc.switchToPage(i);
  const savedBottom = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  doc
    .font(F)
    .fontSize(9)
    .fillColor(FAINT)
    .text(
      `Guide de démo Cashup · version pas à pas · page ${i + 1} / ${range.count}`,
      M,
      doc.page.height - 28,
      { width: W, align: "center", lineBreak: false },
    );
  doc.page.margins.bottom = savedBottom;
}

doc.end();
console.log(`PDF généré : ${OUT}`);
