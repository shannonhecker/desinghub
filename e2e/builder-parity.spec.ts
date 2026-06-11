import { test, expect, type Page } from "@playwright/test";

/**
 * Edit vs Present box-model parity.
 *
 * Regression for the present-mode spacing divergence (2026-06-11):
 * BuilderApp's edit shell carries data-canvas-spacing, but PresentStage
 * REPLACES that shell, so before the fix no ancestor carried the
 * attribute in preview and the tight gate
 * ([data-canvas-spacing="tight"] .canvas-block { padding/margin/border: 0 })
 * never applied — preview blocks rendered 12px padding / 8px margin /
 * 1px border while edit rendered 0/0/0, shifting every block's position.
 *
 * Strategy: populate the canvas via the local-command path (no AI key
 * needed), record each .canvas-block's bounding rect in edit mode,
 * enter Present (Shift+Cmd+P), re-measure, and assert width/height
 * equality within +/-1px per block. Position (x/y) is not compared
 * because Present renders the canvas inside a device frame on a stage,
 * which legitimately offsets the whole canvas; the box model
 * (padding/margin/border -> size) is what the fix pins.
 *
 * Pre-flight: same as builder-gestures.spec.ts — `npm run dev` on :3000
 * (dev is fine; no prod build required for this page).
 */

const NEW_SESSION_LABEL = "Start a new session";

async function gotoBuilderClean(page: Page) {
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox").first()).toBeVisible({ timeout: 30_000 });
  const newSession = page.getByRole("button", { name: NEW_SESSION_LABEL });
  if (await newSession.count()) {
    await newSession.first().click();
    page.once("dialog", (d) => d.accept().catch(() => undefined));
  }
}

async function buildDashboard(page: Page) {
  const textarea = page.getByRole("textbox").first();
  await textarea.fill("build a dashboard");
  await textarea.press("Enter");
  await expect(page.locator(".canvas-block").first()).toBeVisible({ timeout: 60_000 });
}

type Rect = { width: number; height: number };

async function measureBlocks(page: Page): Promise<Rect[]> {
  /* page.$$eval is Playwright's standard DOM-query API (runs the given
     function over matched elements in the page context) — not JS eval();
     no arbitrary string execution here. */
  return page.$$eval(".canvas-block", (els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, height: r.height };
    }),
  );
}

test.describe("Builder - edit vs present box-model parity", () => {
  test("canvas blocks keep the same size (+/-1px) across edit and present", async ({ page }) => {
    await gotoBuilderClean(page);
    await buildDashboard(page);

    const editRects = await measureBlocks(page);
    expect(editRects.length).toBeGreaterThan(0);

    // Enter Present mode (global Shift+Cmd+P shortcut in BuilderApp).
    await page.keyboard.press("Shift+Meta+P");
    await expect(page.locator(".present-stage")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".canvas-block").first()).toBeVisible({ timeout: 15_000 });

    // The root must mirror the store's canvasSpacing (the actual fix).
    await expect(page.locator(".present-stage")).toHaveAttribute(
      "data-canvas-spacing",
      /^(tight|comfortable)$/,
    );

    const presentRects = await measureBlocks(page);
    expect(presentRects.length).toBe(editRects.length);

    for (let i = 0; i < editRects.length; i++) {
      expect
        .soft(Math.abs(presentRects[i].width - editRects[i].width), `block ${i} width`)
        .toBeLessThanOrEqual(1);
      expect
        .soft(Math.abs(presentRects[i].height - editRects[i].height), `block ${i} height`)
        .toBeLessThanOrEqual(1);
    }

    // Exit back to edit so later tests in the worker start clean.
    await page.keyboard.press("Escape");
    await expect(page.locator(".present-stage")).toHaveCount(0);
  });
});
