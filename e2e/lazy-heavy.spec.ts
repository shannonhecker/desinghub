import { test, expect, type Page } from "@playwright/test";

/**
 * Highcharts and AG Grid load with the first block that needs them, not with
 * the page.
 *
 * Both were meant to be lazy, and one static import each (the FX chart, the
 * expanded panel, the record panel, the library's grid page) had put them
 * back into the first load of the builder and the component library: about
 * 550 KB of compressed script before anything could be typed.
 */

/* Strings only the library's own code contains. */
const HIGHCHARTS = /highcharts-container/;
const AG_GRID = /ag-root-wrapper/;

function watchScripts(page: Page) {
  const pending: Promise<void>[] = [];
  const found = { highcharts: [] as string[], agGrid: [] as string[] };
  page.on("response", (response) => {
    if (response.request().resourceType() !== "script") return;
    const url = new URL(response.url());
    if (!url.pathname.startsWith("/_next/static/chunks/")) return;
    pending.push(response.text().then((text) => {
      if (HIGHCHARTS.test(text)) found.highcharts.push(url.pathname);
      if (AG_GRID.test(text)) found.agGrid.push(url.pathname);
    }).catch(() => {}));
  });
  return { found, done: async () => { await Promise.all(pending); return found; } };
}

test("builder home and template gallery load neither Highcharts nor AG Grid; a template brings them", async ({ page }) => {
  const scripts = watchScripts(page);
  await page.goto("/builder", { waitUntil: "networkidle" });
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible();
  let found = await scripts.done();
  expect(found.highcharts, "Highcharts on the home screen").toEqual([]);
  expect(found.agGrid, "AG Grid on the home screen").toEqual([]);

  await page.getByRole("button", { name: /Browse templates/ }).click();
  await expect(page.getByRole("button", { name: "Use the Performance Analytics template" })).toBeVisible();
  await page.waitForLoadState("networkidle");
  found = await scripts.done();
  expect(found.highcharts, "Highcharts in the gallery").toEqual([]);
  expect(found.agGrid, "AG Grid in the gallery").toEqual([]);

  /* A report with charts and data grids: both arrive, and both draw. */
  await page.getByRole("button", { name: "Use the Performance Analytics template" }).click();
  await expect(page.locator(".present-stage .highcharts-container").first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator(".present-stage .ag-root-wrapper").first()).toBeVisible({ timeout: 30_000 });
  found = await scripts.done();
  expect(found.highcharts.length, "Highcharts arrived with the template").toBeGreaterThan(0);
  expect(found.agGrid.length, "AG Grid arrived with the template").toBeGreaterThan(0);
});

test("the FX execution chart loads on demand and holds its place while it does", async ({ page }) => {
  const scripts = watchScripts(page);
  await page.goto("/builder", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Browse templates/ }).click();
  const fx = page.getByRole("button", { name: /^Use the .*(FX|Execution).* template$/ }).first();
  await expect(fx).toBeVisible();
  expect((await scripts.done()).highcharts).toEqual([]);
  await fx.click();
  const chart = page.locator('.present-stage [data-block-id] .highcharts-container').first();
  await expect(chart).toBeVisible({ timeout: 30_000 });
  expect((await scripts.done()).highcharts.length).toBeGreaterThan(0);
});

test("component library: the overview loads no AG Grid; the AG Grid page brings it", async ({ page }) => {
  const scripts = watchScripts(page);
  await page.goto("/ui-kit", { waitUntil: "networkidle" });
  await expect(page.locator(".uikit-shell")).toBeVisible();
  expect((await scripts.done()).agGrid, "AG Grid on the library overview").toEqual([]);
  await page.goto("/ui-kit?ds=salt&c=ag-grid", { waitUntil: "networkidle" });
  await expect(page.locator(".ag-root-wrapper").first()).toBeVisible({ timeout: 30_000 });
  expect((await scripts.done()).agGrid.length).toBeGreaterThan(0);
});
