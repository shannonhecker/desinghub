import { test, expect, type Page } from "@playwright/test";

/**
 * Edit vs Present box-model parity.
 *
 * Regression for the present-mode spacing divergence (2026-06-11):
 * BuilderApp's edit shell carries data-canvas-spacing, but PresentStage
 * REPLACES that shell, so before the fix no ancestor carried the
 * attribute in preview and the tight gate
 * ([data-canvas-spacing="tight"] .canvas-block { padding/margin/border: 0 })
 * never applied — preview blocks rendered 12px padding / 8px margin /
 * 1px border while edit rendered 0/0/0, shifting every block's position.
 *
 * Strategy: assert exactly what the fix changes — the COMPUTED box-model
 * styles (padding / margin-bottom / border-width) of every .canvas-block,
 * which the [data-canvas-spacing] gate drives. Bounding rects are NOT
 * compared: edit renders inside a chat-docked split pane while Present
 * renders a fluid DeviceFrame capped at --bc-stage-cap, so widths
 * legitimately differ; and .canvas-block replays a 260ms scale(0.94)
 * entrance animation on the Present remount, so rects read small
 * mid-animation. Computed padding/margin/border neither animate here nor
 * depend on frame width, so they are mode-invariant and race-free.
 *
 * Covered for BOTH store spacing values:
 *   - tight (default): the dominant block population must be zero-boxed
 *     in edit (the gate bites), and every block's computed box must be
 *     IDENTICAL between edit and present;
 *   - comfortable (flipped via the canvas overflow menu): computed box
 *     must differ from tight, and again be IDENTICAL across modes.
 *
 * Pre-flight: same as builder-gestures.spec.ts — `npm run dev` on :3000
 * (dev is fine; no prod build required for this page).
 */

/* The REAL chat input (ChatPanel.tsx aria-label). `getByRole("textbox").first()`
   is ambiguous here: canvas patterns ship decorative readonly inputs (e.g. the
   chatbox block's .bp-chat-field) that win DOM order once the canvas has
   content, and filling those times out on "element is not editable". */
function chatInput(page: Page) {
  return page.getByRole("textbox", { name: "Chat message input" });
}

async function gotoBuilderClean(page: Page) {
  await page.goto("/builder", { waitUntil: "domcontentloaded" });
  await expect(chatInput(page)).toBeVisible({ timeout: 30_000 });
  /* No "Start a new session" reset click: each test runs in a fresh browser
     context (fresh storage state), so the session always starts clean. The
     default canvas chrome (header brand/status, sidebar nav, footer zone
     blocks) renders even on an empty session and is part of the measured
     population — it is NOT stale state to clear. The reset click this
     replaces was the spec's flakiest step: it raced both the preview
     hydration that mounts those chrome blocks and the builder's first-load
     hydration, which can pin the main thread for >15s on slow machines.
     (If a reset click is ever reintroduced, register any page.once("dialog")
     handler BEFORE the click — a confirm raised by the click blocks it from
     resolving, so a handler attached afterwards never sees the dialog.) */
}

async function buildDashboard(page: Page) {
  const textarea = chatInput(page);
  /* Click first (like builder-gestures does) with generous headroom: the
     first interaction after load can wait out a long hydration task on
     slow dev machines. Once it lands, the rest of the flow is fast. */
  await textarea.click({ timeout: 45_000 });
  /* "internal" matters: ChatPanel's pre-build audience gate
     (assumptionDims.ts audienceUnguessable) interrupts app-like prompts
     that carry no audience signal with a who-is-this-for chip question
     instead of building. "internal" is an explicit audience signal, so
     this goes straight through processLayoutCommand's dashboard preset. */
  await textarea.fill("build an internal dashboard");
  await textarea.press("Enter");

  /* Two deterministic outcomes depending on whether the /api/health probe
     reported an Anthropic key before the send (ChatPanel first-turn
     onboarding):
       - no key (aiDisabled): the message is STAGED and the bot asks
         "which design system?" — answer the chip, which re-routes the
         staged message through the offline layout fast-path;
       - key present (or probe still in flight): the keyword fast-path
         builds the dashboard preset immediately, no chips.
     The "built" signal must be a BODY-zone block inside the OPEN preview
     (.content-split.has-preview): the default canvas chrome renders
     .canvas-block nodes before any build, and the chat surface renders a
     decorative body-zone block too, so any looser match passes vacuously
     while previewOpen is still false. */
  const builtBlock = page
    .locator('.content-split.has-preview .canvas-block[data-zone="body"]')
    .first();
  /* exact: the preview bar's DS dropdown trigger ("Design system: Salt DS")
     also substring-matches "Salt DS". */
  const dsChip = page.getByRole("button", { name: "Salt DS", exact: true });
  await expect(builtBlock.or(dsChip).first()).toBeVisible({ timeout: 60_000 });
  if (!(await builtBlock.isVisible())) {
    await dsChip.click();
  }
  await expect(builtBlock).toBeVisible({ timeout: 60_000 });

  /* Minimize the chat window: it floats OVER the canvas toolbar and
     intercepts pointer events on the Edit/Preview toggle and the overflow
     menu this spec drives next (a real user clears it the same way).
     This also unmounts the chat's decorative blocks, so later
     .canvas-block measurements see only real canvas content. */
  await page.getByRole("button", { name: "Minimize chat to corner" }).click();
  await expect(page.locator(".chat-float")).toHaveCount(0);
}

/* The computed properties the [data-canvas-spacing] gate controls
   (builder.css: padding, margin-bottom, border-width on .canvas-block). */
type BoxStyles = {
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginBottom: string;
  borderTopWidth: string;
  borderRightWidth: string;
  borderBottomWidth: string;
  borderLeftWidth: string;
};

const ZERO_BOX: BoxStyles = {
  paddingTop: "0px",
  paddingRight: "0px",
  paddingBottom: "0px",
  paddingLeft: "0px",
  marginBottom: "0px",
  borderTopWidth: "0px",
  borderRightWidth: "0px",
  borderBottomWidth: "0px",
  borderLeftWidth: "0px",
};

async function measureBoxStyles(page: Page): Promise<BoxStyles[]> {
  /* page.$$eval is Playwright's standard DOM-query API (runs the given
     function over matched elements in the page context) — not JS eval();
     no arbitrary string execution here. */
  return page.$$eval(".canvas-block", (els) =>
    els.map((el) => {
      const cs = getComputedStyle(el);
      return {
        paddingTop: cs.paddingTop,
        paddingRight: cs.paddingRight,
        paddingBottom: cs.paddingBottom,
        paddingLeft: cs.paddingLeft,
        marginBottom: cs.marginBottom,
        borderTopWidth: cs.borderTopWidth,
        borderRightWidth: cs.borderRightWidth,
        borderBottomWidth: cs.borderBottomWidth,
        borderLeftWidth: cs.borderLeftWidth,
      };
    }),
  );
}

async function enterPresent(page: Page, expectedSpacing: "tight" | "comfortable") {
  /* Enter Present mode via the PreviewToggle segment in the builder top bar
     (PreviewToggle.tsx, aria-label "Preview mode"; rendered once the canvas
     has content). Deliberately NOT the Shift+Cmd+P shortcut: under headless
     Playwright the global key listener is flaky (observed needing up to 8
     presses before .present-stage appeared). That listener flakiness is a
     product bug to track separately; this spec uses the deterministic
     click path so parity failures are the only thing that can fail it. */
  const stage = page.locator(".present-stage");
  await page.getByRole("button", { name: "Preview mode" }).click();
  await expect(stage).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".canvas-block").first()).toBeVisible({ timeout: 15_000 });
  // The root must mirror the store's canvasSpacing (the actual fix).
  await expect(stage).toHaveAttribute("data-canvas-spacing", expectedSpacing);
}

async function exitPresent(page: Page) {
  /* PresentBar's author-variant exit button — a click path that does not
     depend on the (dev-flaky) global Escape listener. */
  await page.getByRole("button", { name: "Edit canvas" }).click();
  await expect(page.locator(".present-stage")).toHaveCount(0);
}

test.describe("Builder - edit vs present box-model parity", () => {
  test("canvas blocks keep identical computed padding/margin/border across edit and present (tight + comfortable)", async ({
    page,
  }) => {
    await gotoBuilderClean(page);
    await buildDashboard(page);

    /* ── Phase 1: tight (store default) ────────────────────────────── */
    await expect(page.locator(".builder-shell")).toHaveAttribute(
      "data-canvas-spacing",
      "tight",
    );

    const editTight = await measureBoxStyles(page);
    expect(editTight.length).toBeGreaterThan(0);
    /* The tight gate must actually bite. A handful of special-cased blocks
       legitimately keep a small padding in BOTH modes (observed: 2px), so
       assert the dominant population is zero-boxed rather than every block;
       the per-block parity loop below is the real regression assertion. */
    const zeroCount = editTight.filter(
      (b) => JSON.stringify(b) === JSON.stringify(ZERO_BOX),
    ).length;
    expect(
      zeroCount,
      "most blocks should be zero-boxed under the tight gate in edit mode",
    ).toBeGreaterThanOrEqual(Math.ceil(editTight.length / 2));

    await enterPresent(page, "tight");
    const presentTight = await measureBoxStyles(page);
    expect(presentTight.length).toBe(editTight.length);
    for (let i = 0; i < presentTight.length; i++) {
      expect.soft(presentTight[i], `present/tight parity block ${i}`).toEqual(editTight[i]);
    }
    await exitPresent(page);

    /* ── Phase 2: comfortable (flipped via the canvas overflow menu) ── */
    await page.getByRole("button", { name: "More canvas actions" }).click();
    await page.getByRole("menuitemcheckbox", { name: "Comfortable spacing" }).click();
    await expect(page.locator(".builder-shell")).toHaveAttribute(
      "data-canvas-spacing",
      "comfortable",
    );

    const editComfortable = await measureBoxStyles(page);
    expect(editComfortable.length).toBe(editTight.length);
    // Sanity: comfortable must actually differ from tight, otherwise the
    // parity assertion below would pass vacuously on a broken toggle.
    expect(
      JSON.stringify(editComfortable),
      "comfortable spacing should change the computed box model in edit mode",
    ).not.toBe(JSON.stringify(editTight));

    await enterPresent(page, "comfortable");
    const presentComfortable = await measureBoxStyles(page);
    expect(presentComfortable.length).toBe(editComfortable.length);
    for (let i = 0; i < presentComfortable.length; i++) {
      expect
        .soft(presentComfortable[i], `present/comfortable parity block ${i}`)
        .toEqual(editComfortable[i]);
    }

    // Exit back to edit so later tests in the worker start clean.
    await exitPresent(page);
  });
});
