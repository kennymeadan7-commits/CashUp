import { afterEach, describe, expect, it } from "vitest";
import { checkRateLimit, clearRateLimit, hitRateLimit } from "@/lib/rate-limit";

const keys: string[] = [];

function useKey(label: string): string {
  const key = `test:${label}:${Math.random().toString(36).slice(2)}`;
  keys.push(key);
  return key;
}

afterEach(() => {
  for (const key of keys.splice(0)) clearRateLimit(key);
});

describe("rate limiting en mémoire", () => {
  it("laisse passer les premières tentatives", () => {
    const key = useKey("debut");
    expect(checkRateLimit(key, 3, 60_000)).toBeNull();

    hitRateLimit(key, 60_000);
    hitRateLimit(key, 60_000);
    expect(checkRateLimit(key, 3, 60_000)).toBeNull(); // 2 < 3
  });

  it("bloque à partir de la limite et indique d'attente", () => {
    const key = useKey("limite");
    for (let i = 0; i < 3; i += 1) hitRateLimit(key, 60_000);

    const retryAfter = checkRateLimit(key, 3, 60_000);
    expect(retryAfter).not.toBeNull();
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it("expire à la fenêtre écoulée", () => {
    const key = useKey("fenetre");
    for (let i = 0; i < 5; i += 1) hitRateLimit(key, 0); // fenêtre déjà expirée
    expect(checkRateLimit(key, 1, 0)).toBeNull();
  });

  it("se réinitialise après clearRateLimit (connexion réussie)", () => {
    const key = useKey("clear");
    for (let i = 0; i < 5; i += 1) hitRateLimit(key, 60_000);
    expect(checkRateLimit(key, 5, 60_000)).not.toBeNull();

    clearRateLimit(key);
    expect(checkRateLimit(key, 5, 60_000)).toBeNull();
  });

  it("isole les clés entre elles (un membre ne bloque pas un autre)", () => {
    const a = useKey("a");
    const b = useKey("b");
    for (let i = 0; i < 5; i += 1) hitRateLimit(a, 60_000);

    expect(checkRateLimit(a, 1, 60_000)).not.toBeNull();
    expect(checkRateLimit(b, 1, 60_000)).toBeNull();
  });
});
