import { test, expect, type Page } from "@playwright/test";

/**
 * Landing page: the first viewport, the compare instrument, and the handoff
 * into the builder. These run against the real page, so they cover what the
 * jsdom contract tests cannot: layout inside the fold, real image loads, a
 * real drag, and navigation.
 */

const SYSTEMS = [
  ["Salt DS", "salt"],
  ["Material 3", "md3"],
  ["Fluent 2", "fluent"],
  ["Carbon", "carbon"],
  ["uoaui", "uoaui"],
] as const;

const splitOf = (page: Page) =>
  page.locator("#showcase").evaluate((el) => Number((el as HTMLElement).style.getPropertyValue("--split-n")));
const leftShot = (page: Page) =>
  page.locator("#showcase [role=tabpanel][data-active=true] img.lsl-showcase-shot");
const rightShot = (page: Page) => page.locator("#showcase .lsl-compare-layer img.lsl-showcase-shot");

const FOLDS = [
  { name: "desktop 1512x738", width: 1512, height: 738, whole: true, phone: false },
  { name: "laptop 1024x768", width: 1024, height: 768, whole: true, phone: false },
  { name: "phone 375x812", width: 375, height: 812, whole: false, phone: true },
] as const;

for (const fold of FOLDS) {
  test(`first viewport holds headline, prompt and product proof: ${fold.name}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); // a still frame to measure
    await page.setViewportSize({ width: fold.width, height: fold.height });
    await page.goto("/", { waitUntil: "networkidle" });

    const headline = page.locator("#lsl-hero-headline");
    await expect(headline).toHaveText("One finance screen. Five design systems.");
    // Two lines: each sentence is one unwrapped line.
    const lines = await headline.locator("span").evaluateAll((spans) =>
      spans.map((s) => {
        const r = s.getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(s).lineHeight);
        return { lines: Math.round(r.height / lh), width: s.scrollWidth, box: s.clientWidth };
      }),
    );
    expect(lines).toHaveLength(2);
    for (const l of lines) {
      expect(l.lines).toBe(1);
      expect(l.width).toBeLessThanOrEqual(l.box);
    }

    // Everything that matters is inside the fold.
    for (const selector of [".lsl-hero-sub", ".lsl-hero .lsl-hero-prompt", ".lsl-showcase-tabs"]) {
      const box = await page.locator(selector).first().boundingBox();
      expect(box, selector).not.toBeNull();
      expect(box!.y + box!.height, selector).toBeLessThanOrEqual(fold.height);
    }
    const frame = await page.locator(".lsl-showcase-viewport").boundingBox();
    const visible = Math.min(frame!.y + frame!.height, fold.height) - frame!.y;
    // Two-column layouts show the whole frame; a phone shows at least two thirds.
    expect(visible / frame!.height).toBeGreaterThanOrEqual(fold.whole ? 1 : 0.66);
    if (fold.whole) {
      // Two columns: the frame sits beside the copy, not under it.
      const copy = await page.locator(".lsl-hero-copy").boundingBox();
      expect(frame!.x).toBeGreaterThan(copy!.x + copy!.width);
    }

    // Both captures actually loaded, two different systems, and nothing
    // scrolls sideways.
    const suffix = fold.phone ? "-phone.webp" : ".webp";
    for (const [shot, id] of [[leftShot(page), "salt"], [rightShot(page), "md3"]] as const) {
      expect(await shot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await shot.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain(
        `/showcase/home-${id}-light${suffix}`,
      );
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
}

for (const width of [375, 700, 1024, 1440]) {
  test(`every system tab is in view and clickable with a mouse at ${width}px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    for (const [name, id] of SYSTEMS) {
      const tab = page.getByRole("tab", { name });
      const box = await tab.boundingBox();
      // Fully inside the viewport: not clipped, not behind a scroll container.
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(leftShot(page)).toHaveAttribute("src", `/showcase/home-${id}-light.webp`);
    }
    // The light/dark control is reachable at this width too.
    await page.locator(".lsl-mode-btn:visible").last().click();
    await expect(leftShot(page)).toHaveAttribute("src", "/showcase/home-uoaui-dark.webp");
  });
}

test("the divider demonstrates itself once, then rests in the middle", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // It travels right and left of centre...
  await expect.poll(() => splitOf(page), { timeout: 5000, intervals: [50] }).toBeGreaterThan(0.6);
  await expect.poll(() => splitOf(page), { timeout: 5000, intervals: [50] }).toBeLessThan(0.4);
  // ...and comes home, and does not run again.
  await expect.poll(() => splitOf(page), { timeout: 5000 }).toBe(0.5);
  await page.waitForTimeout(1500);
  expect(await splitOf(page)).toBe(0.5);
});

test("dragging the divider compares two systems, by pointer and by keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const frame = (await page.locator(".lsl-showcase-viewport").boundingBox())!;
  const lineX = () =>
    page.locator(".lsl-split-line").evaluate((el) => el.getBoundingClientRect().left + 1);

  // Pointer: press on the grip and drag to a quarter of the frame.
  await page.mouse.move(frame.x + frame.width * 0.5, frame.y + frame.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(frame.x + frame.width * 0.25, frame.y + frame.height * 0.5, { steps: 10 });
  await page.mouse.up();
  const target = frame.x + frame.width * 0.25;
  // The visible line sits under the pointer (within one slider step).
  await expect
    .poll(async () => Math.abs((await lineX()) - target))
    .toBeLessThanOrEqual(frame.width / 100 + 2);
  // And the clip really follows it: left of the line is Salt, right of it Material 3.
  const clip = await page.locator(".lsl-compare-layer").evaluate((el) => getComputedStyle(el).clipPath);
  expect(clip).toMatch(/^inset\(0px 0px 0px /);

  // Keyboard: the slider is focusable, named, and the arrows move it.
  const slider = page.getByRole("slider", { name: "Divider between Salt DS and Material 3" });
  await slider.focus();
  const before = await splitOf(page);
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight");
  expect(await splitOf(page)).toBeCloseTo(before + 0.05, 5);
  await page.keyboard.press("Home");
  expect(await splitOf(page)).toBe(0);
  await page.keyboard.press("End");
  expect(await splitOf(page)).toBe(1);
  await expect(slider).toHaveAttribute("aria-valuetext", "Salt DS 100 percent, Material 3 0 percent");
  // Focus is visible on the grip.
  expect(
    await page.locator(".lsl-split-grip").evaluate((el) => getComputedStyle(el).outlineStyle),
  ).toBe("solid");
});

test("choosing a system sweeps it in and moves the old one to the right", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // Let the first-view pass finish.
  await expect.poll(() => splitOf(page), { timeout: 5000, intervals: [50] }).toBeLessThan(0.4);
  await expect.poll(() => splitOf(page), { timeout: 5000 }).toBe(0.5);

  await page.getByRole("tab", { name: "Carbon" }).click();
  await expect(leftShot(page)).toHaveAttribute("src", "/showcase/home-carbon-light.webp");
  await expect(rightShot(page)).toHaveAttribute("src", "/showcase/home-salt-light.webp");
  // The sweep starts at the left edge and returns to the resting position.
  await expect.poll(() => splitOf(page), { timeout: 3000, intervals: [20] }).toBeLessThan(0.4);
  await expect.poll(() => splitOf(page), { timeout: 3000 }).toBe(0.5);
  await expect(page.locator(".lsl-legend")).toContainText("IBM Plex Sans, 0px corners, #0F62FE accent");
  await expect(page.locator(".lsl-legend")).toContainText("Open Sans, 4px corners, #2670A9 accent");

  await page.locator(".lsl-mode-btn:visible").last().click();
  await expect(leftShot(page)).toHaveAttribute("src", "/showcase/home-carbon-dark.webp");
  await expect(rightShot(page)).toHaveAttribute("src", "/showcase/home-salt-dark.webp");

  await page.getByRole("tab", { name: "Carbon" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "uoaui" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "uoaui" })).toHaveAttribute("aria-selected", "true");
  await expect(rightShot(page)).toHaveAttribute("src", "/showcase/home-carbon-dark.webp");
});

test("reduced motion: no first-view pass and no sweep, the systems swap in place", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const seen = new Set<number>();
  const sample = async (ms: number) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      seen.add(await splitOf(page));
      await page.waitForTimeout(40);
    }
  };
  await sample(2500);
  await page.getByRole("tab", { name: "Carbon" }).click();
  await sample(1200);
  expect([...seen]).toEqual([0.5]);
  await expect(leftShot(page)).toHaveAttribute("src", "/showcase/home-carbon-light.webp");
});

test("the prompt lands in the builder with the chosen system and mode", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Carbon" }).click();
  await page.locator(".lsl-mode-btn:visible").last().click();

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
  expect(params.getAll("ds")).toEqual(["carbon"]);
  expect(params.get("mode")).toBe("dark");

  // The builder applies the system and stages the prompt in the chat.
  await expect(page.getByRole("button", { name: /^Design system: Carbon/ })).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText("Risk summary by fund").first()).toBeVisible();
});

test("the closing band's system chips feed the prompt and the hero", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  const band = page.locator("#cta");
  await band.scrollIntoViewIfNeeded();
  await expect(band.getByRole("radio", { name: "Salt DS" })).toBeChecked();
  await band.getByRole("radio", { name: "Fluent 2" }).check();
  await expect(band.getByRole("radio", { name: "Fluent 2" })).toBeChecked();
  await expect(page.getByRole("tab", { name: "Fluent 2" })).toHaveAttribute("aria-selected", "true");

  await band.locator("#lsl-cta-prompt-input").fill("ESG scores for a bond fund");
  const [request] = await Promise.all([
    page.waitForRequest((r) => r.isNavigationRequest() && new URL(r.url()).pathname === "/builder"),
    band.getByRole("button", { name: "Build it" }).click(),
  ]);
  const params = new URL(request.url()).searchParams;
  expect(params.get("prompt")).toBe("ESG scores for a bond fund");
  expect(params.getAll("ds")).toEqual(["fluent"]);
  await expect(page.getByRole("button", { name: /^Design system: Fluent 2/ })).toBeVisible({ timeout: 120_000 });
});

test("the screen link opens the same template in the builder", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Open this screen in the builder" }).click();
  await expect(page.locator(".present-stage [data-block-id]").first()).toBeVisible({ timeout: 120_000 });
  await expect(page.locator(".present-stage").getByText("Analytics Dashboard").first()).toBeVisible();
});

test("the recording costs nothing until the visitor asks, then a chapter plays it", async ({ page }) => {
  const videoRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().endsWith(".mp4")) videoRequests.push(new URL(r.url()).pathname);
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  expect(videoRequests).toEqual([]);
  const video = page.locator("#demo video");
  expect(await video.evaluate((v: HTMLVideoElement) => v.paused && !v.autoplay && !v.loop && v.controls)).toBe(true);
  expect(await video.evaluate((v: HTMLVideoElement) => v.preload)).toBe("none");

  await page.getByRole("button", { name: "Present it: play the recording from 0:08" }).click();
  await expect.poll(() => videoRequests.length).toBeGreaterThan(0);
  expect(new Set(videoRequests)).toEqual(new Set(["/builder-walkthrough.mp4"]));
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => !v.paused && v.currentTime >= 8), { timeout: 15_000 })
    .toBe(true);
  await expect(page.locator('.lsl-step[data-current="true"]')).toContainText("Present it");
  // A real recording: 1280x800, about 21 seconds.
  expect(await video.evaluate((v: HTMLVideoElement) => [v.videoWidth, v.videoHeight, Math.round(v.duration)])).toEqual([1280, 800, 22]);
});

test("the export viewer switches between real files without moving the page", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const viewer = page.locator("#export .lsl-code");
  await viewer.scrollIntoViewIfNeeded();
  const height = async () => (await viewer.locator(".lsl-code-pre").boundingBox())!.height;
  const h0 = await height();
  await expect(viewer.locator("pre")).toContainText('from "@salt-ds/core"');
  for (const [file, text] of [
    ["design-hub-project.sh", "Design Hub - Vite project bootstrap"],
    ["dashboard.html", "<!DOCTYPE html>"],
    ["tokens.json", "--salt-container-primary-background"],
  ] as const) {
    await viewer.getByRole("tab", { name: file }).click();
    await expect(viewer.locator("pre")).toContainText(text);
    expect(await height()).toBe(h0);
  }
});

test("tablets keep a nav route to the UI Kit", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/", { waitUntil: "networkidle" });
  const link = page.locator(".lsl-nav").getByRole("link", { name: "UI Kit" });
  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", "/ui-kit");
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
