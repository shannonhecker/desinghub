import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * Material 3 in the builder is Material 3.
 *
 * The builder used to draw Material with MUI's default theme: blue,
 * upper-case, 4px corners, and (in the templates' own primary action) a
 * white label on the pale dark-mode primary. These tests read what is on
 * screen, on a general template and on two finance templates, in light and
 * dark:
 *
 *   - a primary button is the primary role with its on-primary label
 *     (contrast at least 4.5:1), fully rounded, in sentence case, in Roboto;
 *   - a text field is the outlined variant with the 4px corner and the
 *     outline role;
 *   - a switch is Material's track: 52 by 32, fully rounded, 2px outline;
 *   - a chip has the 8px corner;
 *   - the dialog and its actions follow the same theme;
 *   - and the slots the templates reserve are still the slots: the header
 *     buttons and the inline dropdown keep their heights.
 *
 * Pre-flight: `npm run dev` (see playwright.config.ts for the base URL).
 */

const ROLES = {
  light: { primary: "rgb(103, 80, 164)", onPrimary: "rgb(255, 255, 255)", outline: "rgb(121, 116, 126)" },
  dark: { primary: "rgb(208, 188, 255)", onPrimary: "rgb(56, 30, 114)", outline: "rgb(147, 143, 153)" },
} as const;
type Mode = keyof typeof ROLES;
const MODES: Mode[] = ["dark", "light"];

function chatInput(page: Page) {
  return page.getByRole("textbox", { name: "Chat message input" });
}
const stage = (page: Page) => page.locator(".present-stage");

async function applyTemplate(page: Page, label: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(chatInput(page)).toBeVisible({ timeout: 30_000 });
  await expect(async () => {
    const browse = page.getByRole("button", { name: /Browse templates/ });
    if (await browse.isVisible()) await browse.click();
    await expect(page.getByRole("list", { name: "Starting templates" })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  if (label === "Analytics Home") await page.getByRole("button", { name: "Open workspace" }).click();
  else await page.getByRole("button", { name: `Use the ${label} template` }).click();
  await expect(stage(page).locator(".bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: /^Design system:/ }).click();
  await page.getByText("Material 3", { exact: true }).last().click();
  await expect(stage(page).locator(".bp-dashboard")).toHaveClass(/preview-m3/);
}

async function setMode(page: Page, mode: Mode) {
  const toggle = page.getByRole("button", { name: `Switch to ${mode} mode` });
  if (await toggle.count()) await toggle.first().click();
  await expect(page.getByRole("button", { name: `Switch to ${mode === "dark" ? "light" : "dark"} mode` }).first()).toBeVisible();
  /* The canvas repaints in the new mode a frame or two after the toggle
     says so (the token sheet and each MUI theme follow the store): wait
     until the canvas's own primary is that mode's before reading anything.
     (Present's canvas, or the Edit canvas when that is what is showing.) */
  await expect(async () => {
    const primary = await page.locator(".bp-dashboard").first().evaluate((el) => {
      const probe = document.createElement("span");
      probe.style.color = "var(--ds-primary)";
      el.appendChild(probe);
      const c = getComputedStyle(probe).color;
      probe.remove();
      return c;
    });
    expect(primary).toBe(ROLES[mode].primary);
  }).toPass({ timeout: 10_000 });
}

/** Read and check once the look has settled: a colour transition or a
 *  re-themed component may still be a frame behind a mode change. */
async function settled(check: () => Promise<void>) {
  await expect(check).toPass({ timeout: 10_000 });
}

interface Look {
  bg: string;
  color: string;
  contrast: number;
  radius: number;
  transform: string;
  family: string;
  width: number;
  height: number;
  border: string;
  borderWidth: number;
}

/** What an element looks like at rest: its own fill (or the first opaque one
 *  behind it), its text colour and their contrast, corner, case and size. */
async function look(target: Locator): Promise<Look> {
  return target.first().evaluate((el) => {
    const parse = (c: string): number[] => {
      const probe = document.createElement("canvas").getContext("2d")!;
      probe.fillStyle = "#000";
      probe.fillStyle = c;
      const v = probe.fillStyle;
      if (v.startsWith("#")) return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16), 1];
      const m = v.match(/-?[\d.]+(?:e-?\d+)?/g)!.map(Number);
      const unit = v.startsWith("color(") ? 255 : 1;
      return [m[0] * unit, m[1] * unit, m[2] * unit, m[3] ?? 1];
    };
    const over = (top: number[], under: number[]) => top.slice(0, 3).map((t, i) => t * top[3] + under[i] * (1 - top[3])).concat(1);
    const lum = (c: number[]) => {
      const [r, g, b] = c.slice(0, 3).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const layers: number[][] = [];
    for (let n: Element | null = el; n; n = n.parentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      layers.push(c);
      if (c[3] >= 1) break;
    }
    let ground = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) ground = over(layers[i], ground);
    const cs = getComputedStyle(el);
    const ink = over(parse(cs.color), ground);
    const [hi, lo] = [lum(ink), lum(ground)].sort((a, b) => b - a);
    const r = el.getBoundingClientRect();
    const zoom = parseFloat(el.closest(".bp-device-frame")?.getAttribute("data-frame-zoom") ?? "1") || 1;
    return {
      bg: `rgb(${ground.slice(0, 3).map((v) => Math.round(v)).join(", ")})`,
      color: cs.color,
      contrast: (hi + 0.05) / (lo + 0.05),
      radius: parseFloat(cs.borderTopLeftRadius),
      transform: cs.textTransform,
      family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim().toLowerCase(),
      width: r.width / zoom,
      height: r.height / zoom,
      border: cs.borderTopColor,
      borderWidth: parseFloat(cs.borderTopWidth),
    };
  });
}

/** A fully rounded shape: the corner is at least half the height. */
function expectPill(l: Look) {
  expect(l.radius, "fully rounded").toBeGreaterThanOrEqual(l.height / 2 - 0.5);
}

function expectPrimaryButton(l: Look, mode: Mode) {
  expect(l.bg, "the primary role").toBe(ROLES[mode].primary);
  expect(l.color, "the on-primary role").toBe(ROLES[mode].onPrimary);
  expect(l.contrast, "label contrast").toBeGreaterThanOrEqual(4.5);
  expectPill(l);
  expect(l.transform, "sentence case").toBe("none");
  expect(l.family).toBe("roboto");
}

test.describe("Builder - Material 3 is Material 3", () => {
  test("general template (Settings): buttons, text fields, switches and chips", async ({ page }) => {
    await applyTemplate(page, "Settings Page");
    const nav = (name: string) => stage(page).getByRole("button", { name }).first();
    for (const mode of MODES) {
      await setMode(page, mode);

      /* Profile: an outlined button and outlined text fields. */
      await nav("Profile").click();
      const upload = stage(page).getByRole("button", { name: "Upload photo" });
      await expect(upload).toBeVisible();
      await settled(async () => expect((await look(upload)).color).toBe(ROLES[mode].primary));
      const outlined = await look(upload);
      expectPill(outlined);
      expect(outlined.transform).toBe("none");
      expect(outlined.family).toBe("roboto");
      expect(outlined.color, "an outlined button's label is the primary role").toBe(ROLES[mode].primary);
      expect(outlined.contrast).toBeGreaterThanOrEqual(4.5);

      const field = stage(page).locator(".MuiTextField-root").first();
      await expect(field.locator(".MuiOutlinedInput-root"), "the outlined variant").toHaveCount(1);
      const fieldLook = await look(field.locator(".MuiOutlinedInput-root"));
      expect(fieldLook.radius, "extra-small corner").toBe(4);
      expect(fieldLook.height, "Material's 56px field").toBeCloseTo(56, 0);
      expect(fieldLook.contrast).toBeGreaterThanOrEqual(4.5);
      const notch = await look(field.locator("fieldset"));
      expect(notch.border, "the outline role").toBe(ROLES[mode].outline);

      /* Members: the primary (filled) button and chips. */
      await nav("Members").click();
      const primary = stage(page).locator(".MuiButton-contained").first();
      await expect(primary).toBeVisible();
      expectPrimaryButton(await look(primary), mode);
      const chip = await look(stage(page).locator(".MuiChip-root").first());
      expect(chip.radius, "Material's 8px chip").toBe(8);
      expect(chip.contrast).toBeGreaterThanOrEqual(4.5);

      /* Notifications: the switch is Material's track. */
      await nav("Notifications").click();
      const sw = stage(page).locator(".MuiSwitch-root").first();
      await expect(sw).toBeVisible();
      const track = await look(sw.locator(".MuiSwitch-track"));
      expect(Math.round(track.width), "track width").toBe(52);
      expect(Math.round(track.height), "track height").toBe(32);
      expectPill(track);
      expect(track.borderWidth, "2px outline").toBe(2);
      const on = stage(page).locator(".MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track").first();
      await expect(on, "the template has switches that are on").toBeVisible();
      expect((await look(on)).bg, "an on switch is the primary role").toBe(ROLES[mode].primary);
      /* The row keeps the height the template gives it (MUI's 38px root). */
      expect((await look(sw)).height).toBeCloseTo(38, 0);
    }
  });

  test("finance template (FX Execution): header actions, the order ticket and the rail menu", async ({ page }) => {
    await applyTemplate(page, "FX Execution");
    await expect(stage(page).locator(".dh-exec .highcharts-root")).toBeVisible({ timeout: 30_000 });
    for (const mode of MODES) {
      await setMode(page, mode);
      const fill = stage(page).getByRole("button", { name: "Fill now" });
      await settled(async () => expectPrimaryButton(await look(fill), mode));
      const fillLook = await look(fill);
      /* The header's slot: MUI's small button, 30.75px. */
      expect(fillLook.height).toBeGreaterThan(30);
      expect(fillLook.height).toBeLessThan(31.5);
      const compare = await look(stage(page).getByRole("button", { name: "Compare orders" }));
      expectPill(compare);
      expect(compare.transform).toBe("none");
      expect(compare.color).toBe(ROLES[mode].primary);
      expect(compare.height).toBeCloseTo(fillLook.height, 1);

      /* The order ticket: Material's dialog, fields and actions. */
      await fill.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      const paper = await look(dialog);
      expect(paper.radius, "Material's 28px dialog").toBe(28);
      const submit = dialog.getByRole("button", { name: "Submit sample order" });
      expectPrimaryButton(await look(submit), mode);
      const cancel = await look(dialog.getByRole("button", { name: "Cancel" }));
      expect(cancel.transform).toBe("none");
      expect(cancel.color).toBe(ROLES[mode].primary);
      expect(cancel.contrast).toBeGreaterThanOrEqual(4.5);
      const input = dialog.locator(".MuiOutlinedInput-root").first();
      await expect(input, "outlined fields").toBeVisible();
      const inputLook = await look(input);
      expect(inputLook.radius).toBe(4);
      expect(inputLook.contrast).toBeGreaterThanOrEqual(4.5);
      expect((await look(input.locator("fieldset"))).border).toBe(ROLES[mode].outline);
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);

      /* A rail menu: readable rows in Roboto. */
      await stage(page).locator(".dh-exec-rail").getByRole("button", { name: "Interval", exact: true }).click();
      const item = page.getByRole("menu").locator('[role^="menuitem"]').first();
      await expect(item).toBeVisible();
      const row = await look(item);
      expect(row.contrast).toBeGreaterThanOrEqual(4.5);
      expect(row.family).toBe("roboto");
      await page.keyboard.press("Escape");
    }
  });

  test("finance template (Analytics Home): the hero's primary action and the inline filters", async ({ page }) => {
    await applyTemplate(page, "Analytics Home");
    for (const mode of MODES) {
      await setMode(page, mode);
      const search = stage(page).locator(".dh-hero-button").first();
      await expect(search).toBeVisible();
      await settled(async () => expectPrimaryButton(await look(search), mode));
      /* The reference dropdowns: Material's underlined select in the 24px slot. */
      const select = stage(page).locator(".dh-inline-control .MuiInput-root").first();
      await expect(select, "the standard (underlined) variant").toBeVisible();
      const selectLook = await look(select);
      expect(selectLook.height).toBeCloseTo(24, 0);
      expect(selectLook.family).toBe("roboto");
      expect(selectLook.contrast).toBeGreaterThanOrEqual(4.5);
    }
  });
});

/* ── Dialog actions sit on the content column ──
   Material insets a dialog's actions 24px, the same as its content, so the
   primary action's right edge is the fields' right edge. (MUI's own 8px put
   Submit about 16px past the column, into the 28px corner.) */
test.describe("Builder - Material 3 dialogs: the actions sit on the content column", () => {
  for (const width of [1440, 375] as const) {
    test(`order ticket and Go to at ${width}: the primary action ends where the content does`, async ({ page }) => {
      await page.setViewportSize(width === 1440 ? { width: 1440, height: 900 } : { width: 375, height: 812 });
      await applyTemplate(page, "FX Execution");
      await expect(stage(page).locator(".dh-exec .highcharts-root")).toBeVisible({ timeout: 30_000 });
      for (const mode of MODES) {
        await setMode(page, mode);
        for (const opener of ["Fill now", "Go to a date or range"]) {
          await stage(page).getByRole("button", { name: opener }).click();
          const dialog = page.getByRole("dialog");
          await expect(dialog).toBeVisible();
          /* Once the dialog has finished opening (it scales in). */
          await settled(async () => {
            const edges = await dialog.evaluate((d) => {
              const content = d.querySelector<HTMLElement>(".MuiDialogContent-root")!;
              const cs = getComputedStyle(content);
              const box = content.getBoundingClientRect();
              const buttons = [...d.querySelectorAll<HTMLElement>(".MuiDialogActions-root button")].map((b) => b.getBoundingClientRect());
              return {
                left: box.left + parseFloat(cs.paddingLeft),
                right: box.right - parseFloat(cs.paddingRight),
                first: buttons[0].left,
                primary: buttons[buttons.length - 1].right,
                oneRow: buttons.every((b) => Math.abs(b.top - buttons[0].top) < 1),
              };
            });
            expect(Math.abs(edges.primary - edges.right), `${opener}, ${mode}: primary action's right edge on the content column`).toBeLessThanOrEqual(1);
            expect(edges.first, "the actions fit inside the column").toBeGreaterThanOrEqual(edges.left - 1);
            expect(edges.oneRow, "the actions stay on one row").toBe(true);
          });
          await page.keyboard.press("Escape");
          await expect(dialog).toHaveCount(0);
        }
      }
    });
  }
});

/* ── The chart rail's menus are Material surfaces ── */
const SURFACES = {
  light: { surfaceContainer: [243, 237, 247], secondaryContainer: [232, 222, 248], onSecondaryContainer: "rgb(29, 25, 43)" },
  dark: { surfaceContainer: [33, 31, 38], secondaryContainer: [74, 68, 88], onSecondaryContainer: "rgb(232, 222, 248)" },
} as const;
const channels = (rgb: string) => rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number);
const near = (rgb: string, want: readonly number[], by: number) => channels(rgb).every((c, i) => Math.abs(c - want[i]) <= by);

test.describe("Builder - Material 3 rail menu", () => {
  test("FX Execution: the Interval menu is surface-container and its checked row is the secondary container", async ({ page }) => {
    await applyTemplate(page, "FX Execution");
    await expect(stage(page).locator(".dh-exec .highcharts-root")).toBeVisible({ timeout: 30_000 });
    for (const mode of MODES) {
      await setMode(page, mode);
      await stage(page).locator(".dh-exec-rail").getByRole("button", { name: "Interval", exact: true }).click();
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      const surface = await menu.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, image: getComputedStyle(el).backgroundImage, shadow: getComputedStyle(el).boxShadow }));
      expect(near(surface.bg, SURFACES[mode].surfaceContainer, 0), `menu surface ${surface.bg}`).toBe(true);
      /* No Material 2 elevation overlay on top of the role. */
      expect(surface.image).not.toMatch(/gradient\(rgba\(255, 255, 255/);
      expect(surface.shadow, "it still floats").not.toBe("none");
      const checked = menu.locator(".is-checked").first();
      await expect(checked).toBeVisible();
      const row = await look(checked);
      /* The highlighted checked row carries a 6% state layer over the role. */
      expect(near(row.bg, SURFACES[mode].secondaryContainer, 16), `checked row ${row.bg}`).toBe(true);
      expect(row.color).toBe(SURFACES[mode].onSecondaryContainer);
      expect(row.contrast).toBeGreaterThanOrEqual(4.5);
      const plain = await look(menu.locator('[role^="menuitem"]:not(.is-checked)').first());
      expect(plain.contrast).toBeGreaterThanOrEqual(4.5);
      await page.keyboard.press("Escape");
    }
  });
});

/* ── Status chips are tonal ── */
const luminance = (rgb: string) => {
  const [r, g, b] = channels(rgb).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const TERTIARY = {
  light: { container: "rgb(255, 216, 228)", on: "rgb(49, 17, 29)" },
  dark: { container: "rgb(99, 59, 72)", on: "rgb(255, 216, 228)" },
} as const;
/* MUI's saturated fills, which Material 3 does not use for a status. */
const SATURATED = ["rgb(46, 125, 50)", "rgb(102, 187, 106)", "rgb(237, 108, 2)", "rgb(255, 167, 38)"];

test.describe("Builder - Material 3 status chips", () => {
  test("Settings, Members: Active and Pending are tonal containers with readable labels, at the chip's size", async ({ page }) => {
    await applyTemplate(page, "Settings Page");
    await stage(page).getByRole("button", { name: "Members" }).first().click();
    for (const mode of MODES) {
      await setMode(page, mode);
      const active = stage(page).locator(".MuiChip-root", { hasText: "Active" }).first();
      const pending = stage(page).locator(".MuiChip-root", { hasText: "Pending" }).first();
      await expect(active).toBeVisible();
      /* The chip's fill and its label colour cross-fade on a mode change and
         on first paint: read them once both have arrived (the label must
         still reach 4.5:1, it is only given time to get there). */
      await settled(async () => {
        const now = await look(active);
        expect(SATURATED).not.toContain(now.bg);
        expect(now.contrast, "Active label").toBeGreaterThanOrEqual(4.5);
        expect((await look(pending)).contrast, "Pending label").toBeGreaterThanOrEqual(4.5);
      });
      const a = await look(active);
      expect(a.contrast, "Active label").toBeGreaterThanOrEqual(4.5);
      /* A container tone: pale in light, deep in dark; never the saturated fill. */
      if (mode === "light") expect(luminance(a.bg)).toBeGreaterThan(0.6);
      else expect(luminance(a.bg)).toBeLessThan(0.2);
      const [r, g, b] = channels(a.bg);
      expect(g, "positive reads green").toBeGreaterThan(Math.max(r, b));
      expect(Math.round(a.height)).toBe(32);
      expect(a.radius).toBe(8);
      const p = await look(pending);
      expect(p.bg, "warning is the tertiary container").toBe(TERTIARY[mode].container);
      expect(p.color).toBe(TERTIARY[mode].on);
      expect(p.contrast).toBeGreaterThanOrEqual(4.5);
      expect(Math.round(p.height)).toBe(32);
    }
  });
});

/* ── The switch at every size the builder asks for, and on a finance template ── */
async function editCanvas(page: Page) {
  await page.getByRole("button", { name: "Edit canvas" }).click();
  await expect(chatInput(page)).toBeVisible();
  await page.keyboard.press("Escape");
}
const canvasSwitch = (page: Page) => page.locator(".bp-device-frame .bp-main .MuiSwitch-root");

interface SwitchLook { root: [number, number]; track: [number, number]; trackRadius: number; outlined: boolean; thumb: number; trackBg: string; checked: boolean }
async function switchLook(sw: Locator): Promise<SwitchLook> {
  return sw.evaluate((el) => {
    /* Layout sizes (offset and client boxes), which the Edit canvas's scale
       does not touch: a rendered rectangle there is scaled and rounded. */
    const size = (n: Element): [number, number] => [(n as HTMLElement).offsetWidth, (n as HTMLElement).offsetHeight];
    const track = el.querySelector<HTMLElement>(".MuiSwitch-track")!;
    const cs = getComputedStyle(track);
    return {
      root: size(el), track: size(track),
      trackRadius: parseFloat(cs.borderTopLeftRadius),
      /* The outline's exact 2px is measured in Present, at full scale; a
         scaled canvas snaps a border to the device grid. */
      outlined: cs.borderTopStyle === "solid" && parseFloat(cs.borderTopWidth) > 0,
      thumb: size(el.querySelector(".MuiSwitch-thumb")!)[0], trackBg: cs.backgroundColor,
      checked: Boolean(el.querySelector(".Mui-checked")),
    };
  });
}

test.describe("Builder - Material 3 switch sizes", () => {
  test("Settings at High density: Material's switch at three quarters, inside MUI's small box", async ({ page }) => {
    await applyTemplate(page, "Settings Page");
    await stage(page).getByRole("button", { name: "Notifications" }).first().click();
    await editCanvas(page);
    await page.getByRole("button", { name: "More canvas actions" }).click();
    await page.getByRole("menuitemradio", { name: "High" }).click();
    const on = canvasSwitch(page).filter({ has: page.locator(".Mui-checked") }).first();
    const off = canvasSwitch(page).filter({ hasNot: page.locator(".Mui-checked") }).first();
    await expect(on).toHaveClass(/MuiSwitch-sizeSmall/);
    for (const mode of MODES) {
      await setMode(page, mode);
      /* The track's colour follows the mode a frame after the canvas does. */
      await settled(async () => expect((await switchLook(on)).trackBg, "on is the primary role").toBe(ROLES[mode].primary));
      const a = await switchLook(on);
      expect(a.root, "MUI's small box").toEqual([40, 24]);
      expect(a.track, "the track fills it").toEqual([40, 24]);
      expect(a.trackRadius).toBeGreaterThanOrEqual(12);
      expect(a.outlined, "the track is outlined").toBe(true);
      expect(a.thumb, "the on handle").toBe(18);
      expect(a.trackBg, "on is the primary role").toBe(ROLES[mode].primary);
      const b = await switchLook(off);
      expect(b.thumb, "the off handle").toBe(12);
      expect(b.root).toEqual([40, 24]);
    }
  });

  test("a switch added to a finance template (ESG Analytics) is Material's, and the panels do not move", async ({ page }) => {
    await applyTemplate(page, "ESG Analytics");
    await editCanvas(page);
    /* Each panel's layout size (the Edit canvas rescales when the inspector
       opens, so rendered rectangles are not comparable; layout sizes are). */
    const boxes = () => page.locator(".bp-device-frame .bp-main [data-block-id]").evaluateAll((els) => Object.fromEntries(els.map((el) => { const cell = (el.parentElement ?? el) as HTMLElement; return [el.getAttribute("data-block-id")!, [cell.offsetLeft, cell.offsetWidth, cell.offsetHeight]]; })));
    const before = await boxes();
    const show = page.getByRole("button", { name: "Show component library", exact: true });
    if (await show.isVisible()) await show.click();
    await page.getByRole("searchbox", { name: "Search component library" }).fill("Switch");
    await page.getByRole("button", { name: /^Toggle Switch, drag onto canvas/ }).click();
    const sw = canvasSwitch(page).first();
    await expect(sw).toBeVisible();
    for (const mode of MODES) {
      await setMode(page, mode);
      const s = await switchLook(sw);
      expect(s.root, "MUI's medium box").toEqual([58, 38]);
      expect(s.track, "Material's track").toEqual([52, 32]);
      expect(s.trackRadius).toBeGreaterThanOrEqual(16);
      expect(s.outlined, "the track is outlined").toBe(true);
      expect(s.thumb).toBe(s.checked ? 24 : 16);
    }
    /* The report's panels keep their columns and heights. */
    const after = await boxes();
    expect(Object.keys(before).length, "the report's panels").toBeGreaterThanOrEqual(6);
    /* Within the builder's 1px: a width is a whole number of a fractional column. */
    for (const [id, box] of Object.entries(before)) {
      box.forEach((v, i) => expect(Math.abs(after[id][i] - v), `panel ${id}, ${["left", "width", "height"][i]}`).toBeLessThanOrEqual(1));
    }
  });
});
