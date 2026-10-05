import { test, expect, type Page } from "@playwright/test";

async function performance(page: Page) {
  await page.goto("/builder");
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible();
  await page.getByRole("button", { name: /Browse templates/ }).click();
  await page.getByRole("button", { name: "Use the Performance Analytics template" }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible();
}

test("Present block wrappers do not nest buttons around report controls", async ({ page }) => {
  await performance(page);
  await expect(page.locator('.present-stage [data-block-id][role="button"]')).toHaveCount(0);
  await expect(page.locator('.present-stage [data-block-id][tabindex="0"]')).toHaveCount(0);
});

test("expanded panel receives keyboard focus and restores its opener", async ({ page }) => {
  await performance(page);
  const opener = page.getByRole("button", { name: "Expand Performance results", exact: true });
  await opener.focus();
  await page.keyboard.press("Enter");
  const expanded = page.locator(".dh-expand-inner");
  await expect(expanded).toBeVisible();
  await expect.poll(() => expanded.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Shift+Tab");
  await expect(expanded.locator(".ag-cell:focus")).toHaveCount(1);
  await page.keyboard.press("Tab");
  await expect(expanded.getByRole("combobox", { name: "View by" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(expanded).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("Fluent edit canvas remains still with both panels open", async ({ page }) => {
  await performance(page);
  await page.getByRole("button", { name: /^Design system:/ }).click();
  await page.getByText("Fluent 2", { exact: true }).last().click();
  await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
  const showLibrary = page.getByRole("button", { name: "Show component library" });
  if (await showLibrary.isVisible()) await showLibrary.click();
  await page.locator('.bp-main [data-block-id]').first().click({ position: { x: 5, y: 5 } });
  await page.mouse.move(0, 0);
  for (const width of [1440, 1512, 1920, 768]) {
    await page.setViewportSize({ width, height: 900 });
    if (width >= 1440) {
      const tool = page.getByRole("button", { name: "Expand Performance results", exact: true });
      await expect.poll(async () => (await tool.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(23.9);
    }
    // Allow the deliberate device transition to settle before measuring idle frames.
    await page.waitForTimeout(1200);
    const ranges = await page.locator(".bp-device-frame").evaluate(async el => {
      const samples: number[][] = [];
      for (let i = 0; i < 120; i++) {
        await new Promise(requestAnimationFrame);
        samples.push([el, ...el.querySelectorAll(".dh-panel, .highcharts-container")].flatMap(node => {
          const r = node.getBoundingClientRect();
          return [r.x, r.y, r.width, r.height];
        }));
      }
      if (samples.some(s => s.length !== samples[0].length)) return [Infinity];
      return samples[0].map((_, i) => Math.max(...samples.map(s => s[i])) - Math.min(...samples.map(s => s[i])));
    });
    expect(Math.max(...ranges), `idle geometry at ${width}px`).toBeLessThanOrEqual(1);
  }
});

/* The Edit-mode shake (owner, 5 Oct): with the chat and the component
   library both open, the frame fit read a stage width that its own vertical
   scrollbar had just narrowed, refit, lost the scrollbar, and refit again
   every frame. The stage now reserves the gutter and never scrolls sideways;
   this measures the whole state at the owner's widths: idle, hovering a
   block, and with a block selected, three seconds each. */
test("Edit canvas is still with the library showing, at every wide width, idle, hovering and selected", async ({ page }) => {
  test.setTimeout(8 * 60 * 1000);
  await page.goto("/builder");
  await expect(page.getByRole("textbox", { name: "Chat message input" })).toBeVisible();
  await page.getByRole("button", { name: /Browse templates/ }).click();
  await page.getByRole("button", { name: "Use the Analytics Dashboard template" }).click();
  await expect(page.locator(".present-stage .bp-main [data-block-id]").first()).toBeVisible();
  await page.getByRole("button", { name: "Edit canvas", exact: true }).click();
  const showLibrary = page.getByRole("button", { name: "Show component library" });
  if (await showLibrary.isVisible()) await showLibrary.click();
  await expect(page.locator(".lib-browser")).toBeVisible();
  const still = async (label: string) => {
    const result = await page.locator(".bp-viewport-wrapper").evaluate(async (stage) => {
      const frame = stage.querySelector(".bp-device-frame") as HTMLElement;
      const nodes = [frame, ...stage.querySelectorAll(".bp-main [data-block-id]")].slice(0, 8);
      const read = () => nodes.flatMap((n) => { const r = n.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
      const first = read();
      let moved = 0;
      const zooms = new Set<string>();
      const t0 = Date.now();
      while (Date.now() - t0 < 3000) {
        await new Promise(requestAnimationFrame);
        zooms.add(frame.getAttribute("data-frame-zoom") ?? "");
        const now = read();
        for (let i = 0; i < now.length; i++) moved = Math.max(moved, Math.abs(now[i] - first[i]));
      }
      return {
        moved,
        zooms: zooms.size,
        sideways: stage.scrollWidth - stage.clientWidth,
        gutter: getComputedStyle(stage).scrollbarGutter,
      };
    });
    expect(result.moved, `${label}: geometry moved`).toBeLessThanOrEqual(0.5);
    expect(result.zooms, `${label}: one frame zoom`).toBe(1);
    expect(result.sideways, `${label}: no sideways overflow`).toBeLessThanOrEqual(0);
    expect(result.gutter, `${label}: the scrollbar gutter is reserved`).toBe("stable");
  };
  for (const width of [1512, 1728, 1920, 2000]) {
    await page.setViewportSize({ width, height: 900 });
    await page.mouse.move(2, 2);
    await page.waitForTimeout(1200);
    await still(`${width} idle`);
    const block = page.locator('[data-block-id^="tpl-ad-kpi-2-"]').first();
    const box = (await block.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(300);
    await still(`${width} hovering`);
    await block.focus();
    await block.press("Enter");
    await page.waitForTimeout(600);
    await still(`${width} selected`);
    await page.keyboard.press("Escape");
  }
});

test("report grid uses arrow navigation and Tab exits the cells", async ({ page }) => {
  await performance(page);
  const grid = page.locator('.dh-grid').first();
  const first = grid.locator('.ag-row[row-index="0"] .ag-cell').first();
  await first.click();
  await page.keyboard.press("ArrowRight");
  await expect(grid.locator('.ag-cell:focus')).toHaveAttribute('col-id', 'marketValue');
  await page.keyboard.press("Tab");
  await expect.poll(() => grid.evaluate(el => el.contains(document.activeElement))).toBe(false);
});

/* Selecting a row re-reads the page. It must not take the focused cell with
   it: the grid used to redraw every row a moment after the selection, which
   dropped focus to the page, so the next arrow key did nothing and Tab went
   back into the grid instead of leaving it. */
test("selecting a row keeps focus on its cell; arrows still move and one Tab leaves the grid", async ({ page }) => {
  await performance(page);
  const grid = page.locator('.dh-grid.dh-grid-selectable').first();
  const inGrid = () => grid.evaluate(el => el.contains(document.activeElement));
  /* The focused cell is marked, so "still focused" means the very same element. */
  const mark = (name: string) => page.evaluate(n => { (document.activeElement as HTMLElement).dataset.probe = n; }, name);
  const focusedMark = () => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.probe ?? null);
  const selectedRows = () => grid.locator('.ag-row.dh-grid-row-selected').evaluateAll(rows => rows.map(r => r.getAttribute("row-index")).join(","));

  /* By pointer: the click selects the row and focuses its cell. */
  await grid.locator('.ag-row[row-index="1"] .ag-cell').first().click();
  await expect(grid.locator('.ag-row[row-index="1"] .ag-cell:focus')).toHaveCount(1);
  await mark("clicked");
  await expect(grid.locator('.ag-row.dh-grid-row-selected')).toHaveCount(1);
  /* Long after the selection has been drawn, the same cell is still focused. */
  await page.waitForTimeout(500);
  expect(await focusedMark()).toBe("clicked");
  await page.keyboard.press("ArrowRight");
  await expect(grid.locator('.ag-row[row-index="1"] .ag-cell:focus')).toHaveAttribute('col-id', 'marketValue');
  await page.keyboard.press("Tab");
  await expect.poll(inGrid).toBe(false);
  expect(await page.evaluate(() => document.activeElement !== document.body), "Tab lands on a control").toBe(true);

  /* By keyboard: Enter on a focused cell changes the selection and stays there. */
  await page.keyboard.press("Shift+Tab");
  await expect(grid.locator('.ag-cell:focus')).toHaveCount(1);
  await mark("entered");
  const before = await selectedRows();
  await page.keyboard.press("Enter");
  await expect.poll(selectedRows).not.toBe(before);
  await page.waitForTimeout(500);
  expect(await focusedMark()).toBe("entered");
  await page.keyboard.press("Tab");
  await expect.poll(inGrid).toBe(false);
  expect(await page.evaluate(() => document.activeElement !== document.body), "Tab lands on a control").toBe(true);
});

test("device frame starts with concrete dimensions", async ({ page }) => {
  const warnings: string[] = [];
  page.on("console", msg => { if (/not an animatable value/.test(msg.text())) warnings.push(msg.text()); });
  await performance(page);
  expect(warnings).toEqual([]);
});

test("grid headers remain reachable for keyboard sorting", async ({ page }) => {
  await performance(page);
  const grid = page.locator('.dh-grid').nth(1);
  await grid.locator('.ag-row[row-index="0"] .ag-cell').first().click();
  await page.keyboard.press("ArrowUp");
  const header = grid.locator('.ag-header-cell').first();
  await expect(header).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(header).toHaveAttribute('aria-sort', 'ascending');
  await page.keyboard.press("Tab");
  await expect.poll(() => grid.evaluate(el => el.contains(document.activeElement))).toBe(false);
});

test("expanded chart keyboard navigation reaches its data table", async ({ page }) => {
  await performance(page);
  await page.getByRole('button', { name: 'Expand Returns', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Returns expanded', exact: true });
  await expect(dialog).toBeFocused();
  let reachedTable = false;
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    reachedTable = await dialog.locator('.dh-panel-table').evaluate(el => el.contains(document.activeElement));
    if (reachedTable) break;
  }
  expect(reachedTable).toBe(true);
});
