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
/* `minPanel`: the narrowest a panel may get on a phone (and, where it is
   under 240, on a tablet). Score gauges are tiles by design: two across on a
   phone, four across on a tablet; every other panel takes the full width. */
const TEMPLATES = [
  { label: "Risk Analytics", blocks: 5, minPanel: 280 },
  { label: "Performance Analytics", blocks: 6, minPanel: 280 },
  { label: "ESG Analytics", blocks: 10, minPanel: 140 },
  { label: "Climate Analytics", blocks: 9, minPanel: 280 },
  { label: "Screening", blocks: 3, minPanel: 280 },
  { label: "Screening Changes", blocks: 2, minPanel: 280 },
  { label: "Issuer Climate", blocks: 7, minPanel: 280 },
  { label: "Issuer Business Involvement", blocks: 8, minPanel: 280 },
  { label: "Issuer Controversies", blocks: 5, minPanel: 280 },
  { label: "Entity Comparison", blocks: 9, minPanel: 280 },
  { label: "Governance Scorecard", blocks: 8, minPanel: 280 },
  { label: "Analytics Home", blocks: 10, minPanel: 280 },
  { label: "FX Execution", blocks: 4, minPanel: 280 },
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
  /* Clicked before the page has hydrated, the click is lost (the same reason
     applyTemplateFromChat retries): click until the gallery opens. */
  await expect(async () => {
    const browse = page.getByRole("button", { name: /Browse templates/ });
    if (await browse.isVisible()) await browse.click();
    await expect(page.getByRole("list", { name: "Starting templates" })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  /* Analytics Home is the connected workspace: its own action, not a card. */
  if (label === "Analytics Home") await page.getByRole("button", { name: "Open workspace" }).click();
  else await page.getByRole("button", { name: `Use the ${label} template` }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
  /* FX Execution: parity is measured with the sample feed switched off
     (fxLive: Off), under the default motion setting. The feed changes
     numbers, never a block's size; switched off, Edit and Present show the
     same header controls. */
  if (label === "FX Execution") {
    await page.locator(".present-stage").getByRole("button", { name: "Pause the sample feed" }).click();
    await expect(page.locator(".present-stage .dh-feed-status")).toHaveClass(/is-paused/);
  }
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
    const zoom = parseFloat(frame.getAttribute("data-frame-zoom") ?? "1") || 1;
    /* Origin: the frame's CONTENT box (inside its border, if it has one), so
       the framed Edit canvas and the full-bleed Present canvas measure alike. */
    const fb = frame.getBoundingClientRect();
    const fr = { x: fb.x + frame.clientLeft * zoom, y: fb.y + frame.clientTop * zoom };
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
      /* Present on the desktop device is full-bleed (5 Oct), so it is
         measured in a 1318px window, where its content width equals Edit's
         (a 1320px design width inside a 1px frame border each side). Like
         with like; tolerances are unchanged. */
      await page.setViewportSize({ width: 1318, height: 900 });
      await settle(page);
      const present = await measure(page);
      await page.setViewportSize({ width: 1440, height: 900 });
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
    /* The filters sit in the context bar, under the tab strip. */
    await page.locator(".present-stage .dh-contextbar").getByRole("combobox", { name: "Currency" }).first().click();
    await page.getByRole("option", { name: "USD", exact: true }).click();
    await expect(totalCell).toHaveText(/^US\$4\.\d\dbn$/);

    /* View by: the allocation donut regroups from asset types to sectors. */
    const legend = main.locator('section[aria-label="Allocation"] .highcharts-legend-item');
    await expect(legend.first()).toContainText("Equity");
    await main.locator('section[aria-label="Allocation"]').getByRole("combobox").click();
    await page.getByRole("option", { name: "Sector", exact: true }).click();
    await expect(legend.first()).toContainText("Financials");
  });

  test("Expand shows more data; Data level in Configuration sets the depth; Escape collapses and stays in Present", async ({ page }) => {
    await applyTemplate(page, "Performance Analytics");
    const stage = page.locator(".present-stage");
    const rows = (scope: string) => stage.locator(`${scope} .ag-center-cols-container .ag-row`);
    /* In place: accounts, each with its asset classes under it. */
    const results = 'section[aria-label="Performance results"]';
    await expect(stage.locator(`${results} .ag-row`, { hasText: "Global Multi-Asset Growth" }).first()).toBeVisible();
    await expect(stage.locator(`${results} .ag-row`, { hasText: "Government Bond" }).first()).toBeVisible();
    await expect(stage.locator(`${results} .ag-row`, { hasText: "Halden Capital Ord" })).toHaveCount(0);

    /* Expanded: down to the securities. */
    await stage.getByRole("button", { name: "Expand Performance results", exact: true }).click();
    const expanded = ".dh-panel-expanded";
    await expect(stage.locator(`${expanded} .ag-row`, { hasText: "Halden Capital Ord" }).first()).toBeVisible();

    /* Configuration: the data level. */
    await stage.getByRole("button", { name: "Configure Performance results", exact: true }).last().click();
    const config = stage.locator(".dh-config");
    await expect(config).toContainText("Account > Asset class > Security");
    await config.getByRole("combobox", { name: "Data level" }).click();
    await page.getByRole("option", { name: "Account only", exact: true }).click();
    await expect(stage.locator(`${expanded} .ag-row`, { hasText: "Halden Capital Ord" })).toHaveCount(0);
    await expect(rows(expanded)).toHaveCount(6);

    /* Escape collapses the panel; the report is still being presented. */
    await page.keyboard.press("Escape");
    await expect(stage.locator(expanded)).toHaveCount(0);
    await expect(stage.locator(".bp-main [data-block-id]").first()).toBeVisible();

    /* A chart's expanded view carries a deeper table. */
    await stage.getByRole("button", { name: "Expand Allocation", exact: true }).click();
    await expect(stage.locator(`${expanded} .ag-row`, { hasText: "Total" }).first()).toBeVisible();
    await expect(stage.locator(`${expanded} .ag-header-cell`, { hasText: "% of total" })).toBeVisible();
  });

  test("FX Execution: the chart's rail, range chips, order tabs and venue selection re-read the page", async ({ page }) => {
    await applyTemplate(page, "FX Execution");
    const stage = page.locator(".present-stage");
    const status = stage.locator(".dh-instrument-status");
    await expect(status).toHaveText("1m Line · Percentile · 64% done");
    await expect(stage.locator(".dh-instrument-symbol")).toHaveText("EURUSD");
    const chart = stage.locator(".dh-exec");
    await expect(chart.locator(".highcharts-legend-item", { hasText: /^Limit price$/ })).toBeVisible();
    await expect(chart.locator(".highcharts-candlestick-series")).toHaveCount(0);

    /* The rail: chart type and interval. */
    await chart.getByRole("button", { name: "Chart type" }).click();
    await page.getByRole("menuitemradio", { name: "Candlestick" }).click();
    await expect(chart.locator(".highcharts-candlestick-series").first()).toBeVisible();
    await chart.getByRole("button", { name: "Interval" }).click();
    await page.getByRole("menuitemradio", { name: "5m", exact: true }).click();
    await expect(status).toHaveText("5m Candlestick · Percentile · 64% done");

    /* Range chips. */
    await chart.getByRole("button", { name: "1W", exact: true }).click();
    await expect(chart.getByRole("button", { name: "1W", exact: true })).toHaveAttribute("aria-pressed", "true");

    /* The other order: its statistics and its completion. */
    const stats = stage.locator(".dh-panel", { has: page.locator(".dh-record") });
    await expect(stats.locator(".dh-panel-title")).toHaveText("FO-0002LQD");
    await stage.getByRole("tab", { name: /SELL/ }).click();
    await expect(stats.locator(".dh-panel-title")).toHaveText("FO-0002LQE");
    await expect(status).toContainText("100% done");

    /* A fill picked on the chart selects its venue: the others' fills dim. */
    const dimmed = () => chart.locator(".highcharts-scatter-series .highcharts-point").evaluateAll((points) => points.filter((p) => /0\.14\)/.test(p.getAttribute("fill") ?? "")).length);
    expect(await dimmed()).toBe(0);
    await chart.locator(".highcharts-scatter-series .highcharts-point").nth(3).click({ force: true });
    await expect.poll(dimmed).toBeGreaterThan(0);

    /* The table view lists the bars. */
    await chart.getByRole("button", { name: "View", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Table" }).click();
    await expect(chart.locator(".ag-header-cell", { hasText: "Avg fill" })).toBeVisible();
    /* Using the report must not open the amend composer. */
    await expect(page.locator(".present-amend-input")).toHaveCount(0);
  });

  test("the left navigation collapses to a rail, opens reports, and stays collapsed", async ({ page }) => {
    /* Sibling reports in the rail belong to the connected workspace (a card
       on its own is one standalone report): open ESG from inside it. */
    await applyTemplate(page, "Analytics Home");
    await page.locator(".present-stage").getByRole("navigation", { name: "Workspaces" }).getByRole("button", { name: "Sustainable Investment", exact: true }).click();
    await settle(page);
    const side = page.locator(".present-stage .bp-sidebar");
    await expect(side.getByText("Corporate governance", { exact: true })).toBeVisible();
    /* Layout widths: the frame may be zoomed to fit. */
    const width = () => side.evaluate((el) => (el as HTMLElement).offsetWidth);
    expect(await width()).toBe(210);
    await side.getByRole("button", { name: "Collapse sidebar" }).click();
    await expect.poll(width).toBe(56);
    await expect(side.getByText("ES", { exact: true })).toBeVisible();
    /* A rail item opens its report; the rail stays. */
    await side.getByText("CG", { exact: true }).click();
    await expect(page.locator(".present-stage .dh-entity-title")).toHaveText("Avocado Inc");
    await expect(side.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
    await expect.poll(width).toBe(56);
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
      await expect(page.locator(".present-stage .dh-contextbar-title")).toHaveText("Risk", { timeout: 5_000 });
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

  test("Issuer reports: the Entity filter re-reads the page; a scorecard category filters its grids; a launcher opens a report", async ({ page }) => {
    await applyTemplate(page, "Issuer Climate");
    const stage = page.locator(".present-stage");
    await expect(stage.locator(".dh-entity-title")).toHaveText("Avocado Inc");
    await expect(stage.locator(".dh-verdict-status")).toHaveText("Aligned");
    await stage.getByRole("combobox", { name: "Entity" }).first().click();
    await page.getByRole("option", { name: "Helios Energy", exact: true }).click();
    await expect(stage.locator(".dh-entity-title")).toHaveText("Helios Energy");
    await expect(stage.locator(".dh-verdict-status")).toHaveText("Misaligned");
    await expect(stage.locator('section[aria-label="Emissions summary"] .highcharts-legend-item').first()).toContainText("Helios Energy");

    await applyTemplateFromChat(page, "use the governance scorecard template");
    const positive = stage.locator('section[aria-label="Positive"] .ag-center-cols-container .ag-row');
    await expect(positive).toHaveCount(6);
    const productCard = stage.locator(".dh-tile-selectable", { hasText: "Product & Service Mix" });
    await productCard.click();
    await expect(positive).toHaveCount(9);
    await expect(productCard).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".present-amend-input")).toHaveCount(0);

    await applyTemplateFromChat(page, "use the analytics home template");
    await expect(stage.locator(".dh-launcher")).toHaveCount(4);
    await stage.locator(".dh-launcher", { hasText: "Risk" }).getByRole("button", { name: /Open report/ }).click();
    await expect(stage.locator(".dh-contextbar-title")).toHaveText("Risk");
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
        expect.soft(report.narrowest, `${tpl.label}: narrowest panel`).toBeGreaterThanOrEqual(device.name === "phone" ? tpl.minPanel : Math.min(240, tpl.minPanel));
      });
    }
  }
});
