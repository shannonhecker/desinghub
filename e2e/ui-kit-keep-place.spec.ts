import { test, expect, type Page } from "@playwright/test";

/**
 * Owner rule: switching design system keeps the visitor on the same
 * component or pattern, the same tab and the same scroll position. Mode and
 * density restyle in place. A system without an equivalent says so and
 * offers the closest matches; it never redirects.
 */

const SYSTEMS = [
  { id: "salt", label: "Salt DS" },
  { id: "m3", label: "Material 3" },
  { id: "fluent", label: "Fluent 2" },
  { id: "uoaui", label: "uoaui DS" },
  { id: "carbon", label: "Carbon DS" },
] as const;

const railLink = (page: Page, label: string) => page.getByRole("navigation", { name: "Design systems, sections and actions" }).getByRole("link", { name: label, exact: true });
const scroller = (page: Page) => page.getByTestId("kit-scroller");
const scrollTop = (page: Page) => scroller(page).evaluate((el) => el.scrollTop);
const selectedTab = (page: Page) => page.getByRole("tab", { selected: true });

async function open(page: Page, query: string) {
  await page.goto(`/ui-kit?${query}`, { waitUntil: "networkidle" });
  await expect(page.locator(".uikit-shell")).toBeVisible();
}

/* Entries that exist in all five systems, with the id each system uses. */
const SAME: { name: string; start: string; ids: Record<string, string>; heading: RegExp }[] = [
  { name: "Button", start: "buttons", ids: { salt: "buttons", m3: "buttons", fluent: "buttons", uoaui: "buttons", carbon: "buttons" }, heading: /^Buttons?$/ },
  { name: "Input", start: "inputs", ids: { salt: "inputs", m3: "text-fields", fluent: "inputs", uoaui: "inputs", carbon: "inputs" }, heading: /^Text (Input|Fields)$/ },
  { name: "pattern (Wizard)", start: "pat-wizard", ids: { salt: "pat-wizard", m3: "pat-wizard", fluent: "pat-wizard", uoaui: "pat-wizard", carbon: "pat-wizard" }, heading: /^Wizard/ },
];

for (const entry of SAME) {
  test(`${entry.name} stays on screen, on the same tab and scroll, through all five systems`, async ({ page }) => {
    await open(page, `ds=salt&c=${entry.start}`);
    await page.getByRole("tab", { name: "Code" }).click();
    await expect(selectedTab(page)).toHaveText("Code");
    /* Scroll as far as the page allows, up to 240px, and remember it. */
    await scroller(page).evaluate((el) => { el.scrollTop = 240; });
    const before = await scrollTop(page);

    for (const sys of [...SYSTEMS.slice(1), SYSTEMS[0]]) {
      const link = railLink(page, sys.label);
      /* The switcher entry is a real link to the equivalent page. */
      await expect(link).toHaveAttribute("href", `/ui-kit?ds=${sys.id}&c=${entry.ids[sys.id]}&tab=code`);
      await link.click();
      await expect(page).toHaveURL(new RegExp(`ds=${sys.id}&c=${entry.ids[sys.id]}&tab=code$`));
      await expect(page.getByTestId("detail-page")).toHaveAttribute("data-component", entry.ids[sys.id]);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(entry.heading);
      await expect(selectedTab(page)).toHaveText("Code");
      await expect(page.getByTestId("not-in-system")).toHaveCount(0);
      /* Focus stays on the control that was pressed. */
      await expect(link).toBeFocused();
      /* No scroll reset: within a few pixels of where it was, unless the
         new page is simply shorter than the old scroll position. */
      await expect.poll(async () => {
        const max = await scroller(page).evaluate((el) => el.scrollHeight - el.clientHeight);
        return Math.abs((await scrollTop(page)) - Math.min(before, max));
      }).toBeLessThanOrEqual(4);
      const max = await scroller(page).evaluate((el) => el.scrollHeight - el.clientHeight);
      if (max > 0) expect(await scrollTop(page)).toBeGreaterThan(0);
    }
  });
}

test("Data table maps to each system's table, or says the system has none", async ({ page }) => {
  await open(page, "ds=salt&c=table");
  await page.getByRole("tab", { name: "Compare" }).click();

  await railLink(page, "Carbon DS").click();
  await expect(page).toHaveURL(/ds=carbon&c=data-table&tab=compare$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Data Table");
  await expect(selectedTab(page)).toHaveText("Compare");

  await railLink(page, "uoaui DS").click();
  await expect(page).toHaveURL(/ds=uoaui&c=data-table&tab=compare$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Data Table");

  await scroller(page).evaluate((el) => { el.scrollTop = 160; });
  const before = await scrollTop(page);

  /* This library has no Material or Fluent data-table page yet (both
     systems have one); the state says exactly that and does not blame the
     system. The place, the tab and the scroll position are kept. */
  await railLink(page, "Material 3").click();
  await expect(page).toHaveURL(/ds=m3&c=data-table&from=uoaui&tab=compare$/);
  const nis = page.getByTestId("not-in-system");
  await expect(nis.getByRole("heading", { level: 1 })).toHaveText("This library has no Data table page for Material 3 yet.");
  await expect(nis).not.toContainText("has no Data table.");
  await expect(nis.getByRole("link", { name: "AG Grid" })).toHaveAttribute("href", "/ui-kit?ds=m3&c=ag-grid");
  /* The not-here page is a short page: it fits the viewport, so there is
     no position to keep. Nothing scrolls off. */
  expect(await scroller(page).evaluate((el) => el.scrollHeight - el.clientHeight)).toBeLessThanOrEqual(4);
  expect(await scrollTop(page)).toBe(0);

  await railLink(page, "Fluent 2").click();
  await expect(page).toHaveURL(/ds=fluent&c=data-table&from=uoaui&tab=compare$/);
  await expect(page.getByTestId("not-in-system").getByRole("heading", { level: 1 })).toHaveText("This library has no Data table page for Fluent 2 yet.");

  /* And back to a system that has it: same entry, same tab, same scroll,
     and keyboard focus still on the switcher entry that was pressed. */
  await railLink(page, "Salt DS").click();
  await expect(page).toHaveURL(/ds=salt&c=table&tab=compare$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Table");
  await expect(selectedTab(page)).toHaveText("Compare");
  await expect(railLink(page, "Salt DS")).toBeFocused();
  await expect.poll(async () => Math.abs((await scrollTop(page)) - Math.min(before, await scroller(page).evaluate((el) => el.scrollHeight - el.clientHeight)))).toBeLessThanOrEqual(4);
});

test("missing equivalent: says so, offers the closest matches, never redirects", async ({ page }) => {
  await open(page, "ds=m3&c=fabs");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("FAB");

  await railLink(page, "Carbon DS").click();
  const state = page.getByTestId("not-in-system");
  await expect(state.getByRole("heading", { level: 1 })).toHaveText("Carbon has no FAB.");
  /* The place is kept in the URL: same entry, marked as Material's. */
  await expect(page).toHaveURL(/\/ui-kit\?ds=carbon&c=fabs&from=m3$/);
  await expect(page.getByTestId("detail-page")).toHaveCount(0);
  /* Header and switcher stay; the switcher still points back at the FAB. */
  await expect(railLink(page, "Carbon DS")).toHaveAttribute("aria-current", "true");
  await expect(railLink(page, "Material 3")).toHaveAttribute("href", "/ui-kit?ds=m3&c=fabs");
  await expect(state.getByRole("link", { name: "Button" })).toHaveAttribute("href", "/ui-kit?ds=carbon&c=buttons");
  await expect(state.getByRole("link", { name: "FAB in Material 3" })).toHaveAttribute("href", "/ui-kit?ds=m3&c=fabs");

  /* The state survives a reload. */
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByTestId("not-in-system").getByRole("heading", { level: 1 })).toHaveText("Carbon has no FAB.");

  /* A closest match is a link the visitor chooses. */
  await page.getByTestId("not-in-system").getByRole("link", { name: "Button" }).click();
  await expect(page).toHaveURL(/ds=carbon&c=buttons$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Button");

  /* Back returns to the not-in-this-system state, then to the FAB. */
  await page.goBack();
  await expect(page.getByTestId("not-in-system")).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("FAB");
});

test("mode and density restyle in place: no navigation, no scroll", async ({ page }) => {
  await open(page, "ds=salt&c=buttons&tab=specs");
  await scroller(page).evaluate((el) => { el.scrollTop = 200; });
  const before = await scrollTop(page);
  const url = page.url();
  const shell = page.locator(".uikit-shell");
  const bg = () => shell.evaluate((el) => getComputedStyle(el).backgroundColor);
  const bgBefore = await bg();

  const rail = page.getByRole("navigation", { name: "Design systems, sections and actions" });
  await rail.getByRole("button", { name: /^Switch to (light|dark) mode$/ }).click();
  await expect.poll(bg).not.toBe(bgBefore);
  expect(page.url()).toBe(url);
  expect(Math.abs((await scrollTop(page)) - before)).toBeLessThanOrEqual(2);
  await expect(selectedTab(page)).toHaveText("Specs");

  /* Density lives in the theme panel. */
  await rail.getByRole("button", { name: "Theme controls" }).click();
  await page.getByRole("complementary", { name: "Component navigation panel" }).getByRole("radio", { name: /^Touch/ }).click();
  await expect(page.getByRole("radio", { name: /^Touch/ })).toHaveAttribute("aria-checked", "true");
  expect(page.url()).toBe(url);
  await expect(page.getByTestId("detail-page")).toHaveAttribute("data-component", "buttons");
  await expect(selectedTab(page)).toHaveText("Specs");
});

test("overview keeps its filter, search and section across a system switch", async ({ page }) => {
  await open(page, "ds=salt");
  await page.getByRole("group", { name: "Show" }).getByRole("button", { name: /^Components/ }).click();
  await page.locator("#kit-search").fill("date");
  await expect(page).toHaveURL(/ds=salt&q=date&show=components$/);

  await railLink(page, "Carbon DS").click();
  await expect(page).toHaveURL(/ds=carbon&q=date&show=components$/);
  await expect(page.locator("#kit-search")).toHaveValue("date");
  await expect(page.getByRole("group", { name: "Show" }).getByRole("button", { name: /^Components/ })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".uikit-card-hit")).toHaveText(["Date Picker"]);

  /* Section position: reading Components stays in Components. */
  await page.locator("#kit-search").fill("");
  await page.getByRole("group", { name: "Show" }).getByRole("button", { name: /^All/ }).click();
  await page.locator("#kit-components").scrollIntoViewIfNeeded();
  await scroller(page).evaluate((el) => { const s = el.querySelector("#kit-components") as HTMLElement; el.scrollTop += s.getBoundingClientRect().top - el.getBoundingClientRect().top - 40; el.dispatchEvent(new Event("scroll")); });
  await page.waitForTimeout(150);
  await railLink(page, "Fluent 2").click();
  await expect(page).toHaveURL(/ds=fluent$/);
  const offset = await scroller(page).evaluate((el) => (el.querySelector("#kit-components") as HTMLElement).getBoundingClientRect().top - el.getBoundingClientRect().top);
  expect(Math.abs(offset - 40)).toBeLessThanOrEqual(6);
});

test("a shared URL opens the same entry and tab; overview shows compare band", async ({ page }) => {
  await open(page, "ds=fluent&c=inputs&tab=accessibility");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Text Input");
  await expect(selectedTab(page)).toHaveText("Accessibility");

  await open(page, "ds=m3");
  const band = page.getByTestId("compare-panels");
  await expect(band.locator("li")).toHaveCount(5);
  await expect(band.locator('li[data-system="carbon"] button').first()).toBeVisible();
});
