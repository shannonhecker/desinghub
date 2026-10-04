import { test, expect } from '@playwright/test';

test('Analytics Home destinations contain data, persist on reload and retain report defaults', async ({ page }) => {
  await page.route('**/api/health', route => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
  await page.goto('/builder');
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('group', { name: 'Template category' }).getByRole('button', { name: 'Finance', exact: true }).click();
  /* Twelve individual finance reports. The linked app is its own action. */
  await expect(page.getByRole('button', { name: /^Use the .* template$/ })).toHaveCount(12);
  await expect(page.getByRole('button', { name: 'Use the Analytics Home template' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open workspace' }).click();
  const nav = page.locator('.bp-sidebar-nav');
  await nav.getByRole('button', { name: 'Configuration', exact: true }).click();
  await expect(page.locator('.bp-main')).toContainText('Report defaults');
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

/* In Edit the sidebar's frame label sits in a reserved band above the nav,
   not on the first item: a click on that item's icon reaches the item. */
test('Edit mode: the first nav item is not covered by the sidebar frame label', async ({ page }) => {
  await page.route('**/api/health', route => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
  await page.goto('/builder');
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('button', { name: 'Open workspace' }).click();
  await page.getByRole('button', { name: 'Edit canvas', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit mode', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const nav = page.locator('.bp-sidebar-nav');
  const first = nav.locator('.bp-nav-item').first();
  await expect(first).toHaveAttribute('title', 'Dashboards');
  const box = (await first.boundingBox())!;
  const tab = (await page.locator('.bp-frame-tab-sidebar').boundingBox())!;
  expect(tab.y + tab.height).toBeLessThanOrEqual(box.y);
  await nav.locator('.bp-nav-item[title="Configuration"]').click({ position: { x: 12, y: box.height / 2 } });
  await expect(page.locator('.bp-main')).toContainText('Report defaults');
  /* Hovering the nav does not lay the sidebar's layout toolbar over it. */
  const toolbar = page.locator('.zone-layout-overlay[data-zone="sidebar"]');
  await nav.locator('.bp-nav-item[title="Approvals"]').hover();
  await expect(toolbar).toHaveCSS('pointer-events', 'none');
  await first.click({ position: { x: 12, y: box.height / 2 } });
  await expect(page.locator('[data-block-id="tpl-home-hero"]')).toBeVisible();
  /* The toolbar opens from the frame label and can be reached from it. */
  await page.locator('.bp-frame-tab-sidebar').hover();
  await expect(toolbar).toHaveCSS('opacity', '1');
  /* One row, opening under the label, never down over the nav. */
  const bar = (await toolbar.boundingBox())!;
  expect(bar.height).toBeLessThanOrEqual(40);
  expect(bar.y + bar.height).toBeLessThanOrEqual(box.y + box.height + 12);
  await toolbar.hover();
  await expect(toolbar).toHaveCSS('pointer-events', 'auto');
});
