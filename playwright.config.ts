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
 * Local: reuses a dev server already running on the target port
 * (reuseExistingServer), otherwise boots one itself.
 * CI: always boots its own server.
 *
 * Env knobs:
 *   E2E_PORT     - port for the managed dev server (default 3000).
 *   E2E_WEBPACK  - set when node_modules is a symlink (worktrees):
 *                  Next 16's default Turbopack dev rejects symlinked
 *                  node_modules, so fall back to the webpack dev server.
 *   E2E_BASE_URL - target an already-deployed instance (Vercel preview);
 *                  the managed local webServer is skipped entirely.
 */
const E2E_PORT = process.env.E2E_PORT ?? "3000";
const E2E_URL = `http://localhost:${E2E_PORT}`;

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
    baseURL: process.env.E2E_BASE_URL ?? E2E_URL,
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

  /* Managed so the suite is one command, EXCEPT when E2E_BASE_URL points
     the run at a remote target: booting and health-polling a local server
     would then gate remote runs on unrelated localhost state. The url
     targets /builder so the readiness poll pays the cold compile
     BEFORE the first test navigates (webpack worktree cold compile
     runs ~9 min, hence the 12 min ceiling). Locally an already-running
     server on the port is reused. */
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.E2E_WEBPACK
          ? `npx next dev --webpack -p ${E2E_PORT}`
          : `npm run dev -- -p ${E2E_PORT}`,
        url: `${E2E_URL}/builder`,
        reuseExistingServer: !process.env.CI,
        timeout: 720_000,
      },
});
