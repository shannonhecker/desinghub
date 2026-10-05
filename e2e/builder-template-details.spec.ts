import { test, expect, type Page, type Locator } from "@playwright/test";

/**
 * Template details that must hold in every design system, light and dark.
 *
 * Each of these was wrong in all five systems (or in four of them), so each
 * is measured in all five:
 *
 *   - the header's status pill is readable;
 *   - the Settings profile's time zone select has a label of its own;
 *   - the Settings profile's fields are wide enough for their values;
 *   - the Analytics Home launcher thumbnails are dark in dark mode.
 *
 * Pre-flight: `npm run dev` (see playwright.config.ts for the base URL).
 */

const SYSTEMS = ["Salt DS", "Material 3", "Fluent 2", "uoaui", "Carbon"] as const;
const MODES = ["dark", "light"] as const;

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
}

async function switchSystem(page: Page, label: (typeof SYSTEMS)[number]) {
  const picker = page.getByRole("button", { name: /^Design system:/ });
  if ((await picker.getAttribute("aria-label"))?.startsWith(`Design system: ${label}`)) return;
  await picker.click();
  await page.getByText(label, { exact: true }).last().click();
  await expect(page.getByRole("button", { name: new RegExp(`^Design system: ${label}`) })).toBeVisible();
}

async function setMode(page: Page, mode: (typeof MODES)[number]) {
  const toggle = page.getByRole("button", { name: `Switch to ${mode} mode` });
  if (await toggle.count()) await toggle.first().click();
  await expect(page.getByRole("button", { name: `Switch to ${mode === "dark" ? "light" : "dark"} mode` }).first()).toBeVisible();
  await expect(stage(page)).toHaveClass(mode === "light" ? /builder-light/ : /^(?!.*builder-light)/);
}

/** Contrast of an element's text against the first opaque fill behind it. */
async function textContrast(target: Locator): Promise<number> {
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
    const ink = over(parse(getComputedStyle(el).color), ground);
    const [hi, lo] = [lum(ink), lum(ground)].sort((a, b) => b - a);
    return (hi + 0.05) / (lo + 0.05);
  });
}

test.describe("Builder - the header's status pill is readable", () => {
  test("Settings: 'All changes saved' is at least 4.5:1 in every design system, light and dark", async ({ page }) => {
    await applyTemplate(page, "Settings Page");
    for (const system of SYSTEMS) {
      await switchSystem(page, system);
      for (const mode of MODES) {
        await setMode(page, mode);
        const label = stage(page).locator(".bp-status-label").first();
        await expect(label).toHaveText("All changes saved");
        await expect(async () => {
          expect(await textContrast(label), `${system}, ${mode}`).toBeGreaterThanOrEqual(4.5);
        }).toPass({ timeout: 5_000 });
      }
    }
  });
});

test.describe("Builder - Settings profile: the time zone select", () => {
  test("is labelled 'Time zone' in every design system, not with its own value", async ({ page }) => {
    await applyTemplate(page, "Settings Page");
    for (const system of SYSTEMS) {
      await switchSystem(page, system);
      const profile = stage(page).locator(".bp-main");
      /* A visible label, and the control is named by it. */
      await expect(profile.getByText("Time zone", { exact: true }).first(), `${system}: a visible label`).toBeVisible();
      /* The value is shown once, as the value (text on the page, or the
         chosen option of a native select). */
      const shown = await profile.evaluate((el) => {
        const VALUE = "(GMT+00:00) London";
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let count = 0;
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const host = n.parentElement!;
          if (n.textContent?.trim() !== VALUE) continue;
          const cs = getComputedStyle(host);
          if (cs.visibility === "hidden" || cs.display === "none" || host.closest("legend, [aria-hidden='true'], option")) continue;
          count += 1;
        }
        for (const select of el.querySelectorAll("select")) {
          if (select.offsetParent && select.selectedOptions[0]?.textContent?.trim() === VALUE) count += 1;
        }
        return count;
      });
      expect(shown, `${system}: the value appears once`).toBe(1);
    }
  });
});

test.describe("Builder - Analytics Home launcher thumbnails", () => {
  test("are drawn dark in dark mode and as authored in light mode, in every design system", async ({ page }) => {
    await applyTemplate(page, "Analytics Home");
    for (const system of SYSTEMS) {
      await switchSystem(page, system);
      for (const mode of MODES) {
        await setMode(page, mode);
        const art = stage(page).locator(".dh-launcher-art").first();
        await expect(art).toBeVisible();
        await expect(async () => {
          const filter = await art.evaluate((el) => getComputedStyle(el).filter);
          if (mode === "dark") expect(filter, `${system}, dark: the light artwork is inverted`).toMatch(/invert\(1\)/);
          else expect(filter, `${system}, light: the artwork is as authored`).toBe("none");
        }).toPass({ timeout: 5_000 });
      }
    }
  });
});

test.describe("Builder - Settings profile: the fields fit their values", () => {
  test("no profile value is clipped, and the fields share one width, in every design system", async ({ page }) => {
    await applyTemplate(page, "Settings Page");
    for (const system of SYSTEMS) {
      await switchSystem(page, system);
      const fields = stage(page).locator(".bp-main input:not([type='hidden']):not([aria-hidden='true'])");
      await expect(fields.first()).toBeVisible();
      const read = await fields.evaluateAll((els) => (els as HTMLInputElement[]).filter((i) => i.offsetParent && i.value).map((i) => ({ value: i.value, clipped: i.scrollWidth > i.clientWidth + 1, width: Math.round(i.getBoundingClientRect().width) })));
      const email = read.find((f) => f.value.includes("@"));
      expect(email, `${system}: the work email field`).toBeTruthy();
      for (const f of read) expect(f.clipped, `${system}: "${f.value}" fits its field (${f.width}px)`).toBe(false);
      const texts = read.filter((f) => /Sarah|Product|@/.test(f.value));
      expect(texts.length, `${system}: the four text fields`).toBe(4);
      expect(Math.max(...texts.map((f) => f.width)) - Math.min(...texts.map((f) => f.width)), `${system}: one width`).toBeLessThanOrEqual(1);
    }
  });
});
