import { test, expect, type Page } from "@playwright/test";

/**
 * The library's Compare, Playground and Specs panels must match each
 * system's own page. The page draws its button from its documented tokens;
 * the panels mount the real package through the kit skin. Background,
 * corner, text transform and typeface must agree, in light and dark.
 */

const SYSTEMS: { id: string; label: string; own: string }[] = [
  { id: "salt", label: "Salt DS", own: ".s-btn-solid" },
  { id: "m3", label: "Material 3", own: ".m3-btn-filled" },
  { id: "fluent", label: "Fluent 2", own: ".f-btn-primary" },
  { id: "uoaui", label: "uoaui DS", own: ".a-btn-primary" },
  { id: "carbon", label: "Carbon DS", own: ".cb-btn-primary" },
];

type Look = { bg: string; radius: string; transform: string; family: string; color: string };
const look = (page: Page, selector: string) => page.locator(selector).first().evaluate((el): Look => {
  const cs = getComputedStyle(el);
  return { bg: cs.backgroundColor, radius: cs.borderTopLeftRadius, transform: cs.textTransform, family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim().toLowerCase(), color: cs.color };
});

async function setMode(page: Page, dark: boolean) {
  const rail = page.getByRole("navigation", { name: "Design systems, sections and actions" });
  const btn = rail.getByRole("button", { name: /^Switch to (light|dark) mode$/ });
  const label = await btn.getAttribute("aria-label");
  if ((dark && label === "Switch to dark mode") || (!dark && label === "Switch to light mode")) { await btn.click(); await page.waitForTimeout(400); }
}

for (const sys of SYSTEMS) for (const dark of [false, true]) {
  test(`${sys.label} ${dark ? "dark" : "light"}: compare, playground and specs buttons match the page's own button`, async ({ page }) => {
    await page.goto(`/ui-kit?ds=${sys.id}&c=buttons`, { waitUntil: "networkidle" });
    await setMode(page, dark);
    await page.evaluate(() => document.fonts.ready);
    const own = await look(page, `[data-testid="detail-stage"] ${sys.own}`);

    /* Playground (Overview) */
    const play = page.locator(".kit-play-stage button").first();
    await expect(play).toBeVisible();
    /* Carbon's scoped sheet arrives a moment after the component. */
    await expect.poll(async () => (await look(page, ".kit-play-stage button")).bg, { message: "playground background" }).toBe(own.bg);
    const playLook = await look(page, ".kit-play-stage button");
    expect(playLook.radius, "playground corner").toBe(own.radius);
    expect(playLook.transform, "playground text transform").toBe(own.transform);
    expect(playLook.family, "playground typeface").toBe(own.family);

    /* Specs grid, first Default cell */
    await page.getByRole("tab", { name: "Specs" }).click();
    const cell = page.locator(".dh-matrix tbody tr").first().locator("td").first().locator("button");
    await expect(cell).toBeVisible();
    const cellLook = await cell.evaluate((el): Look => { const cs = getComputedStyle(el); return { bg: cs.backgroundColor, radius: cs.borderTopLeftRadius, transform: cs.textTransform, family: cs.fontFamily.split(",")[0].replace(/["']/g, "").trim().toLowerCase(), color: cs.color }; });
    expect(cellLook.bg, "specs background").toBe(own.bg);
    expect(cellLook.radius, "specs corner").toBe(own.radius);
    expect(cellLook.transform, "specs text transform").toBe(own.transform);

    /* Compare panel for this system */
    await page.getByRole("tab", { name: "Compare" }).click();
    const panel = page.locator(`[data-testid="compare-panels"] li[data-system="${sys.id}"] button`).first();
    await expect(panel).toBeVisible();
    const cmp = await look(page, `[data-testid="compare-panels"] li[data-system="${sys.id}"] button`);
    expect(cmp.bg, "compare background").toBe(own.bg);
    expect(cmp.radius, "compare corner").toBe(own.radius);
    expect(cmp.transform, "compare text transform").toBe(own.transform);
    expect(cmp.family, "compare typeface").toBe(own.family);
    /* And the other four panels are each their own system, not this one's. */
    for (const other of SYSTEMS.filter((o) => o.id !== sys.id)) {
      const o = await look(page, `[data-testid="compare-panels"] li[data-system="${other.id}"] button`);
      expect(o.bg, `${other.label} panel differs from ${sys.label}`).not.toBe(own.bg);
    }
  });
}

test("Material 3 panels are Material, not default MUI", async ({ page }) => {
  await page.goto("/ui-kit?ds=salt&c=buttons", { waitUntil: "networkidle" });
  await setMode(page, false);
  await page.getByRole("tab", { name: "Compare" }).click();
  const m3 = await look(page, '[data-testid="compare-panels"] li[data-system="m3"] button');
  expect(m3.bg).toBe("rgb(103, 80, 164)");
  expect(m3.radius).toBe("9999px");
  expect(m3.transform).toBe("none");
  expect(m3.family).toBe("roboto");
  const salt = await look(page, '[data-testid="compare-panels"] li[data-system="salt"] button');
  expect(salt.bg).toBe("rgb(27, 127, 158)");
  expect(salt.transform).toBe("none");
});
