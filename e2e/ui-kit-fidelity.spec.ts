import { test, expect, type Page } from "@playwright/test";

/**
 * The library's Compare, Playground and Specs panels must match each
 * system's own page. The page draws its button from its documented tokens;
 * the panels mount the real package through the kit skin. Background,
 * corner, text transform and typeface must agree, in light and dark.
 */

const SYSTEMS: { id: string; label: string; own: string }[] = [
  { id: "salt", label: "Salt DS", own: ".s-btn-solid" },
  { id: "m3", label: "Material 3", own: ".m3-btn-filled" },
  { id: "fluent", label: "Fluent 2", own: ".f-btn-primary" },
  { id: "uoaui", label: "uoaui DS", own: ".a-btn-primary" },
  { id: "carbon", label: "Carbon DS", own: ".cb-btn-primary" },
];

type Look = { bg: string; radius: string; transform: string; family: string; color: string };
const look = (page: Page, selector: string) => page.locator(selector).first().evaluate((el): Look => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, radius: cs.borderTopLeftRadius, transform: cs.textTransform, family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim().toLowerCase(), color: cs.color };
});

async function setMode(page: Page, dark: boolean) {
  const rail = page.getByRole("navigation", { name: "Design systems, sections and actions" });
  const btn = rail.getByRole("button", { name: /^Switch to (light|dark) mode$/ });
  const label = await btn.getAttribute("aria-label");
  if ((dark && label === "Switch to dark mode") || (!dark && label === "Switch to light mode")) { await btn.click(); await page.waitForTimeout(400); }
}

for (const sys of SYSTEMS) for (const dark of [false, true]) {
  test(`${sys.label} ${dark ? "dark" : "light"}: compare, playground and specs buttons match the page's own button`, async ({ page }) => {
    await page.goto(`/ui-kit?ds=${sys.id}&c=buttons`, { waitUntil: "networkidle" });
    await setMode(page, dark);
    await page.evaluate(() => document.fonts.ready);
    const own = await look(page, `[data-testid="detail-stage"] ${sys.own}`);

    /* Playground (Overview) */
    const play = page.locator(".kit-play-stage button").first();
    await expect(play).toBeVisible();
    /* Carbon's scoped sheet arrives a moment after the component. */
    await expect.poll(async () => (await look(page, ".kit-play-stage button")).bg, { message: "playground background" }).toBe(own.bg);
    const playLook = await look(page, ".kit-play-stage button");
    expect(playLook.radius, "playground corner").toBe(own.radius);
    expect(playLook.transform, "playground text transform").toBe(own.transform);
    expect(playLook.family, "playground typeface").toBe(own.family);

    /* Specs grid, first Default cell */
    await page.getByRole("tab", { name: "Specs" }).click();
    const cell = page.locator(".dh-matrix tbody tr").first().locator("td").first().locator("button");
    await expect(cell).toBeVisible();
    const cellLook = await cell.evaluate((el): Look => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, radius: cs.borderTopLeftRadius, transform: cs.textTransform, family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim().toLowerCase(), color: cs.color }; });
    expect(cellLook.bg, "specs background").toBe(own.bg);
    expect(cellLook.radius, "specs corner").toBe(own.radius);
    expect(cellLook.transform, "specs text transform").toBe(own.transform);

    /* Compare panel for this system */
    await page.getByRole("tab", { name: "Compare" }).click();
    const panel = page.locator(`[data-testid="compare-panels"] li[data-system="${sys.id}"] button`).first();
    await expect(panel).toBeVisible();
    const cmp = await look(page, `[data-testid="compare-panels"] li[data-system="${sys.id}"] button`);
    expect(cmp.bg, "compare background").toBe(own.bg);
    expect(cmp.radius, "compare corner").toBe(own.radius);
    expect(cmp.transform, "compare text transform").toBe(own.transform);
    expect(cmp.family, "compare typeface").toBe(own.family);
    /* And the other four panels are each their own system, not this one's. */
    for (const other of SYSTEMS.filter((o) => o.id !== sys.id)) {
      const o = await look(page, `[data-testid="compare-panels"] li[data-system="${other.id}"] button`);
      expect(o.bg, `${other.label} panel differs from ${sys.label}`).not.toBe(own.bg);
    }
  });
}

test("Material 3 panels are Material, not default MUI", async ({ page }) => {
  await page.goto("/ui-kit?ds=salt&c=buttons", { waitUntil: "networkidle" });
  await setMode(page, false);
  await page.getByRole("tab", { name: "Compare" }).click();
  const m3 = await look(page, '[data-testid="compare-panels"] li[data-system="m3"] button');
  expect(m3.bg).toBe("rgb(103, 80, 164)");
  expect(m3.radius).toBe("9999px");
  expect(m3.transform).toBe("none");
  expect(m3.family).toBe("roboto");
  const salt = await look(page, '[data-testid="compare-panels"] li[data-system="salt"] button');
  expect(salt.bg).toBe("rgb(27, 127, 158)");
  expect(salt.transform).toBe("none");
});

/* ════════════════════════════════════════════════════════════════════════
   Beyond Button: Switch, Tag, Checkbox and Text input, all five systems,
   light and dark. Each Compare panel is measured against the same control
   on that system's own page.

   What is compared is stated per system below. Material and uoaui are held
   to their page exactly (the Material panel is MUI wearing the kit's M3
   theme; the uoaui panel is the same classes). Salt, Fluent and Carbon
   panels are the official packages, and the page beside them is a drawing
   of the system, so a few parts differ by design and are left to the
   package: Salt's own switch and pill have 4px corners where the page draws
   a full pill, Fluent's checkbox corner is 2px where the page draws 3px,
   Carbon's checkbox is 16px with a 1px edge where the page draws 18px with
   2px. Those are sized within a stated tolerance; the rest is exact.
   ════════════════════════════════════════════════════════════════════════ */

type Pick = { css: string; nth?: number; child?: boolean; pseudo?: string; path?: boolean; stroke?: string };
type Box = { w: number; h: number; radius: number; bg: string; edge: string; edgeBottom: string; ink: string };

/** Size, corner and colours of one part of a control. */
function measure(page: Page, root: string, pick: Pick): Promise<Box> {
  return page.locator(`${root} ${pick.css}`).nth(pick.nth ?? 0).evaluate((node, p): Box => {
    let el = node as Element;
    if (p.child) el = el.firstElementChild ?? el;
    if (p.stroke) el = el.querySelector(p.stroke) ?? el;
    const cs = getComputedStyle(el, p.pseudo);
    const rect = p.path ? (el.querySelector("path") ?? el).getBoundingClientRect() : el.getBoundingClientRect();
    const px = (v: string) => Math.round(parseFloat(v) || 0);
    const w = p.pseudo ? px(cs.width) + px(cs.borderLeftWidth) + px(cs.borderRightWidth) : Math.round(rect.width);
    const h = p.pseudo ? px(cs.height) + px(cs.borderTopWidth) + px(cs.borderBottomWidth) : Math.round(rect.height);
    /* A corner at least half the height is a pill, whatever number wrote it. */
    const r = cs.borderTopLeftRadius.endsWith("%") ? (parseFloat(cs.borderTopLeftRadius) / 100) * h : parseFloat(cs.borderTopLeftRadius) || 0;
    return { w, h, radius: Math.min(Math.round(r), Math.round(h / 2)), bg: cs.backgroundColor, edge: cs.borderTopColor, edgeBottom: cs.borderBottomColor, ink: cs.color };
  }, pick);
}

type Key = keyof Box;
interface Check {
  /** The control on the system's own page (inside the detail stage). */
  own: Pick;
  /** The same part inside that system's Compare panel. */
  panel: Pick;
  /** Must be identical. `a=b` compares own.a with panel.b. */
  same: string[];
  /** Identical in the light theme only (see the note where it is used). */
  sameLight?: string[];
  /** Must be within this many pixels (package and drawing differ by design). */
  near?: Partial<Record<Key, number>>;
}

const CONTROLS: { concept: string; ids: Record<string, string | null>; checks: Record<string, Check | null> }[] = [
  {
    concept: "Switch",
    ids: { salt: "switches", m3: "switches", fluent: "switches", uoaui: "switches", carbon: "switches" },
    checks: {
      /* Off state. Salt: the page draws a pill, the package a 4px corner. */
      salt: { own: { css: "button", nth: 1 }, panel: { css: ".saltSwitch-track" }, same: ["edge"], near: { w: 2, h: 2 } },
      m3: { own: { css: ".m3-switch:not(.on)" }, panel: { css: ".MuiSwitch-track" }, same: ["w", "h", "radius", "bg", "edge"] },
      fluent: { own: { css: ".f-switch:not(.on)" }, panel: { css: ".fui-Switch__indicator" }, same: ["w", "h", "radius", "edge"] },
      uoaui: { own: { css: ".a-switch:not(.on)" }, panel: { css: ".a-switch" }, same: ["w", "h", "radius", "bg", "edge"] },
      carbon: { own: { css: ".cb-toggle:not(.on) .cb-toggle-track" }, panel: { css: ".cds--toggle__switch" }, same: ["w", "h", "radius", "bg"] },
    },
  },
  {
    concept: "Checkbox",
    ids: { salt: "checkboxes", m3: "checkboxes", fluent: "checkboxes", uoaui: "checkboxes", carbon: "checkboxes" },
    checks: {
      /* Unchecked box. */
      salt: { own: { css: '[role="checkbox"]', nth: 1, child: true }, panel: { css: ".saltCheckboxIcon" }, same: ["edge"], near: { w: 2, h: 2, radius: 2 } },
      /* MUI draws the box as an 18px path in the outline colour. */
      m3: { own: { css: ".m3-cb:not(.checked) .m3-cb-box" }, panel: { css: ".MuiCheckbox-root svg", path: true }, same: ["w", "h", "edge=ink"] },
      fluent: { own: { css: ".f-checkbox:not(.checked) .f-cb-box" }, panel: { css: ".fui-Checkbox__indicator" }, same: ["w", "h", "edge"], near: { radius: 1 } },
      uoaui: { own: { css: ".a-checkbox:not(.checked) .a-cb-box" }, panel: { css: ".a-cb-box" }, same: ["w", "h", "radius", "bg", "edge"] },
      carbon: { own: { css: ".cb-cb-box:not(.checked)" }, panel: { css: ".cds--checkbox-label", pseudo: "::before" }, same: ["edge"], near: { w: 2, h: 2, radius: 2 } },
    },
  },
  {
    concept: "Text input",
    ids: { salt: "inputs", m3: "text-fields", fluent: "inputs", uoaui: "inputs", carbon: "inputs" },
    checks: {
      salt: { own: { css: ".s-input" }, panel: { css: ".saltInput" }, same: ["h", "radius", "bg"] },
      /* Outlined field: MUI draws the outline on a fieldset inside the root,
         which stands 5px proud at the top to make room for the label notch. */
      m3: { own: { css: ".m3-tf-outlined" }, panel: { css: ".MuiOutlinedInput-root", stroke: "fieldset" }, same: ["radius", "edge"], near: { h: 6 } },
      fluent: { own: { css: ".f-input" }, panel: { css: ".fui-Input" }, same: ["h", "radius", "bg", "edge", "edgeBottom"] },
      uoaui: { own: { css: ".a-input" }, panel: { css: ".a-input" }, same: ["h", "radius", "bg", "edgeBottom"] },
      /* Dark: Carbon's g100 field edge is its own $border-strong-01; the
         page keeps the light theme's grey there, so the edge is held in
         light only. */
      carbon: { own: { css: ".cb-input" }, panel: { css: ".cds--text-input" }, same: ["h", "radius", "bg"], sameLight: ["edgeBottom"] },
    },
  },
  {
    concept: "Tag",
    /* This library has no tag page for Fluent 2 or uoaui. */
    ids: { salt: "pills", m3: "chips", fluent: null, uoaui: null, carbon: "tags" },
    checks: {
      /* Salt: the page draws a pill outline, the package a filled 4px pill. */
      salt: { own: { css: "button", nth: 2 }, panel: { css: ".saltPill" }, same: [], near: { h: 2 } },
      m3: { own: { css: ".m3-chip:not(.selected)" }, panel: { css: ".MuiChip-root" }, same: ["h", "radius", "bg", "edge"] },
      fluent: null,
      uoaui: null,
      carbon: { own: { css: ".cb-tag-gray" }, panel: { css: ".cds--tag" }, same: ["h", "radius", "bg"] },
    },
  },
];

for (const control of CONTROLS) for (const sys of SYSTEMS) for (const dark of [false, true]) {
  const id = control.ids[sys.id];
  const check = control.checks[sys.id];
  if (!id || !check) continue;
  test(`${sys.label} ${dark ? "dark" : "light"}: the Compare ${control.concept} matches the page's own`, async ({ page }) => {
    await page.goto(`/ui-kit?ds=${sys.id}&c=${id}`, { waitUntil: "networkidle" });
    await setMode(page, dark);
    await page.evaluate(() => document.fonts.ready);
    const own = await measure(page, '[data-testid="detail-stage"]', check.own);

    await page.getByRole("tab", { name: "Compare" }).click();
    const root = `[data-testid="compare-panels"] li[data-system="${sys.id}"]`;
    await expect(page.locator(`${root} ${check.panel.css}`).first()).toBeVisible();
    /* Carbon's scoped sheet arrives a moment after the component. */
    const first = check.same[0] ?? "h";
    const [a, b] = (first.includes("=") ? first.split("=") : [first, first]) as [Key, Key];
    if (check.same.length > 0) await expect.poll(async () => (await measure(page, root, check.panel))[b], { message: `${control.concept} ${a}` }).toBe(own[a]);
    const panel = await measure(page, root, check.panel);

    for (const key of [...check.same, ...(dark ? [] : check.sameLight ?? [])]) {
      const [k1, k2] = (key.includes("=") ? key.split("=") : [key, key]) as [Key, Key];
      expect(panel[k2], `${control.concept} ${key}: page ${JSON.stringify(own)} panel ${JSON.stringify(panel)}`).toBe(own[k1]);
    }
    for (const [key, tol] of Object.entries(check.near ?? {})) {
      const k = key as Key;
      expect(Math.abs((panel[k] as number) - (own[k] as number)), `${control.concept} ${k} within ${tol}px: page ${own[k]} panel ${panel[k]}`).toBeLessThanOrEqual(tol);
    }
    /* Never a zero-size or missing part. */
    expect(panel.h).toBeGreaterThan(8);
  });
}

test("Material 3 switch and chip are Material shapes, not default MUI", async ({ page }) => {
  await page.goto("/ui-kit?ds=salt&c=switches&tab=compare", { waitUntil: "networkidle" });
  await setMode(page, false);
  const track = await measure(page, '[data-testid="compare-panels"] li[data-system="m3"]', { css: ".MuiSwitch-track" });
  expect([track.w, track.h, track.radius]).toEqual([52, 32, 16]);
  expect(track.edge).toBe("rgb(121, 116, 126)");

  await page.goto("/ui-kit?ds=salt&c=pills&tab=compare", { waitUntil: "networkidle" });
  const chip = await measure(page, '[data-testid="compare-panels"] li[data-system="m3"]', { css: ".MuiChip-root" });
  expect([chip.h, chip.radius]).toEqual([32, 8]);
  expect(chip.bg).toBe("rgba(0, 0, 0, 0)");
  expect(chip.edge).toBe("rgb(121, 116, 126)");
});

test("systems without a tag page say so in the Compare panel", async ({ page }) => {
  await page.goto("/ui-kit?ds=carbon&c=tags&tab=compare", { waitUntil: "networkidle" });
  for (const sys of ["fluent", "uoaui"]) {
    const panel = page.locator(`[data-testid="compare-panels"] li[data-system="${sys}"]`);
    await expect(panel.locator(".kit-compare-none")).toContainText("No tag page for");
    await expect(panel.locator("button, input")).toHaveCount(0);
  }
});
