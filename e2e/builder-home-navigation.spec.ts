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
  /* Keyboard on the rail: Enter changes the page and focus stays on the item. */
  await page.getByRole('button', { name: 'Preview mode', exact: true }).click();
  await nav.locator('.bp-nav-item[title="Approvals"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.bp-main')).toContainText('A. Okafor');
  await expect(nav.locator('.bp-nav-item[title="Approvals"]')).toBeFocused();
  await page.getByRole('button', { name: 'Edit canvas', exact: true }).click();
  /* Hovering the nav does not lay the sidebar's layout toolbar over it. */
  const toolbar = page.locator('.zone-layout-overlay[data-zone="sidebar"]');
  await nav.locator('.bp-nav-item[title="Approvals"]').hover();
  await expect(toolbar).toHaveCSS('pointer-events', 'none');
  await first.click({ position: { x: 12, y: box.height / 2 } });
  await expect(page.locator('[data-block-id="tpl-home-hero"]')).toBeVisible();
  /* The toolbar opens from the frame label and can be reached from it. */
  await page.locator('.bp-frame-tab-sidebar').hover();
  await expect(toolbar).toHaveCSS('opacity', '1');
  /* One row in the label's band, beside the label: it ends above the first
     nav item, which stays visible and clickable while it is open. */
  const bar = (await toolbar.boundingBox())!;
  const label = (await page.locator('.bp-frame-tab-sidebar').boundingBox())!;
  expect(bar.height).toBeLessThanOrEqual(40);
  expect(bar.y + bar.height).toBeLessThanOrEqual(box.y + 1);
  expect(bar.x).toBeGreaterThanOrEqual(label.x + label.width - 2);
  expect(await first.evaluate((el) => { const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.left + 12, r.top + r.height / 2)); })).toBe(true);
  await toolbar.hover();
  await expect(toolbar).toHaveCSS('pointer-events', 'auto');
});

/* Choosing the page that is already open changes nothing, so it must not
   leave a focus request behind for a later screen to act on. */
test('rail: the already-open page leaves no stray focus request', async ({ page }) => {
  await page.route('**/api/health', route => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
  await page.goto('/builder');
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('button', { name: 'Open workspace', exact: true }).click();
  const nav = page.locator('.bp-sidebar-nav');
  await nav.locator('.bp-nav-item[title="Dashboards"]').click();
  const tabs = page.getByRole('navigation', { name: 'Workspaces' });
  await tabs.getByRole('button', { name: 'Performance', exact: true }).click();
  await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
  await tabs.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.locator('[data-block-id="tpl-home-hero"]')).toBeVisible();
  await expect(nav.locator('.bp-nav-item[title="Dashboards"]')).not.toBeFocused();
});

/* Under the tonal gallery restyle, a selected onboarding choice keeps its
   own filled state: it never reads like the unselected ones. */
test('onboarding: a selected choice stays visibly selected', async ({ page }) => {
  await page.route('**/api/health', route => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
  await page.goto('/builder');
  await page.getByRole('button', { name: /Set it up step by step/ }).click();
  const group = page.locator('.onboarding-radiogroup').first();
  await expect(group).toBeVisible();
  const radios = group.getByRole('radio');
  await radios.nth(1).click();
  const checked = group.locator('[role="radio"][aria-checked="true"]').first();
  await expect(checked).toBeVisible();
  const unchecked = group.locator('[role="radio"][aria-checked="false"]').first();
  const look = (l: typeof checked) => l.evaluate((el) => { const cs = getComputedStyle(el); return `${cs.backgroundColor}|${cs.borderColor}|${cs.fontWeight}`; });
  expect(await look(checked)).not.toBe(await look(unchecked));
  /* A filled state: a visible background, and its text reads on it (AA). */
  const fill = await checked.evaluate((el) => {
    const rgba = (v: string) => (v.match(/[\d.]+/g) ?? []).map(Number);
    const lum = (c: number[]) => { const l = c.slice(0, 3).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }); return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; };
    /* The ground under the chip: the nearest ancestor with a paint. */
    let ground = [11, 17, 32, 1];
    for (let a = el.parentElement; a; a = a.parentElement) { const c = rgba(getComputedStyle(a).backgroundColor); if ((c[3] ?? 1) > 0.5) { ground = c; break; } }
    const bg = rgba(getComputedStyle(el).backgroundColor);
    const alpha = bg[3] ?? 1;
    const painted = [0, 1, 2].map((i) => bg[i] * alpha + ground[i] * (1 - alpha));
    const fg = rgba(getComputedStyle(el).color);
    const fa = fg[3] ?? 1;
    const text = [0, 1, 2].map((i) => fg[i] * fa + painted[i] * (1 - fa));
    const [hi, lo] = [lum(text), lum(painted)].sort((a, b) => b - a);
    return { alpha, contrast: (hi + 0.05) / (lo + 0.05) };
  });
  expect(fill.alpha).toBeGreaterThan(0.1);
  expect(fill.contrast).toBeGreaterThanOrEqual(4.5);
});
