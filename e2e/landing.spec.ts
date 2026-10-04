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
  page.locator("#showcase [role=tabpanel] img.lsl-showcase-shot");
const rightOption = (page: Page, name: string) =>
  page.locator("#showcase").getByRole("radio", { name, exact: true });
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
    for (const selector of [".lsl-hero-sub", ".lsl-hero .lsl-hero-prompt", '[role="tablist"]', '[role="radiogroup"]']) {
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

    // The controls are shown at their real size or larger on a desktop: the
    // wide capture is 710 CSS px across.
    if (fold.width >= 1440) expect(frame!.width).toBeGreaterThanOrEqual(710);

    // Both captures actually loaded, two different systems, and nothing
    // scrolls sideways.
    const suffix = fold.phone ? "-phone.webp" : ".webp";
    for (const [shot, id] of [[leftShot(page), "salt"], [rightShot(page), "md3"]] as const) {
      expect(await shot.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      expect(await shot.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain(
        `/showcase/cmp-${id}-dark${suffix}`,
      );
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  });
}

for (const width of [320, 375, 700, 1024, 1440]) {
  test(`every Left tab and Right option is in view and clickable with a mouse at ${width}px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/", { waitUntil: "networkidle" });
    const inside = (box: { x: number; width: number } | null) => {
      // Fully inside the viewport: not clipped, not behind a scroll container.
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    };
    // Right side first: move it off Material 3 so every Left tab is a plain pick.
    for (const [name, id] of [...SYSTEMS].reverse()) {
      const label = page.locator("#showcase label.lsl-side-option", { hasText: name });
      const box = await label.boundingBox();
      inside(box);
      if (id === "salt") {
        await expect(rightOption(page, name)).toBeDisabled(); // Salt is on the left
        continue;
      }
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await expect(rightOption(page, name)).toBeChecked();
      await expect(rightShot(page)).toHaveAttribute("src", `/showcase/cmp-${id}-dark.webp`);
    }
    for (const [name, id] of SYSTEMS) {
      const tab = page.getByRole("tab", { name });
      const box = await tab.boundingBox();
      inside(box);
      await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
      await expect(tab).toHaveAttribute("aria-selected", "true");
      await expect(leftShot(page)).toHaveAttribute("src", `/showcase/cmp-${id}-dark.webp`);
    }
    // The light/dark control is reachable at this width too, and covers no control.
    const toggle = page.locator(".lsl-mode-btn:visible").first();
    await toggle.click();
    await expect(leftShot(page)).toHaveAttribute("src", "/showcase/cmp-uoaui-light.webp");
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
  await expect(slider).toHaveAttribute("aria-valuetext", /^Salt DS \d+ percent, Material 3 \d+ percent$/);
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

test("each side is chosen on its own, and a change sweeps in from that side", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  // Let the first-view pass finish.
  await expect.poll(() => splitOf(page), { timeout: 5000, intervals: [50] }).toBeLessThan(0.4);
  await expect.poll(() => splitOf(page), { timeout: 5000 }).toBe(0.5);

  // Left: the new system comes in from the left edge; the right side stays.
  await page.getByRole("tab", { name: "Carbon" }).click();
  await expect(leftShot(page)).toHaveAttribute("src", "/showcase/cmp-carbon-dark.webp");
  await expect(rightShot(page)).toHaveAttribute("src", "/showcase/cmp-md3-dark.webp");
  await expect.poll(() => splitOf(page), { timeout: 3000, intervals: [20] }).toBeLessThan(0.4);
  await expect.poll(() => splitOf(page), { timeout: 3000 }).toBe(0.5);

  // Right: the new system comes in from the right edge; the left side stays.
  await rightOption(page, "uoaui").check();
  await expect(rightShot(page)).toHaveAttribute("src", "/showcase/cmp-uoaui-dark.webp");
  await expect(leftShot(page)).toHaveAttribute("src", "/showcase/cmp-carbon-dark.webp");
  await expect.poll(() => splitOf(page), { timeout: 3000, intervals: [20] }).toBeGreaterThan(0.6);
  await expect.poll(() => splitOf(page), { timeout: 3000 }).toBe(0.5);

  // The frame and the legend both say which side is which.
  await expect(page.locator('.lsl-corner[data-side="left"]')).toHaveText("Carbon");
  await expect(page.locator('.lsl-corner[data-side="right"]')).toHaveText("uoaui");
  await expect(page.locator(".lsl-legend")).toContainText("IBM Plex Sans, square corners, bright blue");
  await expect(page.locator(".lsl-legend")).toContainText("Inter, 12px corners, violet");
  // The labels sit on their own sides of the divider.
  const line = (await page.locator(".lsl-split-line").boundingBox())!.x;
  const l = (await page.locator('.lsl-corner[data-side="left"]').boundingBox())!;
  const r = (await page.locator('.lsl-corner[data-side="right"]').boundingBox())!;
  expect(l.x + l.width).toBeLessThan(line);
  expect(r.x).toBeGreaterThan(line);

  // Light and dark change both sides.
  await page.locator(".lsl-mode-btn:visible").first().click();
  await expect(leftShot(page)).toHaveAttribute("src", "/showcase/cmp-carbon-light.webp");
  await expect(rightShot(page)).toHaveAttribute("src", "/showcase/cmp-uoaui-light.webp");

  // Picking the right-hand system on the left swaps the two.
  await page.getByRole("tab", { name: "uoaui" }).click();
  await expect(leftShot(page)).toHaveAttribute("src", "/showcase/cmp-uoaui-light.webp");
  await expect(rightShot(page)).toHaveAttribute("src", "/showcase/cmp-carbon-light.webp");
  await expect(rightOption(page, "Carbon")).toBeChecked();

  await page.getByRole("tab", { name: "uoaui" }).focus();
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab", { name: "Salt DS" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Salt DS" })).toHaveAttribute("aria-selected", "true");
});

const PAIRS = [
  ["Salt DS", "Material 3"],
  ["Salt DS", "Carbon"],
  ["Fluent 2", "uoaui"],
] as const;
/* The primary button's fill, as measured from the builder (landingSystems.ts). */
const ACCENT: Record<string, { light: string; dark: string }> = {
  "Salt DS": { light: "#2670A9", dark: "#2670A9" },
  "Material 3": { light: "#6750A4", dark: "#D0BCFF" },
  "Fluent 2": { light: "#0F6CBD", dark: "#115EA3" },
  Carbon: { light: "#0F62FE", dark: "#4589FF" },
  uoaui: { light: "#6B5AA8", dark: "#8A58C9" },
};

/** Pixel statistics for PNG screenshots, computed in the page. */
async function stats(page: Page, a: Buffer, b: Buffer | null, hex: string) {
  return page.evaluate(
    async ([sa, sb, hex]) => {
      const load = async (src: string) => {
        const img = new Image();
        img.src = "data:image/png;base64," + src;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.width;
        c.height = img.height;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height).data;
      };
      const da = await load(sa as string);
      const db = sb ? await load(sb as string) : null;
      const [r, g, bl] = [1, 3, 5].map((i) => parseInt((hex as string).slice(i, i + 2), 16));
      let sum = 0;
      let changed = 0;
      let accent = 0;
      for (let i = 0; i < da.length; i += 4) {
        if (Math.abs(da[i] - r) <= 12 && Math.abs(da[i + 1] - g) <= 12 && Math.abs(da[i + 2] - bl) <= 12) accent++;
        if (!db) continue;
        const d = (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])) / 3;
        sum += d;
        if (d > 8) changed++;
      }
      const n = da.length / 4;
      return { mean: sum / n, share: changed / n, accent };
    },
    [a.toString("base64"), b ? b.toString("base64") : null, hex],
  );
}

for (const mode of ["dark", "light"] as const) {
  for (const [left, right] of PAIRS) {
    test(`${left} against ${right}, ${mode}: the halves differ, and each side shows its own accent`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 1512, height: 738 });
      await page.goto("/", { waitUntil: "networkidle" });
      if (mode === "light") await page.locator(".lsl-mode-btn", { hasText: "Light" }).click();
      // Set the pair with plain picks (Right first, so no swap is involved).
      if (right !== "Material 3") await rightOption(page, right).check();
      if (left !== "Salt DS") await page.getByRole("tab", { name: left }).click();
      if (right === "Material 3" && left !== "Salt DS") await rightOption(page, right).check();
      await expect(leftShot(page)).toHaveJSProperty("complete", true);
      await expect(rightShot(page)).toHaveJSProperty("complete", true);

      const frame = page.locator(".lsl-showcase-viewport");
      const box = (await frame.boundingBox())!;
      const half = Math.floor(box.width / 2);
      const leftClip = { x: box.x + 2, y: box.y + 2, width: half - 30, height: box.height - 50 };
      const rightClip = { x: box.x + half + 30, y: box.y + 2, width: half - 34, height: box.height - 50 };
      const slider = page.getByRole("slider");

      // 1. The same region rendered by one system, then by the other.
      await slider.focus();
      await page.keyboard.press("End"); // all left system
      await page.waitForTimeout(250);
      const allLeft = await page.screenshot({ clip: leftClip });
      await page.keyboard.press("Home"); // all right system
      await page.waitForTimeout(250);
      const allRight = await page.screenshot({ clip: leftClip });
      const diff = await stats(page, allLeft, allRight, "#000000");
      if (mode === "dark") {
        // Different surfaces: almost every pixel changes.
        expect(diff.share).toBeGreaterThan(0.8);
        expect(diff.mean).toBeGreaterThan(12);
      } else {
        // Light surfaces are all white, so the change is in the controls
        // and the type: still thousands of pixels in this region.
        expect(diff.share).toBeGreaterThan(0.03);
        expect(diff.share * leftClip.width * leftClip.height).toBeGreaterThan(3000);
      }

      // 2. At the resting position each side shows its own accent: the left
      //    system's filled primary button, the right system's selected tab.
      for (let i = 0; i < 50; i++) await page.keyboard.press("ArrowRight");
      await page.waitForTimeout(250);
      expect(await splitOf(page)).toBe(0.5);
      const l = await stats(page, await page.screenshot({ clip: leftClip }), null, ACCENT[left][mode]);
      const r = await stats(page, await page.screenshot({ clip: rightClip }), null, ACCENT[right][mode]);
      expect(l.accent, `${left} primary button on the left`).toBeGreaterThan(1200);
      expect(r.accent, `${right} accent on the right`).toBeGreaterThan(30);
    });
  }
}

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
  await expect(leftShot(page)).toHaveAttribute("src", "/showcase/cmp-carbon-dark.webp");
});

test("the prompt lands in the builder with the chosen system and mode", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Carbon" }).click();
  await page.locator(".lsl-mode-btn:visible").first().click(); // dark is the default: switch to light

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
  expect(params.get("mode")).toBe("light");
  // Nothing from the instrument's own controls leaks into the handoff.
  expect([...params.keys()].sort()).toEqual(["ds", "mode", "prompt"]);

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
  await expect(leftShot(page)).toHaveAttribute("src", "/showcase/cmp-fluent-dark.webp");
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
  // A real recording: 1280x800, 22 seconds to the nearest second.
  expect(await video.evaluate((v: HTMLVideoElement) => [v.videoWidth, v.videoHeight, Math.round(v.duration)])).toEqual([1280, 800, 22]);
});

test("the export viewer switches between real files without moving the page", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const viewer = page.locator("#export .lsl-code");
  await viewer.scrollIntoViewIfNeeded();
  const height = async () => (await viewer.locator(".lsl-code-pre").boundingBox())!.height;
  const h0 = await height();
  await expect(viewer.locator("pre")).toContainText('from "@salt-ds/core"');
  await expect(viewer.getByRole("tab")).toHaveText(["dashboard.tsx", "dashboard.html"]);
  for (const [file, text] of [
    ["dashboard.html", "<!DOCTYPE html>"],
    ["dashboard.tsx", "SaltProvider"],
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
