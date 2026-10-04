import { test, expect } from "@playwright/test";
import { compressToEncodedURIComponent } from "lz-string";

const hash = compressToEncodedURIComponent(JSON.stringify({
  v: 1, designSystem: "salt", mode: "light", density: "medium",
  canvasSpacing: "tight", deviceMode: "desktop", themeKey: null, activeTemplateId: null,
  headerBlocks: [], sidebarBlocks: [], footerBlocks: [],
  blocks: [{ id: "shared-title", type: "PageTitle", props: { text: "Replacement canvas" } }],
})).replace(/\+/g, "_").replace(/\$/g, "~");

for (const accept of [false, true]) {
  test(`shared link ${accept ? "replaces only after confirmation" : "preserves the current canvas when cancelled"}`, async ({ page }) => {
    await page.goto("/builder");
    await page.getByRole("button", { name: /Browse templates/ }).click();
    await page.getByRole("button", { name: "Use the Performance Analytics template" }).click();
    await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
    let confirmations = 0;
    page.on("dialog", async dialog => {
      expect(dialog.type()).toBe("confirm");
      expect(dialog.message()).toContain("Replace your current canvas");
      confirmations++;
      if (accept) await dialog.accept();
      else await dialog.dismiss();
    });
    // pagehide flushes the existing session; the link must protect it on reload too.
    await page.goto(`/builder?shared=${hash}`);
    await expect(page).toHaveURL(/\/builder$/);
    expect(confirmations).toBe(1);
    if (accept) {
      await expect(page.locator('[data-block-id="shared-title"]')).toContainText("Replacement canvas");
      await expect(page.locator('[data-block-id="tpl-perf-results"]')).toHaveCount(0);
    } else {
      await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
      await expect(page.locator('[data-block-id="shared-title"]')).toHaveCount(0);
      await page.reload();
      await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
    }
  });
}

test("a shared canvas opens in a fresh browser without replacement confirmation", async ({ page }) => {
  let confirmations = 0;
  page.on("dialog", async dialog => { confirmations++; await dialog.dismiss(); });
  await page.goto(`/builder?shared=${hash}`);
  await expect(page.locator('[data-block-id="shared-title"]')).toContainText("Replacement canvas");
  expect(confirmations).toBe(0);
});

test("read-only pop-out does not replace the saved editor session", async ({ page }) => {
  await page.goto("/builder");
  await page.getByRole("button", { name: /Browse templates/ }).click();
  await page.getByRole("button", { name: "Use the Performance Analytics template" }).click();
  await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
  let confirmations = 0;
  page.on("dialog", async dialog => { confirmations++; await dialog.dismiss(); });
  await page.goto(`/builder?preview=1&shared=${hash}`);
  await expect(page.locator('[data-block-id="shared-title"]')).toContainText("Replacement canvas");
  expect(confirmations).toBe(0);
  await page.goto("/builder");
  await expect(page.locator('[data-block-id="tpl-perf-results"]')).toBeVisible();
});
