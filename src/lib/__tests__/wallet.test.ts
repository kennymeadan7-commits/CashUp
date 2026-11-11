import { describe, expect, it } from "vitest";
import type { Offer, Store } from "@prisma/client";
import { bestCashbackFor, cashbackOf } from "@/lib/wallet";

const store = (overrides: Partial<Pick<Store, "cashbackType" | "cashbackRate" | "cashbackFixed">> = {}) => ({
  cashbackType: "PERCENT",
  cashbackRate: 5,
  cashbackFixed: null,
  ...overrides,
});

const offer = (overrides: Partial<Offer> = {}): Offer => ({
  id: "offre-1",
  storeId: "boutique-1",
  title: "Promo",
  description: null,
  cashbackType: "PERCENT",
  cashbackRate: 10,
  cashbackFixed: null,
  startsAt: new Date("2026-01-01T00:00:00Z"),
  endsAt: null,
  active: true,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  ...overrides,
});

describe("cashbackOf", () => {
  it("calcule un pourcentage du montant", () => {
    expect(cashbackOf({ cashbackType: "PERCENT", cashbackRate: 8, cashbackFixed: null }, 10_000)).toBe(800);
  });

  it("arrondit au FCFA le plus proche", () => {
    expect(cashbackOf({ cashbackType: "PERCENT", cashbackRate: 7.5, cashbackFixed: null }, 1_000)).toBe(75);
    expect(cashbackOf({ cashbackType: "PERCENT", cashbackRate: 3.33, cashbackFixed: null }, 1_000)).toBe(33);
  });

  it("retourne le montant fixe quel que soit le panier", () => {
    const rule = { cashbackType: "FIXED", cashbackRate: null, cashbackFixed: 500 };
    expect(cashbackOf(rule, 1_000)).toBe(500);
    expect(cashbackOf(rule, 9_999_999)).toBe(500);
  });

  it("ne descend jamais sous zéro (taux manquant ou négatif)", () => {
    expect(cashbackOf({ cashbackType: "PERCENT", cashbackRate: null, cashbackFixed: null }, 5_000)).toBe(0);
    expect(cashbackOf({ cashbackType: "PERCENT", cashbackRate: -10, cashbackFixed: null }, 5_000)).toBe(0);
    expect(cashbackOf({ cashbackType: "FIXED", cashbackRate: null, cashbackFixed: -200 }, 5_000)).toBe(0);
  });
});

describe("bestCashbackFor", () => {
  const purchasedAt = new Date("2026-06-15T12:00:00Z");

  it("retient le taux par défaut de la boutique sans offre", () => {
    const result = bestCashbackFor(store(), [], 10_000, purchasedAt);
    expect(result).toEqual({ cashback: 500, offerId: null });
  });

  it("choisit l'offre la plus favorable", () => {
    const result = bestCashbackFor(
      store(),
      [offer({ id: "offre-a", cashbackRate: 8 }), offer({ id: "offre-b", cashbackRate: 15 })],
      10_000,
      purchasedAt,
    );
    expect(result).toEqual({ cashback: 1_500, offerId: "offre-b" });
  });

  it("ignore une offre moins intéressante que le taux de la boutique", () => {
    const result = bestCashbackFor(
      store({ cashbackRate: 12 }),
      [offer({ id: "offre-faible", cashbackRate: 5 })],
      10_000,
      purchasedAt,
    );
    expect(result).toEqual({ cashback: 1_200, offerId: null });
  });

  it("ignore les offres hors période, inactives ou déjà expirées", () => {
    const offers = [
      offer({ id: "pas-encore", startsAt: new Date("2026-07-01T00:00:00Z") }),
      offer({ id: "terminee", endsAt: new Date("2026-05-01T00:00:00Z") }),
      offer({ id: "desactivee", active: false }),
    ];
    const result = bestCashbackFor(store(), offers, 10_000, purchasedAt);
    expect(result).toEqual({ cashback: 500, offerId: null });
  });

  it("utilise une offre fixe si elle rapporte davantage", () => {
    const result = bestCashbackFor(
      store({ cashbackRate: 5 }),
      [offer({ id: "offre-fixe", cashbackType: "FIXED", cashbackRate: null, cashbackFixed: 2_000 })],
      1_000,
      purchasedAt,
    );
    expect(result).toEqual({ cashback: 2_000, offerId: "offre-fixe" });
  });
});
