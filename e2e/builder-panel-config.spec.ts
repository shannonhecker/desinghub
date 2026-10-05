import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * The panel Configuration dialog (the original Analytics Dashboard's): opened
 * from a data-bound panel's Configure tool, drawn in the active design
 * system's own components, every change applied to the panel behind it.
 *
 * Performance Analytics: its panels are data-bound (the Analytics Dashboard
 * template's are static, so they have no Configure tool).
 *
 * Pre-flight: a production build (`E2E_BASE_URL=http://127.0.0.1:3267`).
 */

const SYSTEMS = ["Salt DS", "Material 3", "Fluent 2", "uoaui", "Carbon"] as const;

async function performance(page: Page) {
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    const browse = page.getByRole("button", { name: /Browse templates/ });
    if (await browse.isVisible()) await browse.click();
    await expect(page.getByRole("list", { name: "Starting templates" })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole("button", { name: "Use the Performance Analytics template" }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
}

async function useSystem(page: Page, system: string) {
  await page.getByRole("button", { name: /^Design system:/ }).click();
  await page.getByText(system, { exact: true }).last().click();
  await expect(page.getByRole("button", { name: new RegExp(`^Design system: ${system}`) })).toBeVisible();
}

async function openConfig(page: Page) {
  const stage = page.locator(".present-stage");
  const opener = stage.getByRole("button", { name: "Configure Performance results", exact: true }).first();
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Configuration" });
  await expect(dialog).toBeVisible();
  return { stage, dialog, opener: stage.getByRole("button", { name: "Configure Performance results", exact: true }).first() };
}

/** Carbon's modal fades in: a click in its first frames can land before it takes pointer events. */
async function selectTab(dialog: Locator, name: string) {
  const tab = dialog.getByRole("tab", { name, exact: true });
  await expect(async () => {
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true", { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
}

const firstRows = (page: Page) => page.locator(".dh-panel-expanded .ag-center-cols-container .ag-row");

test.describe("panel Configuration dialog", () => {
  test("regroup, chart and back, filter, reset; Escape returns focus to Configure", async ({ page }) => {
    await performance(page);
    await useSystem(page, "Salt DS");
    const { dialog, opener } = await openConfig(page);

    /* The original's layout. */
    await expect(dialog.getByRole("combobox", { name: "Component Type" })).toBeVisible();
    await expect(dialog.getByRole("switch", { name: "Aggregated" })).toBeChecked();
    await expect(dialog.getByRole("tablist")).toBeVisible();
    await expect(dialog.getByRole("tab")).toHaveText(["Columns", "Groups", "Display"]);
    await expect(dialog.getByText("Changes applied automatically")).toBeVisible();
    const reset = dialog.getByRole("button", { name: "Reset to first loaded" });
    await expect(reset).toBeDisabled();

    /* Info: the tooltip. */
    await dialog.getByRole("button", { name: "About Aggregated" }).hover();
    await expect(page.getByText("Aggregated shows one row per group. Turn it off to see every row.")).toBeVisible();

    /* Groups: remove the row group (empty state), add Asset class: the grid regroups. */
    await selectTab(dialog, "Groups");
    await dialog.getByRole("button", { name: /^Remove .* from row group$/ }).click();
    await expect(dialog.getByText("No row groups")).toBeVisible();
    await expect(dialog.getByText("Add attributes from Available")).toBeVisible();
    await dialog.getByRole("treeitem", { name: /Asset class/ }).click();
    await expect(firstRows(page).nth(1)).toContainText("Equity");
    await expect(dialog.getByRole("button", { name: "Remove Asset class from row group" })).toBeVisible();
    await expect(reset).toBeEnabled();

    /* Filter: counts follow the name; nothing matches. */
    const available = dialog.getByRole("heading", { name: /^Available: \d+$/ });
    const all = await available.textContent();
    await dialog.getByRole("textbox", { name: "Filter Columns" }).fill("sector");
    await expect(available).toHaveText("Available: 1");
    await expect(dialog.getByRole("treeitem", { name: /Sector/ })).toBeVisible();
    await dialog.getByRole("textbox", { name: "Filter Columns" }).fill("zzz");
    await expect(available).toHaveText("Available: 0");
    await expect(dialog.getByText("No matches")).toBeVisible();
    await dialog.getByRole("textbox", { name: "Filter Columns" }).fill("");
    await expect(available).toHaveText(all!);

    /* Component Type: a chart, then the grid again. */
    await dialog.getByRole("combobox", { name: "Component Type" }).click();
    await page.getByRole("option", { name: "Bar", exact: true }).click();
    await expect(page.locator(".dh-panel-expanded .highcharts-bar-series").first()).toBeVisible();
    await dialog.getByRole("combobox", { name: "Component Type" }).click();
    await page.getByRole("option", { name: "Grid", exact: true }).click();
    await expect(page.locator(".dh-panel-expanded .highcharts-bar-series")).toHaveCount(0);
    await expect(firstRows(page).nth(1)).toContainText("Equity");

    /* Reset to first loaded: the template's panel, grouped by account again. */
    await reset.click();
    await expect(reset).toBeDisabled();
    await expect(firstRows(page).nth(1)).toContainText("Global Multi-Asset Growth");

    /* Escape closes the dialog only: the panel stays expanded, focus is back on Configure. */
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(page.locator(".dh-panel-expanded")).toBeVisible();
    await expect(opener).toBeFocused();
  });

  test("keyboard: tabs move with the arrow keys; the tree opens, closes and adds with Enter", async ({ page }) => {
    await performance(page);
    await useSystem(page, "uoaui");
    const { dialog } = await openConfig(page);
    await dialog.getByRole("tab", { name: "Columns" }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(dialog.getByRole("tab", { name: "Groups" })).toHaveAttribute("aria-selected", "true");
    await expect(dialog.getByRole("tab", { name: "Groups" })).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await expect(dialog.getByRole("tab", { name: "Columns" })).toHaveAttribute("aria-selected", "true");

    /* Columns: the first tree item is the Dimensions branch. */
    const dims = dialog.getByRole("treeitem", { name: /^Dimensions/ });
    await dims.focus();
    await expect(dims).toHaveAttribute("aria-expanded", "true");
    await page.keyboard.press("ArrowLeft");
    await expect(dims).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("ArrowRight");
    await expect(dims).toHaveAttribute("aria-expanded", "true");
    /* Down to a metric that is not chosen, and Enter adds it. */
    const count = dialog.getByRole("heading", { name: /^Columns: \d+$/ });
    const before = Number((await count.textContent())!.replace(/\D/g, ""));
    await dialog.getByRole("textbox", { name: "Filter Columns" }).fill("IVaR");
    const leaf = dialog.locator('.dh-cfg-leaf.is-addable').first();
    await leaf.focus();
    await page.keyboard.press("Enter");
    await expect(count).toHaveText(`Columns: ${before + 1}`);
    /* The new column moves up and is removed again. */
    const removes = dialog.getByRole("button", { name: /^Remove / });
    await expect(removes).toHaveCount(before + 1);
    await removes.last().click();
    await expect(count).toHaveText(`Columns: ${before}`);
  });

  for (const system of SYSTEMS) {
    test(`${system}: opens in the system's own dialog, a change applies, Close returns focus`, async ({ page }) => {
      await performance(page);
      await useSystem(page, system);
      const { dialog, opener } = await openConfig(page);
      await expect(dialog.getByRole("tab", { name: "Columns" })).toHaveAttribute("aria-selected", "true");
      /* One change: show values as % of total, applied at once. */
      await selectTab(dialog, "Display");
      const share = dialog.getByRole("combobox", { name: "Show values as" });
      await expect(share).toBeVisible();
      if (system === "uoaui" || system === "Carbon") await share.selectOption("% of total");
      else {
        await share.click();
        await page.getByRole("option", { name: "% of total", exact: true }).click();
      }
      await expect(dialog.getByRole("button", { name: "Reset to first loaded" })).toBeEnabled();
      /* Every row, at every level, is a share: nothing like "440,000,000.00%". */
      await expect(page.locator(".dh-panel-expanded .ag-center-cols-container .ag-row").nth(3)).toContainText("%");
      await expect(page.locator(".dh-panel-expanded .ag-center-cols-container")).not.toContainText(/\d{1,3}(,\d{3})+(\.\d+)?%/);
      /* Nothing in the dialog spills sideways. */
      const overflow = await dialog.locator(".dh-cfg").evaluate((el) => el.scrollWidth - el.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
      await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Configuration" })).toHaveCount(0);
      await expect(opener).toBeFocused();
    });
  }
});
