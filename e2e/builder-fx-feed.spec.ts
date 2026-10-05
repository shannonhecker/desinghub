import { test, expect, type Page } from "@playwright/test";

/**
 * FX Execution, PR A: the sample live feed.
 *
 *   - While presenting, a bar a second: the chart, the header figures, the
 *     statistics and the table follow it together.
 *   - Pause / Resume and Reset are the design system's own buttons, by
 *     mouse and by keyboard; pausing is report state (fxLive: Off).
 *   - Reduced motion starts it paused; a hidden tab pauses it; Edit is
 *     static; choosing the other order starts that order's session.
 *   - The chart is drawn at its container's width from its first paint.
 *
 * Sample data only: nothing connects to a market or sends an order.
 */

const SYSTEMS = ["Salt DS", "Material 3", "Fluent 2", "uoaui", "Carbon"] as const;

function chatInput(page: Page) {
  return page.getByRole("textbox", { name: "Chat message input" });
}

async function applyFx(page: Page, opts: { reducedMotion?: boolean } = {}) {
  await page.emulateMedia({ reducedMotion: opts.reducedMotion ? "reduce" : "no-preference" });
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(chatInput(page)).toBeVisible({ timeout: 30_000 });
  /* Record the chart's width against its container the moment it is drawn. */
  await page.evaluate(() => {
    const w = window as unknown as { __fxFirstDraw: { chart: number; plot: number } | null };
    w.__fxFirstDraw = null;
    const observer = new MutationObserver(() => {
      const svg = document.querySelector<SVGSVGElement>(".present-stage .dh-exec .highcharts-root");
      if (!svg || w.__fxFirstDraw) return;
      w.__fxFirstDraw = { chart: Number(svg.getAttribute("width")), plot: svg.closest<HTMLElement>(".dh-exec-plot")!.clientWidth };
      observer.disconnect();
    });
    observer.observe(document.body, { subtree: true, childList: true });
  });
  /* Clicked before the page has hydrated, the gallery does not open: retry. */
  const use = page.getByRole("button", { name: "Use the FX Execution template" });
  await expect(async () => {
    if (!(await use.isVisible())) await page.getByRole("button", { name: /Browse templates/ }).click();
    await expect(use).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  await use.click();
  await expect(page.locator(".present-stage .dh-exec .highcharts-root")).toBeVisible({ timeout: 30_000 });
}

const stage = (page: Page) => page.locator(".present-stage");
const bars = async (page: Page) => Number(await stage(page).locator(".dh-instrument").getAttribute("data-feed-bars"));
const chartBars = async (page: Page) => Number(await stage(page).locator(".dh-exec").getAttribute("data-feed-bars"));
const feedStatus = (page: Page) => stage(page).locator(".dh-feed-state-word");
const pauseButton = (page: Page) => stage(page).getByRole("button", { name: "Pause the sample feed" });
const resumeButton = (page: Page) => stage(page).getByRole("button", { name: "Resume the sample feed" });
const resetButton = (page: Page) => stage(page).getByRole("button", { name: "Reset the sample feed" });
const statValue = (page: Page, label: string) => stage(page).locator(".dh-record dt", { hasText: label }).locator("xpath=following-sibling::dd[1]");
/** Bars the drawn chart holds. */
const bidPoints = async (page: Page) => Number(await stage(page).locator(".dh-exec").getAttribute("data-chart-bars"));

test.describe("Builder - FX Execution sample feed", () => {
  test("advances a bar a second; chart, header and statistics move together; Pause holds it; Resume goes on", async ({ page }) => {
    await applyFx(page);
    await expect(feedStatus(page)).toHaveText("Live");
    await expect(stage(page).locator(".dh-feed-note")).toHaveText("Sample data");
    await expect.poll(() => bars(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(3);
    /* The chart holds the same bars as the header. */
    await expect.poll(async () => (await chartBars(page)) === (await bars(page))).toBe(true);
    const base = await bidPoints(page);
    /* O, H, L, C: the close is the fourth figure. */
    const close = stage(page).locator(".dh-instrument-figure").nth(3);
    const duration = statValue(page, "Duration");
    const before = { close: await close.textContent(), duration: await duration.textContent(), points: base };
    await expect.poll(() => duration.textContent(), { timeout: 10_000 }).not.toBe(before.duration);
    await expect.poll(() => bidPoints(page)).toBeGreaterThan(before.points);

    await pauseButton(page).click();
    await expect(feedStatus(page)).toHaveText("Paused");
    await expect(resumeButton(page)).toBeVisible();
    const held = await bars(page);
    await page.waitForTimeout(2_500);
    expect(await bars(page)).toBe(held);

    await resumeButton(page).click();
    await expect(feedStatus(page)).toHaveText("Live");
    await expect.poll(() => bars(page), { timeout: 10_000 }).toBeGreaterThan(held);
    /* Using the controls is reading the report: no amend composer. */
    await expect(page.locator(".present-amend-input")).toHaveCount(0);
  });

  test("Pause and Resume work from the keyboard; the buttons are at least 24px", async ({ page }) => {
    await applyFx(page);
    await pauseButton(page).focus();
    await page.keyboard.press("Enter");
    await expect(feedStatus(page)).toHaveText("Paused");
    await resumeButton(page).focus();
    await page.keyboard.press("Space");
    await expect(feedStatus(page)).toHaveText("Live");
    for (const button of [pauseButton(page), resetButton(page)]) {
      const box = (await button.boundingBox())!;
      const zoom = Number(await page.locator(".bp-device-frame").getAttribute("data-frame-zoom")) || 1;
      expect(box.height / zoom).toBeGreaterThanOrEqual(24);
    }
  });

  test("Reset returns to the seeded session, again and again", async ({ page }) => {
    await applyFx(page);
    await expect.poll(() => bars(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(4);
    const fills = statValue(page, "Number of fills");
    for (let i = 0; i < 3; i++) {
      await resetButton(page).click();
      expect(await bars(page)).toBeLessThanOrEqual(1);
    }
    /* Paused, then reset: the session as seeded. */
    await expect.poll(() => bars(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
    await pauseButton(page).click();
    await expect(resetButton(page)).toBeEnabled();
    await resetButton(page).click();
    await expect.poll(() => bars(page)).toBe(0);
    await expect(fills).toHaveText("13");
    await expect(stage(page).locator(".dh-instrument-status")).toHaveText("1m Line · Percentile · 64% done");
  });

  test("choosing the other order starts its session; a filled order's figures stay while the market moves", async ({ page }) => {
    await applyFx(page);
    await expect.poll(() => bars(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(3);
    await stage(page).getByRole("tab", { name: /SELL/ }).click();
    await expect.poll(() => bars(page)).toBeLessThanOrEqual(1);
    const fills = await statValue(page, "Number of fills").textContent();
    const duration = await statValue(page, "Duration").textContent();
    const first = await bars(page);
    await expect.poll(() => bars(page), { timeout: 10_000 }).toBeGreaterThan(first + 2);
    await expect(stage(page).locator(".dh-instrument-status")).toContainText("100% done");
    expect(await statValue(page, "Number of fills").textContent()).toBe(fills);
    expect(await statValue(page, "Duration").textContent()).toBe(duration);
    /* Back to the working order: its own session, from the start. */
    await stage(page).getByRole("tab", { name: /BUY/ }).click();
    await expect.poll(() => bars(page)).toBeLessThanOrEqual(1);
  });

  test("the table view follows the feed", async ({ page }) => {
    await applyFx(page);
    const chart = stage(page).locator(".dh-exec");
    await chart.getByRole("button", { name: "View", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Table" }).click();
    const grid = chart.locator(".ag-root[aria-rowcount], [role='treegrid'][aria-rowcount], [role='grid'][aria-rowcount]").first();
    await expect(grid).toBeVisible();
    const rows = async () => Number(await grid.getAttribute("aria-rowcount"));
    const now = await rows();
    await expect.poll(rows, { timeout: 10_000 }).toBeGreaterThan(now);
  });

  test("reduced motion starts the feed paused; Resume starts it", async ({ page }) => {
    await applyFx(page, { reducedMotion: true });
    await expect(feedStatus(page)).toHaveText("Paused");
    await page.waitForTimeout(2_500);
    expect(await bars(page)).toBe(0);
    await resumeButton(page).click();
    await expect.poll(() => bars(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
  });

  test("a hidden tab pauses the feed", async ({ page }) => {
    await applyFx(page);
    await expect.poll(() => bars(page), { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
    const setHidden = (hidden: boolean) => page.evaluate((h) => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (h ? "hidden" : "visible") });
      document.dispatchEvent(new Event("visibilitychange"));
    }, hidden);
    await setHidden(true);
    await expect(feedStatus(page)).toHaveText("Paused");
    const held = await bars(page);
    await page.waitForTimeout(2_500);
    expect(await bars(page)).toBe(held);
    await setHidden(false);
    await expect.poll(() => bars(page), { timeout: 10_000 }).toBeGreaterThan(held);
  });

  for (const system of SYSTEMS) {
    test(`${system}: Live and Paused keep the dot still; Edit shows the same feed group as Present`, async ({ page }) => {
      await applyFx(page);
      if (system !== "Salt DS") {
        await page.getByRole("button", { name: /^Design system:/ }).click();
        await page.getByText(system, { exact: true }).last().click();
      }
      await expect(feedStatus(page)).toHaveText("Live");
      await expect(pauseButton(page)).toBeVisible();
      /* Positions in the header, in design pixels: measured from the
         header's right edge, at the scale the canvas is drawn at (Edit and
         Present fit the frame to the window differently). */
      const measure = (scope: string) => page.locator(`${scope} .dh-feed`).evaluate((el) => {
        const header = el.closest<HTMLElement>(".dh-instrument")!;
        const hr = header.getBoundingClientRect();
        const zoom = hr.width / header.offsetWidth;
        const r = el.getBoundingClientRect();
        const dot = el.querySelector(".dh-feed-dot")!.getBoundingClientRect();
        const note = el.querySelector(".dh-feed-note")!.getBoundingClientRect();
        return { dot: Math.round((hr.right - dot.x) / zoom), note: Math.round((hr.right - note.x) / zoom), group: [hr.right - r.right, r.width, r.height].map((n) => Math.round(n / zoom)) };
      });
      const live = await measure(".present-stage");
      await pauseButton(page).click();
      await expect(feedStatus(page)).toHaveText("Paused");
      await expect(resumeButton(page)).toBeVisible();
      const paused = await measure(".present-stage");
      expect(Math.abs(paused.dot - live.dot), `${system}: dot moved ${live.dot} -> ${paused.dot}`).toBeLessThanOrEqual(1);
      expect(Math.abs(paused.note - live.note), `${system}: note moved`).toBeLessThanOrEqual(1);

      await page.getByRole("button", { name: "Edit canvas" }).click();
      /* The panel opens on entering Edit (5 Oct); these design-pixel measurements
         were calibrated with it hidden (a smaller zoom rounds to 2px): hide it. */
      const closePanel = page.getByRole("button", { name: "Close panel", exact: true });
      if (await closePanel.isVisible()) await closePanel.click();
      const edit = page.locator(".bp-viewport-wrapper");
      await expect(edit.locator(".dh-instrument")).toBeVisible();
      /* Edit shows the report as saved, without the feed's bars, paused. */
      await expect(edit.locator(".dh-instrument")).toHaveAttribute("data-feed-bars", "0");
      await expect(edit.locator(".dh-feed-state-word")).toHaveText("Paused");
      await expect(edit.getByRole("button", { name: "Resume the sample feed" })).toBeVisible();
      await expect(edit.locator(".dh-instrument-status")).toHaveText("1m Line · Percentile · 64% done");
      const inEdit = await measure(".bp-viewport-wrapper");
      inEdit.group.forEach((v, i) => expect(Math.abs(v - paused.group[i]), `${system}: feed group ${["inset", "width", "height"][i]}: edit ${inEdit.group} present ${paused.group}`).toBeLessThanOrEqual(1));
      /* The default Edit state has the panel open: same group within one
         SCREEN pixel (design tolerance ceil(1 / zoom) from the real zoom). */
      await page.getByRole("button", { name: "Show component library", exact: true }).click();
      await page.waitForTimeout(600);
      const openZoom = Number(await page.locator(".bp-viewport-wrapper .bp-device-frame").getAttribute("data-frame-zoom")) || 1;
      const tol = Math.ceil(1 / openZoom);
      const inEditOpen = await measure(".bp-viewport-wrapper");
      inEditOpen.group.forEach((v, i) => expect(Math.abs(v - paused.group[i]), `${system}, panel open: feed group ${["inset", "width", "height"][i]}: edit ${inEditOpen.group} present ${paused.group}`).toBeLessThanOrEqual(tol));
      expect(Math.abs(inEditOpen.dot - paused.dot), `${system}, panel open: dot`).toBeLessThanOrEqual(tol);
      expect(Math.abs(inEdit.dot - paused.dot), `${system}: dot in Edit`).toBeLessThanOrEqual(1);
    });
  }

  test("a resize resizes the drawn chart; it does not rebuild it", async ({ page }) => {
    await applyFx(page);
    await pauseButton(page).click();
    const svg = stage(page).locator(".dh-exec .highcharts-root");
    await svg.evaluate((el) => { (el as unknown as { __fxMark: boolean }).__fxMark = true; });
    const width = () => svg.evaluate((el) => Number(el.getAttribute("width")));
    const before = await width();
    await page.setViewportSize({ width: 1180, height: 900 });
    await expect.poll(width).not.toBe(before);
    /* The same drawn chart, at its container's new width. */
    expect(await svg.evaluate((el) => Boolean((el as unknown as { __fxMark?: boolean }).__fxMark))).toBe(true);
    const plot = await stage(page).locator(".dh-exec-plot").evaluate((el) => (el as HTMLElement).clientWidth);
    expect(Math.abs((await width()) - plot)).toBeLessThanOrEqual(1);
  });

  test("the chart is drawn at its container's width from its first paint", async ({ page }) => {
    await applyFx(page);
    const first = await page.evaluate(() => (window as unknown as { __fxFirstDraw: { chart: number; plot: number } | null }).__fxFirstDraw);
    expect(first).not.toBeNull();
    expect(Math.abs(first!.chart - first!.plot)).toBeLessThanOrEqual(1);
  });

  test("the controls are each design system's own button; the header keeps one height", async ({ page }) => {
    await applyFx(page, { reducedMotion: true });
    const header = stage(page).locator(".dh-instrument");
    const heights: number[] = [];
    const real: Record<(typeof SYSTEMS)[number], RegExp> = {
      "Salt DS": /saltButton/, "Material 3": /MuiIconButton-root/, "Fluent 2": /fui-Button/, uoaui: /a-btn/, Carbon: /cds--btn/,
    };
    for (const system of SYSTEMS) {
      if (system !== "Salt DS") {
        await page.getByRole("button", { name: /^Design system:/ }).click();
        await page.getByText(system, { exact: true }).last().click();
      }
      await expect(resumeButton(page)).toHaveClass(real[system]);
      await expect(resetButton(page)).toHaveClass(real[system]);
      /* A target of at least 24px in every system. */
      const zoom = Number(await page.locator(".present-stage .bp-device-frame").getAttribute("data-frame-zoom")) || 1;
      for (const button of [resumeButton(page), resetButton(page)]) {
        const box = (await button.boundingBox())!;
        expect(box.height / zoom, `${system} button height`).toBeGreaterThanOrEqual(24);
        expect(box.width / zoom, `${system} button width`).toBeGreaterThanOrEqual(24);
      }
      for (const mode of ["light", "dark"] as const) {
        await page.getByRole("button", { name: `Switch to ${mode} mode` }).click().catch(() => {});
        heights.push(await header.evaluate((el) => (el as HTMLElement).offsetHeight));
      }
    }
    expect(new Set(heights).size, `header heights ${heights.join(", ")}`).toBe(1);
  });
});
