import { describe, expect, it } from "vitest";
import {
  formatFCFA,
  formatDate,
  formatNumber,
  formatPhone,
  formatRate,
  formatShortDate,
  initials,
  timeAgo,
} from "@/lib/format";

describe("formatFCFA / formatNumber", () => {
  it("groupe les milliers au format français", () => {
    expect(formatNumber(1_500)).toBe(new Intl.NumberFormat("fr-FR").format(1_500));
    expect(formatFCFA(8_046)).toBe(`${formatNumber(8_046)} FCFA`);
    expect(formatFCFA(8_046)).toContain("FCFA");
  });

  it("affiche zéro proprement", () => {
    expect(formatFCFA(0)).toContain("0");
  });
});

describe("formatRate", () => {
  it("affiche les taux entiers sans décimale", () => {
    expect(formatRate(5)).toBe("5 %");
    expect(formatRate(30)).toBe("30 %");
  });

  it("utilise la virgule décimale française", () => {
    expect(formatRate(2.5)).toBe("2,5 %");
  });
});

describe("formatPhone (numéros béninois)", () => {
  it("formate un numéro local à 8 chiffres", () => {
    expect(formatPhone("97123456")).toBe("+229 97 12 34 56");
  });

  it("formate un numéro international normalisé", () => {
    expect(formatPhone("22997123456")).toBe("+229 97 12 34 56");
  });

  it("retourne la valeur d'origine si le format est inconnu", () => {
    expect(formatPhone("abc")).toBe("abc");
  });
});

describe("dates", () => {
  it("affiche un tiret quand la date est absente", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatShortDate(null)).toBe("—");
  });

  it("affiche la date en toutes lettres", () => {
    const formatted = formatDate(new Date("2026-11-05T12:00:00Z"));
    expect(formatted).toContain("2026");
    expect(formatted.toLowerCase()).toContain("novembre");
  });

  it("produit un temps relatable", () => {
    expect(timeAgo(new Date(Date.now() - 60_000))).toMatch(/min/);
    expect(timeAgo(new Date(Date.now() - 3 * 60 * 60 * 1000))).toMatch(/\d+ h/);
    expect(timeAgo(new Date())).toBe("à l'instant");
  });
});

describe("initials", () => {
  it("prend les initiales des deux premiers mots", () => {
    expect(initials("Rachidatou Allassane")).toBe("RA");
    expect(initials("  konan   willy  ")).toBe("KW");
  });

  it("gère un prénom unique", () => {
    expect(initials("Aïcha")).toBe("A");
  });
});
