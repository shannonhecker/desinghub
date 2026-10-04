import { test, expect, type Page } from "@playwright/test";

async function editPerformance(page: Page) {
  await page.route('**/api/health', route => route.fulfill({ json: { anthropicConfigured: false, firebaseConfigured: false } }));
  await page.goto('/builder');
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('button', { name: 'Use the Performance Analytics template' }).click();
  await page.getByRole('button', { name: 'Edit canvas', exact: true }).click();
  await expect(page.locator('.bp-main [data-block-id]')).toHaveCount(6);
}

for (const command of ['add a chart', 'add a data table', 'add an image']) {
  test(`${command} works on a selected template and supports duplicates and undo`, async ({ page }) => {
    await editPerformance(page);
    const blocks = page.locator('.bp-main [data-block-id]');
    const ids = await blocks.evaluateAll(els => els.map(el => el.getAttribute('data-block-id')));
    const originalRow = await page.locator('.dh-grid').first().locator('.ag-row[row-index="0"]').innerText();
    await blocks.first().click({ position: { x: 5, y: 5 } });
    const input = page.getByRole('textbox', { name: 'Chat message input' });
    await input.fill(command);
    await input.press('Enter');
    await expect(blocks).toHaveCount(7);
    await expect(page.getByText('Editing the selected block needs AI.', { exact: false })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Stop generating' })).toHaveCount(0);
    await input.fill(command);
    await input.press('Enter');
    await expect(blocks).toHaveCount(8);
    await page.getByRole('button', { name: /^Undo \(/ }).click();
    await expect(blocks).toHaveCount(7);
    for (const id of ids) await expect(page.locator(`[data-block-id="${id}"]`)).toHaveCount(1);
    await expect(page.locator('.dh-grid').first().locator('.ag-row[row-index="0"]')).toHaveText(originalRow, { useInnerText: true });
  });
}
