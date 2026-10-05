import { test, expect } from "@playwright/test";
import { compressToEncodedURIComponent } from "lz-string";

/**
 * What a crawler, a browser tab and a link preview ask the site for:
 * robots.txt, sitemap.xml, the icons, the share image and the tags that
 * point at them. Each must answer 200 with the right type.
 */

const SITE = "https://uoaui.ai";

test("robots.txt: plain text, allows the site, keeps the API out, names the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/^text\/plain/);
  const body = await res.text();
  expect(body).toMatch(/^User-Agent: \*$/im);
  expect(body).toMatch(/^Allow: \/$/m);
  expect(body).toMatch(/^Disallow: \/api\/$/m);
  expect(body).toContain(`Sitemap: ${SITE}/sitemap.xml`);
});

test("sitemap.xml: XML, the public pages only, absolute addresses that all answer", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toMatch(/^application\/xml/);
  const body = await res.text();
  expect(body).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
  const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs).toEqual([`${SITE}/`, `${SITE}/ui-kit`, `${SITE}/theme-builder`, `${SITE}/token-editor`]);
  for (const loc of locs) {
    const page = await request.get(new URL(loc).pathname);
    expect(page.status(), loc).toBe(200);
    expect(page.headers()["content-type"], loc).toMatch(/^text\/html/);
  }
});

const ASSETS: { path: string; type: RegExp; magic?: number[] }[] = [
  /* ICO: reserved 0, type 1. */
  { path: "/favicon.ico", type: /^image\/(x-icon|vnd\.microsoft\.icon)/, magic: [0, 0, 1, 0] },
  { path: "/favicon.svg", type: /^image\/svg\+xml/ },
  { path: "/apple-touch-icon.png", type: /^image\/png/, magic: [0x89, 0x50, 0x4e, 0x47] },
  { path: "/icon-192.png", type: /^image\/png/, magic: [0x89, 0x50, 0x4e, 0x47] },
  { path: "/app-icon-512.png", type: /^image\/png/, magic: [0x89, 0x50, 0x4e, 0x47] },
  { path: "/manifest.json", type: /^application\/(manifest\+)?json/ },
];

for (const asset of ASSETS) {
  test(`${asset.path} answers 200 as ${asset.type.source}`, async ({ request }) => {
    const res = await request.get(asset.path);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toMatch(asset.type);
    const bytes = await res.body();
    expect(bytes.length).toBeGreaterThan(100);
    if (asset.magic) expect([...bytes.subarray(0, asset.magic.length)]).toEqual(asset.magic);
  });
}

test("the manifest names the site, all five systems and icons that exist", async ({ request }) => {
  const manifest = await (await request.get("/manifest.json")).json();
  expect(manifest.name).toBe("uoaui.ai");
  for (const system of ["Salt DS", "Material 3", "Fluent 2", "Carbon", "uoaui DS"]) expect(manifest.description).toContain(system);
  expect(manifest.description).not.toMatch(/[—–]/);
  for (const icon of manifest.icons) expect((await request.get(icon.src)).status(), icon.src).toBe(200);
});

/** PNG width and height from the IHDR chunk. */
function pngSize(bytes: Buffer) {
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test("landing: title, description, canonical, icons and a complete share card", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("One finance screen. Five design systems. | uoaui.ai");
  const meta = (selector: string) => page.locator(selector).first().getAttribute("content");
  const description = await meta('meta[name="description"]');
  expect(description).toBe("Describe a finance screen, switch it between Salt DS, Material 3, Fluent 2, Carbon and uoaui DS, and export code that runs.");
  expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(SITE);
  expect(await meta('meta[name="robots"]')).toBe("index, follow");

  expect(await meta('meta[property="og:type"]')).toBe("website");
  expect(await meta('meta[property="og:site_name"]')).toBe("uoaui.ai");
  expect(await meta('meta[property="og:title"]')).toBe("One finance screen. Five design systems.");
  expect(await meta('meta[property="og:description"]')).toBe(description);
  expect(await meta('meta[property="og:url"]')).toBe(SITE);
  expect(await meta('meta[name="twitter:card"]')).toBe("summary_large_image");
  expect(await meta('meta[name="twitter:title"]')).toBe("One finance screen. Five design systems.");

  /* The share image: an absolute address on the site, 1200 x 630, a real PNG
     that says what it is. */
  for (const tag of ['meta[property="og:image"]', 'meta[name="twitter:image"]']) {
    const url = await meta(tag);
    expect(url, tag).toMatch(new RegExp(`^${SITE}/(opengraph|twitter)-image[^/]*$`));
    const res = await request.get(new URL(url!).pathname + new URL(url!).search);
    expect(res.status(), tag).toBe(200);
    expect(res.headers()["content-type"], tag).toBe("image/png");
    const bytes = await res.body();
    expect(pngSize(bytes), tag).toEqual({ width: 1200, height: 630 });
    expect(bytes.length, `${tag} is small enough for a link preview to fetch`).toBeLessThan(600_000);
  }
  expect(await meta('meta[property="og:image:width"]')).toBe("1200");
  expect(await meta('meta[property="og:image:height"]')).toBe("630");
  expect(await meta('meta[property="og:image:type"]')).toBe("image/png");
  expect(await meta('meta[property="og:image:alt"]')).toMatch(/uoaui\.ai/);

  /* Icons the tab and the home screen use. */
  const icons = await page.locator('link[rel="icon"]').evaluateAll((links) => links.map((l) => l.getAttribute("href")));
  expect(icons.map((href) => (href ?? "").split("?")[0])).toEqual(["/favicon.ico", "/favicon.svg"]);
  expect(await page.locator('link[rel="apple-touch-icon"]').getAttribute("href")).toBe("/apple-touch-icon.png");
  expect(await page.locator('link[rel="manifest"]').getAttribute("href")).toBe("/manifest.json");
});

const PAGES: { path: string; title: string; canonical: string; robots: string }[] = [
  { path: "/ui-kit", title: "Component library | uoaui.ai", canonical: "/ui-kit", robots: "index, follow" },
  { path: "/ui-kit?ds=m3&c=buttons", title: "Component library | uoaui.ai", canonical: "/ui-kit", robots: "index, follow" },
  { path: "/theme-builder", title: "Theme builder | uoaui.ai", canonical: "/theme-builder", robots: "index, follow" },
  { path: "/token-editor", title: "Token reference | uoaui.ai", canonical: "/token-editor", robots: "index, follow" },
  /* Behind the access gate, or private to a link's holder: not listed. */
  { path: "/builder", title: "Builder | uoaui.ai", canonical: "/builder", robots: "noindex, follow" },
  { path: "/login", title: "Sign in | uoaui.ai", canonical: "/login", robots: "noindex, nofollow" },
];

for (const p of PAGES) {
  test(`${p.path}: its own title and description, canonical ${p.canonical}, robots "${p.robots}"`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page).toHaveTitle(p.title);
    const description = await page.locator('meta[name="description"]').first().getAttribute("content");
    expect(description!.length).toBeGreaterThan(30);
    expect(description).not.toMatch(/[—–]/);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).toBe(`${SITE}${p.canonical}`);
    expect(await page.locator('meta[name="robots"]').first().getAttribute("content")).toBe(p.robots);
    /* Every page shares as a complete card: its own title and address, the
       site's name and the branded image. */
    const og = (name: string) => page.locator(`meta[property="og:${name}"]`).first().getAttribute("content");
    expect(await og("title")).toBe(p.title.replace(" | uoaui.ai", ""));
    expect(await og("description")).toBe(description);
    expect(await og("url")).toBe(`${SITE}${p.canonical}`);
    expect(await og("site_name")).toBe("uoaui.ai");
    expect(await og("type")).toBe("website");
    expect(await og("image")).toMatch(/opengraph-image/);
    expect(await page.locator('meta[name="twitter:card"]').first().getAttribute("content")).toBe("summary_large_image");
    expect(await page.locator('meta[name="twitter:title"]').first().getAttribute("content")).toBe(p.title.replace(" | uoaui.ai", ""));
    expect(await page.locator('meta[name="twitter:image"]').first().getAttribute("content")).toMatch(/twitter-image/);
  });
}

test("a shared preview is not listed in search", async ({ page }) => {
  const hash = compressToEncodedURIComponent(JSON.stringify({
    v: 1, designSystem: "salt", mode: "light", density: "medium",
    canvasSpacing: "tight", deviceMode: "desktop", themeKey: null,
    headerBlocks: [], sidebarBlocks: [], footerBlocks: [],
    blocks: [{ id: "meta-heading", type: "PageTitle", props: { text: "Shared", level: 1 } }],
  })).replace(/\+/g, "_").replace(/\$/g, "~");
  await page.goto(`/preview/share/${hash}`);
  await expect(page).toHaveTitle("Shared preview - Salt DS | uoaui.ai");
  expect(await page.locator('meta[name="robots"]').first().getAttribute("content")).toBe("noindex, nofollow");
});
