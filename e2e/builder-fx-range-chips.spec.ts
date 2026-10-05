import { test, expect, type Page } from "@playwright/test";

/**
 * FX Execution, the range row under the chart (1D, 3D, ... and Go to).
 *
 *   - The chosen range is an inverted pill: its label must read against the
 *     pill (4.5:1) in every system, light and dark. In uoaui the card colour
 *     is glass (white at low alpha), so a label painted in it vanished.
 *   - On a narrow panel the row scrolls and the Go to chip stays at its end,
 *     over the presets: it must hide what scrolls under it.
 *
 * Sample data only: nothing connects to a market.
 */

const SYSTEMS = ["Salt DS", "Material 3", "Fluent 2", "uoaui", "Carbon"] as const;
const MODES = ["dark", "light"] as const;

async function applyFx(page: Page) {
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible({ timeout: 30_000 });
  const use = page.getByRole("button", { name: "Use the FX Execution template" });
  await expect(async () => {
    if (!(await use.isVisible())) await page.getByRole("button", { name: /Browse templates/ }).click();
    await expect(use).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  await use.click();
  await expect(page.locator(".present-stage .dh-exec .highcharts-root")).toBeVisible({ timeout: 30_000 });
  await stage(page).getByRole("button", { name: "Pause the sample feed" }).click();
  await expect(stage(page).locator(".dh-feed-status")).toHaveClass(/is-paused/);
}

const stage = (page: Page) => page.locator(".present-stage");
const row = (page: Page) => stage(page).locator(".dh-exec-ranges");

async function pickSystem(page: Page, system: (typeof SYSTEMS)[number]) {
  const trigger = page.getByRole("button", { name: /^Design system:/ });
  if ((await trigger.textContent())?.trim() === system) return;
  await trigger.click();
  await page.getByText(system, { exact: true }).last().click();
  await expect(trigger).toContainText(system);
}

async function pickMode(page: Page, mode: (typeof MODES)[number]) {
  const to = page.getByRole("button", { name: `Switch to ${mode} mode`, exact: true });
  if (await to.isVisible()) await to.click();
  await expect(page.getByRole("button", { name: `Switch to ${mode === "dark" ? "light" : "dark"} mode`, exact: true })).toBeVisible();
}

/**
 * The active chip as drawn: its label colour over its own background, both
 * resolved by painting them (so any colour syntax and any alpha is read as
 * the pixels it makes), and the WCAG contrast between the two.
 */
async function activeChip(page: Page) {
  return row(page).locator(".dh-exec-range.is-active").first().evaluate(el => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    const paint = (colours: string[]) => {
      ctx.clearRect(0, 0, 1, 1);
      for (const c of colours) { ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1); }
      return [...ctx.getImageData(0, 0, 1, 1).data];
    };
    const ownBg = getComputedStyle(el).backgroundColor;
    const behind: string[] = [];
    for (let n = el.parentElement; n; n = n.parentElement) behind.unshift(getComputedStyle(n).backgroundColor);
    const bg = paint([...behind, ownBg]);
    const fg = paint([...behind, ownBg, getComputedStyle(el).color]);
    const lum = ([r, g, b]: number[]) => {
      const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
    return { label: el.textContent ?? "", contrast: (hi + 0.05) / (lo + 0.05) };
  });
}

/** The Go to chip's own background, painted alone: 255 is opaque. */
async function goToAlpha(page: Page) {
  return row(page).locator(".dh-exec-range-goto").evaluate(el => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    const style = getComputedStyle(el);
    ctx.fillStyle = style.backgroundColor;
    ctx.fillRect(0, 0, 1, 1);
    return { alpha: ctx.getImageData(0, 0, 1, 1).data[3], image: style.backgroundImage };
  });
}

for (const width of [375, 1440] as const) {
  test.describe(`Builder - FX Execution range row at ${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test("every system, light and dark: the active chip's label reads on its pill, and Go to hides the chip under it", async ({ page }) => {
      await applyFx(page);
      for (const system of SYSTEMS) {
        await pickSystem(page, system);
        for (const mode of MODES) {
          await pickMode(page, mode);
          const where = `${system}, ${mode}, ${width}px`;
          await expect(row(page).locator(".dh-exec-range.is-active")).toHaveCount(1);

          const chip = await activeChip(page);
          expect(chip.label.trim().length, `${where}: the active chip has a label`).toBeGreaterThan(0);
          expect(chip.contrast, `${where}: "${chip.label}" against its pill`).toBeGreaterThanOrEqual(4.5);

          const goTo = await goToAlpha(page);
          expect(goTo.alpha === 255 || goTo.image !== "none", `${where}: the Go to chip has a solid surface`).toBe(true);

          /* What is drawn: with the presets under it, and with them hidden,
             the Go to chip is the same pixels. */
          const scrolls = await row(page).evaluate(el => el.scrollWidth > el.clientWidth + 1);
          if (width === 375) expect(scrolls, `${where}: the row scrolls on a phone`).toBe(true);
          if (!scrolls) continue;
          const goToChip = row(page).locator(".dh-exec-range-goto");
          /* Scroll until a preset's label sits under the chip. */
          const covered = await row(page).evaluate(el => {
            const chipBox = el.querySelector(".dh-exec-range-goto")!.getBoundingClientRect();
            const presets = [...el.querySelectorAll<HTMLElement>(".dh-exec-range:not(.dh-exec-range-goto)")];
            for (let left = 0; left <= el.scrollWidth - el.clientWidth; left += 2) {
              el.scrollLeft = left;
              const under = presets.find(p => {
                const r = p.getBoundingClientRect();
                const mid = r.left + r.width / 2;
                return mid > chipBox.left + 4 && mid < chipBox.right - 4;
              });
              if (under) return under.textContent;
            }
            return null;
          });
          expect(covered, `${where}: a preset sits under the Go to chip`).not.toBeNull();
          await page.mouse.move(0, 0);
          /* The chip's own surface: the band through its middle, where a
             pill is as wide as its box and a label under it would be. */
          const box = (await goToChip.boundingBox())!;
          const clip = { x: box.x + 2, y: box.y + box.height / 2 - 5, width: box.width - 4, height: 10 };
          expect(clip.width, `${where}: the Go to chip has a surface to read`).toBeGreaterThan(8);
          const withPresets = await page.screenshot({ clip, animations: "disabled" });
          await row(page).evaluate(el => el.querySelectorAll<HTMLElement>(".dh-exec-range:not(.dh-exec-range-goto)").forEach(p => { p.style.visibility = "hidden"; }));
          const alone = await page.screenshot({ clip, animations: "disabled" });
          await row(page).evaluate(el => {
            el.querySelectorAll<HTMLElement>(".dh-exec-range:not(.dh-exec-range-goto)").forEach(p => { p.style.visibility = ""; });
            el.scrollLeft = 0;
          });
          expect(withPresets.equals(alone), `${where}: "${covered}" shows through the Go to chip`).toBe(true);
        }
      }
    });
  });
}
