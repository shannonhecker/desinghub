import { test, expect, type Page } from "@playwright/test";

/**
 * Present and Preview are full screen on the desktop device (owner, 5 Oct):
 * the report lays out at the window's real width, edge to edge and top to
 * bottom, with no frame chrome or side margins, and scrolls vertically inside
 * the stage. Tablet and phone keep their framed, centred preview. The floating
 * Present bar never covers the last row of content at the end of the scroll.
 */

async function present(page: Page, label = "Analytics Dashboard") {
  await page.goto("/builder");
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible();
  await expect(async () => {
    const browse = page.getByRole("button", { name: /Browse templates/ });
    if (await browse.isVisible()) await browse.click();
    await expect(page.getByRole("list", { name: "Starting templates" })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await page.getByRole("button", { name: `Use the ${label} template` }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(600);
}

function edges(page: Page) {
  return page.evaluate(() => {
    const d = document.querySelector(".present-stage .bp-dashboard")!.getBoundingClientRect();
    const f = document.querySelector(".present-stage .bp-device-frame")!;
    const cs = getComputedStyle(f);
    return { left: d.left, right: d.right, top: d.top, width: d.width, radius: cs.borderTopLeftRadius, border: cs.borderLeftWidth, win: window.innerWidth, winH: window.innerHeight, bottom: f.getBoundingClientRect().bottom };
  });
}

test.describe("Present is full screen on the desktop device", () => {
  for (const width of [1512, 2000, 2560]) {
    test(`at ${width} wide the dashboard spans the window edge to edge`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await present(page);
      const e = await edges(page);
      expect(e.left, "left edge").toBe(0);
      expect(Math.abs(e.right - e.win), "right edge").toBeLessThanOrEqual(1);
      expect(e.top, "top edge").toBe(0);
      expect(e.radius, "no rounded frame corners").toBe("0px");
      expect(e.border, "no frame border").toBe("0px");
      expect(Math.abs(e.bottom - e.winH), "fills to the bottom").toBeLessThanOrEqual(1);
    });
  }

  test("tablet and phone stay framed and centred", async ({ page }) => {
    await page.setViewportSize({ width: 1512, height: 900 });
    await present(page);
    for (const device of ["Tablet", "Mobile"]) {
      await page.getByRole("button", { name: `${device} viewport` }).click();
      await page.waitForTimeout(800);
      const e = await edges(page);
      expect(e.left, `${device} has a left margin`).toBeGreaterThan(40);
      expect(Math.abs(e.left - (e.win - e.right)), `${device} is centred`).toBeLessThanOrEqual(2);
      expect(e.radius, `${device} keeps its frame`).not.toBe("0px");
    }
  });

  test("the last row is not covered by the Present bar at the end of the scroll", async ({ page }) => {
    await page.setViewportSize({ width: 1512, height: 738 });
    await present(page);
    const result = await page.evaluate(async () => {
      const main = document.querySelector(".present-stage .bp-main") as HTMLElement;
      main.scrollTop = main.scrollHeight;
      await new Promise((r) => setTimeout(r, 300));
      const blocks = [...main.querySelectorAll("[data-block-id]")];
      const last = blocks[blocks.length - 1].getBoundingClientRect();
      const bar = document.querySelector(".present-bar")!.getBoundingClientRect();
      return { lastBottom: last.bottom, barTop: bar.top, scrolled: main.scrollTop > 0 };
    });
    expect(result.scrolled, "the page scrolls inside the stage").toBe(true);
    expect(result.lastBottom, "last row clear of the bar").toBeLessThanOrEqual(result.barTop);
  });

  test("the shared preview route follows the same rule", async ({ page }) => {
    await page.setViewportSize({ width: 2000, height: 900 });
    await present(page);
    await page.goto("/builder?preview=1");
    await expect(page.locator(".standalone-preview .bp-main [data-block-id]").first()).toBeVisible({ timeout: 30_000 });
    const e = await page.evaluate(() => {
      const d = document.querySelector(".standalone-preview .bp-dashboard")!.getBoundingClientRect();
      return { left: d.left, right: d.right, win: window.innerWidth };
    });
    expect(e.left).toBe(0);
    expect(Math.abs(e.right - e.win)).toBeLessThanOrEqual(1);
  });
});
