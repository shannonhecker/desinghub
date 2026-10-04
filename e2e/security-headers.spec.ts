import { test, expect } from "@playwright/test";
import { compressToEncodedURIComponent } from "lz-string";

// A real shared page, rather than just the invalid-link fallback.
const share = compressToEncodedURIComponent(JSON.stringify({
  v: 1, designSystem: "salt", mode: "light", density: "medium",
  canvasSpacing: "tight", deviceMode: "desktop", themeKey: null,
  headerBlocks: [], sidebarBlocks: [], footerBlocks: [],
  blocks: [{ id: "security-smoke-heading", type: "PageTitle", props: { text: "Shared policy check", level: 1 } }],
})).replace(/\+/g, "_").replace(/\$/g, "~");

for (const route of ["/", "/login", "/builder", "/ui-kit", "/token-editor", "/theme-builder", `/preview/share/${share}`]) {
  test(`security headers and CSP-compatible rendering: ${route.split('/').slice(0,3).join('/')}`, async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (/violates.*content security policy|refused to.*content security policy/i.test(message.text())) violations.push(message.text());
    });
    const response = await page.goto(route, { waitUntil: "networkidle" });
    expect(response?.ok()).toBe(true);
    const headers = response!.headers();
    expect(headers["x-powered-by"]).toBeUndefined();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    await expect(page.locator("main").first()).toBeVisible();
    if (route.startsWith('/preview/share/')) await expect(page.getByText("Shared policy check", { exact: true })).toBeVisible();
    expect(violations).toEqual([]);
  });
}
