import { siteUrl } from "@/lib/site";

/**
 * Payload des QR codes CashUp : une URL same-origin du parcours « Payer »
 * portant le code marchand (`/payer?code=7842`).
 *
 * Module volontairement pur (aucun import serveur) : il est partagé entre les
 * pages serveur (génération) et le scanner côté client (décodage).
 */

/** Code marchand attendu : exactement 4 chiffres. */
export function isValidStoreCode(code: string): boolean {
  return /^\d{4}$/.test(code);
}

/** Construit l'URL à encoder dans le QR d'une boutique. */
export function storeQrPayload(code: string, origin: string): string {
  if (!isValidStoreCode(code)) throw new Error(`Code marchand invalide : ${code}`);
  return `${origin.replace(/\/+$/, "")}/payer?code=${code}`;
}

/**
 * Analyse le contenu décodé d'un QR (ou d'un code saisi à la main).
 *
 * Accepte :
 * - une URL same-origin vers `/payer?code=XXXX` (le cas réel) ;
 * - une URL relative `/payer?code=XXXX` ;
 * - un code nu `7842` ;
 * - le format compact `CASHUP:7842`.
 *
 * Toute URL cross-origin est refusée : un QR malveillant ne doit jamais
 * pouvoir rediriger le membre vers un autre site (open redirect).
 *
 * @param origin origine attendue (ex. `http://localhost:3100`).
 *              Par défaut : `siteUrl`.
 */
export function parseQrPayload(text: string, origin: string = siteUrl): { code: string } | null {
  const raw = text.trim();
  if (!raw) return null;

  const compact = raw.match(/^CASHUP:(\d{4})$/i);
  if (compact) return { code: compact[1] };

  if (raw.startsWith("/") || raw.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(raw)) {
    // Contenu de type URL → vérification stricte de l'origine.
    let url: URL;
    let base: URL;
    try {
      base = new URL(origin);
      url = new URL(raw, base);
    } catch {
      return null;
    }
    if (url.origin !== base.origin) return null;
    const code = url.searchParams.get("code");
    return code !== null && isValidStoreCode(code) ? { code } : null;
  }

  return isValidStoreCode(raw) ? { code: raw } : null;
}
