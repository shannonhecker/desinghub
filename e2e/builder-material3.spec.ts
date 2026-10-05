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
      if (await on.count()) expect((await look(on)).bg, "an on switch is the primary role").toBe(ROLES[mode].primary);
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
      const fillLook = await look(fill);
      expectPrimaryButton(fillLook, mode);
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
      expectPrimaryButton(await look(search), mode);
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
