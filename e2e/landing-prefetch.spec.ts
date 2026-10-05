import { test, expect, type Page } from "@playwright/test";

/**
 * The landing does not download the builder until the visitor reaches for it.
 *
 * Next prefetches every link in view; from the landing that used to pull the
 * builder (about 2 MB of script), the library and both tools as soon as the
 * page loaded on a desktop. Now a route is fetched when a mouse rests on its
 * link or the keyboard focuses it, never on touch.
 */

/** Requests that only another route makes: its payload, or script the
    landing itself never asked for. */
function watchOtherRoutes(page: Page) {
  const landing = new Set<string>();
  const later: string[] = [];
  let settled = false;
  page.on("request", (request) => {
    const url = new URL(request.url());
    const isRoutePayload = url.searchParams.has("_rsc") && url.pathname !== "/";
    const isScript = request.resourceType() === "script" && url.pathname.startsWith("/_next/static/chunks/");
    if (!isRoutePayload && !isScript) return;
    if (isRoutePayload) later.push(url.pathname + " (route payload)");
    else if (!settled) landing.add(url.pathname);
    else if (!landing.has(url.pathname)) later.push(url.pathname);
  });
  return {
    settle: () => { settled = true; },
    later,
    builder: () => later.filter((u) => u.startsWith("/builder") || /app\/builder\/page/.test(u)),
  };
}

test("desktop: nothing of another route is fetched until a link is hovered, then only that route", async ({ page }) => {
  const seen = watchOtherRoutes(page);
  await page.goto("/", { waitUntil: "networkidle" });
  /* Bring every section's links on screen: sight alone must fetch nothing. */
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForLoadState("networkidle");
  seen.settle();
  await page.waitForTimeout(800);
  expect(seen.later, "fetched without intent").toEqual([]);

  /* A pointer crossing a link is not intent. */
  const cta = page.locator("a.lsl-nav-cta");
  await cta.hover();
  await page.mouse.move(5, 400);
  await page.waitForTimeout(600);
  expect(seen.later, "fetched by a pointer passing over").toEqual([]);

  /* Resting on it is. */
  await cta.hover();
  await expect.poll(() => seen.builder().length, { timeout: 15_000 }).toBeGreaterThan(0);
  await page.waitForLoadState("networkidle");
  expect(seen.later.some((u) => u.startsWith("/ui-kit") || u.startsWith("/theme-builder") || u.startsWith("/token-editor")), "only the hovered route").toBe(false);

  /* And the click that follows lands in the builder. */
  await cta.click();
  await expect(page).toHaveURL(/\/builder$/);
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible();
});

test("keyboard: focusing a link fetches its route", async ({ page }) => {
  const seen = watchOtherRoutes(page);
  await page.goto("/", { waitUntil: "networkidle" });
  seen.settle();
  await page.waitForTimeout(500);
  expect(seen.later).toEqual([]);
  await page.locator("a.lsl-nav-cta").focus();
  /* focus() from script is not the keyboard: reach it with Tab. */
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(page.locator("a.lsl-nav-cta")).toBeFocused();
  await expect.poll(() => seen.builder().length, { timeout: 15_000 }).toBeGreaterThan(0);
});

test("phone: touch never prefetches; the builder loads when it is opened", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const seen = watchOtherRoutes(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1200);
  await page.waitForLoadState("networkidle");
  seen.settle();
  /* A finger landing on a system card, as a scroll begins. */
  const card = page.locator("a.lsl-syscard").first();
  await card.scrollIntoViewIfNeeded();
  await card.dispatchEvent("pointerenter", { pointerType: "touch" });
  await card.dispatchEvent("touchstart");
  await page.waitForTimeout(800);
  expect(seen.later, "fetched on touch").toEqual([]);
  await card.tap();
  await expect(page).toHaveURL(/\/builder\?ds=/);
  await context.close();
});

test("a visitor who asked to save data is never prefetched for", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "connection", { value: { saveData: true }, configurable: true });
  });
  const seen = watchOtherRoutes(page);
  await page.goto("/", { waitUntil: "networkidle" });
  seen.settle();
  await page.locator("a.lsl-nav-cta").hover();
  await page.waitForTimeout(900);
  expect(seen.later).toEqual([]);
});
