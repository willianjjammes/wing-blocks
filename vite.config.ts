import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Caminhos relativos no build: o jogo funciona na raiz de um servidor OU
  // dentro de uma subpasta (ex.: o portal da Wings Studios em /wing-blocks/).
  base: "./",
  resolve: {
    alias: {
      "@domain": path.resolve(__dirname, "src/domain"),
      "@application": path.resolve(__dirname, "src/application"),
      "@infrastructure": path.resolve(__dirname, "src/infrastructure"),
      "@presentation": path.resolve(__dirname, "src/presentation"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
