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
  await page.getByRole('button', { name: 'Use the Performance Analytics template' }).click();
  await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
  await expect(homeNav(page)).toHaveCount(0);
});

test('gallery: the workspace action opens the linked app', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Browse templates/ }).click();
  const workspace = page.getByRole('button', { name: 'Open connected analytics workspace' }).last();
  await expect(workspace).toHaveAccessibleDescription('Home, reports and settings, linked as one app');
  await workspace.click();
  await expect(page.locator('[data-block-id="tpl-home-hero"]')).toBeVisible();
  await expect(homeNav(page)).toBeVisible();
});

test('gallery: the General filter hides the finance workspace and its source credit', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await expect(page.getByText('Finance templates are adapted from', { exact: false })).toBeVisible();
  await page.getByRole('group', { name: 'Template category' }).getByRole('button', { name: 'General', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Open connected analytics workspace' })).toHaveCount(0);
  await expect(page.getByText('Finance templates are adapted from', { exact: false })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Use the Settings Page template' })).toBeVisible();
});

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
