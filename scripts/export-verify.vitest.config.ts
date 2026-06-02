/**
 * Dedicated vitest config for the export-verification harness.
 *
 * The harness runs scripts/generate-export.mjs as a one-off vitest spec to drive
 * the REAL exporter with the project's exact module resolution (TS + the `@/`
 * path alias). The app's vitest.config.ts restricts `include` to src/**, so the
 * generator would never be picked up there. This config narrows `include` to the
 * generator only and reuses the same `@/` alias, leaving the app's test config
 * (and the `npm run test` CI step) completely untouched.
 */
import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["scripts/generate-export.mjs"],
    coverage: { enabled: false },
  },
  resolve: {
    alias: {
      "@": path.resolve(dir, "..", "src"),
    },
  },
});
