import { test, expect, type Locator, type Page } from "@playwright/test";

/**
 * FX Execution, PR D: the sample order workflow.
 *
 *   - The ticket opens from every launcher (the header's S and B quote
 *     tiles, Fill now, a price tag's menu, the BID tag dragged), validates,
 *     and on Submit says exactly "Sample order. Nothing was sent." in one
 *     polite toast, with focus back on the launcher. Nothing is requested.
 *   - The working order's limit is amended by dragging its tag or its line
 *     (a read-out follows, snapped to 0.00001; Escape cancels), and from the
 *     keyboard (arrows, Enter, the Amend dialog). A filled order cannot be.
 *   - Compare opens a ten-measure table and a small chart.
 *   - Dialogs and menus are each design system's own; focus stays inside,
 *     Escape closes them and nothing else, focus returns.
 *   - Present only: Edit is static. Reset on the feed returns to the seed.
 *
 * Sample data only: nothing connects to a market or sends an order.
 */

const SYSTEMS = ["Salt DS", "Material 3", "Fluent 2", "uoaui", "Carbon"] as const;
const CONFIRMATION = "Sample order. Nothing was sent.";
const PRICE = /^\d\.\d{5}$/;

function chatInput(page: Page) {
  return page.getByRole("textbox", { name: "Chat message input" });
}

async function applyFx(page: Page, opts: { paused?: boolean } = {}) {
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(chatInput(page)).toBeVisible({ timeout: 30_000 });
  /* Clicked before the page has hydrated, the gallery does not open: retry. */
  const use = page.getByRole("button", { name: "Use the FX Execution template" });
  await expect(async () => {
    if (!(await use.isVisible())) await page.getByRole("button", { name: /Browse templates/ }).click();
    await expect(use).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  await use.click();
  await expect(page.locator(".present-stage .dh-exec .highcharts-root")).toBeVisible({ timeout: 30_000 });
  if (opts.paused !== false) {
    await stage(page).getByRole("button", { name: "Pause the sample feed" }).click();
    await expect(stage(page).locator(".dh-feed-status")).toHaveClass(/is-paused/);
  }
  await expect(limitTag(page)).toBeVisible();
}

async function pickSystem(page: Page, system: (typeof SYSTEMS)[number]) {
  if (system === "Salt DS") return;
  await page.getByRole("button", { name: /^Design system:/ }).click();
  await page.getByText(system, { exact: true }).last().click();
  await expect(limitTag(page)).toBeVisible();
}

const stage = (page: Page) => page.locator(".present-stage");
const dialog = (page: Page) => page.getByRole("dialog");
const toast = (page: Page) => stage(page).locator(".dh-order-toast");
const limitTag = (page: Page) => stage(page).locator(".dh-order-tag-limit");
const bidTag = (page: Page) => stage(page).locator(".dh-order-tag-bid");
const readout = (page: Page) => stage(page).locator(".dh-order-readout");
const sellTile = (page: Page) => stage(page).getByRole("button", { name: /^Sell EUR at/ });
const buyTile = (page: Page) => stage(page).getByRole("button", { name: /^Buy EUR at/ });
const fillNow = (page: Page) => stage(page).getByRole("button", { name: "Fill now" });
const compare = (page: Page) => stage(page).getByRole("button", { name: "Compare orders" });
const submit = (page: Page) => page.getByRole("button", { name: "Submit sample order" });
const priceOf = (tag: Locator) => tag.getAttribute("data-price");
const stillPresenting = (page: Page) => expect(page.locator(".present-stage .dh-exec")).toBeVisible();

async function centre(locator: Locator) {
  const box = (await locator.boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Press on a tag, move it by `dy`, and leave the button down. */
async function dragStart(page: Page, tag: Locator, dy: number) {
  const from = await centre(tag);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x, from.y + dy, { steps: 8 });
}

async function expectTicket(page: Page, side: "BUY" | "SELL", type: string) {
  await expect(dialog(page)).toBeVisible();
  await expect(dialog(page)).toContainText("EURUSD order ticket");
  await expect(dialog(page)).toContainText("Sample data. Nothing is sent.");
  await expect(page.locator("#dh-ticket-direction")).toHaveValue(side === "BUY" ? "Buy EUR, sell USD" : "Sell EUR, buy USD");
  const priceLabel = type === "Stop" ? "Stop price" : type === "Take profit" ? "Take profit price" : "Limit price";
  await expect(page.locator('[data-field="dh-ticket-price"]')).toContainText(priceLabel);
  await expect(page.locator("#dh-ticket-price")).toHaveValue(PRICE);
}

async function closeWithEscape(page: Page, launcher: Locator) {
  await page.keyboard.press("Escape");
  await expect(dialog(page)).toHaveCount(0);
  await stillPresenting(page);
  await expect(launcher).toBeFocused();
}

test.describe("Builder - FX Execution sample orders", () => {
  test("the ticket opens from every launcher, at that launcher's side and price, and Escape gives focus back", async ({ page }) => {
    await applyFx(page);

    await sellTile(page).click();
    await expectTicket(page, "SELL", "Stop");
    await closeWithEscape(page, sellTile(page));

    await buyTile(page).click();
    await expectTicket(page, "BUY", "Limit");
    await closeWithEscape(page, buyTile(page));

    await fillNow(page).click();
    await expectTicket(page, "BUY", "Limit");
    await closeWithEscape(page, fillNow(page));

    /* The price menu, from a tag: Buy limit, Sell stop, Add order. */
    const limit = await priceOf(limitTag(page));
    for (const [item, side, type] of [["Buy limit at", "BUY", "Limit"], ["Sell stop at", "SELL", "Stop"], ["Add order at", "BUY", "Limit"]] as const) {
      await limitTag(page).click();
      await page.getByRole("menuitem", { name: `${item} ${limit}` }).click();
      await expectTicket(page, side, type);
      await expect(page.locator("#dh-ticket-price")).toHaveValue(limit!);
      await closeWithEscape(page, limitTag(page));
    }
  });

  test("the BID tag dragged stages a ticket: above the market a SELL take profit, below a BUY limit", async ({ page }) => {
    await applyFx(page);
    await dragStart(page, bidTag(page), -80);
    await expect(readout(page)).toHaveText(/^SELL TP \d\.\d{5}$/);
    const up = (await readout(page).textContent())!.split(" ")[2];
    await page.mouse.up();
    await expectTicket(page, "SELL", "Take profit");
    await expect(page.locator("#dh-ticket-price")).toHaveValue(up);
    await closeWithEscape(page, bidTag(page));

    await dragStart(page, bidTag(page), 60);
    await expect(readout(page)).toHaveText(/^BUY LMT \d\.\d{5}$/);
    const down = (await readout(page).textContent())!.split(" ")[2];
    await page.mouse.up();
    await expectTicket(page, "BUY", "Limit");
    await expect(page.locator("#dh-ticket-price")).toHaveValue(down);
    expect(Number(down)).toBeLessThan(Number(up));
    await closeWithEscape(page, bidTag(page));
    /* A press that does not move is a click: the price menu. */
    await bidTag(page).click();
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await stillPresenting(page);
  });

  test("Submit validates, then confirms in one polite toast, draws the order for the session, and requests nothing", async ({ page }) => {
    await applyFx(page);
    /* Anything the page asks the network for from here on is recorded. */
    await page.evaluate(() => {
      const w = window as unknown as { __sent: string[] };
      w.__sent = [];
      const note = (kind: string, url: unknown) => w.__sent.push(`${kind} ${String(url)}`);
      const realFetch = window.fetch;
      window.fetch = (...args: Parameters<typeof fetch>) => { note("fetch", args[0] instanceof Request ? args[0].url : args[0]); return realFetch(...args); };
      const open = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (this: XMLHttpRequest, ...args: unknown[]) { note("xhr", args[1]); return (open as (...a: unknown[]) => void).apply(this, args); } as typeof XMLHttpRequest.prototype.open;
      const beacon = navigator.sendBeacon?.bind(navigator);
      if (beacon) navigator.sendBeacon = (url, data) => { note("beacon", url); return beacon(url, data); };
      const RealSocket = window.WebSocket;
      window.WebSocket = new Proxy(RealSocket, { construct(target, args) { note("websocket", args[0]); return new target(...(args as [string])); } });
    });
    /* Each dialog is opened once first, so a typeface it uses is already
       loaded: from here on any request at all is a failure, with no exceptions. */
    await compare(page).click();
    await expect(dialog(page)).toContainText("Compare orders");
    await closeWithEscape(page, compare(page));
    await limitTag(page).focus();
    await page.keyboard.press("Enter");
    await expect(dialog(page)).toContainText("Amend limit price");
    await closeWithEscape(page, limitTag(page));
    for (const tag of [limitTag(page), bidTag(page)]) {
      await dragStart(page, tag, -30);
      await expect(readout(page)).toHaveCount(1);
      await page.keyboard.press("Escape");
      await page.mouse.up();
    }
    await page.evaluate(() => document.fonts.ready);
    const requests: string[] = [];
    page.on("request", (r) => requests.push(`${r.method()} ${r.url()}`));

    await fillNow(page).click();
    await expectTicket(page, "BUY", "Limit");

    /* A notional that is not a positive number, and a price far from the market. */
    await page.locator("#dh-ticket-notional").fill("0");
    await page.locator("#dh-ticket-price").fill("1.2");
    await submit(page).click();
    await expect(dialog(page)).toContainText("Enter a notional above zero");
    await expect(dialog(page)).toContainText(/Enter a price between \d\.\d{5} and \d\.\d{5}\./);
    /* Focus is on the first field to fix. */
    await expect(page.locator("#dh-ticket-notional")).toBeFocused();
    /* Too small and too large are refused in words; leaving the field tidies the number. */
    await page.locator("#dh-ticket-notional").fill("0.4");
    await expect(dialog(page)).toContainText("Enter a notional of at least 1,000.");
    await page.locator("#dh-ticket-notional").fill("1e24");
    await expect(dialog(page)).toContainText("Enter a notional above zero");
    await page.locator("#dh-ticket-notional").fill("5000000000");
    await expect(dialog(page)).toContainText("Enter a notional of at most 1,000,000,000.");
    await page.locator("#dh-ticket-notional").fill("2.5m");
    await page.locator("#dh-ticket-price").focus();
    await expect(page.locator("#dh-ticket-notional")).toHaveValue("2,500,000");
    await expect(toast(page)).toHaveText("");
    await expect(stage(page).locator(".dh-order-placed")).toHaveCount(0);

    await page.locator("#dh-ticket-notional").fill("2,500,000");
    await page.locator("#dh-ticket-price").fill("1.37650");
    await expect(dialog(page)).not.toContainText("Enter a notional above zero");
    requests.length = 0;
    await page.evaluate(() => { (window as unknown as { __sent: string[] }).__sent.length = 0; });
    await submit(page).click();

    await expect(dialog(page)).toHaveCount(0);
    await expect(toast(page)).toHaveText(CONFIRMATION);
    await expect(toast(page)).toHaveAttribute("aria-live", "polite");
    /* One live region for the workflow, one message in it. */
    await expect(stage(page).locator('.dh-exec [role="status"]')).toHaveCount(1);
    await expect(toast(page).locator("> span")).toHaveCount(1);
    await expect(fillNow(page)).toBeFocused();
    /* The order is on the chart, at its price. */
    await expect(stage(page).locator(".dh-order-placed-label")).toHaveText("SAMPLE BUY 1.37650");
    await expect(stage(page).locator(".dh-feed-note")).toHaveText("Sample data");
    /* The toast goes after four seconds; nothing was asked of the network in all that time. */
    await expect(toast(page)).toHaveText("", { timeout: 6_000 });
    expect(requests, `requests during submit: ${requests.join(", ")}`).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __sent: string[] }).__sent)).toEqual([]);
    /* The rest of the workflow asks for nothing either: an amendment by drag
       and by dialog, a staged ticket, Compare. */
    await dragStart(page, limitTag(page), 40);
    await page.mouse.up();
    await expect(toast(page)).toHaveText(CONFIRMATION);
    await limitTag(page).focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Amend", exact: true }).click();
    await expect(dialog(page)).toHaveCount(0);
    await dragStart(page, bidTag(page), -60);
    await page.mouse.up();
    await expectTicket(page, "SELL", "Take profit");
    await submit(page).click();
    await expect(dialog(page)).toHaveCount(0);
    await compare(page).click();
    await expect(dialog(page)).toContainText("Compare orders");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await expect(toast(page)).toHaveText("", { timeout: 6_000 });
    expect(requests, `requests during the workflow: ${requests.join(", ")}`).toEqual([]);
    expect(await page.evaluate(() => (window as unknown as { __sent: string[] }).__sent)).toEqual([]);
    /* Nothing reached the saved session either. */
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
    expect(stored).not.toContain("1.37650");
    expect(stored).not.toContain("2500000");
  });

  test("a second confirmation replaces the first: the toast never stacks", async ({ page }) => {
    await applyFx(page);
    for (const tile of [sellTile(page), buyTile(page)]) {
      await tile.click();
      await submit(page).click();
      await expect(toast(page)).toHaveText(CONFIRMATION);
    }
    await expect(toast(page).locator("> span")).toHaveCount(1);
    await expect(stage(page).locator(".dh-order-placed")).toHaveCount(2);
  });

  test("dragging the LMT tag amends the limit: a read-out follows, snapped; release steps the limit; Escape cancels", async ({ page }) => {
    await applyFx(page);
    const before = (await priceOf(limitTag(page)))!;

    /* Escape during the drag: nothing changes, and Present stays. */
    await dragStart(page, limitTag(page), 50);
    await expect(readout(page)).toHaveText(/^LMT → \d\.\d{5}$/);
    await page.keyboard.press("Escape");
    await expect(readout(page)).toHaveCount(0);
    await page.mouse.up();
    await stillPresenting(page);
    expect(await priceOf(limitTag(page))).toBe(before);
    await expect(toast(page)).toHaveText("");

    await dragStart(page, limitTag(page), 50);
    const shown = (await readout(page).textContent())!.replace("LMT → ", "");
    expect(shown).toMatch(PRICE);
    expect(Number(shown)).toBeLessThan(Number(before));
    await page.mouse.up();
    await expect(readout(page)).toHaveCount(0);
    /* The drop commits: no dialog, one toast, focus on the tag. */
    await expect(dialog(page)).toHaveCount(0);
    await expect(toast(page)).toHaveText(CONFIRMATION);
    await expect(toast(page).locator("> span")).toHaveCount(1);
    await expect.poll(() => priceOf(limitTag(page))).toBe(shown);
    await expect(limitTag(page)).toBeFocused();
    /* The drawn limit series steps: its last point is the new limit, the one before is the old. */
    await expect(stage(page).locator(".dh-exec")).toHaveAttribute("data-limit-tail", `${before},${shown}`);
  });

  test("the limit line itself can be grabbed and dragged", async ({ page }) => {
    await applyFx(page);
    const before = (await priceOf(limitTag(page)))!;
    const plot = (await stage(page).locator(".dh-exec .highcharts-plot-background").boundingBox())!;
    const tag = await centre(limitTag(page));
    const x = plot.x + plot.width - 60;
    await page.mouse.move(x, tag.y);
    await expect(stage(page).locator(".dh-exec-plot")).toHaveCSS("cursor", "ns-resize");
    await page.mouse.down();
    await page.mouse.move(x, tag.y + 70, { steps: 8 });
    await expect(readout(page)).toHaveText(/^LMT → \d\.\d{5}$/);
    const shown = (await readout(page).textContent())!.replace("LMT → ", "");
    await page.mouse.up();
    await expect(dialog(page)).toHaveCount(0);
    await expect(toast(page)).toHaveText(CONFIRMATION);
    await expect.poll(() => priceOf(limitTag(page))).toBe(shown);
    expect(shown).not.toBe(before);
    await expect(limitTag(page)).toBeFocused();
  });

  for (const interval of ["15m", "30m"]) {
    test(`${interval} bars: a dropped limit is drawn, not only confirmed`, async ({ page }) => {
      await applyFx(page);
      const chart = stage(page).locator(".dh-exec");
      await chart.getByRole("button", { name: "Interval", exact: true }).click();
      await page.getByRole("menuitemradio", { name: interval, exact: true }).click();
      await expect(limitTag(page)).toBeVisible();
      const before = (await priceOf(limitTag(page)))!;
      await dragStart(page, limitTag(page), 40);
      const shown = (await readout(page).textContent())!.replace("LMT → ", "");
      await page.mouse.up();
      await expect(toast(page)).toHaveText(CONFIRMATION);
      await expect.poll(() => priceOf(limitTag(page))).toBe(shown);
      expect(shown).not.toBe(before);
      await expect(stage(page).locator(".dh-exec")).toHaveAttribute("data-limit-tail", new RegExp(`${shown.replace(".", "\\.")}$`));
    });
  }

  test("Amend reads the limit as amended: 'Limit now' follows, and amending back to the seed price is a change", async ({ page }) => {
    await applyFx(page);
    const seed = (await priceOf(limitTag(page)))!;
    const amendButton = page.getByRole("button", { name: "Amend", exact: true });
    const open = async () => { await limitTag(page).focus(); await page.keyboard.press("Enter"); await expect(dialog(page)).toContainText("Amend limit price"); };
    await open();
    await expect(dialog(page)).toContainText(`Limit now ${seed}`);
    await page.locator("#dh-amend-price").fill("1.37650");
    await amendButton.click();
    await expect.poll(() => priceOf(limitTag(page))).toBe("1.37650");
    await open();
    await expect(dialog(page)).toContainText("Limit now 1.37650");
    await expect(page.locator("#dh-amend-price")).toHaveValue("1.37650");
    await page.locator("#dh-amend-price").fill(seed);
    await amendButton.click();
    await expect(toast(page)).toHaveText(CONFIRMATION);
    await expect.poll(() => priceOf(limitTag(page))).toBe(seed);
  });

  test("Table view has no tag targets; the ticket still opens from the header; the chart's tags come back", async ({ page }) => {
    await applyFx(page);
    const chart = stage(page).locator(".dh-exec");
    await expect(page.locator(".dh-order-tag")).toHaveCount(2);
    await chart.getByRole("button", { name: "View", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Table" }).click();
    await expect(chart.locator("[role='treegrid'], [role='grid']").first()).toBeVisible();
    await expect(page.locator(".dh-order-tag")).toHaveCount(0);
    await expect(page.locator('.dh-exec [role="slider"]')).toHaveCount(0);
    await fillNow(page).click();
    await expectTicket(page, "BUY", "Limit");
    await closeWithEscape(page, fillNow(page));
    await chart.getByRole("button", { name: "View", exact: true }).click();
    await page.getByRole("menuitemradio", { name: "Chart" }).click();
    await expect(page.locator(".dh-order-tag")).toHaveCount(2);
  });

  test("a press, a drag and the arrow keys on a tag never reach the chart's own listeners", async ({ page }) => {
    await applyFx(page);
    await stage(page).locator(".dh-exec-plot").evaluate((plot) => {
      const w = window as unknown as { __leaked: string[] };
      w.__leaked = [];
      for (const type of ["pointerdown", "pointermove", "pointerup", "mousedown", "mousemove", "mouseup", "touchstart", "keydown"]) {
        plot.addEventListener(type, (e) => { if ((e.target as Element).closest?.(".dh-order-tag") && (type !== "keydown" || /^Arrow|^Page|^Enter$/.test((e as KeyboardEvent).key))) w.__leaked.push(type); });
      }
    });
    for (const tag of [limitTag(page), bidTag(page)]) {
      await dragStart(page, tag, 30);
      await expect(readout(page)).toHaveCount(1);
      await page.keyboard.press("Escape");
      await page.mouse.up();
      await tag.focus();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("PageUp");
      await page.keyboard.press("Escape");
    }
    expect(await page.evaluate(() => (window as unknown as { __leaked: string[] }).__leaked)).toEqual([]);
    await stillPresenting(page);
  });

  test("the focused BID tag keeps the price it had when focused: it is not read out on every tick", async ({ page }) => {
    await applyFx(page, { paused: false });
    await bidTag(page).focus();
    await expect(bidTag(page)).toHaveAttribute("aria-live", "off");
    const heard = await bidTag(page).getAttribute("aria-valuetext");
    const first = await priceOf(bidTag(page));
    await expect.poll(() => priceOf(bidTag(page)), { timeout: 15_000 }).not.toBe(first);
    expect(await bidTag(page).getAttribute("aria-valuetext")).toBe(heard);
  });

  test("keyboard: arrows step the limit by 0.00001, Enter opens Amend with that price, the dialog's field amends, focus returns", async ({ page }) => {
    await applyFx(page);
    const before = Number(await priceOf(limitTag(page)));
    await limitTag(page).focus();
    await expect(limitTag(page)).toHaveAttribute("role", "slider");
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowDown");
    await expect(limitTag(page)).toHaveAttribute("aria-valuetext", (before - 0.00003).toFixed(5));
    await expect(readout(page)).toHaveText(`LMT → ${(before - 0.00003).toFixed(5)}`);
    await page.keyboard.press("Shift+ArrowUp");
    await expect(limitTag(page)).toHaveAttribute("aria-valuetext", (before + 0.00007).toFixed(5));
    /* Escape drops the stepped price and stays in Present. */
    await page.keyboard.press("Escape");
    await expect(readout(page)).toHaveCount(0);
    await stillPresenting(page);
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(dialog(page)).toContainText("Amend limit price");
    const field = page.locator("#dh-amend-price");
    await expect(field).toHaveValue((before - 0.00001).toFixed(5));
    /* Out of the band: refused, in words. */
    await field.fill("2.5");
    await page.getByRole("button", { name: "Amend", exact: true }).click();
    await expect(dialog(page)).toContainText(/Enter a price between/);
    /* Typed to six decimals: snapped to five. Enter submits. */
    await field.fill("1.376412");
    await field.press("Enter");
    await expect(dialog(page)).toHaveCount(0);
    await expect(toast(page)).toHaveText(CONFIRMATION);
    await expect.poll(() => priceOf(limitTag(page))).toBe("1.37641");
    await expect(limitTag(page)).toBeFocused();
    await stillPresenting(page);
  });

  test("a filled order cannot be amended: no drag, no steps, and the menu's Amend is off", async ({ page }) => {
    await applyFx(page);
    await stage(page).getByRole("tab", { name: /SELL/ }).click();
    await expect(stage(page).locator(".dh-instrument-order.is-active")).toContainText("SELL");
    await expect(limitTag(page)).toBeVisible();
    await expect(limitTag(page)).not.toHaveAttribute("role", "slider");
    const before = await priceOf(limitTag(page));
    await dragStart(page, limitTag(page), 40);
    await expect(readout(page)).toHaveCount(0);
    await page.mouse.up();
    expect(await priceOf(limitTag(page))).toBe(before);
    /* The press was a click: the menu, with Amend switched off. */
    const amend = page.getByRole("menuitem", { name: /Amend limit price/ });
    await expect(amend).toBeVisible();
    await expect(amend).toBeDisabled();
    await page.keyboard.press("Escape");
    await stillPresenting(page);
  });

  test("Compare opens the ten measures for both orders and a percent-done chart", async ({ page }) => {
    await applyFx(page);
    await compare(page).click();
    await expect(dialog(page)).toContainText("Compare orders");
    const rows = dialog(page).locator("tbody tr");
    await expect(rows).toHaveCount(10);
    for (const measure of ["Status", "Duration", "Amount done", "Fills", "Passive %", "Slippage vs arrival", "Avg fill vs TWAP", "Avg spread capture", "Avg 1-bar markout", "Top venue"]) {
      await expect(dialog(page).locator("tbody")).toContainText(measure);
    }
    await expect(dialog(page).locator("thead")).toContainText("BUY FO-0002LQD");
    await expect(dialog(page).locator("thead")).toContainText("SELL FO-0002LQE");
    await expect(dialog(page).locator(".highcharts-series.highcharts-line-series")).toHaveCount(2);
    await closeWithEscape(page, compare(page));
  });

  test("Reset on the feed returns to the seeded session: the amendment and the sample order go", async ({ page }) => {
    await applyFx(page, { paused: false });
    await expect.poll(async () => Number(await stage(page).locator(".dh-exec").getAttribute("data-feed-bars")), { timeout: 10_000 }).toBeGreaterThanOrEqual(2);
    await stage(page).getByRole("button", { name: "Pause the sample feed" }).click();
    const seeded = await priceOf(limitTag(page));
    await limitTag(page).focus();
    await page.keyboard.press("PageDown");
    await page.keyboard.press("Enter");
    await page.getByRole("button", { name: "Amend", exact: true }).click();
    await expect.poll(() => priceOf(limitTag(page))).not.toBe(seeded);
    await fillNow(page).click();
    await submit(page).click();
    await expect(stage(page).locator(".dh-order-placed")).toHaveCount(1);

    await stage(page).getByRole("button", { name: "Reset the sample feed" }).click();
    await expect.poll(() => priceOf(limitTag(page))).toBe(seeded);
    await expect(stage(page).locator(".dh-order-placed")).toHaveCount(0);
    await expect(toast(page)).toHaveText("");
  });

  test("Edit is static: no tag targets, the quote's sides are not controls, the launchers do nothing", async ({ page }) => {
    await applyFx(page);
    await page.getByRole("button", { name: "Edit canvas" }).click();
    const edit = page.locator(".bp-viewport-wrapper");
    await expect(page.locator(".present-stage")).toHaveCount(0);
    await expect(edit.locator(".dh-exec .highcharts-root")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator(".dh-order-tag")).toHaveCount(0);
    await expect(page.locator(".dh-order-toast")).toHaveCount(0);
    const side = page.locator("button.dh-instrument-side").first();
    await expect(side).toHaveAttribute("aria-disabled", "true");
    await expect(side).toHaveCSS("pointer-events", "none");
    /* Compare and Fill now say they are off, and are not tab stops. */
    for (const name of ["Fill now", "Compare orders"]) {
      const b = edit.getByRole("button", { name });
      await expect(b).toHaveAttribute("aria-disabled", "true");
      await expect(b).toHaveAttribute("tabindex", "-1");
      await b.click({ force: true });
    }
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("Edit keeps the builder's gestures: a press and drag on the limit line draws no read-out, and a click selects the block", async ({ page }) => {
    await applyFx(page);
    await page.getByRole("button", { name: "Edit canvas" }).click();
    const edit = page.locator(".bp-viewport-wrapper");
    await expect(edit.locator(".dh-exec .highcharts-root")).toBeVisible({ timeout: 30_000 });
    const pill = (await edit.locator(".dh-exec .dh-exec-pill-limit").boundingBox())!;
    const plot = (await edit.locator(".dh-exec .highcharts-plot-background").boundingBox())!;
    const y = pill.y + pill.height / 2;
    const x = plot.x + plot.width - 60;
    await page.mouse.move(x, y);
    await expect(edit.locator(".dh-exec-plot")).not.toHaveCSS("cursor", "ns-resize");
    await page.mouse.down();
    await page.mouse.move(x, y + 3, { steps: 2 });
    await expect(page.locator(".dh-order-readout, .dh-order-preview")).toHaveCount(0);
    await page.mouse.up();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("menu")).toHaveCount(0);
    /* The press was the builder's: the chart block is selected. */
    await expect(edit.locator(".is-selected").filter({ has: page.locator(".dh-exec") })).toHaveCount(1);
  });

  test("the drag reads its price from the drawn axis: right after the window changes size", async ({ page }) => {
    await applyFx(page);
    for (const size of [{ width: 1180, height: 760 }, { width: 1500, height: 940 }]) {
      await page.setViewportSize(size);
      await expect(limitTag(page)).toBeVisible();
      /* The chart has settled at the new size when its tag target stops moving. */
      let last = -1;
      await expect.poll(async () => { const y = (await centre(limitTag(page))).y; const still = Math.abs(y - last) < 0.5; last = y; return still; }, { timeout: 10_000 }).toBe(true);
      const price = Number(await priceOf(limitTag(page)));
      /* Out and back to where it was pressed: the read-out is the tag's own price, to a pixel's worth. */
      const from = await centre(limitTag(page));
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      await page.mouse.move(from.x, from.y + 40, { steps: 6 });
      const away = Number((await readout(page).textContent())!.replace("LMT → ", ""));
      expect(away).toBeLessThan(price);
      await page.mouse.move(from.x, from.y, { steps: 6 });
      const back = Number((await readout(page).textContent())!.replace("LMT → ", ""));
      expect(Math.abs(back - price), `${size.width}px: ${back} against ${price}`).toBeLessThanOrEqual(0.00004);
      await page.keyboard.press("Escape");
      await page.mouse.up();
      await expect(readout(page)).toHaveCount(0);
      await expect(dialog(page)).toHaveCount(0);
    }
  });

  for (const system of SYSTEMS) {
    test(`${system}: the ticket, Amend and the price menu are the system's own; focus stays inside and returns`, async ({ page }) => {
      const own: Record<(typeof SYSTEMS)[number], { dialog: RegExp; menu: RegExp; button: RegExp }> = {
        "Salt DS": { dialog: /saltDialog/, menu: /saltMenuPanel/, button: /saltButton/ },
        "Material 3": { dialog: /MuiDialog/, menu: /MuiMenu|MuiList/, button: /MuiButton/ },
        "Fluent 2": { dialog: /fui-DialogSurface/, menu: /fui-MenuList|fui-MenuPopover/, button: /fui-Button/ },
        uoaui: { dialog: /a-dialog/, menu: /a-dropdown-menu/, button: /a-btn/ },
        Carbon: { dialog: /cds--modal/, menu: /cds--menu/, button: /cds--btn/ },
      };
      await applyFx(page);
      await pickSystem(page, system);

      await sellTile(page).click();
      await expectTicket(page, "SELL", "Stop");
      const classes = await page.evaluate(() => {
        const d = document.querySelector('[role="dialog"]')!;
        return [d, d.parentElement, ...d.querySelectorAll("*")].map((el) => (el as Element | null)?.getAttribute?.("class") ?? "").join(" ");
      });
      expect(classes).toMatch(own[system].dialog);
      await expect(submit(page)).toHaveClass(own[system].button);
      /* Tab stays inside the dialog all the way round. */
      const seen = new Set<string>();
      for (let i = 0; i < 24; i++) {
        await page.keyboard.press("Tab");
        /* As a person tabs (Carbon wraps focus a tick after the key). */
        await page.waitForTimeout(60);
        const at = await page.evaluate(() => {
          const a = document.activeElement;
          const behind = !a || a === document.body || Boolean(a.closest(".present-stage"));
          return { behind, id: a?.id || a?.textContent?.trim().slice(0, 24) || a?.tagName || "" };
        });
        expect(at.behind, `Tab ${i + 1} reached the page behind the dialog (${at.id})`).toBe(false);
        seen.add(at.id);
      }
      /* Round and round inside: the fields and Submit were all reached. */
      for (const id of ["dh-ticket-notional", "dh-ticket-price", "dh-ticket-iceberg"]) expect([...seen], `${id} is a tab stop`).toContain(id);
      /* Pick the other side with its tile: the price follows the touch. */
      await dialog(page).locator(".dh-kit-tile", { hasText: /Buy EUR at/ }).click();
      await expect(page.locator("#dh-ticket-direction")).toHaveValue("Buy EUR, sell USD");
      await closeWithEscape(page, sellTile(page));

      /* The price menu, then Amend from it. */
      await limitTag(page).click();
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      const menuClasses = await menu.evaluate((m) => [m, m.parentElement, m.parentElement?.parentElement].map((el) => el?.getAttribute("class") ?? "").join(" "));
      expect(menuClasses).toMatch(own[system].menu);
      await expect(page.getByRole("menuitem")).toHaveCount(5);
      await page.getByRole("menuitem", { name: "Amend limit price" }).click();
      await expect(dialog(page)).toContainText("Amend limit price");
      await page.locator("#dh-amend-price").fill("1.37610");
      await page.getByRole("button", { name: "Amend", exact: true }).click();
      await expect(toast(page)).toHaveText(CONFIRMATION);
      await expect.poll(() => priceOf(limitTag(page))).toBe("1.37610");
      await expect(limitTag(page)).toBeFocused();
      await stillPresenting(page);
    });
  }

  test("the tag targets are at least 24px and named; a keyboard reader gets the menu from Shift+F10", async ({ page }) => {
    await applyFx(page);
    const zoom = Number(await page.locator(".present-stage .bp-device-frame").getAttribute("data-frame-zoom")) || 1;
    for (const tag of [limitTag(page), bidTag(page)]) {
      const box = (await tag.boundingBox())!;
      expect(box.height / zoom).toBeGreaterThanOrEqual(24);
      expect(box.width / zoom).toBeGreaterThanOrEqual(24);
    }
    await expect(limitTag(page)).toHaveAccessibleName("Limit price");
    await expect(bidTag(page)).toHaveAccessibleName("Latest bid");
    await bidTag(page).focus();
    await page.keyboard.press("Shift+F10");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expect(bidTag(page)).toBeFocused();
    /* Arrows on the BID tag stage a price; Enter opens the ticket there. */
    await page.keyboard.press("Shift+ArrowDown");
    await expect(readout(page)).toHaveText(/^BUY LMT \d\.\d{5}$/);
    await page.keyboard.press("Enter");
    await expectTicket(page, "BUY", "Limit");
    await closeWithEscape(page, bidTag(page));
  });
});

test.describe("Builder - FX Execution sample orders, on a zoomed chart (FX B's navigation)", () => {
  const plot = (page: Page) => stage(page).locator(".dh-exec-plot");
  const view = async (page: Page) => `${await plot(page).getAttribute("data-view-x")} | ${await plot(page).getAttribute("data-view-y")}`;
  const ctrlWheel = async (page: Page, dy: number) => { await page.keyboard.down("Control"); await page.mouse.wheel(0, dy); await page.keyboard.up("Control"); };
  const area = async (page: Page) => (await plot(page).locator(".highcharts-plot-background").boundingBox())!;

  test("time and price zoomed: the limit drag reads the drawn axis and commits that price; no pan, no price-axis drag, no key pan", async ({ page }) => {
    await applyFx(page);
    const a = await area(page);
    /* Zoom time over the plot, then price over the gutter, anchored on the LMT tag so it stays on the scale. */
    await page.mouse.move(a.x + a.width * 0.7, a.y + a.height * 0.4);
    await ctrlWheel(page, -300);
    await expect.poll(() => plot(page).getAttribute("data-view-x")).not.toBeNull();
    const tagY = (await centre(limitTag(page))).y;
    await page.mouse.move(a.x + a.width + 30, tagY);
    await ctrlWheel(page, -200);
    await expect.poll(() => plot(page).getAttribute("data-view-y")).not.toBeNull();
    await expect(limitTag(page)).toBeVisible();
    let last = -1;
    await expect.poll(async () => { const y = (await centre(limitTag(page))).y; const still = Math.abs(y - last) < 0.5; last = y; return still; }, { timeout: 10_000 }).toBe(true);
    const zoomed = await view(page);
    const price = Number(await priceOf(limitTag(page)));

    /* Out and back: the read-out is the tag's own price again (a pixel is worth less on a zoomed scale). */
    const from = await centre(limitTag(page));
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x, from.y + 40, { steps: 6 });
    expect(Number((await readout(page).textContent())!.replace("LMT → ", ""))).toBeLessThan(price);
    await page.mouse.move(from.x, from.y, { steps: 6 });
    expect(Math.abs(Number((await readout(page).textContent())!.replace("LMT → ", "")) - price)).toBeLessThanOrEqual(0.00004);
    /* Dropped lower: that price is the limit, and the view has not moved. */
    await page.mouse.move(from.x, from.y + 30, { steps: 6 });
    const shown = (await readout(page).textContent())!.replace("LMT → ", "");
    await page.mouse.up();
    await expect(toast(page)).toHaveText(CONFIRMATION);
    await expect.poll(() => priceOf(limitTag(page))).toBe(shown);
    expect(await view(page)).toBe(zoomed);

    /* The line itself, grabbed in the plot: an amendment, not a pan. */
    const line = await centre(limitTag(page));
    const x = a.x + a.width - 60;
    await page.mouse.move(x, line.y);
    await page.mouse.down();
    await page.mouse.move(x, line.y + 24, { steps: 6 });
    await expect(readout(page)).toHaveText(/^LMT → \d\.\d{5}$/);
    const second = (await readout(page).textContent())!.replace("LMT → ", "");
    await page.mouse.up();
    await expect.poll(() => priceOf(limitTag(page))).toBe(second);
    expect(await view(page)).toBe(zoomed);

    /* Arrow keys on a focused tag step its price; the chart does not pan. */
    await limitTag(page).focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowLeft");
    await expect(readout(page)).toHaveCount(1);
    await page.keyboard.press("Escape");
    expect(await view(page)).toBe(zoomed);
    await stillPresenting(page);

    /* The BID tag, if it is on the scale: staging, not a price-axis drag. */
    if (await bidTag(page).count()) {
      await dragStart(page, bidTag(page), -20);
      await page.mouse.up();
      await expect(dialog(page)).toContainText("EURUSD order ticket");
      await page.keyboard.press("Escape");
      await expect(dialog(page)).toHaveCount(0);
      expect(await view(page)).toBe(zoomed);
    }
    /* A plain press and drag in the plot is still the chart's pan. */
    await page.mouse.move(a.x + a.width * 0.5, a.y + a.height * 0.75);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width * 0.5 + 80, a.y + a.height * 0.75, { steps: 6 });
    await page.mouse.up();
    await expect.poll(() => view(page)).not.toBe(zoomed);
  });

  test("a tag off the zoomed price scale has no target, and comes back with it", async ({ page }) => {
    await applyFx(page);
    const a = await area(page);
    await expect(page.locator(".dh-order-tag")).toHaveCount(2);
    /* Zoom price far from the LMT tag (it is near the top): it leaves the scale. */
    await page.mouse.move(a.x + a.width + 30, a.y + a.height * 0.62);
    await expect(async () => { await ctrlWheel(page, -300); await expect(plot(page).locator(".dh-exec-pill-limit")).toHaveCount(0, { timeout: 500 }); }).toPass({ timeout: 15_000 });
    await expect(limitTag(page)).toHaveCount(0);
    /* Every target that is left sits on a drawn tag. */
    for (const key of ["limit", "bid"]) await expect(page.locator(`.dh-order-tag-${key}`)).toHaveCount(await plot(page).locator(`.dh-exec-pill-${key}`).count());
    await stage(page).getByRole("button", { name: "Reset view", exact: true }).click();
    await expect(page.locator(".dh-order-tag")).toHaveCount(2);
  });
});

test.describe("Builder - FX Execution sample orders, with the feed live", () => {
  for (const system of SYSTEMS) {
    test(`${system}: the price menu keeps focus where the reader put it while the feed ticks`, async ({ page }) => {
      await applyFx(page, { paused: false });
      await pickSystem(page, system);
      const bars = async () => Number(await stage(page).locator(".dh-exec").getAttribute("data-feed-bars"));
      await limitTag(page).click();
      await expect(page.getByRole("menu")).toBeVisible();
      const at = () => page.evaluate(() => (document.activeElement?.closest('[role="menu"]') ? document.activeElement?.textContent?.trim() ?? "" : ""));
      /* The menu has focus; the reader moves off its first item. */
      await expect.poll(at).not.toBe("");
      const firstItem = (await page.getByRole("menuitem").first().textContent())!.trim();
      await expect(async () => { await page.keyboard.press("ArrowDown"); expect(await at()).toMatch(/^(Add order|Sell stop|Amend)/); }).toPass({ timeout: 5_000 });
      const item = await at();
      expect(item).not.toBe(firstItem);
      const from = await bars();
      await expect.poll(bars, { timeout: 15_000 }).toBeGreaterThanOrEqual(from + 3);
      expect(await at()).toBe(item);
      await expect(page.getByRole("menu")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("menu")).toHaveCount(0);
      await stillPresenting(page);
    });
  }

  test("uoaui: the ticket keeps what was typed and where focus is while the feed ticks", async ({ page }) => {
    await applyFx(page, { paused: false });
    await pickSystem(page, "uoaui");
    const bars = async () => Number(await stage(page).locator(".dh-exec").getAttribute("data-feed-bars"));
    await fillNow(page).click();
    await page.locator("#dh-ticket-notional").fill("3,000,000");
    const from = await bars();
    await expect.poll(bars, { timeout: 15_000 }).toBeGreaterThanOrEqual(from + 3);
    await expect(page.locator("#dh-ticket-notional")).toBeFocused();
    await expect(page.locator("#dh-ticket-notional")).toHaveValue("3,000,000");
  });
});

test.describe("Builder - FX Execution sample orders, the uoaui dialog", () => {
  test("a click on the title keeps focus in the dialog; Tab stays inside; Escape closes it and Present stays", async ({ page }) => {
    await applyFx(page);
    await pickSystem(page, "uoaui");
    await fillNow(page).click();
    await expectTicket(page, "BUY", "Limit");
    await dialog(page).locator(".dh-kit-title").click();
    const where = () => page.evaluate(() => { const a = document.activeElement; return !a || a === document.body ? "page" : a.closest('[role="dialog"]') ? "dialog" : "behind"; });
    expect(await where()).toBe("dialog");
    for (let i = 0; i < 16; i++) { await page.keyboard.press("Tab"); expect(await where(), `Tab ${i + 1}`).toBe("dialog"); }
    for (let i = 0; i < 4; i++) { await page.keyboard.press("Shift+Tab"); expect(await where(), `Shift+Tab ${i + 1}`).toBe("dialog"); }
    await dialog(page).locator(".dh-kit-title").click();
    await closeWithEscape(page, fillNow(page));

    /* Focus sent to the page behind comes back, and Escape still closes the dialog only. */
    await fillNow(page).click();
    await expectTicket(page, "BUY", "Limit");
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
    await stillPresenting(page);
  });
});

test.describe("Builder - FX Execution sample orders, touch and phone", () => {
  test.use({ hasTouch: true });

  test("a tap on a tag opens its menu; a finger on a tag drags it; the plot still scrolls the page", async ({ page }) => {
    await applyFx(page);
    const at = await centre(limitTag(page));
    await page.touchscreen.tap(at.x, at.y);
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    /* Only the tag takes touch for itself. */
    await expect(limitTag(page)).toHaveCSS("touch-action", "none");
    await expect(stage(page).locator(".dh-exec-plot")).not.toHaveCSS("touch-action", "none");
    /* A touch drag of the tag (pointer events of type touch). */
    const before = await priceOf(limitTag(page));
    await limitTag(page).evaluate((el, y) => {
      const fire = (type: string, clientY: number) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: "touch", isPrimary: true, button: 0, buttons: type === "pointerup" ? 0 : 1, clientX: el.getBoundingClientRect().x + 10, clientY }));
      fire("pointerdown", y);
      for (let i = 1; i <= 6; i++) fire("pointermove", y + i * 8);
      fire("pointerup", y + 48);
    }, at.y);
    await expect(dialog(page)).toHaveCount(0);
    await expect(toast(page)).toHaveText(CONFIRMATION);
    expect(await priceOf(limitTag(page))).not.toBe(before);
  });

  test("tablet: the ticket fits, and the limit can be dragged", async ({ page }) => {
    await applyFx(page);
    await page.setViewportSize({ width: 834, height: 1112 });
    await page.getByRole("button", { name: /Tablet/i }).first().click();
    await expect(fillNow(page)).toBeVisible();
    await fillNow(page).scrollIntoViewIfNeeded();
    await fillNow(page).click();
    await expectTicket(page, "BUY", "Limit");
    const box = (await dialog(page).boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(835);
    expect(box.y).toBeGreaterThanOrEqual(-1);
    await submit(page).scrollIntoViewIfNeeded();
    await submit(page).click();
    await expect(toast(page)).toHaveText(CONFIRMATION);
    await expect(dialog(page)).toHaveCount(0);

    await limitTag(page).scrollIntoViewIfNeeded();
    const before = await priceOf(limitTag(page));
    await dragStart(page, limitTag(page), 30);
    await expect(readout(page)).toHaveText(/^LMT → \d\.\d{5}$/);
    await page.mouse.up();
    await expect(dialog(page)).toHaveCount(0);
    await expect(toast(page)).toHaveText(CONFIRMATION);
    await expect.poll(() => priceOf(limitTag(page))).not.toBe(before);
  });

  for (const system of SYSTEMS) {
    test(`${system}: the ticket is usable at 375px`, async ({ page }) => {
      await applyFx(page);
      await pickSystem(page, system);
      await page.setViewportSize({ width: 375, height: 812 });
      await page.getByRole("button", { name: /Mobile/ }).first().click().catch(() => {});
      await expect(fillNow(page)).toBeVisible();
      await fillNow(page).scrollIntoViewIfNeeded();
      await fillNow(page).click();
      await expectTicket(page, "BUY", "Limit");
      /* Nothing wider than the screen; every field and Submit can be reached. */
      const box = (await dialog(page).boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width).toBeLessThanOrEqual(376);
      for (const id of ["dh-ticket-type", "dh-ticket-notional", "dh-ticket-price", "dh-ticket-iceberg", "dh-ticket-goodtill"]) {
        const field = page.locator(`[data-field="${id}"]`);
        await field.scrollIntoViewIfNeeded();
        const f = (await field.boundingBox())!;
        expect(f.x, id).toBeGreaterThanOrEqual(0);
        expect(f.x + f.width, id).toBeLessThanOrEqual(376);
      }
      await page.locator("#dh-ticket-notional").fill("750,000");
      await submit(page).scrollIntoViewIfNeeded();
      await submit(page).click();
      await expect(dialog(page)).toHaveCount(0);
      await expect(toast(page)).toHaveText(CONFIRMATION);
    });
  }
});

/**
 * Where the confirmation is drawn. It is over the chart panel for its four
 * seconds, so it must not sit on anything a reader needs there: every tag
 * on the price scale (LMT, BID, RTP, ARR, AVG) stays in the clear, on a
 * phone as on a desk, in every system.
 */
test.describe("Builder - FX Execution sample orders, the toast's place", () => {
  type Rect = { name: string; x: number; y: number; right: number; bottom: number };
  const touching = (a: Rect, b: Rect) => a.x < b.right && b.x < a.right && a.y < b.bottom && b.y < a.bottom;

  async function drawn(page: Page) {
    return stage(page).locator(".dh-exec").evaluate((panel) => {
      const rect = (el: Element, name: string) => {
        const r = el.getBoundingClientRect();
        return { name, x: r.left, y: r.top, right: r.right, bottom: r.bottom };
      };
      const message = panel.querySelector(".dh-order-toast > span");
      const tags = [
        ...[...panel.querySelectorAll(".dh-exec-pill")].map((el) => rect(el, `price tag ${el.getAttribute("class")?.match(/dh-exec-pill-(\w+)/)?.[1] ?? ""}`)),
        ...[...panel.querySelectorAll(".dh-order-tag")].map((el) => rect(el, `tag target ${el.getAttribute("class")?.match(/dh-order-tag-(\w+)/)?.[1] ?? ""}`)),
      ];
      return { toast: message ? rect(message, "toast") : null, panel: rect(panel, "panel"), tags, opacity: getComputedStyle(panel.querySelector(".dh-order-toast")!).opacity };
    });
  }

  for (const width of [375, 1440] as const) {
    test(`${width}px: in every system the toast covers no price tag, stays inside the panel and the screen`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });
      await applyFx(page);
      for (const system of SYSTEMS) {
        await pickSystem(page, system);
        await expect(toast(page)).toHaveText("", { timeout: 6_000 });
        await fillNow(page).click();
        await submit(page).click();
        await expect(dialog(page)).toHaveCount(0);
        await expect(toast(page)).toHaveText(CONFIRMATION);
        await expect(toast(page)).toHaveAttribute("aria-live", "polite");
        await expect(stage(page).locator('.dh-exec [role="status"]')).toHaveCount(1);
        await expect(toast(page).locator("> span")).toHaveCount(1);
        /* Fully shown (its fade is over) before it is measured. */
        await expect.poll(async () => (await drawn(page)).opacity).toBe("1");
        const { toast: message, panel, tags } = await drawn(page);
        expect(message, `${system}: the toast is drawn`).not.toBeNull();
        expect(tags.filter((t) => t.name.startsWith("price tag")).length, `${system}: the price scale has its tags`).toBeGreaterThanOrEqual(2);
        for (const tag of tags) {
          expect(touching(message!, tag), `${system} at ${width}px: the toast covers the ${tag.name}`).toBe(false);
        }
        expect(message!.x, `${system}: inside the panel`).toBeGreaterThanOrEqual(panel.x - 1);
        expect(message!.right, `${system}: inside the panel`).toBeLessThanOrEqual(panel.right + 1);
        expect(message!.x).toBeGreaterThanOrEqual(0);
        expect(message!.right).toBeLessThanOrEqual(width);
        expect(message!.y, `${system}: on screen`).toBeGreaterThanOrEqual(0);
      }
    });
  }
});
