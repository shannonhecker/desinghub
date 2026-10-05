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
    out.push({ text: (icon ? "icon " : "") + el.textContent.trim().slice(0, 30), cls: (el.getAttribute("class") || "").slice(0, 40), ratio: Math.round(ratio(fgc, bg) * 100) / 100, need });
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

/* Owner, 5 Oct: the Export menu was drawn BEHIND the canvas (the template's
   sticky header painted over it). Every top-bar and toolbar menu must be the
   topmost thing at each of its items, whatever the template puts in the frame. */
for (const [width, height] of [[1512, 738], [1100, 700]] as const) {
  test(`top-bar and toolbar menus paint above the canvas at ${width}x${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.route("**/api/health", (route) => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
    await page.goto("/builder", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible({ timeout: 30_000 });
    await expect(async () => {
      const browse = page.getByRole("button", { name: /Browse templates/ });
      if (await browse.isVisible()) await browse.click();
      await expect(page.getByRole("list", { name: "Starting templates" })).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await page.getByRole("button", { name: "Use the Risk Analytics template" }).click();
    await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
    await page.waitForTimeout(600);
    /* With the component panel closed the menus hang over the canvas frame. */
    const close = page.getByRole("button", { name: "Close panel", exact: true });
    if (await close.isVisible()) await close.click();
    await page.waitForTimeout(400);
    for (const [trigger, menuSel] of [
      [page.getByRole("button", { name: "Export canvas" }), ".top-bar-export-menu"],
      [page.getByRole("button", { name: /^Design system:/ }), ".preview-bar-ds-menu"],
      [page.getByRole("button", { name: "More canvas actions" }), ".preview-bar-overflow-main"],
    ] as const) {
      await trigger.click();
      const menu = page.locator(menuSel).first();
      await expect(menu).toBeVisible();
      await page.waitForTimeout(250);
      const hidden = await menu.evaluate((m) => {
        const out: string[] = [];
        for (const it of m.querySelectorAll("[role^='menuitem']")) {
          const r = it.getBoundingClientRect();
          const x = r.left + r.width / 2, y = r.top + r.height / 2;
          /* Items scrolled out of the menu's own viewport are covered by the
             reachability test below; here only what the menu shows counts. */
          const mr = m.getBoundingClientRect();
          if (r.width === 0 || y < Math.max(0, mr.top) || y > Math.min(window.innerHeight, mr.bottom)) continue;
          const top = document.elementFromPoint(x, y);
          if (!top || !m.contains(top)) out.push(`"${(it.textContent || "").trim().slice(0, 24)}" under ${top ? (top.getAttribute("class") || top.tagName).slice(0, 40) : "nothing"}`);
        }
        return out;
      });
      expect(hidden, `${menuSel}: every item is on top`).toEqual([]);
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
    }
  });
}

/* Owner, 5 Oct: the "..." menu ran off a short window and could not scroll. */
test("the canvas overflow menu fits a 1280x600 window, scrolls to its last item and keeps one item grammar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await openBuilder(page, "dark");
  await page.getByRole("button", { name: "More canvas actions" }).click();
  const menu = page.getByRole("menu", { name: "More canvas actions" });
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  expect((box?.y ?? 0) + (box?.height ?? 0), "menu bottom inside the viewport, 12px clear").toBeLessThanOrEqual(588.5);
  expect((box?.x ?? 0) + (box?.width ?? 0), "menu right edge inside the viewport").toBeLessThanOrEqual(1280);
  /* Roles: radio groups, toggles and actions. */
  await expect(menu.getByRole("menuitemradio", { name: "Medium" })).toHaveAttribute("aria-checked", /true|false/);
  await expect(menu.getByRole("menuitemcheckbox", { name: "Real components in Edit" })).toHaveAttribute("aria-checked", /true|false/);
  await expect(menu.getByRole("menuitemcheckbox", { name: "Header" })).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Show code view" })).toBeVisible();
  /* Every item leads with an icon; a selected radio keeps its own icon. */
  const rows = await menu.evaluate((m) => [...m.querySelectorAll("[role^='menuitem']")].map((el) => ({
    text: (el.textContent || "").trim(),
    lead: el.firstElementChild?.tagName.toLowerCase() === "svg" ? el.firstElementChild.getAttribute("data-icon") : null,
    role: el.getAttribute("role"), checked: el.getAttribute("aria-checked"),
  })));
  for (const r of rows) expect(r.lead, `"${r.text}" has a leading icon`).toBeTruthy();
  for (const r of rows.filter((x) => x.role === "menuitemradio" && x.checked === "true")) expect(r.lead, `selected "${r.text}" keeps its icon`).not.toBe("check");
  /* The last item scrolls into view and works. */
  const last = menu.getByRole("menuitem", { name: "Pop out to window" });
  await last.scrollIntoViewIfNeeded();
  await expect(last).toBeInViewport();
  const refresh = menu.getByRole("menuitem", { name: "Refresh preview" });
  await refresh.scrollIntoViewIfNeeded();
  await refresh.click();
  await expect(menu).toBeHidden();
  /* Keyboard: arrows walk the items, Escape returns focus to the trigger. */
  await page.getByRole("button", { name: "More canvas actions" }).click();
  await expect(menu).toBeVisible();
  for (let i = 0; i < 30; i++) await page.keyboard.press("ArrowDown");
  const focusedInView = await page.evaluate(() => { const el = document.activeElement as HTMLElement; const r = el.getBoundingClientRect(); return el.getAttribute("role")?.startsWith("menuitem") && r.top >= 0 && r.bottom <= window.innerHeight; });
  expect(focusedInView, "the focused item is in view").toBe(true);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "More canvas actions" })).toBeFocused();
});

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

    test("the component panel in browse mode is tonal and readable; Collapse all is an icon button; an empty search clears", async ({ page }) => {
      await openBuilder(page, mode);
      const panel = page.locator(".component-sidebar");
      if (!(await panel.isVisible())) await page.getByRole("button", { name: "Show component library", exact: true }).click();
      await expect(panel.locator(".lib-search-input")).toBeVisible();
      await panel.locator(".lib-templates-head").click();
      await expect(panel.locator(".lib-template-card").first()).toBeVisible();
      /* Tone, not outlines: no visible border on the Templates row, its cards,
         the search field, the collapse button or the tiles. */
      const outlined = await panel.evaluate((aside) => {
        const sels = [".lib-templates", ".lib-templates-head", ".lib-template-card", ".lib-template-thumb", ".lib-search-sticky", ".lib-search-input", ".lib-collapse-toggle", ".lib-tile", ".lib-tile-preview", ".lib-category-count", ".lib-zone-count", ".lib-templates-count"];
        const alpha = (c: string) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return 0; const p = m[1].split(",").map(Number); return p.length > 3 ? p[3] : 1; };
        const out: string[] = [];
        for (const sel of sels) {
          const els = [...aside.querySelectorAll(sel)].slice(0, 6);
          if (els.length === 0) out.push(`${sel} missing`);
          for (const el of els) {
            const cs = getComputedStyle(el);
            for (const side of ["Top", "Right", "Bottom", "Left"] as const) {
              const w = parseFloat(cs.getPropertyValue(`border-${side.toLowerCase()}-width`));
              const c = cs.getPropertyValue(`border-${side.toLowerCase()}-color`);
              if (w > 0 && cs.getPropertyValue(`border-${side.toLowerCase()}-style`) !== "none" && alpha(c) >= 0.2) out.push(`${sel} border-${side} ${w}px ${c}`);
            }
          }
        }
        return out;
      });
      expect(outlined, "no outlined boxes in browse mode").toEqual([]);
      for (const sel of [".lib-templates-head", ".lib-search", ".lib-zone-group", ".lib-category-head", ".lib-tile", ".lib-template-card"]) {
        expectAllPass(await contrastOf(page, `.component-sidebar ${sel}`), `browse ${sel}`);
      }
      await panel.locator(".lib-templates-head").click();
      /* Collapse all / Expand all is a 28px icon button at the end of the search row. */
      const collapse = panel.getByRole("button", { name: "Collapse all", exact: true });
      await expect(collapse).toBeVisible();
      const box = await collapse.boundingBox();
      expect(Math.round(box?.width ?? 0)).toBe(28);
      expect(Math.round(box?.height ?? 0)).toBe(28);
      const field = await panel.locator(".lib-search-input").boundingBox();
      expect(Math.abs((field?.y ?? 0) - (box?.y ?? 0)), "same row as the search field").toBeLessThan(1);
      await collapse.click();
      await expect(panel.locator(".lib-category-head[aria-expanded='true']")).toHaveCount(0);
      await panel.getByRole("button", { name: "Expand all", exact: true }).click();
      await expect(panel.getByRole("button", { name: "Collapse all", exact: true })).toBeVisible();
      await expect(panel.locator(".lib-category-head[aria-expanded='false']")).toHaveCount(0);
      /* Empty search: a plain sentence and a Clear search button that clears
         the field and puts focus back in it. */
      const search = panel.getByRole("searchbox", { name: "Search component library" });
      await search.fill("zzzz");
      const empty = panel.locator(".lib-empty");
      await expect(empty).toContainText("No components match");
      expect(await empty.locator(".lib-empty-text").evaluate((el) => getComputedStyle(el).fontStyle)).toBe("normal");
      expectAllPass(await contrastOf(page, ".component-sidebar .lib-empty"), "empty search");
      await empty.getByRole("button", { name: "Clear search", exact: true }).click();
      await expect(search).toHaveValue("");
      await expect(search).toBeFocused();
      await expect(panel.locator(".lib-tile").first()).toBeVisible();
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
