import { test, expect, type Page } from "@playwright/test";

/* Task 30: a block's Content controls in the panel visibly change the block,
   in every design system. Analytics Dashboard in Edit: the data table's rows
   shown and hidden columns, a stat card's progress bar, a chart's legend; the
   changes hold when the design system changes. */

const SYSTEMS = ["Salt DS", "Material 3", "Fluent 2", "uoaui DS", "Carbon"] as const;
const SHOTS = process.env.PANEL_SHOTS_DIR;

async function openAnalytics(page: Page) {
  await page.route("**/api/health", (route) => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    const browse = page.getByRole("button", { name: /Browse templates/ });
    if (await browse.isVisible()) await browse.click();
    await expect(page.getByRole("list", { name: "Starting templates" })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole("button", { name: "Use the Analytics Dashboard template" }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
  await page.waitForTimeout(600);
}

async function select(page: Page, prefix: string) {
  const block = page.locator(`[data-block-id^="tpl-${prefix}-"]`).first();
  await block.focus();
  await block.press("Enter");
  const show = page.getByRole("button", { name: "Show component library", exact: true });
  if (await show.isVisible()) await show.click();
  return block;
}

async function switchSystem(page: Page, label: (typeof SYSTEMS)[number]) {
  await page.getByRole("button", { name: /^Design system:/ }).click();
  await page.getByText(label, { exact: true }).last().click();
  await page.waitForTimeout(700);
}

test("data table, stat card and chart controls change the canvas in all five systems", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAnalytics(page);

  /* Data table: rows shown + hide a column. */
  const table = await select(page, "ad-table");
  const before = await table.locator("tbody tr").count();
  expect(before).toBeGreaterThan(3);
  await expect(table.getByText("Seats", { exact: true })).toBeVisible();
  await page.getByRole("combobox", { name: "Rows shown", exact: true }).selectOption("3");
  await expect(table.locator("tbody tr")).toHaveCount(3);
  await page.getByRole("textbox", { name: "Hide columns (comma separated)" }).fill("Seats");
  await expect(table.getByText("Seats", { exact: true })).toHaveCount(0);

  /* Stat card: hide the progress bar. */
  const kpi = await select(page, "ad-kpi-1");
  const bar = kpi.locator('[role="progressbar"], .a-progress-track');
  await expect(bar.first()).toBeVisible();
  await page.getByRole("switch", { name: "Hide progress bar" }).click();
  await expect(bar).toHaveCount(0);

  /* Chart: hide the legend. */
  const chart = await select(page, "ad-hero");
  await expect(chart.locator(".highcharts-legend-item").first()).toBeVisible();
  await page.getByRole("switch", { name: "Hide legend" }).click();
  await expect(chart.locator(".highcharts-legend-item")).toHaveCount(0);

  /* The changes hold in every design system. */
  for (const system of SYSTEMS) {
    await switchSystem(page, system);
    const t = page.locator('[data-block-id^="tpl-ad-table-"]').first();
    await expect(t.locator("tbody tr"), system).toHaveCount(3);
    await expect(t.getByText("Seats", { exact: true }), system).toHaveCount(0);
    const k = page.locator('[data-block-id^="tpl-ad-kpi-1-"]').first();
    await expect(k.getByText(/\S/).first(), system).toBeVisible();
    await expect(k.locator('[role="progressbar"], .a-progress-track'), system).toHaveCount(0);
    const c = page.locator('[data-block-id^="tpl-ad-hero-"]').first();
    await expect(c.locator(".highcharts-root").first(), system).toBeVisible();
    await expect(c.locator(".highcharts-legend-item"), system).toHaveCount(0);
  }
});

test("panel screenshots (dark): data table, chart, stat card, dropdown, button", async ({ page }) => {
  test.skip(!SHOTS, "set PANEL_SHOTS_DIR to write the panel screenshots");
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openAnalytics(page);
  for (const [prefix, name] of [["ad-table", "data-table"], ["ad-hero", "chart"], ["ad-kpi-1", "stat-card"], ["ad-range", "dropdown"], ["ad-export", "button"]] as const) {
    await select(page, prefix);
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${SHOTS}/${name}.png` });
  }
});
