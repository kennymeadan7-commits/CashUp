import { describe, expect, it } from "vitest";
import { generateVoucherCode } from "@/lib/points";

describe("generateVoucherCode", () => {
  it("produit le format CU-XXXX-XXXX", () => {
    for (let i = 0; i < 100; i += 1) {
      expect(generateVoucherCode()).toMatch(/^CU-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    }
  });

  it("exclut les caractères ambigus (I, L, O, 0, 1) pour la lecture en boutique", () => {
    const ambiguous = /[ILO01]/;
    for (let i = 0; i < 100; i += 1) {
      expect(generateVoucherCode()).not.toMatch(ambiguous);
    }
  });

  it("génère des codes distincts (faible risque de collision)", () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateVoucherCode()));
    expect(codes.size).toBe(100);
  });
});
