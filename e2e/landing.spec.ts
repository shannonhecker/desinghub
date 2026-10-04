import { test, expect } from "@playwright/test";

/**
 * Landing page: the first viewport, the system instrument, and the handoff
 * into the builder. These run against the real page, so they cover what the
 * jsdom contract tests cannot: layout inside the fold, real image loads,
 * and navigation.
 */

const FOLDS = [
  { name: "desktop 1512x738", width: 1512, height: 738 },
  { name: "phone 375x812", width: 375, height: 812 },
] as const;

for (const fold of FOLDS) {
  test(`first viewport holds headline, prompt and product proof: ${fold.name}`, async ({ page }) => {
    await page.setViewportSize({ width: fold.width, height: fold.height });
    await page.goto("/", { waitUntil: "networkidle" });

    const headline = page.locator("#lsl-hero-headline");
    await expect(headline).toHaveText("One finance report. Five design systems.");
    // Two lines: each sentence is one unwrapped line.
    const lines = await headline.locator("span").evaluateAll((spans) =>
      spans.map((s) => {
        const r = s.getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(s).lineHeight);
        return { lines: Math.round(r.height / lh), right: r.right, width: s.scrollWidth, box: s.clientWidth };
      }),
    );
    expect(lines).toHaveLength(2);
    for (const l of lines) {
      expect(l.lines).toBe(1);
      expect(l.width).toBeLessThanOrEqual(l.box);
    }

    // Everything that matters is inside the fold.
    for (const selector of [".lsl-hero-sub", ".lsl-hero-prompt", ".lsl-showcase-tabs"]) {
      const box = await page.locator(selector).first().boundingBox();
      expect(box, selector).not.toBeNull();
      expect(box!.y + box!.height, selector).toBeLessThanOrEqual(fold.height);
    }
    const frame = await page.locator(".lsl-showcase-viewport").boundingBox();
    const visible = Math.min(frame!.y + frame!.height, fold.height) - frame!.y;
    // Desktop shows the whole report; a phone shows at least two thirds.
    expect(visible / frame!.height).toBeGreaterThanOrEqual(fold.width > 640 ? 1 : 0.66);

    // The capture actually loaded, and nothing scrolls sideways.
    const shot = page.locator("#showcase img.lsl-showcase-shot");
    expect(await shot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
    expect(await shot.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain(
      fold.width > 640 ? "/showcase/esg-salt-light.webp" : "/showcase/esg-salt-light-phone.webp",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
}

test("the instrument swaps real captures by system and mode, from the keyboard too", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const shot = page.locator("#showcase [role=tabpanel][data-active=true] img.lsl-showcase-shot");

  await page.getByRole("tab", { name: "Material 3" }).click();
  await expect(shot).toHaveAttribute("src", "/showcase/esg-md3-light.webp");
  await expect(page.locator(".lsl-showcase-layer")).toHaveAttribute("data-ready", "true");

  await page.getByRole("button", { name: "Dark" }).click();
  await expect(shot).toHaveAttribute("src", "/showcase/esg-md3-dark.webp");
  await expect(page.getByRole("button", { name: "Dark" })).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("tab", { name: "Material 3" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Fluent 2" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Fluent 2" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "uoaui" })).toHaveAttribute("aria-selected", "true");
  await expect(shot).toHaveAttribute("src", "/showcase/esg-uoaui-dark.webp");
  // After the wipe the new capture is fully revealed.
  await expect
    .poll(() => page.locator(".lsl-showcase-layer").evaluate((el) => getComputedStyle(el).clipPath))
    .toMatch(/^inset\((0(px|%)?\s?){1,4}\)$/);
});

test("reduced motion: the swap is instant, with no clip and no animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Carbon" }).click();
  const style = await page.locator(".lsl-showcase-layer").evaluate((el) => {
    const s = getComputedStyle(el);
    return { animation: s.animationName, clip: s.clipPath };
  });
  expect(style).toEqual({ animation: "none", clip: "none" });
});

test("the prompt lands in the builder with the chosen system and mode", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Carbon" }).click();
  await page.getByRole("button", { name: "Dark" }).click();

  // An empty prompt does not navigate.
  await page.locator(".lsl-hero .lsl-hero-prompt-submit").click();
  expect(new URL(page.url()).pathname).toBe("/");

  await page.locator("#lsl-hero-prompt-input").fill("Risk summary by fund");
  const [request] = await Promise.all([
    page.waitForRequest((r) => r.isNavigationRequest() && new URL(r.url()).pathname === "/builder"),
    page.keyboard.press("Enter"),
  ]);
  const params = new URL(request.url()).searchParams;
  expect(params.get("prompt")).toBe("Risk summary by fund");
  expect(params.get("ds")).toBe("carbon");
  expect(params.get("mode")).toBe("dark");

  // The builder applies the system and stages the prompt in the chat.
  await expect(page.getByRole("button", { name: /^Design system: Carbon/ })).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText("Risk summary by fund").first()).toBeVisible();
});

test("the concept video costs nothing until the visitor presses play", async ({ page }) => {
  const videoRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) videoRequests.push(r.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  expect(videoRequests).toEqual([]);
  expect(await page.locator("#demo video").evaluate((v: HTMLVideoElement) => v.paused && !v.autoplay && v.controls)).toBe(true);
});

test("every landing link resolves", async ({ page, request }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const hrefs = await page.locator("a[href]").evaluateAll((as) =>
    Array.from(new Set(as.map((a) => a.getAttribute("href")!))),
  );
  expect(hrefs.length).toBeGreaterThanOrEqual(12);
  for (const href of hrefs) {
    if (href.startsWith("#")) {
      expect(await page.locator(href).count(), href).toBe(1);
    } else {
      expect((await request.get(href)).status(), href).toBe(200);
    }
  }
});
