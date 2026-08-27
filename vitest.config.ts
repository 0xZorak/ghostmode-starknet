import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "technocore-studio/**", "ghostmode-simple-explainer/**"],
    coverage: {
      include: ["src/lib/ghostmode/**/*.ts"],
      exclude: ["src/lib/ghostmode/**/*.test.ts"],
    },
  },
});
