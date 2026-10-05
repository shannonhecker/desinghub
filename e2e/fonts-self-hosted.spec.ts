import { test, expect, type Page } from "@playwright/test";

/**
 * Fonts come from this origin only.
 *
 * Text fonts used to be fetched from Google while the site was built (two
 * preview builds failed there) and the icon font, a 4 MB variable file, from
 * Google while the page ran. Every font is now a file in the repository.
 */

function watch(page: Page) {
  const foreign: string[] = [];
  const fonts: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (/fonts\.(googleapis|gstatic)\.com$/.test(url.host)) foreign.push(request.url());
    if (request.resourceType() === "font") fonts.push(request.url());
  });
  return { foreign, fonts };
}

const loaded = (page: Page, font: string, text = "Ag") =>
  page.evaluate(([f, t]) => document.fonts.load(f, t).then((faces) => faces.length > 0 && document.fonts.check(f, t)), [font, text]);

for (const route of ["/", "/login", "/ui-kit", "/ui-kit?ds=m3&c=buttons", "/ui-kit?ds=carbon&c=buttons", "/builder", "/token-editor"]) {
  test(`no font host is contacted: ${route}`, async ({ page }) => {
    const seen = watch(page);
    await page.goto(route, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    expect(seen.foreign).toEqual([]);
    expect(seen.fonts.length).toBeGreaterThan(0);
    for (const url of seen.fonts) expect(new URL(url).pathname).toMatch(/^\/_next\/static\/media\/[a-z0-9-]+\.[0-9a-f]{8}\.woff2$/);
    await expect(page.locator('link[rel="stylesheet"][href*="fonts.googleapis"]')).toHaveCount(0);
  });
}

test("the three first-paint faces are preloaded from this origin and are the files the stylesheet uses", async ({ page }) => {
  const seen = watch(page);
  const response0 = await page.goto("/", { waitUntil: "networkidle" });
  /* A prerendered page carries the hints as tags; a page rendered on request
     may send them as a Link header instead. Either way: once each. */
  const tags = await page.locator('link[rel="preload"][as="font"]').evaluateAll((links) => links.map((l) => l.getAttribute("href") ?? ""));
  const header = [...(response0?.headers()["link"] ?? "").matchAll(/<([^>]+\.woff2)>;\s*rel=preload/g)].map((m) => m[1]);
  const preloads = [...tags, ...header];
  expect(preloads.map((p) => p.replace(/\.[0-9a-f]{8}\.woff2$/, "")).sort()).toEqual([
    "/_next/static/media/bricolage-grotesque-latin",
    "/_next/static/media/outfit-latin",
    "/_next/static/media/space-grotesk-latin",
  ]);
  /* A preload that the stylesheet does not use is fetched twice or wasted:
     each address is requested exactly once. */
  for (const href of preloads) expect(seen.fonts.filter((u) => new URL(u).pathname === href).length, href).toBeLessThanOrEqual(1);
  const response = await page.request.get(preloads[0]);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("font/woff2");
  expect(response.headers()["cache-control"]).toContain("immutable");
});

test("each design system's own typeface, and the icon font, load by the names the systems use", async ({ page }) => {
  const seen = watch(page);
  await page.goto("/ui-kit?ds=m3&c=buttons", { waitUntil: "networkidle" });
  for (const font of ['400 16px "Open Sans"', '600 16px "Open Sans"', '500 16px "Roboto"', '400 16px "IBM Plex Sans"', '400 14px "IBM Plex Mono"', '600 16px "Inter"', '500 16px "DM Sans"', '500 16px "Outfit"']) {
    expect(await loaded(page, font), font).toBe(true);
  }
  expect(await loaded(page, '24px "Material Symbols Outlined"', "home")).toBe(true);
  /* The icon font draws a ligature: the word "home" is one glyph wide. */
  const width = await page.evaluate(() => {
    const span = document.createElement("span");
    span.className = "material-symbols-outlined";
    span.textContent = "home";
    document.body.append(span);
    const w = span.getBoundingClientRect().width;
    span.remove();
    return w;
  });
  expect(width).toBe(24);
  /* The fill and optical-size axes are still in the file: Material 3's
     filled icons and the finer drawing at small sizes look as they did. */
  const drawn = async (settings: string) => {
    await page.evaluate((v) => {
      document.getElementById("axis-probe")?.remove();
      const span = document.createElement("span");
      span.id = "axis-probe";
      span.className = "material-symbols-outlined";
      span.style.cssText = `font-variation-settings:${v};position:fixed;left:0;top:0;z-index:99999;font-size:48px;color:#000;background:#fff`;
      span.textContent = "favorite";
      document.body.append(span);
    }, settings);
    return (await page.locator("#axis-probe").screenshot()).toString("base64");
  };
  const outline = await drawn("'FILL' 0, 'opsz' 48");
  expect(await drawn("'FILL' 1, 'opsz' 48"), "FILL changes the drawing").not.toBe(outline);
  expect(await drawn("'FILL' 0, 'opsz' 20"), "optical size changes the drawing").not.toBe(outline);
  await page.evaluate(() => document.getElementById("axis-probe")?.remove());
  expect(seen.foreign).toEqual([]);
  const icon = seen.fonts.filter((u) => /material-symbols-outlined/.test(u));
  expect(icon.length).toBe(1);
  const size = Number((await page.request.get(icon[0])).headers()["content-length"]);
  expect(size, "the icon font is the reduced file, not the 4 MB one").toBeLessThan(1_300_000);
});

test("Inter Light reaches the library's uoaui pages and never the builder", async ({ page }) => {
  const seen = watch(page);
  const light = () => page.evaluate(() => [...document.fonts].filter((f) => /Inter/.test(f.family) && f.weight === "300").length);
  await page.goto("/ui-kit?ds=uoaui&c=buttons", { waitUntil: "networkidle" });
  expect(await light(), "uoaui library page").toBe(7);
  expect(await loaded(page, '300 16px "Inter"')).toBe(true);
  /* Another system in view: the face goes with uoaui's stylesheet. */
  await page.goto("/ui-kit?ds=salt&c=buttons", { waitUntil: "networkidle" });
  expect(await light(), "Salt library page").toBe(0);
  await page.goto("/builder", { waitUntil: "networkidle" });
  expect(await light(), "builder").toBe(0);
  expect(seen.foreign).toEqual([]);
});
