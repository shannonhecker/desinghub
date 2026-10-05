import { test, expect, type Page } from "@playwright/test";

/**
 * FX Execution: the chart's price tags follow a theme change at once.
 *
 * The outlined tags (ATP, ARR, AVG) are filled with the chart panel's own
 * surface, read when the design system or the mode changes. Under reduced
 * motion every element carries a near-zero transition, so that read came
 * back with the previous theme's surface: white tags on a dark panel after
 * Light to Dark, the last system's grey after a system switch, and they
 * stayed that way. Solid tags (LMT, BID) take the new theme's colours and
 * must stay readable.
 *
 * Pre-flight: `npm run dev` (see playwright.config.ts for the base URL).
 */

type System = "Salt DS" | "Material 3" | "Fluent 2" | "uoaui" | "Carbon";

function chatInput(page: Page) {
  return page.getByRole("textbox", { name: "Chat message input" });
}
const stage = (page: Page) => page.locator(".present-stage");

async function applyFx(page: Page) {
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(chatInput(page)).toBeVisible({ timeout: 30_000 });
  const use = page.getByRole("button", { name: "Use the FX Execution template" });
  await expect(async () => {
    if (!(await use.isVisible())) await page.getByRole("button", { name: /Browse templates/ }).click();
    await expect(use).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 60_000 });
  await use.click();
  await expect(stage(page).locator(".dh-exec .highcharts-root")).toBeVisible({ timeout: 30_000 });
  await expect(stage(page).locator(".dh-exec-pill-bid")).toBeVisible();
}

interface Tag { key: string; fill: string; text: string; contrast: number }
interface Theme { panel: string; fg: string; tags: Tag[] }

/** The panel's settled surface and text colour, and each tag's fill, text
 *  colour and their contrast, as drawn. */
async function read(page: Page): Promise<Theme> {
  return stage(page).locator(".dh-exec").first().evaluate((el) => {
    const parse = (c: string): number[] => {
      const probe = document.createElement("canvas").getContext("2d")!;
      probe.fillStyle = "#000";
      probe.fillStyle = c;
      const v = probe.fillStyle;
      if (v.startsWith("#")) return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
      const m = v.match(/-?[\d.]+(?:e-?\d+)?/g)!.map(Number);
      const unit = v.startsWith("color(") ? 255 : 1;
      return [m[0] * unit, m[1] * unit, m[2] * unit];
    };
    const css = (c: number[]) => `rgb(${c.map((v) => Math.round(v)).join(", ")})`;
    const lum = (c: number[]) => {
      const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    /* A fresh element has no transition in flight: it shows where the
       panel's colours are going, not where they were. */
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;transition:none;color:var(--ds-fg)";
    el.appendChild(probe);
    const fg = css(parse(getComputedStyle(probe).color));
    probe.remove();
    const html = el as HTMLElement;
    const was = html.style.transition;
    html.style.transition = "none";
    const panel = css(parse(getComputedStyle(html).backgroundColor));
    html.style.transition = was;
    const tags = [...el.querySelectorAll<SVGGElement>(".dh-exec-pill")].map((g) => {
      const fill = parse(g.querySelector("rect, path")!.getAttribute("fill")!);
      const text = parse(getComputedStyle(g.querySelector("text")!).fill);
      const [hi, lo] = [lum(fill), lum(text)].sort((a, b) => b - a);
      return { key: [...g.classList].find((c) => c.startsWith("dh-exec-pill-"))!.replace("dh-exec-pill-", ""), fill: css(fill), text: css(text), contrast: (hi + 0.05) / (lo + 0.05) };
    });
    return { panel, fg, tags };
  });
}

async function switchSystem(page: Page, label: System) {
  await page.getByRole("button", { name: /^Design system:/ }).click();
  await page.getByText(label, { exact: true }).last().click();
  await expect(page.getByRole("button", { name: new RegExp(`^Design system: ${label}`) })).toBeVisible();
}
async function switchMode(page: Page, mode: "light" | "dark") {
  await page.getByRole("button", { name: `Switch to ${mode} mode` }).first().click();
  await expect(page.getByRole("button", { name: `Switch to ${mode === "dark" ? "light" : "dark"} mode` }).first()).toBeVisible();
}

function expectTagsMatch(theme: Theme, step: string) {
  const keys = theme.tags.map((t) => t.key);
  expect(keys, `${step}: the solid tags are drawn`).toEqual(expect.arrayContaining(["limit", "bid"]));
  for (const tag of theme.tags) {
    expect(tag.contrast, `${step}: ${tag.key} tag is readable (${tag.text} on ${tag.fill})`).toBeGreaterThanOrEqual(4.5);
    if (tag.key === "limit" || tag.key === "bid") continue;
    /* Outlined tags sit on the panel: its surface, its text colour. */
    expect(tag.fill, `${step}: ${tag.key} tag is filled with the panel's surface`).toBe(theme.panel);
    expect(tag.text, `${step}: ${tag.key} tag's text is the panel's text colour`).toBe(theme.fg);
  }
}

test.describe("Builder - FX Execution price tags follow the theme", () => {
  for (const motion of ["reduce", "no-preference"] as const) {
    test(`a design-system or light/dark switch repaints every tag at once (motion: ${motion})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: motion });
      await applyFx(page);
      expectTagsMatch(await read(page), "on arrival");
      const solid = (t: Theme) => t.tags.filter((x) => x.key === "limit" || x.key === "bid").map((x) => `${x.key} ${x.fill} ${x.text}`).join("; ");
      const steps: [string, () => Promise<void>][] = [
        ["to Material 3", () => switchSystem(page, "Material 3")],
        ["to light", () => switchMode(page, "light")],
        ["to Fluent 2", () => switchSystem(page, "Fluent 2")],
        ["to dark", () => switchMode(page, "dark")],
        ["to Carbon", () => switchSystem(page, "Carbon")],
        ["to light again", () => switchMode(page, "light")],
        ["to uoaui", () => switchSystem(page, "uoaui")],
        ["to Salt DS", () => switchSystem(page, "Salt DS")],
      ];
      const seen: Record<string, string> = {};
      for (const [step, act] of steps) {
        await act();
        /* "At once": the first drawn frame after the switch, not a later redraw. */
        await expect(async () => expectTagsMatch(await read(page), step)).toPass({ timeout: 1_500 });
        seen[step] = solid(await read(page));
      }
      /* The solid tags changed with the theme too (a system's positive and
         series colours differ, and light and dark differ). */
      expect(seen["to light"]).not.toBe(seen["to Material 3"]);
      expect(seen["to Carbon"]).not.toBe(seen["to dark"]);
    });
  }
});
