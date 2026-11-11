import { headers } from "next/headers";
import { siteUrl } from "@/lib/site";

/**
 * Origine (schéma + hôte) de la requête courante, utilisée pour construire
 * les URLs encodées dans les QR codes marchands.
 *
 * Derrière un proxy, x-forwarded-proto / x-forwarded-host font foi ;
 * en local, host suffit (http). Repli sur `siteUrl` hors contexte requête.
 */
export async function getRequestOrigin(): Promise<string> {
  try {
    const requestHeaders = await headers();
    const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
    if (!host) return siteUrl;

    const forwardedProto = requestHeaders.get("x-forwarded-proto");
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:|$)/i.test(host);
    const proto = forwardedProto ?? (isLocal ? "http" : "https");

    return `${proto}://${host}`;
  } catch {
    return siteUrl;
  }
}
