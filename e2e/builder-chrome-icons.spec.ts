import { test, expect, type Page } from "@playwright/test";

/**
 * The builder chrome's icons must not depend on an icon font.
 *
 * The chrome used to draw its icons as Material Symbols ligatures: a span
 * holding the icon's name, turned into a glyph by a font. Until the font
 * arrived (or when it never did) a ligature span drew its literal word
 * ("compare", "light_mode"). Every chrome icon is now an inline SVG, so the
 * chrome has nothing to wait for. Canvas blocks still use the font, because
 * there it is part of the design system on show; a ligature inside a block
 * keeps a fixed square box that clips the word.
 */

type Box = { name: string; x: number; y: number; right: number; bottom: number };

/** Block the icon font wherever it is served from. */
async function blockIconFont(page: Page) {
  let blocked = 0;
  await page.route(/material-?symbols/i, route => {
    if (route.request().resourceType() !== "font") return route.continue();
    blocked++;
    return route.abort();
  });
  return () => blocked;
}

/**
 * Everything on the page that would draw an icon's name as letters: a
 * ligature span, by its class or by any other route to the icon font, that
 * is not inside a canvas block. Hidden ones count too: they are one media
 * query or one hover away from showing.
 */
async function ligaturesInChrome(page: Page) {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>("body *")) {
      /* A block's content is the design system's; the handles the editor
         draws on a block are chrome. */
      if (el.closest("[data-block-id]") && !el.closest("[data-inspector-block-id]")) continue;
      const byClass = el.classList.contains("material-symbols-outlined") || el.classList.contains("mi");
      const own = [...el.childNodes].some(n => n.nodeType === 3 && (n.textContent ?? "").trim().length > 0);
      const byFont = own && /Material Symbols/i.test(getComputedStyle(el).fontFamily);
      if (byClass || byFont) out.push(`${el.tagName.toLowerCase()}.${el.className}: "${(el.textContent ?? "").trim()}"`);
    }
    return out;
  });
}

/** Every chrome icon on screen is a drawing: an SVG, one em square, with ink. */
async function expectIconsDrawn(page: Page, least: number) {
  const icons = await page.evaluate(() => [...document.querySelectorAll<SVGSVGElement>("svg.chrome-icon")]
    .filter(el => el.getClientRects().length > 0)
    .map(el => {
      const c = getComputedStyle(el);
      const px = (v: string) => parseFloat(v) || 0;
      const ink = [...el.querySelectorAll<SVGGeometryElement>("path, circle, rect, line, polyline, polygon, ellipse")]
        .some(shape => { const b = shape.getBBox(); return b.width > 0 || b.height > 0; });
      return {
        name: el.getAttribute("data-icon") ?? "",
        /* The laid-out size (content box), not the painted one: a control
           that is mid-transition is scaled, and its icon with it. */
        w: px(c.width),
        h: px(c.height),
        fontSize: px(c.fontSize),
        ink,
        text: (el.textContent ?? "").trim(),
        known: !el.hasAttribute("data-icon-missing"),
      };
    }));
  expect(icons.length, "chrome icons on screen").toBeGreaterThanOrEqual(least);
  for (const icon of icons) {
    expect(icon.ink, `"${icon.name}" has a drawing`).toBe(true);
    expect(icon.text, `"${icon.name}" holds no text`).toBe("");
    expect(icon.known, `"${icon.name}" has its own icon, not the stand-in`).toBe(true);
    expect(Math.abs(icon.w - icon.fontSize), `"${icon.name}" is one em wide`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(icon.h - icon.fontSize), `"${icon.name}" is one em tall`).toBeLessThanOrEqual(0.5);
  }
  return icons;
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
    /* The chrome no longer asks for the font; a block that does is refused. */
    void blocked;
    await expect(page.locator(".present-bar .material-symbols-outlined")).toHaveCount(0);
    expect(await ligaturesInChrome(page)).toEqual([]);
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

  test("with the font blocked no chrome control shows text where an icon should be", async ({ page }) => {
    const blocked = await blockIconFont(page);
    const fontRequests: string[] = [];
    page.on("request", r => { if (r.resourceType() === "font" && /material-?symbols/i.test(r.url())) fontRequests.push(r.url()); });

    /* Home. */
    await page.goto("/builder");
    await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible();
    expect(await ligaturesInChrome(page), "home").toEqual([]);
    await expectIconsDrawn(page, 6);
    expect(fontRequests, "the home screen never asks for the icon font").toEqual([]);

    /* Template gallery. */
    await page.getByRole("button", { name: /Browse templates/ }).click();
    await expect(page.getByRole("button", { name: "Use the Performance Analytics template" })).toBeVisible();
    expect(await ligaturesInChrome(page), "gallery").toEqual([]);
    const gallery = await expectIconsDrawn(page, 10);
    void gallery;
    await expect(page.locator(".template-gallery-arrow svg.chrome-icon"), "gallery arrows").toHaveCount(2);
    await expect(page.locator(".template-card-head svg.chrome-icon").first(), "template cards").toBeVisible();

    /* Edit. */
    await page.getByRole("button", { name: "Use the Performance Analytics template" }).click();
    await expect(page.locator(".present-bar")).toBeVisible();
    await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
    await expect(page.locator(".top-bar")).toBeVisible();
    const library = page.getByRole("button", { name: "Show component library" });
    if (await library.isVisible()) await library.click();
    expect(await ligaturesInChrome(page), "edit").toEqual([]);
    const edit = await expectIconsDrawn(page, 20);
    for (const name of ["menu", "edit_square", "palette", "ios_share", "undo", "redo", "search"]) {
      expect(edit.some(i => i.name === name), `the edit chrome draws "${name}"`).toBe(true);
    }

    /* Inspector. */
    const block = page.locator('.bp-main [data-block-id][data-zone="body"]').first();
    await block.focus();
    await block.press("Enter");
    await expect(block).toHaveClass(/is-selected/);
    expect(await ligaturesInChrome(page), "inspector").toEqual([]);
    await expectIconsDrawn(page, 20);

    /* Context menu: every item that has an icon draws one. */
    await block.click({ button: "right", position: { x: 5, y: 5 } });
    await expect(page.getByRole("menuitem", { name: /^Delete/ })).toBeVisible();
    expect(await ligaturesInChrome(page), "context menu").toEqual([]);
    await expectIconsDrawn(page, 20);
    const menuIcons = await page.locator('[role="menu"] .context-menu-icon svg.chrome-icon').count();
    expect(menuIcons, "context menu icons").toBeGreaterThanOrEqual(5);
    await expect(page.getByRole("menuitem", { name: /^Delete/ }).locator("svg.chrome-icon")).toHaveAttribute("data-icon", "delete");
    await page.keyboard.press("Escape");

    /* Export menu. */
    await page.getByRole("button", { name: "Export canvas" }).click();
    const exportItems = page.locator(".top-bar-export-item");
    await expect(exportItems.first()).toBeVisible();
    expect(await ligaturesInChrome(page), "export menu").toEqual([]);
    for (let i = 0; i < await exportItems.count(); i++) {
      await expect(exportItems.nth(i).locator("svg.chrome-icon"), `export item ${i + 1} draws an icon`).toHaveCount(1);
    }
    await expectIconsDrawn(page, 20);

    /* A toast draws its icon the same way. */
    await page.keyboard.press("Escape");
    await block.click({ button: "right", position: { x: 5, y: 5 } });
    await page.getByRole("menuitem", { name: /^Copy as JSON/ }).click().catch(() => {});
    expect(await ligaturesInChrome(page), "after a toast").toEqual([]);

    /* Phone width hides labels and keeps icons: still no letters. */
    await page.setViewportSize({ width: 375, height: 760 });
    expect(await ligaturesInChrome(page), "phone").toEqual([]);
    void blocked;
  });

  test("a ligature inside a canvas block keeps a square box that clips its word", async ({ page }) => {
    await blockIconFont(page);
    await present(page);
    await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
    await expect(page.locator(".top-bar")).toBeVisible();
    /* Blocks draw Material Symbols when their design system does (Material 3,
       uoaui DS) or their content names an icon. Put one in a block, as a
       block would, with the font refused. */
    const spans = await page.evaluate(() => {
      const block = document.querySelector<HTMLElement>(".builder-shell .bp-main [data-block-id]")!;
      return ["compare", "light_mode", "check_box_outline_blank"].map(word => {
        const el = document.createElement("span");
        el.className = "material-symbols-outlined";
        el.style.fontSize = "18px";
        el.textContent = word;
        block.append(el);
        const r = el.getBoundingClientRect();
        const style = getComputedStyle(el);
        const out = { word, width: r.width, height: r.height, fontSize: parseFloat(style.fontSize), overflow: style.overflowX };
        el.remove();
        return out;
      });
    });
    expect(spans.length).toBe(3);
    for (const s of spans) {
      expect(s.overflow, `"${s.word}" clips`).toMatch(/hidden|clip/);
      expect(s.width, `"${s.word}" is one glyph wide`).toBeLessThanOrEqual(s.fontSize + 0.5);
      expect(s.height, `"${s.word}" is one glyph tall`).toBeLessThanOrEqual(s.fontSize + 0.5);
    }
    expect(await ligaturesInChrome(page)).toEqual([]);
  });

  test("the icon font is served from this origin and blocks, never swaps a word in", async ({ page }) => {
    await page.goto("/builder");
    await expect(page.locator('link[rel="stylesheet"][href*="Material+Symbols"]')).toHaveCount(0);
    await expect(page.locator('link[href*="fonts.googleapis.com"]')).toHaveCount(0);
    const faces = await page.evaluate(() => [...document.fonts].filter(f => /Material Symbols/i.test(f.family)).map(f => f.display));
    expect(faces).toEqual(["block"]);
  });
});

/**
 * The other side of the square box: the box must never cut the icon. A rule
 * that gives an icon a taller line (the attachment error sits on a 1.45 line
 * beside its sentence) or padding (a badge), or a flex row that squeezes it,
 * has to keep the whole icon inside what is drawn. This holds for the chrome's
 * SVG icons and for the ligatures canvas blocks still draw with the font.
 */
type Glyph = { word: string; where: string; fontSize: number; lineHeight: number; innerW: number; innerH: number };

async function iconFontReady(page: Page) {
  await expect.poll(() => page.evaluate(() => document.fonts.load('16px "Material Symbols Outlined"', "error").then(f => f.length > 0)), { timeout: 30_000 }).toBe(true);
  await page.evaluate(() => document.fonts.ready);
}

async function glyphs(page: Page, scope = ".builder-shell"): Promise<Glyph[]> {
  return page.evaluate(sel => [...document.querySelectorAll<HTMLElement | SVGSVGElement>(`${sel} .material-symbols-outlined, ${sel} svg.chrome-icon`)]
    .filter(el => el.getClientRects().length > 0 && (el instanceof SVGElement || (el.textContent ?? "").trim().length > 0))
    .map(el => {
      const c = getComputedStyle(el);
      const px = (v: string) => parseFloat(v) || 0;
      const svg = el instanceof SVGElement;
      /* The laid-out box, which a transform (a control scaling in, a caret
         turning) does not change. An SVG has no client box in every engine:
         its computed width and height are its content box (.chrome-icon is
         content-box), so the padding is added back to compare like for like. */
      const boxW = svg ? px(c.width) + px(c.paddingLeft) + px(c.paddingRight) : (el as HTMLElement).clientWidth;
      const boxH = svg ? px(c.height) + px(c.paddingTop) + px(c.paddingBottom) : (el as HTMLElement).clientHeight;
      return {
        word: svg ? (el.getAttribute("data-icon") ?? "") : (el.textContent ?? "").trim(),
        where: (el.parentElement?.getAttribute("class") ?? "").slice(0, 40),
        fontSize: px(c.fontSize),
        innerW: boxW - px(c.paddingLeft) - px(c.paddingRight),
        innerH: boxH - px(c.paddingTop) - px(c.paddingBottom),
        /* "normal" for the icon font is its em: one glyph. An SVG has no
           line: it is its own box. */
        lineHeight: svg ? px(c.fontSize) : px(c.lineHeight) || px(c.fontSize),
      };
    }), scope);
}

function expectWhole(list: Glyph[]) {
  for (const g of list) {
    const name = `"${g.word}" in .${g.where}`;
    expect(g.innerW, `${name}: room for one glyph across`).toBeGreaterThanOrEqual(g.fontSize - 0.5);
    expect(g.innerH, `${name}: room for one glyph down`).toBeGreaterThanOrEqual(g.fontSize - 0.5);
    /* The glyph is one em, centred in its line. The line starts at the top of
       the box, so the glyph ends at (line + em) / 2: that must be inside.
       (scrollHeight cannot say this: it counts the font's own ascent and
       descent, a couple of pixels past the em on every icon, cut or not.) */
    expect((g.lineHeight + g.fontSize) / 2, `${name}: the glyph's foot is inside its box (line ${g.lineHeight}px, box ${g.innerH}px)`).toBeLessThanOrEqual(g.innerH + 0.5);
  }
}

test.describe("Builder chrome icons are drawn whole", () => {
  test("a rejected attachment: the error icon is whole and sits on the sentence's first line", async ({ page }) => {
    await page.route("**/api/health", route => route.fulfill({ json: { anthropicConfigured: true, firebaseConfigured: false } }));
    await page.goto("/builder");
    await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible();
    await iconFontReady(page);
    const notAnImage = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>');
    await page.locator('[data-testid="composer-file-input"]').setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: notAnImage });
    const error = page.locator(".composer-attach-error");
    await expect(error).toContainText("That file isn't an image we can read");
    const icon = error.locator("svg.chrome-icon");
    await expect(icon).toHaveAttribute("data-icon", "error");
    await expect(error.locator(".material-symbols-outlined")).toHaveCount(0);

    expectWhole(await glyphs(page, ".composer-attach-status"));

    /* On the row of the sentence's first line, centred on it. */
    const rows = await error.evaluate(el => {
      const glyph = el.querySelector("svg.chrome-icon")!.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(el.querySelector("span")!);
      const line = range.getClientRects()[0];
      return { glyphTop: glyph.top, glyphBottom: glyph.bottom, lineTop: line.top, lineBottom: line.bottom };
    });
    const glyphMid = (rows.glyphTop + rows.glyphBottom) / 2;
    const lineMid = (rows.lineTop + rows.lineBottom) / 2;
    expect(Math.abs(glyphMid - lineMid), "the icon is centred on the first line of the sentence").toBeLessThanOrEqual(2);
  });

  test("every icon in the edit chrome is drawn whole: nothing cuts or squeezes it", async ({ page }) => {
    await page.goto("/builder");
    await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible();
    await iconFontReady(page);
    expectWhole(await glyphs(page));
    await page.getByRole("button", { name: /Browse templates/ }).click();
    await expect(page.getByRole("button", { name: "Use the Performance Analytics template" })).toBeVisible();
    expectWhole(await glyphs(page));
    await page.getByRole("button", { name: "Use the Performance Analytics template" }).click();
    await expect(page.locator(".present-bar")).toBeVisible();
    await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
    await expect(page.locator(".top-bar")).toBeVisible();
    const library = page.getByRole("button", { name: "Show component library" });
    if (await library.isVisible()) await library.click();
    const block = page.locator('.bp-main [data-block-id][data-zone="body"]').first();
    await block.focus();
    await block.press("Enter");
    await expect(block).toHaveClass(/is-selected/);
    const edit = await glyphs(page);
    expect(edit.length).toBeGreaterThan(20);
    expectWhole(edit);
    await block.click({ button: "right", position: { x: 5, y: 5 } });
    await expect(page.getByRole("menuitem", { name: /^Delete/ })).toBeVisible();
    expectWhole(await glyphs(page, "body"));
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Export canvas" }).click();
    expectWhole(await glyphs(page, "body"));
  });
});

