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
  const menu = page.getByRole('navigation', { name: 'Pages' }).getByRole('combobox');
  await expect(menu).toBeVisible();
  for (const [label, text] of [['Configuration', 'Report defaults'], ['Approvals', 'A. Okafor'], ['Reports', 'SI Portfolio Report, December'], ['Dashboards', 'Analytics Dashboard']] as const) {
    await menu.selectOption({ label });
    await expect(page.locator('.bp-main')).toContainText(text);
  }
  const bar = (await page.getByRole('toolbar', { name: 'Present mode controls' }).boundingBox())!;
  expect(bar.x).toBeGreaterThanOrEqual(0);
  expect(bar.x + bar.width).toBeLessThanOrEqual(375);
  await expect(page.getByRole('button', { name: 'Edit canvas', exact: true })).toBeInViewport({ ratio: 1 });
});
