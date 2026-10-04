import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * FX Execution: the chart rail's menus (Interval, Chart type, Overlays,
 * View) are overlays, in every design system.
 *
 *   - They float: a drop shadow, and a hairline outline that is quiet
 *     against the menu's own surface (contrast measured, not eyeballed).
 *   - They stay inside the chart panel, at desktop and in the phone frame.
 *   - They behave as menus: Enter opens on the first checked item, the
 *     arrow keys, Home and End move, Escape closes and puts focus back on
 *     the rail button that opened it.
 *
 * Pre-flight: `npm run dev` (see playwright.config.ts for the base URL).
 */

const SYSTEMS = ["Salt DS", "Material 3", "Fluent 2", "uoaui", "Carbon"] as const;
const MENUS = ["Interval", "Chart type", "Overlays", "View"] as const;
/* The outline must read as a hairline, not a ring: against the menu's own
   surface its contrast stays under this (the old outline was about 3.5:1
   in Salt dark), and above 1, so it is there at all. */
const QUIET_OUTLINE = 2;

function chatInput(page: Page) {
  return page.getByRole("textbox", { name: "Chat message input" });
}

async function applyFx(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(chatInput(page)).toBeVisible({ timeout: 30_000 });
  const use = page.getByRole("button", { name: "Use the FX Execution template" });
  await expect(async () => {
    if (!(await use.isVisible())) await page.getByRole("button", { name: /Browse templates/ }).click();
    await expect(use).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  await use.click();
  await expect(page.locator(".present-stage .dh-exec .highcharts-root")).toBeVisible({ timeout: 30_000 });
}

async function switchSystem(page: Page, label: (typeof SYSTEMS)[number]) {
  await page.getByRole("button", { name: /^Design system:/ }).click();
  await page.getByText(label, { exact: true }).last().click();
}

const chart = (page: Page) => page.locator(".present-stage .dh-exec");
const railButton = (page: Page, name: string) => chart(page).locator(".dh-exec-rail").getByRole("button", { name, exact: true });

interface Look { shadow: string; contrast: number; inside: { dx: number; dy: number; right: number; bottom: number }; }

/** The open menu's shadow, its outline's contrast against its own surface,
 *  and how far it sits inside the chart panel (negative: outside). */
async function look(menu: Locator): Promise<Look> {
  return menu.evaluate((el) => {
    const parse = (c: string): number[] => {
      const probe = document.createElement("canvas").getContext("2d")!;
      probe.fillStyle = "#000";
      probe.fillStyle = c;
      const v = probe.fillStyle;
      if (v.startsWith("#")) return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16), 1];
      const m = v.match(/[\d.]+/g)!.map(Number);
      return [m[0], m[1], m[2], m[3] ?? 1];
    };
    const over = (top: number[], under: number[]) => top.slice(0, 3).map((t, i) => t * top[3] + under[i] * (1 - top[3])).concat(1);
    const lum = (c: number[]) => {
      const [r, g, b] = c.slice(0, 3).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    /* The surface the menu is painted on: its own background over whatever
       is behind it (up the tree to the first opaque background). */
    const backdrop = (node: Element | null): number[] => {
      const layers: number[][] = [];
      for (let n = node; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        layers.push(c);
        if (c[3] >= 1) break;
      }
      return layers.reverse().reduce((under, top) => over(top, under), [255, 255, 255, 1]);
    };
    const cs = getComputedStyle(el);
    const surface = backdrop(el);
    const edge = over(parse(cs.borderTopColor), surface);
    const [a, b] = [lum(surface), lum(edge)].sort((x, y) => y - x);
    const panel = el.closest(".dh-exec")!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return {
      shadow: cs.boxShadow,
      contrast: (a + 0.05) / (b + 0.05),
      inside: { dx: r.left - panel.left, dy: r.top - panel.top, right: panel.right - r.right, bottom: panel.bottom - r.bottom },
    };
  });
}

async function expectOverlay(page: Page, system: string, name: string) {
  const button = railButton(page, name);
  await button.click();
  const menu = chart(page).getByRole("menu", { name });
  await expect(menu).toBeVisible();
  const l = await look(menu);
  const where = `${system} ${name}`;
  expect(l.shadow, `${where}: a drop shadow`).not.toBe("none");
  expect(l.contrast, `${where}: the outline is a quiet hairline (${l.contrast.toFixed(2)}:1)`).toBeLessThan(QUIET_OUTLINE);
  expect(l.contrast, `${where}: the outline is there`).toBeGreaterThan(1.02);
  for (const [side, gap] of Object.entries(l.inside)) expect(gap, `${where}: inside the chart panel (${side})`).toBeGreaterThanOrEqual(-1);
  /* Floating: a gap between the rail and the menu. */
  const rail = (await chart(page).locator(".dh-exec-rail").boundingBox())!;
  const box = (await menu.boundingBox())!;
  expect(box.x - (rail.x + rail.width), `${where}: a gap from the rail`).toBeGreaterThanOrEqual(2);
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(button).toBeFocused();
}

test.describe("Builder - FX Execution rail menus", () => {
  for (const system of SYSTEMS) {
    test(`${system}: each rail menu floats with a shadow and a quiet outline, inside the panel, light and dark`, async ({ page }) => {
      await applyFx(page);
      await page.locator(".present-stage").getByRole("button", { name: "Pause the sample feed" }).click().catch(() => {});
      if (system !== "Salt DS") await switchSystem(page, system);
      for (const name of MENUS) await expectOverlay(page, `${system} dark`, name);
      await page.getByRole("button", { name: "Switch to light mode" }).click();
      for (const name of MENUS) await expectOverlay(page, `${system} light`, name);
    });
  }

  test("in the phone frame each menu stays inside the chart panel", async ({ page }) => {
    await applyFx(page);
    await page.getByRole("button", { name: /Mobile/i }).first().click();
    await expect.poll(() => chart(page).evaluate((el) => (el as HTMLElement).offsetWidth)).toBeLessThan(480);
    for (const name of MENUS) await expectOverlay(page, "phone", name);
  });

  test("the keyboard: Enter opens on the checked item, arrows, Home and End move, Enter chooses, Escape returns focus", async ({ page }) => {
    await applyFx(page);
    const button = railButton(page, "Interval");
    await button.focus();
    await page.keyboard.press("Enter");
    const menu = chart(page).getByRole("menu", { name: "Interval" });
    await expect(menu).toBeVisible();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    const items = menu.getByRole("menuitemradio");
    /* Focus starts on the checked item (1m, the first). */
    await expect(items.first()).toBeFocused();
    await expect(items.first()).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();
    await page.keyboard.press("End");
    await expect(items.last()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(items.first()).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(items.last()).toBeFocused();
    await page.keyboard.press("Home");
    await expect(items.first()).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(items.nth(2)).toBeFocused();
    /* Only the focused item is in the tab order. */
    expect(await items.evaluateAll((els) => els.filter((e) => e.getAttribute("tabindex") === "0").length)).toBe(1);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(button).toBeFocused();
    await expect(button).toHaveAttribute("aria-expanded", "false");

    /* Space opens too; Enter chooses; focus goes back to the button. */
    await page.keyboard.press("Space");
    await expect(menu).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(menu).toHaveCount(0);
    await expect(button).toBeFocused();
    await expect(button).toHaveText("5m");

    /* A click outside closes it. */
    await button.click();
    await expect(menu).toBeVisible();
    await page.locator(".present-stage .dh-exec-ranges").click({ position: { x: 2, y: 2 } });
    await expect(menu).toHaveCount(0);
  });
});
