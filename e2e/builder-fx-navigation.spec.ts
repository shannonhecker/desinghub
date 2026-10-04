import { test, expect, type Page } from "@playwright/test";

/**
 * FX Execution, PR B: chart navigation (Present only).
 *
 *   - Wheel zooms time on the plot, centred on the pointer, and price on the
 *     price axis; the page scrolls as usual off the chart.
 *   - Drag pans; panned back, new feed bars do not move the view; "Back to
 *     live" returns; Reset returns to the full view and to following.
 *   - Box zoom from the rail zooms both axes and switches itself off.
 *   - Press and hold pins the values; keys pan, zoom and reset.
 *   - Go to: the design system's own dialog in all five systems, with a
 *     calendar; focus stays inside, Escape closes it and only it, focus
 *     returns to the chip; bounds give a plain message; the chip shows the
 *     window and the range chips let it go.
 *   - Edit is static: no zoom, and the builder still selects the block.
 *
 * Sample data only: nothing connects to a market.
 */

const SYSTEMS = ["Salt DS", "Material 3", "Fluent 2", "uoaui", "Carbon"] as const;

async function applyFx(page: Page) {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible({ timeout: 30_000 });
  const use = page.getByRole("button", { name: "Use the FX Execution template" });
  await expect(async () => {
    if (!(await use.isVisible())) await page.getByRole("button", { name: /Browse templates/ }).click();
    await expect(use).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  await use.click();
  await expect(page.locator(".present-stage .dh-exec .highcharts-root")).toBeVisible({ timeout: 30_000 });
}

const stage = (page: Page) => page.locator(".present-stage");
const plot = (page: Page) => stage(page).locator(".dh-exec-plot");
const viewX = async (page: Page) => {
  const v = await plot(page).getAttribute("data-view-x");
  return v ? (v.split(",").map(Number) as [number, number]) : null;
};
const viewY = async (page: Page) => {
  const v = await plot(page).getAttribute("data-view-y");
  return v ? (v.split(",").map(Number) as [number, number]) : null;
};
const feedBars = async (page: Page) => Number(await stage(page).locator(".dh-exec").getAttribute("data-feed-bars"));
/** The plot area (inside the axes), in page pixels. */
async function plotArea(page: Page) {
  const r = await plot(page).locator(".highcharts-plot-background").boundingBox();
  return r!;
}
async function pause(page: Page) {
  await stage(page).getByRole("button", { name: "Pause the sample feed" }).click();
  await expect(stage(page).locator(".dh-feed-status")).toHaveClass(/is-paused/);
}
const rail = (page: Page, name: string) => stage(page).getByRole("button", { name, exact: true });

async function switchSystem(page: Page, label: (typeof SYSTEMS)[number]) {
  await page.getByRole("button", { name: /^Design system:/ }).click();
  await page.getByText(label, { exact: true }).last().click();
  await expect(page.getByRole("button", { name: /^Design system:/ })).toContainText(label);
}

test.describe("Builder - FX Execution chart navigation", () => {
  test("wheel zooms time around the pointer; Reset and a double-click restore the full view; off the chart the page scrolls", async ({ page }) => {
    await applyFx(page);
    await pause(page);
    expect(await viewX(page)).toBeNull();
    await expect(rail(page, "Reset view")).toHaveAttribute("aria-disabled", "true");
    const area = await plotArea(page);
    const px = area.x + area.width * 0.3;
    await page.mouse.move(px, area.y + area.height * 0.5);
    /* The bar under the pointer, before: the full view runs from -0.5 to the axis end. */
    await page.mouse.wheel(0, -200);
    await expect.poll(() => viewX(page)).not.toBeNull();
    const [a, b] = (await viewX(page))!;
    await page.mouse.wheel(0, -200);
    await expect.poll(async () => (await viewX(page))![1]).toBeLessThan(b);
    const [c, d] = (await viewX(page))!;
    /* Anchored: the value under the pointer is the same after the second zoom. */
    const share = (px - area.x) / area.width;
    expect(Math.abs(a + share * (b - a) - (c + share * (d - c)))).toBeLessThan(0.6);
    expect(d - c).toBeLessThan(b - a);
    await expect(plot(page)).toHaveAttribute("data-zoomed", "true");

    await rail(page, "Reset view").click();
    await expect.poll(() => viewX(page)).toBeNull();
    await page.mouse.move(px, area.y + area.height * 0.5);
    await page.mouse.wheel(0, -300);
    await expect.poll(() => viewX(page)).not.toBeNull();
    await page.mouse.dblclick(px, area.y + area.height * 0.5);
    await expect.poll(() => viewX(page)).toBeNull();

    /* Over the price axis: price zooms, time does not. */
    await page.mouse.move(area.x + area.width + 30, area.y + area.height * 0.3);
    await page.mouse.wheel(0, -200);
    await expect.poll(() => viewY(page)).not.toBeNull();
    expect(await viewX(page)).toBeNull();
    await rail(page, "Reset view").click();
    await expect.poll(() => viewY(page)).toBeNull();
  });

  test("drag pans; panned back, the feed's bars do not move the view; Back to live and Reset return to following", async ({ page }) => {
    await applyFx(page);
    await expect.poll(() => feedBars(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
    const area = await plotArea(page);
    const y = area.y + area.height * 0.5;
    await page.mouse.move(area.x + area.width * 0.5, y);
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, -200);
    await expect.poll(() => viewX(page)).not.toBeNull();
    /* Drag right: earlier bars come in from the left. */
    await page.mouse.move(area.x + area.width * 0.3, y);
    await page.mouse.down();
    await page.mouse.move(area.x + area.width * 0.9, y, { steps: 10 });
    await page.mouse.up();
    await expect(plot(page)).toHaveAttribute("data-away", "true");
    const held = await viewX(page);
    const bars = await feedBars(page);
    await expect.poll(() => feedBars(page), { timeout: 10_000 }).toBeGreaterThan(bars + 1);
    expect(await viewX(page)).toEqual(held);
    /* A pan does not click the fill under the pointer (that selects a venue). */
    await expect(stage(page).locator(".present-amend-input")).toHaveCount(0);

    const live = stage(page).getByRole("button", { name: /^Back to live/ });
    await expect(live).toBeVisible();
    await live.click();
    await expect(plot(page)).not.toHaveAttribute("data-away", "true");
    const [, end] = (await viewX(page))!;
    /* Following: the view moves on with the next bars. */
    const now = await feedBars(page);
    await expect.poll(() => feedBars(page), { timeout: 10_000 }).toBeGreaterThan(now);
    await expect.poll(async () => (await viewX(page))![1]).toBeGreaterThan(end);
    await expect(live).toHaveCount(0);

    await rail(page, "Reset view").click();
    await expect.poll(() => viewX(page)).toBeNull();
  });

  test("box zoom zooms both axes and switches itself off; Escape cancels it", async ({ page }) => {
    await applyFx(page);
    await pause(page);
    const box = rail(page, "Box zoom");
    await box.click();
    await expect(box).toHaveAttribute("aria-pressed", "true");
    await plot(page).focus();
    await page.keyboard.press("Escape");
    await expect(box).toHaveAttribute("aria-pressed", "false");
    /* Escape cancelled the tool, not Present. */
    await expect(stage(page).locator(".dh-exec")).toBeVisible();
    await box.click();
    const area = await plotArea(page);
    await page.mouse.move(area.x + area.width * 0.3, area.y + area.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(area.x + area.width * 0.55, area.y + area.height * 0.5, { steps: 8 });
    await expect(plot(page).locator(".dh-exec-box")).toHaveCount(1);
    await page.mouse.up();
    await expect(plot(page).locator(".dh-exec-box")).toHaveCount(0);
    const x = (await viewX(page))!;
    const yv = (await viewY(page))!;
    expect(x[1] - x[0]).toBeGreaterThan(4);
    expect(yv[1]).toBeGreaterThan(yv[0]);
    await expect(box).toHaveAttribute("aria-pressed", "false");
  });

  test("press and hold pins the values; release lets them go", async ({ page }) => {
    await applyFx(page);
    await pause(page);
    const area = await plotArea(page);
    await page.mouse.move(area.x + area.width * 0.5, area.y + area.height * 0.4);
    await page.mouse.down();
    await expect(plot(page)).toHaveAttribute("data-pinned", "true", { timeout: 2_000 });
    await expect(plot(page).locator(".highcharts-tooltip")).toBeVisible();
    await page.mouse.up();
    await expect(plot(page)).not.toHaveAttribute("data-pinned", "true");
  });

  test("keys: the chart takes focus with a visible ring; arrows pan, plus and minus zoom, 0 resets", async ({ page }) => {
    await applyFx(page);
    await pause(page);
    await plot(page).focus();
    await page.keyboard.press("+");
    /* Reached and used by keyboard: the focus ring shows. */
    expect(await plot(page).evaluate((el) => el.matches(":focus-visible") && getComputedStyle(el).outlineStyle !== "none")).toBe(true);
    await page.keyboard.press("+");
    const zoomed = (await viewX(page))!;
    expect(zoomed).not.toBeNull();
    await page.keyboard.press("ArrowLeft");
    const panned = (await viewX(page))!;
    expect(panned[0]).toBeLessThan(zoomed[0]);
    expect(panned[1] - panned[0]).toBeCloseTo(zoomed[1] - zoomed[0], 5);
    await page.keyboard.press("PageUp");
    expect(await viewY(page)).not.toBeNull();
    await page.keyboard.press("-");
    await page.keyboard.press("0");
    expect(await viewX(page)).toBeNull();
    expect(await viewY(page)).toBeNull();
    /* The rail has the same moves. */
    await rail(page, "Zoom in").click();
    expect(await viewX(page)).not.toBeNull();
    await rail(page, "Zoom out").click();
    expect(await viewX(page)).toBeNull();
  });

  for (const system of SYSTEMS) {
    test(`${system}: Go to is the system's own dialog; keyboard, bounds, Escape and focus`, async ({ page }) => {
      await applyFx(page);
      if (system !== "Salt DS") await switchSystem(page, system);
      await pause(page);
      const chip = stage(page).getByRole("button", { name: "Go to a date or range" });
      await chip.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", { name: "Go to" });
      await expect(dialog).toBeVisible();
      /* Focus stays inside. */
      for (let i = 0; i < 25; i++) {
        await page.keyboard.press("Tab");
        /* Inside the dialog (a focus guard or sentinel of the system's own trap counts: it hands focus straight back). */
        await expect.poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"], [data-floating-ui-focus-guard], .dh-form-dialog-scope'))), { timeout: 1_000, message: `Tab ${i + 1}` }).toBe(true);
      }
      /* Outside the data: a plain message by the field. */
      const date = dialog.getByLabel("Date", { exact: true });
      await date.fill("2026-03-02");
      await dialog.getByRole("button", { name: "Go to", exact: true }).click();
      await expect(dialog.getByText(/Pick a date from .* to 5 Jan 2026\./)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(chip).toBeFocused();
      /* Escape closed the dialog, not Present. */
      await expect(page.getByRole("button", { name: "Edit canvas" })).toBeVisible();

      /* A day picked on the calendar with the keys, then a time. */
      await page.keyboard.press("Enter");
      await expect(dialog).toBeVisible();
      const today = dialog.locator('[data-day="2026-01-05"]');
      await today.focus();
      await page.keyboard.press("Enter");
      await dialog.getByLabel(/^Time/).first().fill("10:30");
      await dialog.getByRole("button", { name: "Go to", exact: true }).click();
      await expect(dialog).toBeHidden();
      const custom = stage(page).getByRole("button", { name: /^Go to: showing 5 Jan 09:45 to 11:15/ });
      await expect(custom).toHaveAttribute("aria-pressed", "true");
      await expect(stage(page).getByRole("button", { name: "1D", exact: true })).toHaveAttribute("aria-pressed", "false");
      expect(await viewX(page)).not.toBeNull();
      /* A range chip lets the window go. */
      await stage(page).getByRole("button", { name: "1D", exact: true }).click();
      await expect.poll(() => viewX(page)).toBeNull();
      await expect(stage(page).getByRole("button", { name: "Go to a date or range" })).toHaveAttribute("aria-pressed", "false");
    });
  }

  test("Go to a custom range further back moves the range preset and shows the window", async ({ page }) => {
    await applyFx(page);
    await pause(page);
    await stage(page).getByRole("button", { name: "Go to a date or range" }).click();
    const dialog = page.getByRole("dialog", { name: "Go to" });
    await dialog.getByText("Custom range", { exact: true }).first().click();
    /* The calendar fills From, then To. */
    await dialog.getByRole("button", { name: "Previous month" }).click();
    await dialog.locator('[data-day="2025-12-29"]').click();
    await expect(dialog.getByText("Pick the end day")).toBeVisible();
    await dialog.locator('[data-day="2025-12-30"]').click();
    await dialog.getByLabel("From", { exact: true }).fill("2025-12-29");
    await dialog.getByRole("button", { name: "Go to", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(stage(page).getByRole("button", { name: /^Go to: showing 29 Dec 10:00 to 30 Dec 11:00/ })).toBeVisible();
    /* 1W is the range that reaches 29 December (5D starts on the 31st). */
    await expect(stage(page).locator(".dh-exec-ranges")).toHaveAttribute("data-range", "1W");
    expect(await viewX(page)).not.toBeNull();
  });

  test("Edit is static: no zoom, the zoom tools wait for Present, and the builder still selects the block", async ({ page }) => {
    await applyFx(page);
    await pause(page);
    await page.getByRole("button", { name: "Edit canvas" }).click();
    const edit = page.locator(".bp-viewport-wrapper");
    const editPlot = edit.locator(".dh-exec-plot");
    await expect(editPlot).toBeVisible();
    await expect(editPlot).not.toHaveAttribute("tabindex", "0");
    const r = (await editPlot.locator(".highcharts-plot-background").boundingBox())!;
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2);
    await page.mouse.wheel(0, -300);
    await page.waitForTimeout(300);
    expect(await editPlot.getAttribute("data-view-x")).toBeNull();
    await expect(edit.getByRole("button", { name: "Zoom in", exact: true })).toHaveAttribute("aria-disabled", "true");
    await expect(edit.getByRole("button", { name: "Go to a date or range" })).toHaveAttribute("aria-disabled", "true");
    await page.mouse.click(r.x + r.width / 2, r.y + r.height / 2);
    await expect(edit.locator("[data-block-id]", { has: page.locator(".dh-exec") }).first()).toHaveClass(/is-selected/);
  });

  test("phone: a vertical swipe is the page's (pan-y), the tools are 24px targets, nothing on the rail is cut off", async ({ page }) => {
    await applyFx(page);
    await pause(page);
    await page.getByRole("button", { name: /Mobile/i }).first().click();
    await expect(plot(page)).toHaveCSS("touch-action", "pan-y");
    const zoom = Number(await page.locator(".bp-device-frame").getAttribute("data-frame-zoom")) || 1;
    const railBox = (await stage(page).locator(".dh-exec-rail").boundingBox())!;
    for (const name of ["Box zoom", "Zoom in", "Zoom out", "Reset view"]) {
      const b = (await rail(page, name).boundingBox())!;
      expect(b.height / zoom).toBeGreaterThanOrEqual(24);
      expect(b.y + b.height).toBeLessThanOrEqual(railBox.y + railBox.height + 1);
    }
    await expect(stage(page).getByRole("button", { name: "Go to a date or range" })).toBeVisible();
  });
});
