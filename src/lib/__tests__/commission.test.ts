import { describe, expect, it } from "vitest";
import { splitCommission } from "@/lib/commission";
import { COMMISSION_SPLIT, MAX_COMMISSION_RATE, MIN_COMMISSION_RATE } from "@/lib/constants";

describe("splitCommission — répartition 50 / 20 / 30", () => {
  it("découpe une commission simple sans perte", () => {
    // 10 000 FCFA à 20 % → 2 000 FCFA de commission
    const shares = splitCommission(10_000, 20);
    expect(shares).toEqual({
      rate: 20,
      commission: 2_000,
      cashUp: 1_000,
      fees: 400,
      points: 600,
    });
  });

  it("répartit 30 % aux points (source des bons d'achat)", () => {
    const shares = splitCommission(100_000, 30);
    expect(shares.points).toBe(Math.round(shares.commission * 0.3));
  });

  it("garde toujours cashUp + fees + points = commission (arrondis absorbés par les points)", () => {
    const amounts = [500, 999, 1_000, 12_345, 100_000, 9_999_999];
    const rates = [MIN_COMMISSION_RATE, 17, 23, MAX_COMMISSION_RATE];

    for (const amount of amounts) {
      for (const rate of rates) {
        const shares = splitCommission(amount, rate);
        expect(shares.cashUp + shares.fees + shares.points).toBe(shares.commission);
        expect(shares.commission).toBeGreaterThanOrEqual(0);
        expect(shares.points).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("respecte les bornes de partage du plan", () => {
    expect(COMMISSION_SPLIT.cashUp).toBe(50);
    expect(COMMISSION_SPLIT.fees).toBe(20);
    expect(COMMISSION_SPLIT.points).toBe(30);
    expect(COMMISSION_SPLIT.cashUp + COMMISSION_SPLIT.fees + COMMISSION_SPLIT.points).toBe(100);
  });

  it("arrondit la commission en FCFA entiers", () => {
    const shares = splitCommission(3_333, 17); // 566,61 → 567
    expect(Number.isInteger(shares.commission)).toBe(true);
    expect(shares.commission).toBe(567);
  });

  it("ne produit jamais de valeur négative", () => {
    expect(splitCommission(0, 20)).toEqual({
      rate: 20,
      commission: 0,
      cashUp: 0,
      fees: 0,
      points: 0,
    });
    expect(splitCommission(-5_000, 20).commission).toBe(0);
  });
});
