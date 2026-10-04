import { test, expect } from "@playwright/test";
import { compressToEncodedURIComponent } from "lz-string";

test("model endpoints deny unauthenticated requests without invoking the provider", async ({ playwright, baseURL }) => {
  const api = await playwright.request.newContext({ baseURL, storageState: { cookies: [], origins: [] } });
  try {
    for (const path of ["/api/chat", "/api/builder/generate-content", "/api/builder/generate-table"]) {
      const response = await api.post(path, { data: {} });
      expect([401, 503]).toContain(response.status());
      expect((await response.json()).error).toMatch(/Sign.in/);
    }
  } finally { await api.dispose(); }
});

test("shared previews load local images and remove remote sources", async ({ page }) => {
  const hash = compressToEncodedURIComponent(JSON.stringify({
    v: 1, designSystem: "salt", mode: "light", density: "medium", canvasSpacing: "tight", deviceMode: "desktop",
    themeKey: null, activeTemplateId: null, headerBlocks: [], sidebarBlocks: [], footerBlocks: [],
    blocks: [
      { id: "local-image", type: "SimulatedImage", props: { src: "/showcase/salt.webp", alt: "Local preview asset" } },
      { id: "remote-image", type: "SimulatedImage", props: { src: "https://untrusted.invalid/tracker.png", alt: "Untrusted image" } },
    ],
  })).replace(/\+/g, "_").replace(/\$/g, "~");
  const remote: string[] = [];
  page.on("request", request => { if (request.url().includes("untrusted.invalid")) remote.push(request.url()); });
  const response = await page.goto(`/preview/share/${hash}`);
  expect(response?.headers()["content-security-policy"]).toContain("img-src 'self' data:;");
  await expect(page.getByRole("img", { name: "Local preview asset" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Untrusted image" })).toHaveCount(0);
  expect(remote).toEqual([]);
});
