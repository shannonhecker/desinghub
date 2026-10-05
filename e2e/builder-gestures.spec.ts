import { test, expect, type Page, type Locator } from "@playwright/test";

// Every test gets Playwright's fresh browser context. All mutations use the
// visible UI; default scaffold blocks cannot satisfy the body assertions.
const bodyBlocks = (page: Page) => page.locator('.bp-main [data-block-id][data-zone="body"]');
const chatInput = (page: Page) => page.getByRole('textbox', { name: 'Chat message input' });

async function openBuilder(page: Page) {
  await page.route('**/api/health', route => route.fulfill({
    json: { anthropicConfigured: false, firebaseConfigured: false },
  }));
  await page.goto('/builder');
  await expect(chatInput(page)).toBeVisible();
}

async function editTemplate(page: Page) {
  await openBuilder(page);
  await page.getByRole('button', { name: /Browse templates/ }).click();
  await page.getByRole('button', { name: 'Use the Performance Analytics template' }).click();
  await page.getByRole('button', { name: 'Edit canvas', exact: true }).click();
  await expect(bodyBlocks(page)).toHaveCount(6);
  await atRest(page);
}

/**
 * Every block is at rest. When the edit canvas mounts, each block plays its
 * entrance (canvas-block-in: 260 ms, a scale that overshoots 1 on the way).
 * Until it ends a block's box on screen is up to 0.6% larger than its
 * layout, so a width read then is not the width the block has: this is what
 * made "Undo restores it" miss by 2.7 to 4.8px about one run in three.
 */
async function atRest(page: Page) {
  await bodyBlocks(page).evaluateAll(els => Promise.all(els.flatMap(el => el.getAnimations().filter(a => a instanceof CSSAnimation).map(a => a.finished.catch(() => undefined)))));
  await expect.poll(() => bodyBlocks(page).evaluateAll(els => els.filter(el => getComputedStyle(el).transform !== 'none' || el.getAnimations().some(a => a instanceof CSSAnimation && a.playState !== 'finished')).length)).toBe(0);
}

async function selectBlock(block: Locator) {
  await block.focus();
  await block.press('Enter');
  await expect(block).toHaveClass(/is-selected/);
}

async function libraryTile(page: Page) {
  await page.keyboard.press('Escape');
  const show = page.getByRole('button', { name: 'Show component library', exact: true });
  if (await show.isVisible()) await show.click();
  await page.getByRole('searchbox', { name: 'Search component library' }).fill('Button');
  const tile = page.getByRole('button', { name: 'Button, drag onto canvas or click to add', exact: true });
  await tile.scrollIntoViewIfNeeded();
  return tile;
}

async function undo(page: Page) {
  await page.getByRole('button', { name: /^Undo \(/ }).click();
}

test('loads with a focusable chat input and primary navigation', async ({ page }) => {
  await openBuilder(page);
  await expect(page.getByRole('log', { name: 'Chat messages' })).toBeVisible();
  await expect(page.getByRole('link', { name: /UI Kit/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export canvas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start a new session' })).toBeVisible();
  await chatInput(page).focus();
  await expect(chatInput(page)).toBeFocused();
});

test('local dashboard command builds body content without AI', async ({ page }) => {
  await openBuilder(page);
  await chatInput(page).fill('build an internal dashboard');
  await chatInput(page).press('Enter');
  const built = page.locator('.content-split.has-preview .bp-main [data-block-id]').first();
  const ds = page.getByRole('button', { name: 'Salt DS', exact: true });
  await expect(built.or(ds).first()).toBeVisible();
  if (!(await built.isVisible())) await ds.click();
  await expect(built).toBeVisible();
  await expect(page.getByRole('button', { name: 'Stop generating' })).toHaveCount(0);
});

test('keyboard Undo restores a deleted block with its original content', async ({ page }) => {
  await editTemplate(page);
  const block = bodyBlocks(page).first();
  const id = await block.getAttribute('data-block-id');
  const content = await block.locator('.dh-panel').innerText();
  await selectBlock(block);
  await page.keyboard.press('Delete');
  await expect(bodyBlocks(page)).toHaveCount(5);
  await page.keyboard.press('ControlOrMeta+z');
  await expect(bodyBlocks(page)).toHaveCount(6);
  await expect(page.locator(`[data-block-id="${id}"] .dh-panel`)).toHaveText(content, { useInnerText: true });
});

test('library tile click adds exactly one body block', async ({ page }) => {
  await editTemplate(page);
  await (await libraryTile(page)).click();
  await expect(bodyBlocks(page)).toHaveCount(7);
  await undo(page);
  await expect(bodyBlocks(page)).toHaveCount(6);
});

test('context menu deletes and wraps a block in a group', async ({ page }) => {
  await editTemplate(page);
  const id = await bodyBlocks(page).first().getAttribute('data-block-id');
  const block = page.locator(`[data-block-id="${id}"]`);
  await block.click({ button: 'right', position: { x: 5, y: 5 } });
  await page.getByRole('menuitem', { name: /^Delete/ }).click();
  await expect(block).toHaveCount(0);
  await expect(bodyBlocks(page)).toHaveCount(5);
  await undo(page);
  await block.click({ button: 'right', position: { x: 5, y: 5 } });
  await page.getByRole('menuitem', { name: /^Wrap in group column/ }).click();
  await expect(page.locator(`.group-drop-container [data-block-id="${id}"]`)).toHaveCount(1);
  await expect(bodyBlocks(page)).toHaveCount(6);
  await undo(page);
  await expect(page.locator('.group-drop-container')).toHaveCount(0);
  await expect(block).toHaveCount(1);
});

test('Delete key removes only the selected block', async ({ page }) => {
  await editTemplate(page);
  const ids = await bodyBlocks(page).evaluateAll(els => els.map(el => el.getAttribute('data-block-id')));
  await selectBlock(bodyBlocks(page).first());
  await page.keyboard.press('Delete');
  await expect(page.locator(`[data-block-id="${ids[0]}"]`)).toHaveCount(0);
  await expect(bodyBlocks(page)).toHaveCount(5);
  for (const id of ids.slice(1)) await expect(page.locator(`[data-block-id="${id}"]`)).toHaveCount(1);
});

test('pointer drag adds a library tile before the first body block', async ({ page }) => {
  await editTemplate(page);
  const originalIds = await bodyBlocks(page).evaluateAll(els => els.map(el => el.getAttribute('data-block-id')));
  const tile = await libraryTile(page);
  const from = (await tile.boundingBox())!;
  // Grid layouts omit between-item slots to preserve their track geometry.
  // Dropping on the first block inserts immediately before it.
  const to = (await bodyBlocks(page).first().boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x - 25, from.y + from.height / 2, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + 10, { steps: 20 });
  await page.mouse.up();
  await expect(bodyBlocks(page)).toHaveCount(7);
  const ids = await bodyBlocks(page).evaluateAll(els => els.map(el => el.getAttribute('data-block-id')));
  expect(ids.slice(1)).toEqual(originalIds);
  expect(originalIds).not.toContain(ids[0]);
});

test('pointer resize changes block width and Undo restores it', async ({ page }) => {
  await editTemplate(page);
  const block = bodyBlocks(page).first();
  await selectBlock(block);
  /* The width to come back to is the block's own, at rest: boundingBox()
     reads the scaled box while an entrance animation is still running. */
  expect(await block.evaluate(el => el.getAnimations().filter(a => a instanceof CSSAnimation && a.playState !== 'finished').length), 'the block is at rest when it is measured').toBe(0);
  await expect(block).toHaveCSS('transform', 'none');
  const before = (await block.boundingBox())!;
  const handle = block.getByRole('slider', { name: 'Resize width', exact: true });
  const grip = (await handle.boundingBox())!;
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2);
  await page.mouse.down();
  await page.mouse.move(grip.x - before.width / 3, grip.y + grip.height / 2, { steps: 15 });
  await page.mouse.up();
  await expect.poll(async () => (await block.boundingBox())!.width).toBeLessThan(before.width - 20);
  await undo(page);
  await expect.poll(async () => Math.abs((await block.boundingBox())!.width - before.width)).toBeLessThanOrEqual(1);
});

/* The entrance (canvas-block-in: a fade and a scale up from 0.94) is for a
   block that has just been added. A drop ends a drag, it adds nothing: while
   dragging the blocks carry classes that switch the entrance off, and taking
   them away at the drop used to start it again on every block, so the whole
   canvas blinked out and popped back in. */
test('dropping a reordered block does not replay the entrance on any block', async ({ page }) => {
  await editTemplate(page);
  const ids = () => bodyBlocks(page).evaluateAll(els => els.map(el => el.getAttribute('data-block-id')));
  const before = await ids();
  const dragged = bodyBlocks(page).nth(1);
  await dragged.hover({ position: { x: 20, y: 20 } });
  const handle = dragged.locator('.canvas-block-handle[aria-label="Drag handle"]').first();
  const from = (await handle.boundingBox())!;
  const to = (await bodyBlocks(page).nth(2).boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 20, from.y + 20, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
  await expect(dragged).toHaveClass(/is-dragging/);
  const peer = bodyBlocks(page).nth(2);
  await expect(peer).toHaveClass(/is-sorting-peer/);
  /* The drop will reorder once the peer under the pointer has made way (the
     sort library shifts it with a transform); a nudge keeps it reading the pointer. */
  let nudge = 0;
  await expect(async () => {
    nudge = nudge === 0 ? 2 : 0;
    await page.mouse.move(to.x + to.width / 2 + nudge, to.y + to.height / 2 + nudge);
    expect(await peer.evaluate(el => getComputedStyle(el).transform)).not.toBe('none');
  }).toPass({ timeout: 10_000 });

  /* Every frame for 400 ms from the drop: each block's opacity, its scale,
     and whether the entrance is running on it. */
  await page.evaluate(() => {
    const w = window as unknown as { __drop: { t: number; opacity: number; scale: number; entering: boolean }[]; __dropDone: boolean };
    w.__drop = [];
    w.__dropDone = false;
    let t0 = 0;
    const blocks = () => [...document.querySelectorAll<HTMLElement>('.bp-main [data-block-id][data-zone="body"]')];
    const frame = () => {
      const t = performance.now() - t0;
      for (const el of blocks()) {
        const style = getComputedStyle(el);
        const m = style.transform === 'none' ? null : new DOMMatrixReadOnly(style.transform);
        w.__drop.push({
          t,
          opacity: Number(style.opacity),
          scale: m ? Math.hypot(m.a, m.b) : 1,
          entering: el.getAnimations().some(a => a instanceof CSSAnimation && a.animationName === 'canvas-block-in' && a.playState === 'running'),
        });
      }
      if (t < 400) requestAnimationFrame(frame); else w.__dropDone = true;
    };
    window.addEventListener('pointerup', () => { t0 = performance.now(); requestAnimationFrame(frame); }, { once: true, capture: true });
  });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dropDone: boolean }).__dropDone)).toBe(true);
  const frames = await page.evaluate(() => (window as unknown as { __drop: { t: number; opacity: number; scale: number; entering: boolean }[] }).__drop);

  /* The drop was a real reorder. */
  const after = await ids();
  expect(after).not.toEqual(before);
  expect([...after].sort()).toEqual([...before].sort());

  expect(frames.length).toBeGreaterThan(6 * 10);
  expect(frames.filter(f => f.entering).length, 'frames in which a block is playing its entrance').toBe(0);
  /* The first frame can still be the drag itself (the dragged block is half
     faded while held); from the next one on no block fades. The entrance
     starts at opacity 0, so this is the blink itself. Scale is recorded but
     not asserted: the sort library sizes and moves the blocks into place
     with its own transform as the drag ends, and that is not an entrance. */
  const settled = frames.filter(f => f.t > 34);
  expect(Math.min(...settled.map(f => f.opacity)), 'lowest opacity of any block after the drop').toBe(1);
  /* And none of them is ever as small as the entrance's first frames (0.94). */
  expect(Math.min(...settled.map(f => f.scale)), 'smallest scale of any block after the drop').toBeGreaterThan(0.96);
});

test('Shift-click and keyboard grouping preserve both selected blocks', async ({ page }) => {
  await editTemplate(page);
  const first = bodyBlocks(page).nth(0);
  const second = bodyBlocks(page).nth(1);
  const ids = [await first.getAttribute('data-block-id'), await second.getAttribute('data-block-id')];
  await first.click({ position: { x: 5, y: 5 } });
  await second.click({ position: { x: 5, y: 5 }, modifiers: ['Shift'] });
  await page.keyboard.press('ControlOrMeta+g');
  const group = page.locator('.group-drop-container');
  await expect(group).toHaveCount(1);
  for (const id of ids) await expect(group.locator(`[data-block-id="${id}"]`)).toHaveCount(1);
  await expect(bodyBlocks(page)).toHaveCount(5);
  await undo(page);
  await expect(group).toHaveCount(0);
  await expect(bodyBlocks(page)).toHaveCount(6);
});
