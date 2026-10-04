import { test, expect, type Page } from "@playwright/test";

/**
 * The finance report templates (Risk Analytics, Performance Analytics).
 *
 * What they promise, measured here:
 *
 *   1. Identical layout in every design system: each body block's x, y,
 *      width AND height match Salt's within 1px, in light and dark, with no
 *      sideways overflow. (The general parity spec only checks x and width;
 *      these templates pin their heights, so all four sides hold.)
 *   2. Edit matches Present.
 *   3. They are live: a filter re-derives the numbers, a panel's "View by"
 *      re-groups it, and the chat can apply a template and set a filter
 *      without a model.
 *   4. Nothing is clipped at tablet or phone width.
 *
 * Positions are read in DESIGN pixels: relative to the device frame and
 * divided by the frame's scale (data-frame-zoom, see frameFit.ts).
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
/* `minPanel`: the narrowest a panel may get on a phone. Score gauges sit two
   across by design; every other panel takes the full width. */
const TEMPLATES = [
  { label: "Risk Analytics", blocks: 7, minPanel: 280 },
  { label: "Performance Analytics", blocks: 11, minPanel: 280 },
  { label: "ESG Analytics", blocks: 13, minPanel: 140 },
  { label: "Climate Analytics", blocks: 11, minPanel: 280 },
  { label: "Screening", blocks: 4, minPanel: 280 },
  { label: "Screening Changes", blocks: 3, minPanel: 280 },
] as const;

function chatInput(page: Page) {
  return page.getByRole("textbox", { name: "Chat message input" });
}

async function openBuilder(page: Page) {
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(chatInput(page)).toBeVisible({ timeout: 30_000 });
}

async function applyTemplate(page: Page, label: string) {
  await openBuilder(page);
  await page.getByRole("button", { name: /Browse templates/ }).click();
  await page.getByRole("button", { name: `Use the ${label} template` }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
  await settle(page);
}

/** Apply a template by typing its name: works on a canvas that already has
 *  one (the start screen's gallery is gone by then). */
async function applyTemplateFromChat(page: Page, ask: string) {
  await page.getByRole("button", { name: "Edit canvas" }).click();
  await expect(chatInput(page)).toBeVisible();
  await expect(async () => {
    await chatInput(page).fill(ask);
    await chatInput(page).press("Enter");
    await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 5_000 });
  }).toPass({ timeout: 30_000 });
  await settle(page);
}

async function measure(page: Page): Promise<Measure> {
  return page.evaluate(() => {
    const frame = document.querySelector<HTMLElement>(".bp-device-frame")!;
    const fr = frame.getBoundingClientRect();
    const zoom = parseFloat(frame.getAttribute("data-frame-zoom") ?? "1") || 1;
    const main = frame.querySelector<HTMLElement>(".bp-main")!;
    /* The grid cell (the block's wrapper) is what the layout places. */
    const boxes = [...main.querySelectorAll<HTMLElement>("[data-block-id]")].map((el) => {
      const r = (el.parentElement ?? el).getBoundingClientRect();
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

/* Charts and grids size themselves a frame or two after mount; wait for the
   boxes to stop moving. */
async function settle(page: Page) {
  let last = "";
  await expect(async () => {
    const now = JSON.stringify(await measure(page));
    const stable = now === last;
    last = now;
    expect(stable).toBe(true);
  }).toPass({ timeout: 20_000, intervals: [500] });
}

async function switchSystem(page: Page, label: (typeof SYSTEMS)[number]) {
  await page.getByRole("button", { name: /^Design system:/ }).click();
  await page.getByText(label, { exact: true }).last().click();
  await settle(page);
}

const SIDES = ["x", "y", "width", "height"] as const;

test.describe("Builder - finance templates", () => {
  for (const tpl of TEMPLATES) {
    test(`${tpl.label}: every panel within 1px on all four sides across the five design systems, light and dark`, async ({ page }) => {
      await applyTemplate(page, tpl.label);
      const reference = await measure(page);
      expect(reference.boxes.length).toBe(tpl.blocks);

      for (const system of SYSTEMS) {
        if (system !== "Salt DS") await switchSystem(page, system);
        for (const mode of ["dark", "light"] as const) {
          if (mode === "light") {
            await page.getByRole("button", { name: "Switch to light mode" }).click();
            await settle(page);
          }
          const m = await measure(page);
          expect.soft(m.overflow, `${system} ${mode}: body overflows sideways`).toBe(0);
          expect.soft(m.boxes.length, `${system} ${mode}: block count`).toBe(reference.boxes.length);
          m.boxes.forEach((box, i) => {
            const ref = reference.boxes[i];
            if (!ref) return;
            SIDES.forEach((side, s) => {
              expect.soft(Math.abs(box[s] - ref[s]), `${system} ${mode}: block ${i} ${side} ${box[s]} vs Salt ${ref[s]}`).toBeLessThanOrEqual(1);
            });
          });
        }
        await page.getByRole("button", { name: "Switch to dark mode" }).click();
        await settle(page);
      }
    });

    test(`${tpl.label}: Edit matches Present`, async ({ page }) => {
      await applyTemplate(page, tpl.label);
      const present = await measure(page);
      await page.getByRole("button", { name: "Edit canvas" }).click();
      await expect(page.locator(".bp-viewport-wrapper .bp-main [data-block-id]").first()).toBeVisible();
      await settle(page);
      const edit = await measure(page);
      expect(edit.overflow).toBe(0);
      expect(edit.boxes.length).toBe(present.boxes.length);
      edit.boxes.forEach((box, i) => {
        SIDES.forEach((side, s) => {
          /* Heights are pinned by the template, so all four sides hold to
             1px here (unlike a table whose row hairlines add up). */
          expect.soft(Math.abs(box[s] - present.boxes[i][s]), `block ${i} ${side} ${box[s]} vs present ${present.boxes[i][s]}`).toBeLessThanOrEqual(1);
        });
      });
    });
  }

  test("filters re-derive the numbers and a panel's View by re-groups it", async ({ page }) => {
    await applyTemplate(page, "Performance Analytics");
    const main = page.locator(".present-stage .bp-main");
    const totalCell = main.locator(".ag-row").first().locator(".ag-cell").nth(1);
    await expect(totalCell).toHaveText("£3.55bn");

    /* Currency: the same book in dollars. */
    await main.getByRole("combobox", { name: "Currency" }).first().click();
    await page.getByRole("option", { name: "USD", exact: true }).click();
    await expect(totalCell).toHaveText(/^US\$4\.\d\dbn$/);

    /* View by: the allocation donut regroups from asset types to sectors. */
    const legend = main.locator('section[aria-label="Allocation"] .highcharts-legend-item');
    await expect(legend.first()).toContainText("Equity");
    await main.locator('section[aria-label="Allocation"]').getByRole("combobox").click();
    await page.getByRole("option", { name: "Sector", exact: true }).click();
    await expect(legend.first()).toContainText("Financials");
  });

  test("the chat applies a template, sets a filter and re-themes without a model", async ({ page }) => {
    await openBuilder(page);
    /* Typed before the page has hydrated, the text is lost: retry until the
       message lands. */
    const ask = "use the risk analytics template in carbon, light mode";
    await expect(async () => {
      await chatInput(page).fill(ask);
      await expect(chatInput(page)).toHaveValue(ask);
      await chatInput(page).press("Enter");
      await expect(page.locator(".present-stage .dh-page-title")).toHaveText("Risk", { timeout: 5_000 });
    }).toPass({ timeout: 60_000 });
    await expect(page.locator(".present-stage .bp-dashboard")).toHaveClass(/preview-carbon/);

    await page.getByRole("button", { name: "Edit canvas" }).click();
    await expect(page.getByText(/Risk Analytics is on the canvas in Carbon DS in light mode/)).toBeVisible();
    const totalCell = page.locator(".bp-viewport-wrapper .bp-main .ag-row").first().locator(".ag-cell").nth(1);
    await expect(totalCell).toHaveText("£3.55bn");
    await chatInput(page).fill("show it in USD");
    await chatInput(page).press("Enter");
    await expect(totalCell).toHaveText(/^US\$4\.\d\dbn$/);
    /* The reply ends the turn; the chat ignores a message sent before it. */
    await expect(page.getByText("Currency set to USD.")).toBeVisible();

    await chatInput(page).fill("switch to material dark");
    await chatInput(page).press("Enter");
    await expect(page.locator(".bp-viewport-wrapper .bp-dashboard")).toHaveClass(/preview-m3/);
    /* Re-theming keeps the report and its state. */
    await expect(totalCell).toHaveText(/^US\$4\.\d\dbn$/);
  });

  test("ESG: a selected account re-scopes the gauges; Screening: a waterfall bar filters the universe and a row opens its detail", async ({ page }) => {
    await applyTemplate(page, "ESG Analytics");
    const main = page.locator(".present-stage .bp-main");
    const gauge = main.locator('section[aria-label="ESG score"] .highcharts-data-label').first();
    await expect(gauge).toContainText("6.34");
    await main.locator(".ag-row", { hasText: "Climate Transition Bond" }).first().click();
    await expect(gauge).toContainText("5.76");
    /* The Total row means everything again. */
    await main.locator(".ag-row", { hasText: "Total" }).first().click();
    await expect(gauge).toContainText("6.34");

    await applyTemplateFromChat(page, "use the screening template");
    const rows = page.locator(".present-stage .bp-main .ag-center-cols-container .ag-row");
    const all = await rows.count();
    expect(all).toBeGreaterThan(10);
    /* Second bar: the House screen. */
    await page.locator('.present-stage section[aria-label="Screening summary"] .highcharts-point').nth(1).click();
    await expect(async () => expect(await rows.count()).toBeLessThan(all)).toPass();
    const detail = page.locator(".present-stage .bp-main .dh-panel").last();
    await expect(detail).toContainText("Select a security");
    const first = page.locator(".present-stage .bp-main .ag-row").first();
    const name = (await first.locator(".ag-cell").first().textContent())!.trim();
    await first.click();
    await expect(detail.locator(".dh-panel-title")).toHaveText(name);
    await expect(detail).toContainText("ESG scores");
    /* Using the report must not open the amend composer. */
    await expect(page.locator(".present-amend-input")).toHaveCount(0);
  });

  test("Changes: chips, sparklines, badges and toned words are drawn", async ({ page }) => {
    await applyTemplate(page, "Screening Changes");
    const main = page.locator(".present-stage .bp-main");
    await expect(main.locator(".dh-cell-chip").first()).toBeVisible();
    await expect(main.locator(".dh-cell-spark polyline").first()).toBeVisible();
    await expect(main.locator(".dh-cell-badge").first()).toBeVisible();
    await expect(main.locator(".dh-cell-tonetext").first()).toBeVisible();
    await expect(main.locator(".dh-cell-flag").first()).toBeVisible();
    /* The whole grid fits its panel: no sideways scroll at the desktop width. */
    const overflow = await main.locator(".dh-grid .ag-center-cols-viewport").first().evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });

  for (const device of [
    { name: "tablet", button: /Tablet/i },
    { name: "phone", button: /Mobile/i },
  ]) {
    for (const tpl of TEMPLATES) {
      test(`${tpl.label}: nothing is clipped on a ${device.name}`, async ({ page }) => {
        await applyTemplate(page, tpl.label);
        await page.getByRole("button", { name: device.button }).first().click();
        await settle(page);
        const report = await page.evaluate(() => {
          const frame = document.querySelector<HTMLElement>(".bp-device-frame")!;
          const fr = frame.getBoundingClientRect();
          const main = frame.querySelector<HTMLElement>(".bp-main")!;
          const header = frame.querySelector<HTMLElement>(".bp-header")!;
          const cut = [...frame.querySelectorAll<HTMLElement>(".dh-panel-title, .dh-page-title, .dh-topnav-name, .dh-topnav-link")]
            .filter((el) => el.offsetParent !== null && el.scrollWidth > el.clientWidth + 1)
            .map((el) => el.textContent);
          const outside = [...main.querySelectorAll<HTMLElement>("[data-block-id]")]
            .filter((el) => el.getBoundingClientRect().right > fr.right + 1)
            .map((el) => el.getAttribute("data-block-id"));
          const narrowest = Math.min(...[...main.querySelectorAll<HTMLElement>(".dh-panel")].map((el) => el.getBoundingClientRect().width));
          return { bodyOverflow: main.scrollWidth - main.clientWidth, headerOverflow: header.scrollWidth - header.clientWidth, cut, outside, narrowest };
        });
        expect.soft(report.bodyOverflow, `${tpl.label}: body overflows sideways`).toBe(0);
        expect.soft(report.headerOverflow, `${tpl.label}: header overflows sideways`).toBe(0);
        expect.soft(report.cut, `${tpl.label}: clipped text`).toEqual([]);
        expect.soft(report.outside, `${tpl.label}: blocks past the frame edge`).toEqual([]);
        /* A panel is never squeezed into a sliver. */
        expect.soft(report.narrowest, `${tpl.label}: narrowest panel`).toBeGreaterThanOrEqual(device.name === "phone" ? tpl.minPanel : 240);
      });
    }
  }
});
