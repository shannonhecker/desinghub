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
    await expect(toast(page)).toHaveText(CONFIRMATION);
    await expect.poll(() => priceOf(limitTag(page))).toBe(shown);
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
    await expect(toast(page)).toHaveText(CONFIRMATION);
    await expect.poll(() => priceOf(limitTag(page))).toBe(shown);
    expect(shown).not.toBe(before);
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
    await edit.getByRole("button", { name: "Fill now" }).click();
    await edit.getByRole("button", { name: "Compare orders" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
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
    await expect(toast(page)).toHaveText(CONFIRMATION);
    expect(await priceOf(limitTag(page))).not.toBe(before);
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
