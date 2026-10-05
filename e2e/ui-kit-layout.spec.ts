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

/* The chrome above the content is the library's own and has one size in
   every system: the breadcrumb, the title and the tab strip must not move by
   a pixel when the system changes. */
const header = (page: Page) => page.evaluate(() => {
  const top = (sel: string) => Math.round(document.querySelector(sel)!.getBoundingClientRect().top * 2) / 2;
  const left = (sel: string) => Math.round(document.querySelector(sel)!.getBoundingClientRect().left * 2) / 2;
  return {
    crumbTop: top(".kit-crumb-here"),
    crumbLeft: left(".kit-crumbs"),
    barHeight: Math.round(document.querySelector(".kit-topbar")!.getBoundingClientRect().height),
    titleTop: top('[data-testid="detail-page"] h1'),
    titleLeft: left('[data-testid="detail-page"] h1'),
    tabsTop: top('[role="tablist"]'),
    tabsLeft: left('[role="tablist"]'),
    panelTop: top('[role="tabpanel"]'),
  };
});

for (const entry of [
  { name: "Button", query: "c=buttons" },
  { name: "Checkbox", query: "c=checkboxes" },
  { name: "Wizard pattern", query: "c=pat-wizard" },
]) {
  test(`${entry.name}: breadcrumb, title and tab strip sit at the same place in all five systems`, async ({ page }) => {
    await page.goto(`/ui-kit?ds=salt&${entry.query}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const base = await header(page);
    expect(base.barHeight).toBe(48);
    expect(base.crumbLeft).toBe(base.titleLeft);
    for (const label of [...SYSTEMS.slice(1), SYSTEMS[0]]) {
      await rail(page).getByRole("link", { name: label, exact: true }).click();
      await expect(rail(page).getByRole("link", { name: label, exact: true })).toHaveAttribute("aria-current", "true");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      expect(await header(page), `${entry.name} in ${label}`).toEqual(base);
      for (const tab of ["Code", "Compare", "Overview"]) {
        await page.getByRole("tab", { name: tab }).click();
        await page.waitForTimeout(120);
        expect(await header(page), `${entry.name} in ${label}, ${tab} tab`).toEqual(base);
      }
    }
  });
}

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

test("the plain /ui-kit page has its overview in the server HTML", async ({ request }) => {
  const html = await (await request.get("/ui-kit")).text();
  /* Before any script runs: the title, the section headings and a tile. */
  expect(html).toContain('class="kit-page"');
  expect(html).toContain("Same component, five systems");
  expect(html).toContain('id="kit-foundations"');
  expect(html).toContain("kit-tile-name");
  /* A link to a place is held instead: no overview in its HTML. */
  const deep = await (await request.get("/ui-kit?ds=carbon&c=buttons&tab=code")).text();
  expect(deep).not.toContain('class="kit-page"');
});

test("a link to a system's overview opens that system and leaves the address alone", async ({ page }) => {
  await page.addInitScript(() => { (window as unknown as { __h0: number }).__h0 = history.length; });
  await page.goto("/ui-kit?ds=m3", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Material 3");
  await expect(page.locator(".uikit-shell")).toHaveAttribute("data-system", "m3");
  expect(page.url()).toMatch(/\/ui-kit\?ds=m3$/);
  /* Nothing was pushed on the way in: the pre-URL state never reached the
     address bar or the history. */
  expect(await page.evaluate(() => history.length - (window as unknown as { __h0: number }).__h0)).toBe(0);
});

test("a row that fits is not faded; a row that scrolls is, until its end", async ({ page }) => {
  await page.goto("/ui-kit?ds=salt", { waitUntil: "networkidle" });
  /* 1440: the compare band, its picker, the filters and the fingerprint all
     fit, so none of them is masked. */
  for (const sel of [".kit-compare.is-compact", ".kit-band-picks", ".kit-filters", ".kit-fp"]) {
    const el = page.locator(sel).first();
    await expect(el).toBeVisible();
    await expect(el, `${sel} at 1440`).not.toHaveAttribute("data-fade", /.+/);
    expect(await el.evaluate((n) => getComputedStyle(n).maskImage), `${sel} mask at 1440`).toBe("none");
  }
  /* The last compare panel and the last pick are fully drawn. */
  await expect(page.locator('.kit-compare.is-compact li[data-system="carbon"]')).toBeVisible();
  await expect(page.getByRole("group", { name: "Component to compare" }).getByRole("button", { name: "Switch" })).toBeVisible();

  /* Phone: the band scrolls. It fades at the end it continues past, at both
     ends in the middle, and not at the end it has reached. */
  await page.setViewportSize({ width: 375, height: 812 });
  const band = page.locator(".kit-compare.is-compact");
  await expect(band).toHaveAttribute("data-fade", "end");
  expect(await band.evaluate((n) => getComputedStyle(n).maskImage)).toContain("linear-gradient");
  await band.evaluate((n) => { n.scrollLeft = 200; });
  await expect(band).toHaveAttribute("data-fade", "both");
  await band.evaluate((n) => { n.scrollLeft = n.scrollWidth; });
  await expect(band).toHaveAttribute("data-fade", "start");
});

test("phone: the selected tab is scrolled into view", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/ui-kit?ds=m3&c=buttons&tab=compare", { waitUntil: "networkidle" });
  const tab = page.getByRole("tab", { name: "Compare" });
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect.poll(async () => {
    const box = await tab.boundingBox();
    return !!box && box.x >= 0 && box.x + box.width <= 375;
  }).toBe(true);
});

test("the scroll hold lets go when the visitor presses or scrolls", async ({ page }) => {
  await page.goto("/ui-kit?ds=salt&c=buttons&tab=specs", { waitUntil: "networkidle" });
  const sc = page.getByTestId("kit-scroller");
  await sc.evaluate((el) => { el.scrollTop = 300; });
  await page.waitForTimeout(100);
  await rail(page).getByRole("link", { name: "Carbon DS", exact: true }).click();
  /* Straight away, inside the settling window: press in the scroller (what a
     scrollbar drag starts with) and move. The position must stay where the
     visitor put it, not be pulled back. */
  await sc.dispatchEvent("pointerdown");
  await sc.evaluate((el) => { el.scrollTop = 40; });
  await page.waitForTimeout(700);
  expect(await sc.evaluate((el) => el.scrollTop)).toBeLessThanOrEqual(44);

  /* A tab change inside the window also ends the hold. */
  await sc.evaluate((el) => { el.scrollTop = 300; });
  await page.waitForTimeout(100);
  await rail(page).getByRole("link", { name: "Salt DS", exact: true }).click();
  await page.getByRole("tab", { name: "Code" }).click();
  await sc.evaluate((el) => { el.scrollTop = 0; });
  await page.waitForTimeout(700);
  expect(await sc.evaluate((el) => el.scrollTop)).toBeLessThanOrEqual(4);
});
