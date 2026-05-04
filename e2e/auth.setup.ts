import { test as setup, expect } from "@playwright/test";

/**
 * Global auth setup for the E2E suite.
 *
 * If STAGING_PASSWORD is set in the env (matching the dev server's
 * STAGING_PASSWORD), this setup signs in via /api/staging-login and
 * saves the resulting cookie to playwright/.auth/user.json. All tests
 * then reuse that storage state via `playwright.config.ts`.
 *
 * If STAGING_PASSWORD is not set, the suite assumes public-mode dev
 * (middleware.ts:32 — "No password configured → public mode") and
 * the storage-state file is created empty.
 */

const AUTH_FILE = "playwright/.auth/user.json";

setup("authenticate (or skip if public mode)", async ({ request, page }) => {
  const password = process.env.STAGING_PASSWORD ?? process.env.E2E_STAGING_PASSWORD;

  if (!password) {
    // Public mode — write an empty storage state and bail.
    await page.context().storageState({ path: AUTH_FILE });
    return;
  }

  const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

  const res = await request.post(`${baseURL}/api/staging-login`, {
    data: { password },
    headers: { "content-type": "application/json" },
  });

  expect(
    res.ok(),
    `Login failed (status ${res.status()}). Set STAGING_PASSWORD env to match the dev server.`,
  ).toBe(true);

  // The login route sets `ausos_auth_token` as an httpOnly cookie on the
  // response. Persist the cookies into a Playwright storage state.
  const cookies = (await res.headersArray())
    .filter((h) => h.name.toLowerCase() === "set-cookie")
    .flatMap((h) => h.value.split(/,(?=\s*\w+=)/g))
    .map((c) => c.trim())
    .filter(Boolean);

  // Apply set-cookies to the page context, then persist storage state.
  for (const cookieStr of cookies) {
    const [pair, ...flags] = cookieStr.split(";").map((s) => s.trim());
    const [name, ...rest] = pair.split("=");
    const value = rest.join("=");
    await page.context().addCookies([
      {
        name,
        value,
        domain: new URL(baseURL).hostname,
        path: "/",
        httpOnly: flags.some((f) => f.toLowerCase() === "httponly"),
        secure: flags.some((f) => f.toLowerCase() === "secure"),
        sameSite: "Lax",
      },
    ]);
  }

  await page.context().storageState({ path: AUTH_FILE });
});
