import { test, expect, type Page } from "@playwright/test";

/**
 * The builder chrome's icons must not depend on the Material Symbols font.
 *
 * The font is a ligature font from a CDN: until it arrives (or when it never
 * does) a ligature span draws its literal word ("compare", "light_mode"),
 * which is wider than its button and covers the neighbour. The Present bar
 * draws inline SVG icons, so it has nothing to wait for; every ligature that
 * stays in the chrome sits in a fixed square box that clips the word.
 */

type Box = { name: string; x: number; y: number; right: number; bottom: number };

async function blockIconFont(page: Page) {
  let blocked = 0;
  await page.route(/fonts\.gstatic\.com\/.*materialsymbols/i, route => { blocked++; return route.abort(); });
  return () => blocked;
}

async function present(page: Page) {
  await page.goto("/builder");
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible();
  await page.getByRole("button", { name: /Browse templates/ }).click();
  await page.getByRole("button", { name: "Use the Performance Analytics template" }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible();
  await expect(page.locator(".present-bar")).toBeVisible();
}

/** Every control's box, and the box its own content paints into. */
async function controlBoxes(page: Page) {
  return page.locator(".present-bar").evaluate(bar => {
    const controls = [...bar.querySelectorAll<HTMLElement>("button, a")].filter(el => el.getClientRects().length > 0);
    return controls.map(el => {
      const r = el.getBoundingClientRect();
      const ink = { x: r.left, y: r.top, right: r.right, bottom: r.bottom };
      for (const child of el.querySelectorAll<HTMLElement>("*")) {
        const style = getComputedStyle(child);
        if (style.position === "absolute" || child.getClientRects().length === 0) continue;
        if (child.closest("svg") && child.tagName !== "svg") continue;
        const c = child.getBoundingClientRect();
        ink.x = Math.min(ink.x, c.left); ink.y = Math.min(ink.y, c.top);
        ink.right = Math.max(ink.right, c.right); ink.bottom = Math.max(ink.bottom, c.bottom);
      }
      const name = el.getAttribute("aria-label") ?? el.textContent ?? "";
      return {
        box: { name, x: r.left, y: r.top, right: r.right, bottom: r.bottom },
        ink: { name, ...ink },
      };
    });
  });
}

function overlaps(a: Box, b: Box) {
  return a.x < b.right - 0.5 && b.x < a.right - 0.5 && a.y < b.bottom - 0.5 && b.y < a.bottom - 0.5;
}

async function expectBarSound(page: Page) {
  const controls = await controlBoxes(page);
  expect(controls.length).toBeGreaterThanOrEqual(4);
  for (const { box, ink } of controls) {
    expect(ink.right - ink.x, `"${box.name}" draws inside its own box`).toBeLessThanOrEqual(box.right - box.x + 0.5);
  }
  for (let i = 0; i < controls.length; i++) {
    for (let j = i + 1; j < controls.length; j++) {
      expect(overlaps(controls[i].ink, controls[j].ink), `"${controls[i].box.name}" overlaps "${controls[j].box.name}"`).toBe(false);
    }
  }
  const bar = page.locator(".present-bar");
  const all = bar.locator("button, a");
  for (let i = 0; i < await all.count(); i++) {
    const control = all.nth(i);
    if (!(await control.isVisible())) continue;
    await control.click({ trial: true, timeout: 5_000 });
  }
}

test.describe("Builder chrome icons without the icon font", () => {
  test("Present bar: every control is clickable and no control's box overlaps another", async ({ page }) => {
    const blocked = await blockIconFont(page);
    await present(page);
    expect(blocked(), "the icon font was requested and blocked").toBeGreaterThan(0);
    await expect(page.locator(".present-bar .material-symbols-outlined")).toHaveCount(0);
    await expectBarSound(page);

    /* The control the word "compare" used to cover. */
    await page.getByRole("button", { name: "Switch to light mode", exact: true }).click();
    await expect(page.getByRole("button", { name: "Switch to dark mode", exact: true })).toBeVisible();
    await expectBarSound(page);

    /* The design-system menu and the Share feedback draw icons too. */
    await page.getByRole("button", { name: /^Design system:/ }).click();
    const selected = page.locator('.present-bar-ds-option[aria-selected="true"]');
    await expect(selected.locator("svg")).toBeVisible();
    await page.keyboard.press("Escape");
    await expectBarSound(page);

    await page.setViewportSize({ width: 375, height: 760 });
    await expectBarSound(page);
  });

  test("a ligature left in the chrome keeps a square box that clips its word", async ({ page }) => {
    const blocked = await blockIconFont(page);
    await present(page);
    await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
    await expect(page.locator(".top-bar")).toBeVisible();
    expect(blocked()).toBeGreaterThan(0);
    const spans = await page.evaluate(() => {
      const chrome = [...document.querySelectorAll<HTMLElement>(".builder-shell .material-symbols-outlined")]
        .filter(el => !el.closest("[data-block-id]") && el.getClientRects().length > 0 && (el.textContent ?? "").trim().length > 0);
      return chrome.map(el => {
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        return {
          word: (el.textContent ?? "").trim(),
          width: r.width,
          height: r.height,
          fontSize: parseFloat(style.fontSize),
          overflow: style.overflowX,
        };
      });
    });
    expect(spans.length, "the edit chrome still draws some ligature icons").toBeGreaterThan(0);
    for (const s of spans) {
      expect(s.overflow, `"${s.word}" clips`).toMatch(/hidden|clip/);
      expect(s.width, `"${s.word}" is one glyph wide`).toBeLessThanOrEqual(s.fontSize + 0.5);
      expect(s.height, `"${s.word}" is one glyph tall`).toBeLessThanOrEqual(s.fontSize + 0.5);
    }
  });

  test("the icon font is asked to block, never to swap a word in", async ({ page }) => {
    await page.goto("/builder");
    const href = await page.locator('link[rel="stylesheet"][href*="Material+Symbols"]').getAttribute("href");
    expect(href).toContain("display=block");
    expect(href).not.toContain("display=swap");
  });
});
