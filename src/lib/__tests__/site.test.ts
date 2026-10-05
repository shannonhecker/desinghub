// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { PUBLIC_PAGES, SITE_DESCRIPTION, SITE_TITLE, isPreviewDeployment, siteUrl } from "../site";

describe("site address", () => {
  it("is uoaui.ai unless the build says otherwise", () => {
    expect(siteUrl({})).toBe("https://uoaui.ai");
  });

  it("an explicit address wins, with or without a scheme or a trailing slash", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://example.test/", VERCEL_PROJECT_PRODUCTION_URL: "uoaui.ai" })).toBe("https://example.test");
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "example.test" })).toBe("https://example.test");
  });

  it("production uses the production domain; a preview uses its own address so its share image resolves", () => {
    const vercel = { VERCEL_PROJECT_PRODUCTION_URL: "uoaui.ai", VERCEL_URL: "uoaui-git-branch.vercel.app" };
    expect(siteUrl({ ...vercel, VERCEL_ENV: "production" })).toBe("https://uoaui.ai");
    expect(siteUrl({ ...vercel, VERCEL_ENV: "preview" })).toBe("https://uoaui-git-branch.vercel.app");
  });

  it("an address that is not one falls back", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "http://" })).toBe("https://uoaui.ai");
  });

  it("knows a preview deployment", () => {
    expect(isPreviewDeployment({})).toBe(false);
    expect(isPreviewDeployment({ VERCEL_ENV: "production" })).toBe(false);
    expect(isPreviewDeployment({ VERCEL_ENV: "preview" })).toBe(true);
    expect(isPreviewDeployment({ VERCEL_ENV: "development" })).toBe(true);
  });

  it("the copy is plain: no em dash, within what a search result and a share card show", () => {
    for (const text of [SITE_TITLE, SITE_DESCRIPTION]) expect(text).not.toMatch(/[—–]/);
    expect(SITE_TITLE.length).toBeLessThanOrEqual(60);
    expect(SITE_DESCRIPTION.length).toBeGreaterThanOrEqual(70);
    expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(160);
  });
});

describe("robots.txt and sitemap.xml", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

  async function load(env: Record<string, string>) {
    vi.resetModules();
    for (const key of ["NEXT_PUBLIC_SITE_URL", "VERCEL_ENV", "VERCEL_URL", "VERCEL_PROJECT_PRODUCTION_URL"]) vi.stubEnv(key, env[key] ?? "");
    const robots = (await import("@/app/robots")).default();
    const sitemap = (await import("@/app/sitemap")).default();
    return { robots, sitemap };
  }

  it("production: everything but the API may be fetched, and the sitemap is named", async () => {
    const { robots } = await load({});
    expect(robots.rules).toEqual([{ userAgent: "*", allow: "/", disallow: ["/api/"] }]);
    expect(robots.sitemap).toBe("https://uoaui.ai/sitemap.xml");
    expect(robots.host).toBe("https://uoaui.ai");
  });

  it("a preview deployment asks not to be crawled", async () => {
    const { robots } = await load({ VERCEL_ENV: "preview", VERCEL_URL: "uoaui-git-x.vercel.app" });
    expect(robots.rules).toEqual([{ userAgent: "*", disallow: "/" }]);
    expect(robots.sitemap).toBeUndefined();
  });

  it("the sitemap lists the public pages with absolute addresses, and nothing behind the gate", async () => {
    const { sitemap } = await load({});
    expect(sitemap.map((e) => e.url)).toEqual([
      "https://uoaui.ai/",
      "https://uoaui.ai/ui-kit",
      "https://uoaui.ai/theme-builder",
      "https://uoaui.ai/token-editor",
    ]);
    for (const gated of ["/builder", "/login", "/preview", "/api"]) {
      expect(PUBLIC_PAGES.some((p) => p.path.startsWith(gated)), gated).toBe(false);
    }
  });
});
