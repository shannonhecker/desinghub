import { test, expect, type Page } from '@playwright/test';

/* Individual templates and the connected workspace are separate choices, on
   every path that offers templates; and no sidebar item opens a blank page. */

async function open(page: Page) {
  await page.route('**/api/health', route => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
  await page.goto('/builder');
}

const homeNav = (page: Page) => page.locator('.bp-sidebar-nav').getByRole('button', { name: 'Configuration', exact: true });

test('gallery: an individual card opens that report alone', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('group', { name: 'Template category' }).getByRole('button', { name: 'Finance', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Use the Analytics Home template' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Use the Performance Analytics template' }).click();
  await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
  await expect(homeNav(page)).toHaveCount(0);
  /* No links to other templates: the tab strip holds this report only, and
     choosing it keeps this report on the canvas. */
  const tabs = page.getByRole('navigation', { name: 'Workspaces' }).getByRole('button');
  await expect(tabs).toHaveText(['Performance']);
  await tabs.first().click();
  await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
});

test('gallery: a Sustainable Investment card is that one report, with no sibling links', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('button', { name: 'Use the ESG Analytics template' }).click();
  await expect(page.locator('.bp-main [data-block-id]').first()).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Workspaces' }).getByRole('button')).toHaveText(['Sustainable Investment']);
  const items = page.locator('.bp-sidebar-nav .bp-nav-item');
  await expect(items).toHaveCount(1);
  await expect(items.first()).toHaveAttribute('aria-current', 'page');
  const first = await page.locator('.bp-main [data-block-id]').first().getAttribute('data-block-id');
  await items.first().click();
  await expect(page.locator(`.bp-main [data-block-id="${first}"]`)).toBeVisible();
});

test('gallery: the workspace action opens the linked app', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Browse templates/ }).click();
  /* The first choice in the gallery, ahead of the individual templates. */
  const option = page.getByRole('region', { name: 'Connected analytics workspace' });
  const optionBox = (await option.boundingBox())!;
  const firstCard = (await page.getByRole('list', { name: 'Starting templates' }).boundingBox())!;
  expect(optionBox.y + optionBox.height).toBeLessThanOrEqual(firstCard.y);
  const workspace = option.getByRole('button', { name: 'Open workspace', exact: true });
  await expect(workspace).toHaveAccessibleDescription('Connected analytics workspace Home, reports and settings, linked as one app.');
  await workspace.click();
  await expect(page.locator('[data-block-id="tpl-home-hero"]')).toBeVisible();
  await expect(homeNav(page)).toBeVisible();
});

/* The category chips narrow the individual cards only: the workspace is not
   one of them, so it and the source credit stay put under any filter. */
test('gallery: a category filter narrows the cards and leaves the workspace option in place', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Browse templates/ }).click();
  const use = page.getByRole('button', { name: /^Use the .* template$/ });
  await expect(use).toHaveCount(17);
  await page.getByRole('group', { name: 'Template category' }).getByRole('button', { name: 'General', exact: true }).click();
  await expect(use).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Use the Settings Page template' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open workspace', exact: true })).toBeVisible();
  const credit = page.locator('.template-source-note');
  await expect(credit.getByRole('link', { name: 'Analytics Dashboard' })).toBeVisible();
  await expect(credit.getByRole('link', { name: 'FX Execution Analytics' })).toBeVisible();
});

/* Whole cards: none is cut by the row's edge, descriptions are not
   truncated, and previous / next never cover a card. */
for (const [name, width, height, perView] of [['desktop', 1440, 900, 3], ['phone', 375, 812, 1]] as const) {
  test(`gallery layout on a ${name}: whole cards, full descriptions, edges shared with the composer`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await open(page);
    await page.getByRole('button', { name: /Browse templates/ }).click();
    const row = page.getByRole('list', { name: 'Starting templates' });
    await expect(row).toBeVisible();
    const report = await row.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cards = [...el.querySelectorAll<HTMLElement>('.template-card')].map((c) => c.getBoundingClientRect());
      const visible = cards.filter((c) => c.right > r.left + 1 && c.left < r.right - 1);
      const cr = document.querySelector<HTMLElement>('textarea[aria-label="Chat message input"]')!.closest<HTMLElement>('.input-box')!.getBoundingClientRect();
      const arrows = [...document.querySelectorAll<HTMLElement>('.template-gallery-arrow')].map((a) => a.getBoundingClientRect());
      return {
        visible: visible.length,
        sliced: visible.filter((c) => c.left < r.left - 1 || c.right > r.right + 1).length,
        truncated: [...el.querySelectorAll<HTMLElement>('.template-card-desc, .template-card-label')].filter((d) => d.scrollHeight > d.clientHeight + 1 || d.scrollWidth > d.clientWidth + 1).length,
        heights: new Set(cards.map((c) => Math.round(c.height))).size,
        edges: [Math.abs(r.left - cr.left), Math.abs(r.right - cr.right)],
        arrowsOverCards: arrows.filter((a) => a.bottom > r.top + 1 && a.top < r.bottom - 1).length,
      };
    });
    expect(report.visible).toBe(perView);
    expect(report.sliced).toBe(0);
    expect(report.truncated).toBe(0);
    expect(report.heights).toBe(1);
    expect(Math.max(...report.edges)).toBeLessThanOrEqual(1);
    expect(report.arrowsOverCards).toBe(0);
    /* Next shows the following whole view. */
    await page.getByRole('button', { name: 'Scroll to more templates' }).click();
    await expect.poll(() => row.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const cards = [...el.querySelectorAll<HTMLElement>('.template-card')].map((c) => c.getBoundingClientRect()).filter((c) => c.right > r.left + 1 && c.left < r.right - 1);
      return cards.every((c) => c.left >= r.left - 1 && c.right <= r.right + 1) && el.scrollLeft > 0;
    })).toBe(true);
    /* At rest the credit sits clear of the thread's bottom fade, fully
       opaque: its bottom is above the masked band. */
    const clear = await page.evaluate(() => {
      const scroll = document.querySelector<HTMLElement>('.chat-scroll')!;
      const mask = getComputedStyle(scroll).maskImage;
      const fade = mask && mask !== 'none' ? parseFloat(getComputedStyle(scroll).paddingBottom) : 0;
      const credit = document.querySelector<HTMLElement>('.template-source-note')!.getBoundingClientRect();
      return credit.bottom <= scroll.getBoundingClientRect().bottom - fade + 0.5;
    });
    expect(clear).toBe(true);
    /* Both credit links can be reached. */
    for (const link of ['Analytics Dashboard', 'FX Execution Analytics']) {
      const a = page.locator('.template-source-note').getByRole('link', { name: link });
      await a.scrollIntoViewIfNeeded();
      await expect(a).toBeInViewport({ ratio: 1 });
    }
  });
}

test('chat: a typed request opens the named template', async ({ page }) => {
  await open(page);
  const input = page.getByRole('textbox', { name: 'Chat message input' });
  await input.fill('use the analytics home template');
  await input.press('Enter');
  await expect(page.locator('[data-block-id="tpl-home-hero"]')).toBeVisible();
  await expect(homeNav(page)).toBeVisible();
});

for (const [template, items] of [
  ['Analytics Dashboard', ['Events', 'Users', 'Funnels', 'Retention', 'Revenue', 'Settings', 'Overview']],
  ['Settings Page', ['Notifications', 'Members', 'Billing', 'Security', 'Integrations', 'Profile']],
  ['CRM Contacts', ['Companies', 'Deals', 'Activities', 'Reports', 'All Contacts']],
  ['Login → Dashboard', ['Create account', 'Help', 'Sign in']],
] as const) {
  test(`navigation: every ${template} sidebar item opens a page with content`, async ({ page }) => {
    await open(page);
    await page.getByRole('button', { name: /Browse templates/ }).click();
    await page.getByRole('button', { name: `Use the ${template} template` }).click();
    const nav = page.locator('.bp-sidebar-nav');
    const seen = new Set<string>();
    for (const label of items) {
      const item = nav.getByRole('button', { name: label, exact: true });
      await item.click();
      await expect(item).toHaveAttribute('aria-current', 'page');
      const blocks = page.locator('.bp-main [data-block-id]');
      await expect(blocks.first()).toBeVisible();
      expect(await blocks.count()).toBeGreaterThan(2);
      /* A different page each time, not the same body. */
      const first = await blocks.first().getAttribute('data-block-id');
      expect(seen.has(first!)).toBe(false);
      seen.add(first!);
    }
  });
}

/* A phone opens the phone frame; every page is reachable without the sidebar,
   and the Present bar fits with its primary action in view. */
test('phone: page menu reaches every workspace page and the Present bar fits', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page);
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('button', { name: 'Open workspace', exact: true }).click();
  await expect(page.locator('[data-block-id="tpl-home-hero"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mobile viewport' })).toHaveAttribute('aria-pressed', 'true');
  const pages = page.getByRole('navigation', { name: 'Pages' });
  const button = pages.getByRole('button', { name: /^Page/ });
  await expect(button).toBeVisible();
  /* The pages appear once: no rail beside the menu. */
  await expect(page.locator('.bp-sidebar')).toHaveCount(0);
  for (const [label, text] of [['Configuration', 'Report defaults'], ['Approvals', 'A. Okafor'], ['Reports', 'SI Portfolio Report, December'], ['Dashboards', 'Analytics Dashboard']] as const) {
    await button.click();
    await pages.getByRole('option', { name: label, exact: true }).click();
    await expect(page.locator('.bp-main')).toContainText(text);
    await expect(button).toHaveAccessibleName(`Page ${label}`);
  }
  /* Keyboard: arrows only move; the page changes on Enter, focus comes back
     to the menu, and Escape closes without changing anything. */
  await button.focus();
  await page.keyboard.press('ArrowDown');
  await expect(pages.getByRole('listbox')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.bp-main')).toContainText('Analytics Dashboard');
  await page.keyboard.press('Escape');
  await expect(pages.getByRole('listbox')).toHaveCount(0);
  await expect(button).toBeFocused();
  await expect(button).toHaveAccessibleName('Page Dashboards');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('.bp-main')).toContainText('Report defaults');
  await expect(pages.getByRole('button', { name: /^Page/ })).toBeFocused();
  const bar = (await page.getByRole('toolbar', { name: 'Present mode controls' }).boundingBox())!;
  expect(bar.x).toBeGreaterThanOrEqual(0);
  expect(bar.x + bar.width).toBeLessThanOrEqual(375);
  await expect(page.getByRole('button', { name: 'Edit canvas', exact: true })).toBeInViewport({ ratio: 1 });
});

/* Every value on the workspace's own pages shows in full at 1440 and on a
   tablet: no cell ends in an ellipsis. */
for (const width of [1440, 768]) {
  test(`workspace pages: no grid cell is truncated at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await open(page);
    await page.getByRole('button', { name: /Browse templates/ }).click();
    await page.getByRole('button', { name: 'Open workspace', exact: true }).click();
    await expect(page.locator('[data-block-id="tpl-home-hero"]')).toBeVisible();
    for (const label of ['Configuration', 'Approvals', 'Reports']) {
      await page.locator('.bp-sidebar-nav').getByRole('button', { name: label, exact: true }).click();
      const cells = page.locator('.bp-main .dh-grid .ag-cell, .bp-main .dh-grid .ag-header-cell-text');
      await expect(cells.first()).toBeVisible();
      const cut = await cells.evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent));
      expect(cut, `${label} at ${width}px`).toEqual([]);
    }
  });
}

/* The phone Page menu's label is never clipped (descenders included) in any
   design system or mode, and the light top bar's menu icon and logo keep
   contrast against the bar. */
const SYSTEMS = ['Salt DS', 'Material 3', 'Fluent 2', 'Carbon', 'uoaui'];
test('phone: the Page menu label fits its line box in every system, light and dark', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page);
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('button', { name: 'Open workspace', exact: true }).click();
  const pages = page.getByRole('navigation', { name: 'Pages' });
  for (const system of SYSTEMS) {
    await page.getByRole('button', { name: /^Design system:/ }).click();
    await page.getByRole('listbox', { name: 'Design system' }).getByRole('option', { name: system, exact: true }).click();
    await expect(page.getByRole('button', { name: /^Design system:/ })).toHaveAccessibleName(new RegExp(`^Design system: ${system}\\.`));
    for (const mode of ['light', 'dark']) {
      const toggle = page.getByRole('button', { name: `Switch to ${mode} mode` });
      if (await toggle.count()) await toggle.click();
      for (const label of ['Configuration', 'Approvals', 'Reports', 'Dashboards']) {
        await pages.getByRole('button', { name: /^Page/ }).click();
        const option = pages.getByRole('option', { name: label, exact: true });
        const optionFits = await option.evaluate((el) => el.scrollHeight <= el.clientHeight);
        await option.click();
        const value = pages.locator('.bp-page-menu-value');
        await expect(value).toHaveText(label);
        const fits = await value.evaluate((el) => el.scrollHeight <= el.clientHeight);
        expect(fits && optionFits, `${system} ${mode} ${label}`).toBe(true);
      }
    }
  }
});

test('light builder chrome: the top bar menu icon and logo stand out from the bar', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page);
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('button', { name: 'Open workspace', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.getByRole('button', { name: 'Edit canvas', exact: true }).click();
  await expect(page.locator('.builder-shell')).toHaveClass(/builder-light/);
  const result = await page.evaluate(async () => {
    const lum = (r: number, g: number, b: number) => {
      const c = [r, g, b].map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const rgba = (s: string) => (s.match(/[\d.]+/g) ?? []).map(Number);
    /* The bar over the page ground, as painted. */
    const ground = rgba(getComputedStyle(document.body).backgroundColor);
    const barC = rgba(getComputedStyle(document.querySelector('.top-bar')!).backgroundColor);
    const a = barC[3] ?? 1;
    const bar = [0, 1, 2].map((i) => barC[i] * a + (ground[i] ?? 255) * (1 - a));
    const barL = lum(bar[0], bar[1], bar[2]);
    const icon = rgba(getComputedStyle(document.querySelector('.sidebar-toggle-btn')!).color);
    const ia = icon[3] ?? 1;
    const iconL = lum(...([0, 1, 2].map((i) => icon[i] * ia + bar[i] * (1 - ia)) as [number, number, number]));
    /* The logo as drawn: its pixels through the element's own filter. */
    const img = document.querySelector<HTMLImageElement>('.uoaui-logo-img')!;
    const cs = getComputedStyle(img);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.filter = cs.filter === 'none' ? 'none' : cs.filter;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let sum = 0, n = 0;
    for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 128) { sum += lum(data[i], data[i + 1], data[i + 2]); n++; }
    return { icon: ratio(iconL, barL), logo: ratio(sum / n, barL) };
  });
  expect(result.icon).toBeGreaterThanOrEqual(3);
  expect(result.logo).toBeGreaterThanOrEqual(3);
});

/* The sideways-scroll fade belongs to the workspace's own lists only, and it
   lifts once the last column is in view. A template canvas's grids never
   change. */
test('phone: workspace lists fade their right edge until scrolled to the end; template grids never do', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await open(page);
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('button', { name: 'Open workspace', exact: true }).click();
  const pages = page.getByRole('navigation', { name: 'Pages' });
  await pages.getByRole('button', { name: /^Page/ }).click();
  await pages.getByRole('option', { name: 'Approvals', exact: true }).click();
  const grid = page.locator('[data-block-id="tpl-home-approvals-grid"] .dh-grid');
  await expect(grid).toHaveClass(/dh-grid-more-right/);
  /* The scrollbar (a desktop visitor drags it): to the end lifts the fade,
     back to the start brings it back. */
  const bar = grid.locator('.ag-body-horizontal-scroll-viewport');
  /* The scrollbar, as a desktop visitor in the phone frame uses it. For a
     moment after a page opens AG Grid does not yet sync its scrollbar to the
     rows (also true on origin/main, without the fade); attempts a second
     apart stand in for a person's drag, which lands later. */
  const rows = grid.locator('.ag-center-cols-viewport');
  const scrollBarTo = async (end: boolean) => {
    await expect(async () => {
      /* Each attempt moves the thumb (the same position again fires no event). */
      await bar.evaluate((el, toEnd) => { el.scrollLeft = toEnd ? 0 : el.scrollWidth; }, end);
      await page.waitForTimeout(100);
      await bar.evaluate((el, toEnd) => { el.scrollLeft = toEnd ? el.scrollWidth : 0; }, end);
      expect(await rows.evaluate((el, toEnd) => (toEnd ? el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 : el.scrollLeft === 0), end)).toBe(true);
    }).toPass({ intervals: [1_000], timeout: 15_000 });
  };
  await scrollBarTo(true);
  await expect(grid).not.toHaveClass(/dh-grid-more-right/);
  await scrollBarTo(false);
  await expect(grid).toHaveClass(/dh-grid-more-right/);
  /* A wheel or trackpad over the rows, as a reader would. */
  await rows.hover();
  for (let i = 0; i < 4; i++) await page.mouse.wheel(400, 0);
  await expect(grid).not.toHaveClass(/dh-grid-more-right/);
  /* A finance template on the same phone: its grids scroll, never fade. */
  await page.getByRole('navigation', { name: 'Workspaces' }).getByRole('button', { name: 'Performance', exact: true }).click();
  await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
  await expect(page.locator('.bp-main .dh-grid')).not.toHaveCount(0);
  await expect(page.locator('.bp-main .dh-grid.dh-grid-more-right')).toHaveCount(0);
});
