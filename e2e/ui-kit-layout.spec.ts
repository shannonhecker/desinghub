import { test, expect, type Page } from "@playwright/test";

/** Owner rule: nothing moves on a system or tab switch. */

const SYSTEMS = ["Salt DS", "Material 3", "Fluent 2", "uoaui DS", "Carbon DS"];
const TABS = ["Overview", "Specs", "Code", "Guidelines", "Accessibility", "Compare"];
const rail = (page: Page) => page.getByRole("navigation", { name: "Design systems, sections and actions" });
const geometry = (page: Page) => page.evaluate(() => {
  const r = document.querySelector(".uikit-rail")!.getBoundingClientRect();
  const m = document.querySelector("#main-content")!.getBoundingClientRect();
  return { rail: Math.round(r.width), left: Math.round(m.left) };
});

test("rail width and main column edge are identical across systems and tabs", async ({ page }) => {
  await page.goto("/ui-kit?ds=salt&c=buttons", { waitUntil: "networkidle" });
  const base = await geometry(page);
  expect(base.rail).toBe(92);
  for (const label of SYSTEMS) {
    await rail(page).getByRole("link", { name: label, exact: true }).click();
    await page.waitForTimeout(300);
    for (const tab of TABS) {
      await page.getByRole("tab", { name: tab }).click();
      await page.waitForTimeout(120);
      expect(await geometry(page), `${label} / ${tab}`).toEqual(base);
    }
  }
  await rail(page).getByRole("link", { name: "Salt DS", exact: true }).click();
  await page.getByRole("button", { name: "Theme controls" }).click();
  await page.waitForTimeout(200);
  expect((await geometry(page)).rail).toBe(92);
});

test("a deep link never renders the overview first", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __overviewSeen: boolean }).__overviewSeen = false;
    const mo = new MutationObserver(() => {
      if (document.querySelector(".kit-page")) (window as unknown as { __overviewSeen: boolean }).__overviewSeen = true;
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  });
  await page.goto("/ui-kit?ds=carbon&c=buttons&tab=code", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Button");
  await expect(page.getByRole("tab", { selected: true })).toHaveText("Code");
  expect(await page.evaluate(() => (window as unknown as { __overviewSeen: boolean }).__overviewSeen)).toBe(false);
  expect(await page.locator(".kit-page").count()).toBe(0);
});
