import { test, expect, type Page } from "@playwright/test";

/**
 * Builder chrome that floats or overlays follows the chrome's mode (owner,
 * 5 Oct: the Sessions drawer was dark glass under dark text in light chrome).
 * Every text leaf in each overlay clears WCAG AA (4.5:1, 3:1 for large text),
 * and icons and the selected marker clear 3:1, in light and dark.
 *
 * Contrast is computed from the DOM: the text colour over the composited
 * background of its ancestors (alpha blended down to the page).
 */

const CONTRAST = `(function(root) {
  const parse = (s) => { const m = s.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(",").map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const bgOf = (el) => { const stack = []; let n = el; while (n && n !== document.documentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } n = n.parentElement; } let bg = { r: 255, g: 255, b: 255, a: 1 }; for (const e of [document.documentElement, document.body]) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) bg = over(c, bg); } for (let i = stack.length - 1; i >= 0; i--) bg = over(stack[i], bg); return bg; };
  const ratio = (a, b) => { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
  const isIcon = (el) => el.classList.contains("material-symbols-outlined") || el.tagName === "svg";
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && cs.visibility !== "hidden" && cs.opacity !== "0"; };
  const out = [];
  for (const el of root.querySelectorAll("*")) {
    if (!visible(el)) continue;
    if (el.closest("[aria-disabled='true'], [disabled], .is-disabled")) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const icon = isIcon(el);
    if (!hasText && !icon) continue;
    const cs = getComputedStyle(el); const fg = parse(cs.color); if (!fg) continue;
    const bg = bgOf(el); const fgc = fg.a < 1 ? over(fg, bg) : fg;
    const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = icon ? 3 : (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    out.push({ text: (icon ? "icon " : "") + el.textContent.trim().slice(0, 30), cls: (el.className || "").toString().slice(0, 40), ratio: Math.round(ratio(fgc, bg) * 100) / 100, need });
  }
  return out;
})`;

async function openBuilder(page: Page, mode: "light" | "dark") {
  await page.route("**/api/health", (route) => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    const browse = page.getByRole("button", { name: /Browse templates/ });
    if (await browse.isVisible()) await browse.click();
    await expect(page.getByRole("list", { name: "Starting templates" })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole("button", { name: "Use the Analytics Dashboard template" }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
  await page.waitForTimeout(600);
  if (mode === "light") {
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await page.waitForTimeout(400);
  }
}

async function contrastOf(page: Page, selector: string) {
  const root = page.locator(selector).first();
  await expect(root).toBeVisible();
  await page.waitForTimeout(300);
  /* `eval` runs the constant CONTRAST source above inside the test browser
     page (test code, no user input); Playwright serialises page functions,
     so the helper is shipped as text and instantiated there. */
  return root.evaluate((el, fn) => (eval(fn) as (r: Element) => Array<{ text: string; cls: string; ratio: number; need: number }>)(el), CONTRAST);
}

function expectAllPass(rows: Array<{ text: string; cls: string; ratio: number; need: number }>, label: string) {
  expect(rows.length, `${label}: measured something`).toBeGreaterThan(0);
  for (const r of rows) expect.soft(r.ratio, `${label}: "${r.text}" (${r.cls}) ${r.ratio}:1 needs ${r.need}:1`).toBeGreaterThanOrEqual(r.need);
}

for (const mode of ["light", "dark"] as const) {
  test.describe(`${mode} chrome`, () => {
    test("the Sessions drawer is readable: title, helper, session name, date and New session", async ({ page }) => {
      await openBuilder(page, mode);
      await page.getByRole("button", { name: "Open sessions drawer" }).click();
      const rows = await contrastOf(page, ".sessions-drawer");
      const find = (sel: string) => page.locator(`.sessions-drawer ${sel}`).first();
      for (const sel of [".sessions-drawer-title", ".sessions-drawer-subtitle", ".sessions-row-title", ".sessions-row-timestamp", ".sessions-new-btn"]) {
        await expect(find(sel), `${sel} is present`).toBeVisible();
      }
      const named = rows.filter((r) => /sessions-drawer-title|sessions-drawer-subtitle|sessions-row-title|sessions-row-timestamp|sessions-new-btn/.test(r.cls) && !r.text.startsWith("icon"));
      expect(named.length, "the five named texts were measured").toBeGreaterThanOrEqual(5);
      for (const r of named) expect(r.ratio, `${r.cls} "${r.text}" ${r.ratio}:1`).toBeGreaterThanOrEqual(4.5);
      expectAllPass(rows, "sessions drawer");
      /* The selected row's marker (its icon) is distinguishable. */
      const marker = rows.find((r) => /sessions-row-icon/.test(r.cls));
      expect(marker?.ratio ?? 0, "selected row marker").toBeGreaterThanOrEqual(3);
    });

    test("the other overlays are readable: toast, export menu, design system menu, canvas actions, context menu, top bar", async ({ page }) => {
      await openBuilder(page, mode);
      await page.getByRole("button", { name: "Open sessions drawer" }).click();
      await page.locator(".sessions-new-btn").click();
      expectAllPass(await contrastOf(page, ".dh-toast"), "toast");
      await page.keyboard.press("Escape");
      await expect(async () => {
        const browse = page.getByRole("button", { name: /Browse templates/ });
        if (await browse.isVisible()) await browse.click();
        await expect(page.getByRole("list", { name: "Starting templates" })).toBeVisible({ timeout: 2_000 });
      }).toPass({ timeout: 30_000 });
      await page.getByRole("button", { name: "Use the Analytics Dashboard template" }).click();
      await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
      await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
      await page.waitForTimeout(500);
      await page.getByRole("button", { name: "Export canvas" }).click();
      expectAllPass(await contrastOf(page, ".top-bar-export-menu"), "export menu");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: /^Design system:/ }).click();
      expectAllPass(await contrastOf(page, ".preview-bar-ds-menu"), "design system menu");
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "More canvas actions" }).click();
      expectAllPass(await contrastOf(page, ".preview-bar-overflow"), "canvas actions menu");
      await page.keyboard.press("Escape");
      await page.locator('[data-block-id^="tpl-ad-kpi-1-"]').first().click({ button: "right", position: { x: 6, y: 6 } });
      expectAllPass(await contrastOf(page, ".context-menu"), "context menu");
      await page.keyboard.press("Escape");
      expectAllPass(await contrastOf(page, ".top-bar"), "top bar");
    });
  });
}
