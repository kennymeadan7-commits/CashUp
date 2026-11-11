import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  CATEGORY_SLUGS,
  COMMISSION_SPLIT,
  CITIES,
  DEFAULT_COMMISSION_RATE,
  MAX_COMMISSION_RATE,
  MAX_PURCHASE_AMOUNT,
  MIN_COMMISSION_RATE,
  MIN_POINTS_CONVERSION,
  MIN_PURCHASE_AMOUNT,
  MIN_WITHDRAWAL,
  POINTS_VALUE_FCFA,
  PURCHASE_STATUS_LABEL,
  STATUS_META,
  WITHDRAWAL_METHODS,
  WITHDRAWAL_STATUS_LABEL,
  categoryLabel,
  statusMeta,
  withdrawalMethodLabel,
} from "@/lib/constants";

describe("limites métier", () => {
  it("impose un retrait minimum realiste", () => {
    expect(MIN_WITHDRAWAL).toBe(5_000);
  });

  it("borne les montants déclarables", () => {
    expect(MIN_PURCHASE_AMOUNT).toBe(500);
    expect(MAX_PURCHASE_AMOUNT).toBe(10_000_000);
    expect(MIN_PURCHASE_AMOUNT).toBeLessThan(MAX_PURCHASE_AMOUNT);
  });

  it("garde 1 point = 1 FCFA et une conversion à 1 000 points", () => {
    expect(POINTS_VALUE_FCFA).toBe(1);
    expect(MIN_POINTS_CONVERSION).toBe(1_000);
    expect(MIN_POINTS_CONVERSION * POINTS_VALUE_FCFA).toBe(1_000);
  });
});

describe("commission partenaire", () => {
  it("reste dans la fourchette 10–30 %", () => {
    expect(MIN_COMMISSION_RATE).toBe(10);
    expect(MAX_COMMISSION_RATE).toBe(30);
    expect(DEFAULT_COMMISSION_RATE).toBeGreaterThanOrEqual(MIN_COMMISSION_RATE);
    expect(DEFAULT_COMMISSION_RATE).toBeLessThanOrEqual(MAX_COMMISSION_RATE);
  });

  it("répartit 50 / 20 / 30", () => {
    expect(COMMISSION_SPLIT).toEqual({ cashUp: 50, fees: 20, points: 30 });
  });
});

describe("statuts", () => {
  it("couvre les statuts d'achat et de retrait", () => {
    for (const status of ["PENDING", "APPROVED", "REJECTED"]) {
      expect(PURCHASE_STATUS_LABEL[status]).toBeTruthy();
      expect(statusMeta(status).label).toBeTruthy();
    }
    for (const status of ["PENDING", "PAID", "REJECTED"]) {
      expect(WITHDRAWAL_STATUS_LABEL[status]).toBeTruthy();
    }
  });

  it("couvre les statuts de la boîte d'envoi", () => {
    for (const status of ["QUEUED", "SENT", "FAILED"]) {
      expect(STATUS_META[status]).toBeTruthy();
      expect(statusMeta(status).label).toBeTruthy();
    }
  });

  it("retombe sur « En attente » pour un statut inconnu", () => {
    expect(statusMeta("N_IMPORTE_QUOI").label).toBe(statusMeta("PENDING").label);
  });
});

describe("opérateurs Mobile Money", () => {
  it("propose les trois canaux du marché béninois", () => {
    expect(WITHDRAWAL_METHODS.map((m) => m.value)).toEqual([
      "MTN_MONEY",
      "MOOV_MONEY",
      "CELTIIS_CASH",
    ]);
    expect(withdrawalMethodLabel("MTN_MONEY")).toBe("MTN MoMo");
    expect(withdrawalMethodLabel("INCONNU")).toBe("INCONNU");
  });
});

describe("catégories et villes", () => {
  it("a des slugs uniques et un libellé pour chacun", () => {
    expect(new Set(CATEGORY_SLUGS).size).toBe(CATEGORIES.length);
    for (const category of CATEGORIES) {
      expect(categoryLabel(category.slug)).toBe(category.label);
    }
    expect(categoryLabel("slug-inconnu")).toBeTruthy();
  });

  it("liste les villes sans doublon", () => {
    expect(new Set(CITIES).size).toBe(CITIES.length);
    expect(CITIES.length).toBeGreaterThanOrEqual(5);
  });
});
