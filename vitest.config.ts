import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Même alias que tsconfig.json (`@/*` → ./src/*)
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    // Les tests d'intégration (tests/) parlent au serveur local : ils se
    // mettent de côté eux-mêmes quand celui-ci n'est pas lancé.
    testTimeout: 15_000,
  },
});
