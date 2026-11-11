// Test de fumée : vérifie que l'application de production répond correctement.
// Il se met de côté automatiquement si le serveur n'est pas lancé
// (localement : `npm run start` ; en CI : démarré par la workflow).
//
//   SMOKE_BASE_URL=http://localhost:3100 npx vitest run tests/smoke.test.ts

import { describe, expect, it } from "vitest";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://localhost:3100";

async function get(path: string): Promise<Response | null> {
  try {
    return await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
  } catch {
    return null;
  }
}

async function needsServer(ctx: { skip: () => void }): Promise<boolean> {
  const reachable = await get("/");
  if (!reachable) {
    ctx.skip();
    return true;
  }
  return false;
}

describe("fumée — serveur de production", () => {
  it("l'accueil répond 200 et affiche Cashup", async (ctx) => {
    if (await needsServer(ctx)) return;
    const res = await get("/");
    expect(res?.status).toBe(200);
    const html = await res!.text();
    expect(html).toContain("Cashup");
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
  });

  it("sert les en-têtes de sécurité", async (ctx) => {
    if (await needsServer(ctx)) return;
    const res = await get("/");
    expect(res?.headers.get("content-security-policy")).toContain("default-src 'self'");
    expect(res?.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res?.headers.get("x-frame-options")).toBe("DENY");
  });

  it("expose le catalogue public", async (ctx) => {
    if (await needsServer(ctx)) return;
    const res = await get("/boutiques");
    expect(res?.status).toBe(200);
    expect(await res!.text()).toContain("Boutiques partenaires");
  });

  it("expose la page d'explication du service", async (ctx) => {
    if (await needsServer(ctx)) return;
    const res = await get("/comment-ca-marche");
    expect(res?.status).toBe(200);
  });

  it("expose le manifest PWA", async (ctx) => {
    if (await needsServer(ctx)) return;
    const res = await get("/manifest.webmanifest");
    expect(res?.status).toBe(200);
    expect(res?.headers.get("content-type")).toContain("manifest");
    const manifest = (await res!.json()) as { name: string; icons: unknown[] };
    expect(manifest.name).toContain("Cashup");
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  it("protège l'espace membre (redirection vers la connexion)", async (ctx) => {
    if (await needsServer(ctx)) return;
    const res = await get("/tableau-de-bord");

    if ([302, 303, 307].includes(res!.status)) {
      // Redirection HTTP classique (cache miss / navigateur sans JS)
      expect(res?.headers.get("location") ?? "").toContain("/connexion");
      return;
    }

    // Next.js stream le premier rendu : la redirection est alors portée par
    // <meta http-equiv="refresh"> (voir meta#__next-page-redirect).
    expect(res?.status).toBe(200);
    const html = await res!.text();
    expect(html).toMatch(/<meta[^>]+__next-page-redirect[^>]+url=\/connexion/);
  });

  it("renvoie 404 sur une route inexistante", async (ctx) => {
    if (await needsServer(ctx)) return;
    const res = await get("/route-qui-nexiste-pas-9f3");
    expect(res?.status).toBe(404);
  });
});
