import { describe, expect, it } from "vitest";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { isValidStoreCode, parseQrPayload, storeQrPayload } from "@/lib/qr";

const ORIGIN = "http://localhost:3100";

/** Rasterise la matrice d'un QR en image RGBA (avec zone de silence). */
function rasterize(payload: string): { pixels: Uint8ClampedArray; dimension: number } {
  const qr = QRCode.create(payload, { errorCorrectionLevel: "M" });
  const { size, data } = qr.modules;
  const scale = 8;
  const quietZone = 4;
  const dimension = (size + quietZone * 2) * scale;

  const pixels = new Uint8ClampedArray(dimension * dimension * 4).fill(255);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!data[row * size + col]) continue;
      for (let dy = 0; dy < scale; dy += 1) {
        for (let dx = 0; dx < scale; dx += 1) {
          const x = (col + quietZone) * scale + dx;
          const y = (row + quietZone) * scale + dy;
          const offset = (y * dimension + x) * 4;
          pixels[offset] = 0;
          pixels[offset + 1] = 0;
          pixels[offset + 2] = 0;
          pixels[offset + 3] = 255;
        }
      }
    }
  }
  return { pixels, dimension };
}

describe("QR CashUp — round-trip complet", () => {
  it("génère un QR que jsQR décode à l’identique", () => {
    const payload = storeQrPayload("7842", ORIGIN);
    expect(payload).toBe("http://localhost:3100/payer?code=7842");

    const { pixels, dimension } = rasterize(payload);
    const decoded = jsQR(pixels, dimension, dimension);

    expect(decoded).not.toBeNull();
    expect(decoded?.data).toBe(payload);
  });

  it("le décodage mène au bon code marchand", () => {
    const payload = storeQrPayload("5041", ORIGIN);
    const { pixels, dimension } = rasterize(payload);
    const decoded = jsQR(pixels, dimension, dimension);

    const parsed = parseQrPayload(decoded?.data ?? "", ORIGIN);
    expect(parsed).toEqual({ code: "5041" });
  });
});

describe("storeQrPayload", () => {
  it("construit une URL /payer?code= sur l’origine donnée", () => {
    expect(storeQrPayload("4107", "http://localhost:3100")).toBe(
      "http://localhost:3100/payer?code=4107",
    );
    // Le slash final de l’origine n’est pas dupliqué.
    expect(storeQrPayload("4107", "https://cashup.bj/")).toBe(
      "https://cashup.bj/payer?code=4107",
    );
  });

  it("refuse un code qui n’est pas à 4 chiffres", () => {
    expect(() => storeQrPayload("78", ORIGIN)).toThrow();
    expect(() => storeQrPayload("78421", ORIGIN)).toThrow();
    expect(() => storeQrPayload("78a2", ORIGIN)).toThrow();
  });
});

describe("parseQrPayload", () => {
  it("accepte une URL same-origin du parcours Payer", () => {
    expect(parseQrPayload("http://localhost:3100/payer?code=7842", ORIGIN)).toEqual({
      code: "7842",
    });
  });

  it("accepte une URL relative", () => {
    expect(parseQrPayload("/payer?code=1234", ORIGIN)).toEqual({ code: "1234" });
  });

  it("accepte un code nu et le format compact", () => {
    expect(parseQrPayload("7842", ORIGIN)).toEqual({ code: "7842" });
    expect(parseQrPayload("CASHUP:7842", ORIGIN)).toEqual({ code: "7842" });
    expect(parseQrPayload("cashup:7842", ORIGIN)).toEqual({ code: "7842" });
  });

  it("refuse une URL cross-origin (anti open redirect)", () => {
    expect(parseQrPayload("https://evil.example/payer?code=7842", ORIGIN)).toBeNull();
    expect(parseQrPayload("//evil.example/payer?code=7842", ORIGIN)).toBeNull();
    expect(parseQrPayload("http://localhost:9999/payer?code=7842", ORIGIN)).toBeNull();
  });

  it("refuse les contenus non CashUp", () => {
    expect(parseQrPayload("", ORIGIN)).toBeNull();
    expect(parseQrPayload("   ", ORIGIN)).toBeNull();
    expect(parseQrPayload("https://cashup.bj/boutiques", ORIGIN)).toBeNull();
    expect(parseQrPayload("http://localhost:3100/payer", ORIGIN)).toBeNull();
    expect(parseQrPayload("http://localhost:3100/payer?code=99999", ORIGIN)).toBeNull();
    expect(parseQrPayload("HELLO", ORIGIN)).toBeNull();
    expect(parseQrPayload("CASHUP:abcd", ORIGIN)).toBeNull();
  });

  it("valide le format du code marchand", () => {
    expect(isValidStoreCode("7842")).toBe(true);
    expect(isValidStoreCode("784")).toBe(false);
    expect(isValidStoreCode("78421")).toBe(false);
    expect(isValidStoreCode("78a2")).toBe(false);
  });
});
