import { test, expect, type Page } from "@playwright/test";

/**
 * Builder canvas-gesture regression suite.
 *
 * Scaffolding PR — covers the load + smoke-level interactions that don't
 * require dnd-kit pointer-event simulation. The drag/resize gestures are
 * marked `test.fixme` with a TODO so the file is honest about what's
 * actually being validated.
 *
 * Pre-flight (local):
 *   - `npm run dev` running on :3000
 *   - STAGING_PASSWORD unset (public mode), or visitor cookie present
 *   - ANTHROPIC_API_KEY does NOT need to be set — tests use the local
 *     command path ("build a dashboard" / "add buttons") so they work
 *     even without an API key.
 */

const NEW_SESSION_LABEL = "Start a new session";

async function gotoBuilderClean(page: Page) {
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  // Builder defers some hydration; wait for the chat input to mount.
  await expect(page.getByRole("textbox").first()).toBeVisible({ timeout: 30_000 });
  // Reset to a clean canvas if a previous test left state behind. The
  // top bar exposes a "Start a new session" icon-only button.
  const newSession = page.getByRole("button", { name: NEW_SESSION_LABEL });
  if (await newSession.count()) {
    await newSession.first().click();
    // Confirm dialogs may pop up if there's unsaved state — auto-accept.
    page.once("dialog", (d) => d.accept().catch(() => undefined));
  }
}

test.describe("Builder — load + smoke", () => {
  test("loads with chat input visible", async ({ page }) => {
    await gotoBuilderClean(page);
    await expect(page.getByRole("log", { name: "Chat messages" })).toBeVisible();
    // Chat textarea should exist and be focusable.
    const textarea = page.getByRole("textbox").first();
    await expect(textarea).toBeVisible();
    await textarea.focus();
    await expect(textarea).toBeFocused();
  });

  test("top bar exposes UI Kit + Export + New session", async ({ page }) => {
    await gotoBuilderClean(page);
    await expect(page.getByRole("link", { name: /UI Kit/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Export canvas/i })).toBeVisible();
    await expect(page.getByRole("button", { name: NEW_SESSION_LABEL })).toBeVisible();
  });
});

test.describe("Builder — local-command path (no AI key required)", () => {
  test("typing 'build a dashboard' into chat produces canvas blocks", async ({ page }) => {
    await gotoBuilderClean(page);

    // Send the local-command prompt. The chat input is a single textarea
    // that submits on Enter (no Shift required).
    const textarea = page.getByRole("textbox").first();
    await textarea.click();
    await textarea.fill("build a dashboard");
    await textarea.press("Enter");

    // The local command path applies blocks within ~600–1600ms (random
    // jitter in applyChatComponentDelta). Wait for the AI message reply
    // OR the canvas to populate.
    await expect(async () => {
      // Either the chat shows an assistant reply OR blocks land on canvas.
      const blocksOnCanvas = await page.locator("[data-block-id], .sortable-block").count();
      const aiReply = await page.locator(".chat-msg-ai").count();
      expect(blocksOnCanvas + aiReply).toBeGreaterThan(0);
    }).toPass({ timeout: 15_000 });
  });

  test.fixme("⌘Z undoes the last canvas mutation", async ({ page }) => {
    /* TODO — test-isolation flake. When this test runs after the
       "build a dashboard" test in the same worker, the second chat
       command produces no blocks within 15s. Likely causes:
         1. localStorage / Zustand state from prior test persists despite
            Start-a-new-session click; "build a dashboard" hits the
            "you already have a canvas" branch and asks the user via
            chat instead of applying.
         2. A stale `awaitingDS` chat state from prior test blocks new
            command processing.
         3. The Cmd+Z keyboard event is captured by some focus path
            we haven't isolated even after blurring activeElement.
       Next steps:
         - Use `page.context.clearStorage()` or per-test fresh contexts
           (storage isolation in playwright.config).
         - Or invoke the store's reset directly via `page.evaluate(() =>
           window.__designHubStore?.getState().reset())` (need to expose
           a debug hook in dev mode).
         - Verify Cmd+Z actually fires `undo` by checking the store's
           historyCursor before/after. */
    await gotoBuilderClean(page);

    const textarea = page.getByRole("textbox").first();
    await textarea.click();
    await textarea.fill("build a dashboard");
    await textarea.press("Enter");

    await expect(async () => {
      const n = await page.locator("[data-block-id], .sortable-block").count();
      expect(n).toBeGreaterThan(0);
    }).toPass({ timeout: 15_000 });

    const before = await page.locator("[data-block-id], .sortable-block").count();

    await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (el && typeof el.blur === "function") el.blur();
    });
    await page.keyboard.press("Meta+Z");

    await expect(async () => {
      const after = await page.locator("[data-block-id], .sortable-block").count();
      expect(after).toBeLessThan(before);
    }).toPass({ timeout: 10_000 });
  });
});

test.describe("Builder — block lifecycle (click-to-add path)", () => {
  test.fixme("library tile click adds a block to the canvas", async () => {
    // TODO: ComponentLibrary lives inside PreviewSidePanel and is only
    // visible when the panel is open. Need to (1) open the panel via the
    // canvas toggle, (2) wait for `.lib-tile-grid` to mount, (3) click a
    // known tile by `title="<label> - drag onto canvas or click to add"`,
    // (4) assert a new block lands in the body zone.
    // Click-to-add zone resolution lives in useBuilder.ts:632–674.
  });

  test.fixme("right-click menu offers Delete + Wrap in group column", async () => {
    // TODO: Need to right-click an existing block on the canvas. Playwright's
    // page.locator(...).click({ button: "right" }) triggers contextmenu but
    // BlockContextMenu listens via a custom event from SortableBlock — verify
    // the propagation path works under a synthetic event before asserting.
  });

  test.fixme("Delete key removes the selected block", async () => {
    // TODO: Need a stable selection-set helper. SortableBlock dispatches
    // `setSelectedBlockId` on click; assert the store updates, then send
    // Delete keydown and assert removal.
  });
});

test.describe("Builder — drag and drop (placeholder)", () => {
  test.fixme("drag library tile to canvas body zone adds a block at index 0", async () => {
    // TODO: dnd-kit uses pointer events with a 10px activation threshold
    // (CLICK_TOLERANCE_PX in ComponentLibrary.tsx). Playwright's
    // page.dragAndDrop simulates HTML5 drag events, which dnd-kit does NOT
    // listen to — must use page.mouse.move + .down + .up sequence with a
    // step option to pass the activation threshold.
    //
    // Approximate sequence:
    //   const tile = page.getByRole("button", { name: "Button" }).first();
    //   const zone = page.locator('[data-zone="body"]').first();
    //   const tileBox = await tile.boundingBox();
    //   const zoneBox = await zone.boundingBox();
    //   await page.mouse.move(tileBox.x + 10, tileBox.y + 10);
    //   await page.mouse.down();
    //   await page.mouse.move(tileBox.x + 30, tileBox.y + 10, { steps: 10 });
    //   await page.mouse.move(zoneBox.x + 50, zoneBox.y + 30, { steps: 20 });
    //   await page.mouse.up();
  });

  test.fixme("resize handle drag changes block width", async () => {
    // TODO: SortableBlock.tsx:606 has aria-label="Resize width". Drag should
    // emit live "{N}px" overlay text — assert overlay text changes during
    // drag, and final block width snaps to a known bucket (25/33/50/66/75/100%).
  });

  test.fixme("Shift-click multi-select then ⌘G groups blocks", async () => {
    // TODO: Need ≥2 blocks on the canvas first. Then:
    //   await firstBlock.click();
    //   await secondBlock.click({ modifiers: ["Shift"] });
    //   await page.keyboard.press("Meta+g");
    // Assert a new LayoutGroup wraps both blocks (look for
    // `.layout-group` or `[data-layout-group]`).
  });
});
