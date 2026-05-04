import { defineConfig, devices } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

/* Load .env.local so STAGING_PASSWORD is available to the auth setup
   without forcing the user to export it manually. Mirrors how Next.js
   dev does it. Skipped silently if the file isn't there (CI / public-
   mode setups). */
const envFile = resolve(__dirname, ".env.local");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

/**
 * Playwright config for the builder canvas-gesture regression suite.
 *
 * Scope: exercise add / drag / resize / group / remove / undo on the
 * canvas so a regression in dnd-kit, the resize HUD, or the keyboard-
 * shortcut layer is caught before it reaches usability participants.
 *
 * Local: assumes `npm run dev` already running on :3000.
 * CI: uses `webServer` to boot dev itself; raises timeout for cold compile.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // canvas state is shared per-page; serialise within file
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 1, // canvas state collisions if parallel
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  /* Per-test timeout. Next 16 + Turbopack on iCloud-synced FS does
     a 4–5 minute cold compile of /builder on first hit; downstream
     tests reuse the warm bundle, so this only really hurts the first
     navigation in a run. 5 min covers worst case + a little headroom. */
  timeout: 5 * 60 * 1000,

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 5 * 60 * 1000,
  },

  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium-desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        storageState: "playwright/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],

  // Boot dev server on CI; locally we expect the user to keep one running.
  webServer: process.env.CI
    ? {
        command: "npm run dev",
        url: "http://localhost:3000/builder",
        reuseExistingServer: false,
        timeout: 5 * 60 * 1000, // Next 16 + Turbopack cold compile
      }
    : undefined,
});
