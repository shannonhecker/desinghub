import { test, expect } from '@playwright/test';

test('Analytics Home destinations contain data, persist on reload and retain report defaults', async ({ page }) => {
  await page.route('**/api/health', route => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
  await page.goto('/builder');
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('group', { name: 'Template category' }).getByRole('button', { name: 'Finance', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Use the .* template$/ })).toHaveCount(13);
  await page.getByRole('button', { name: 'Use the Analytics Home template' }).click();
  const nav = page.locator('.bp-sidebar-nav');
  await nav.getByRole('button', { name: 'Configuration', exact: true }).click();
  await expect(page.locator('.bp-main')).toContainText('Dashboard settings');
  await page.getByRole('combobox', { name: 'Base currency', exact: true }).click();
  await page.getByRole('option', { name: 'USD', exact: true }).click();
  await nav.getByRole('button', { name: 'Approvals', exact: true }).click();
  await expect(page.locator('.bp-main')).toContainText('A. Okafor');
  await expect(page.locator('.bp-main')).toContainText('Pending');
  await nav.getByRole('button', { name: 'Reports', exact: true }).click();
  await expect(page.locator('.bp-main')).toContainText('SI Portfolio Report, December');
  await page.reload();
  await expect(page.locator('.bp-main')).toContainText('SI Portfolio Report, December');
  await page.getByRole('button', { name: 'Preview mode', exact: true }).click();
  await nav.getByRole('button', { name: 'Dashboards', exact: true }).click();
  await expect(page.locator('[data-block-id="tpl-home-hero"]')).toBeVisible();
  await page.locator('[data-block-id="tpl-home-launcher-2"]').getByRole('button', { name: 'Open report' }).click();
  await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Currency', exact: true })).toContainText('USD');
  /* The setting outlives a reload on the report and comes back to Configuration. */
  await page.reload();
  await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
  await page.getByRole('button', { name: 'Preview mode', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Currency', exact: true })).toContainText('USD');
  await page.getByRole('navigation', { name: 'Workspaces' }).getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.locator('[data-block-id="tpl-home-hero"]')).toBeVisible();
  await nav.getByRole('button', { name: 'Configuration', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Base currency', exact: true })).toContainText('USD');
});
