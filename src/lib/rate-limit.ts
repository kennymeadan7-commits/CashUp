import { headers } from "next/headers";

type Bucket = {
  count: number;
  resetAt: number;
};

// Limiteur en mémoire, suffisant pour une instance Node unique.
// Pour plusieurs instances, remplacer par Redis/Upstash.
const globalStore = globalThis as unknown as {
  __cashupRateLimit?: Map<string, Bucket>;
};

const store = globalStore.__cashupRateLimit ?? new Map<string, Bucket>();
globalStore.__cashupRateLimit = store;

const MAX_ENTRIES = 5000;

function prune(now: number): void {
  if (store.size < MAX_ENTRIES) return;

  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }

  if (store.size >= MAX_ENTRIES) {
    let toDelete = Math.ceil(store.size / 10);
    for (const key of store.keys()) {
      store.delete(key);
      toDelete -= 1;
      if (toDelete <= 0) break;
    }
  }
}

/**
 * Retourne le nombre de secondes à attendre si la limite est atteinte,
 * ou null si l'action est autorisée.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): number | null {
  const now = Date.now();
  prune(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) return null;
  if (bucket.count < limit) return null;

  return Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
}

/** Enregistre une tentative (échec de connexion, création de compte…). */
export function hitRateLimit(key: string, windowMs: number): void {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
}

/** Réinitialise une clé (par exemple après une connexion réussie). */
export function clearRateLimit(key: string): void {
  store.delete(key);
}

/**
 * Récupère l'IP du client derrière un proxy.
 * En production, s'assurer que le proxy transmet bien x-forwarded-for.
 */
export async function getClientIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");

  return (
    forwarded?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "local"
  );
}
