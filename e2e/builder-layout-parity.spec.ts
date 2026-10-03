import { test, expect, type Page } from "@playwright/test";

/**
 * Layout parity for a template on the canvas.
 *
 * Three promises, measured on the Analytics Dashboard template:
 *
 *   1. Nothing is clipped: the body never overflows .bp-main sideways, in
 *      any design system. (Regression: the body ran two gutters past
 *      .bp-main in every system but Carbon and clipped the right-hand
 *      column.)
 *   2. Columns are the same in every design system: each block's x and
 *      width match Salt's within 1px, in light and dark. (Regression:
 *      Carbon's body was narrower, so its 4-up KPI row re-wrapped.)
 *   3. Edit matches Present: with the chat docked the canvas is scaled to
 *      the stage, not re-flowed, so every block has the same position and
 *      size in design pixels in both modes.
 *
 * Positions are read in DESIGN pixels: relative to the device frame and
 * divided by the frame's scale (data-frame-zoom, see frameFit.ts).
 *
 * Not asserted here: row HEIGHTS across design systems. Components have
 * different natural heights per system (a Material 3 stat card is taller
 * than a Salt one), so y positions drift unless a template pins its row
 * heights. Templates that do so carry their own all-four-sides test.
 *
 * Pre-flight: `npm run dev` (see playwright.config.ts for the base URL).
 */

type Box = [x: number, y: number, width: number, height: number];
interface Measure {
  zoom: number;
  overflow: number;
  boxes: Box[];
}

const SYSTEMS = ["Salt DS", "Material 3", "Fluent 2", "uoaui", "Carbon"] as const;

function chatInput(page: Page) {
  return page.getByRole("textbox", { name: "Chat message input" });
}

async function applyAnalyticsTemplate(page: Page) {
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(chatInput(page)).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /Browse templates/ }).click();
  await page.getByRole("button", { name: "Use the Analytics Dashboard template" }).click();
  await page.getByRole("button", { name: "Salt DS", exact: true }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
  await settle(page);
}

/* Blocks replay a short entrance animation on (re)mount and charts size
   themselves a frame later; wait for the boxes to stop moving. */
async function settle(page: Page) {
  let last = "";
  await expect(async () => {
    const now = JSON.stringify(await measure(page));
    const stable = now === last;
    last = now;
    expect(stable).toBe(true);
  }).toPass({ timeout: 15_000, intervals: [400] });
}

async function measure(page: Page): Promise<Measure> {
  return page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>(".bp-device-frame")!;
    const fr = frame.getBoundingClientRect();
    const zoom = parseFloat(frame.getAttribute("data-frame-zoom") ?? "1") || 1;
    const main = frame.querySelector<HTMLElement>(".bp-main")!;
    const boxes = [...main.querySelectorAll<HTMLElement>("[data-block-id]")].map((el) => {
      const r = el.getBoundingClientRect();
      return [
        Math.round((r.x - fr.x) / zoom),
        Math.round((r.y - fr.y) / zoom),
        Math.round(r.width / zoom),
        Math.round(r.height / zoom),
      ] as [number, number, number, number];
    });
    return { zoom, overflow: main.scrollWidth - main.clientWidth, boxes };
  });
}

async function switchSystem(page: Page, label: (typeof SYSTEMS)[number]) {
  await page.getByRole("button", { name: /^Design system:/ }).click();
  await page.getByText(label, { exact: true }).last().click();
  await settle(page);
}

test.describe("Builder - template layout parity", () => {
  test("no sideways clipping, and identical columns across the five design systems in light and dark", async ({ page }) => {
    await applyAnalyticsTemplate(page);
    const reference = await measure(page);
    expect(reference.boxes.length).toBeGreaterThan(8);

    for (const system of SYSTEMS) {
      if (system !== "Salt DS") await switchSystem(page, system);
      for (const mode of ["dark", "light"] as const) {
        if (mode === "light") {
          await page.getByRole("button", { name: "Switch to light mode" }).click();
          await settle(page);
        }
        const m = await measure(page);
        expect.soft(m.overflow, `${system} ${mode}: body overflows .bp-main sideways`).toBe(0);
        expect.soft(m.boxes.length, `${system} ${mode}: block count`).toBe(reference.boxes.length);
        m.boxes.forEach((box, i) => {
          const ref = reference.boxes[i];
          if (!ref) return;
          expect.soft(Math.abs(box[0] - ref[0]), `${system} ${mode}: block ${i} x ${box[0]} vs Salt ${ref[0]}`).toBeLessThanOrEqual(1);
          expect.soft(Math.abs(box[2] - ref[2]), `${system} ${mode}: block ${i} width ${box[2]} vs Salt ${ref[2]}`).toBeLessThanOrEqual(1);
        });
      }
      await page.getByRole("button", { name: "Switch to dark mode" }).click();
      await settle(page);
    }
  });

  test("Edit matches Present: the canvas is scaled to the stage, not re-flowed", async ({ page }) => {
    await applyAnalyticsTemplate(page);
    const present = await measure(page);

    await page.getByRole("button", { name: "Edit canvas" }).click();
    await expect(page.locator(".bp-viewport-wrapper .bp-main [data-block-id]").first()).toBeVisible();
    await settle(page);
    const edit = await measure(page);

    /* The chat is docked beside the canvas in Edit, so at the test viewport
       the stage is narrower than the design width: the frame must be scaled
       rather than laid out narrower. */
    expect(edit.zoom).toBeLessThan(1);
    expect(edit.overflow).toBe(0);
    expect(edit.boxes.length).toBe(present.boxes.length);
    edit.boxes.forEach((box, i) => {
      const ref = present.boxes[i];
      /* x, y, width: 1px for rounding at a fractional scale. Height gets
         the larger of 2px and 1%: a hairline border is snapped to a whole
         device pixel, so at a scale of 0.86 each one is 0.17 design px
         thicker, and a table's row borders add that up (about 4px over an
         eight-row table). A block with a pinned height is not affected. */
      expect.soft(Math.abs(box[0] - ref[0]), `block ${i} x ${box[0]} vs present ${ref[0]}`).toBeLessThanOrEqual(1);
      expect.soft(Math.abs(box[1] - ref[1]), `block ${i} y ${box[1]} vs present ${ref[1]}`).toBeLessThanOrEqual(1);
      expect.soft(Math.abs(box[2] - ref[2]), `block ${i} width ${box[2]} vs present ${ref[2]}`).toBeLessThanOrEqual(1);
      expect.soft(Math.abs(box[3] - ref[3]), `block ${i} height ${box[3]} vs present ${ref[3]}`).toBeLessThanOrEqual(Math.max(2, Math.ceil(ref[3] * 0.01)));
    });
  });
});
