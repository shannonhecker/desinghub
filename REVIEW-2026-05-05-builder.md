# Phase 1 — Builder Lane Code Review

**Date:** 2026-05-05
**Branch:** `review/phase1-2026-05-05`
**Scope:** `src/components/builder/*` — 14.8k LoC TS/TSX + 12.7k LoC CSS, the entire builder workbench surface.
**Agents:** 4 parallel `feature-dev:code-reviewer` runs, one per sub-area.
**Out of scope:** UI/interaction changes (per the user constraint for this round). Focus is correctness, perf, security, a11y, and quality.

## Summary

| Severity | Count |
|---|---|
| **High** (correctness / data loss / security / hard perf) | 19 |
| **Med** (perf / quality / correctness-edge / a11y) | 33 |
| **Low** (nits) | 5 |
| **Total** | **57** |

Top theme by frequency: **render churn from over-broad Zustand subscriptions and unstable inline callbacks.** Multiple builder components subscribe to the entire store or pull whole zone arrays via separate selectors, then pass freshly-allocated callbacks to memoized children, defeating both the subscription model and React's prop-equality optimization. Cumulative cost shows up during DnD (drag fires many store writes per second) and during chat streaming.

Second theme: **lifecycle bugs** — listeners attached without symmetric cleanup, animations running when offscreen, `setState` in render bodies that breaks under React 18 Strict Mode / concurrent rendering.

Third theme: **a11y regressions** — focus rings stripped on the primary chat textarea and on search inputs, no role/keyboard nav on the swap menu, no focus restore on context-menu close, missing label associations in SettingsPanel. CLAUDE.md flags a11y as non-negotiable.

## Top findings, ranked

### #1 — SSE chunk boundary splits `data:` lines; tokens silently dropped on slow pipes
- **Severity:** HIGH (correctness / data loss)
- **Where:** `src/lib/useChatAPI.ts:122`
- **What:** `chunk.split("\n")` assumes every `data: {...}` event fits within one network read. On slow pipes the boundary falls mid-event; the `JSON.parse` on the broken fragment is swallowed silently. The accumulated text never gets those characters and the streamed message appears truncated.
- **Why:** Dropped tokens produce silently wrong AI responses with no indication content was lost. Worst case: actions in dropped chunks (e.g. `setDesignSystem`) fail to apply.
- **Fix:** Maintain `leftover` string across iterations: `const lines = (leftover + chunk).split("\n"); leftover = lines.pop() ?? "";` then process all but the last item.

### #2 — `useChatAPI` AbortController double-clear leaks orphaned streaming connection
- **Severity:** HIGH (correctness)
- **Where:** `src/lib/useChatAPI.ts:57-59`
- **What:** Rapid double-send creates two controllers; the first `finally` block sets `abortRef.current = null`, clearing the second controller. Second in-flight request can no longer be aborted.
- **Why:** Orphaned streaming connection burns tokens and races against the visible response.
- **Fix:** Guard the cleanup: `if (abortRef.current === controller) abortRef.current = null`.

### #3 — `SortableBlock` fires 9+ separate `useBuilder` selector calls per instance
- **Severity:** HIGH (perf)
- **Where:** `src/components/builder/SortableBlock.tsx:713-721`
- **What:** Every `SortableBlock` calls `useBuilder` nine times with inline selector functions. With a 20-block canvas there are ~180 live subscriptions from this component alone.
- **Why:** During drag (frequent store writes) all subscriptions re-evaluate per write per block. Primary cause of canvas lag during DnD.
- **Fix:** Single `useShallow` selector returning a struct of all needed state. Or extract a dedicated `useBlockState(id, zone)` hook. **needs-judgment** — large refactor.

### #4 — Body-block renderers re-subscribe to the full `blocks` array, causing all blocks to re-render on any keystroke
- **Severity:** HIGH (perf)
- **Where:** `src/components/builder/ComponentRenderer.tsx:165-169` (and `FormFieldsBlock`, `CardsBlock`, `ButtonsBlock`, `TogglesBlock`, `BadgesBlock`, `DropdownBlock`, `SimulatedStatCardBlock`)
- **What:** Each calls `useBuilder((s) => s.blocks)` then `.find(b => b.id === blockId)`. The selector returns a new array reference on every store update, so every block re-renders when any block changes.
- **Why:** With 30+ blocks, every character typed in any InlineEditable re-renders the whole canvas. **Primary cause of typing lag.**
- **Fix:** Replace with scoped selector: `useBuilder((s) => s.blocks.find((b) => b.id === blockId)?.props ?? null)`. The newer `useBlockInAnyZone` hook does this correctly — migrate older renderers.

### #5 — Sliding chat-split & sidebar resize handlers fire `setState` on every pixel, no rAF
- **Severity:** HIGH (perf)
- **Where:** `src/components/builder/BuilderApp.tsx:183-188`, `PreviewPanel.tsx:1294-1299`, `1309-1315`
- **What:** Both resize handlers call `setState` synchronously inside `mousemove`/`touchmove` at 60-120 Hz. Every event re-renders the entire `content-split` subtree including `PreviewSidePanel`.
- **Why:** Visible frame drops on mid-range hardware, especially with Highcharts blocks on canvas.
- **Fix:** Wrap in `requestAnimationFrame` so only one update per paint. Three handlers, ~20-line change total.

### #6 — `key={previewKey}` forces full remount of the entire `bp-dashboard` subtree
- **Severity:** HIGH (perf)
- **Where:** `src/components/builder/PreviewPanel.tsx:1377`, `1484` (StandalonePreview)
- **What:** `bumpPreview()` increments `previewKey`, which is passed as React `key` to the `bp-dashboard` div. React unmounts/remounts the whole dashboard subtree including all blocks, header, sidebar, footer, and any Highcharts.
- **Why:** Highcharts instances are expensive to construct. Visible flash on every "Refresh." `DefaultChatArea`'s `key={previewKey}` is the legitimate use; the dashboard one is overreach.
- **Fix:** Remove `key={previewKey}` from the `bp-dashboard` div; pass it only to `DefaultChatArea` where the staggered animation re-trigger is the intent. **needs-judgment** — confirm Highcharts doesn't need full remount.

### #7 — `WaveHero` rAF loop runs unconditionally with no visibility gate
- **Severity:** HIGH (perf — battery / GPU)
- **Where:** `src/components/builder/WaveHero.tsx:356-365`
- **What:** WebGL renderer + 64×64 touch-texture canvas + shader run at full framerate even when scrolled out of view or tab is hidden. THREE.WebGLRenderer doesn't throttle itself.
- **Why:** Continuous GPU compositing on a tab that may never be in viewport. Battery drain on mobile.
- **Fix:** `IntersectionObserver` gate that pauses rAF when `!isIntersecting`. ~10 lines, no visual change.

### #8 — `LiquidHero` rAF + SVG filter loop has no visibility guard
- **Severity:** HIGH (perf — paint)
- **Where:** `src/components/builder/LiquidHero.tsx:28-41`
- **What:** `setAttribute("baseFrequency", ...)` on `feTurbulence` every frame unconditionally. Each call re-runs the feTurbulence→feDisplacementMap filter pipeline (main-thread, layout-adjacent).
- **Why:** Pure waste when offscreen — and SVG filter recompute is more expensive than canvas paint.
- **Fix:** Same `IntersectionObserver` pattern as #7, plus `document.visibilitychange` listener.

### #9 — Duplicate `transition` declaration on `.input-box` — second wins, first dropped silently
- **Severity:** HIGH (correctness)
- **Where:** `src/components/builder/builder.css:2588` and `2591`
- **What:** Two consecutive `transition` declarations. Browser applies only the second (`0.4s ease`). The first (`200ms ease`) is dropped.
- **Why:** Intended 200ms transitions for `background`/`border-color`/`box-shadow` are silently overridden to 400ms. If the intent was 200ms (likely — it matches other UI), behaviour is wrong.
- **Fix:** Remove the duplicate. One-line deletion.

### #10 — `transition: all` on hover-heavy chrome elements
- **Severity:** HIGH (perf — paint)
- **Where:** `builder.css:484, 514, 554, 3159, 2702, 2527`
- **What:** `.sidebar-collapse-btn`, `.sidebar-nav li`, `.b-btn`, `.generate-btn` use `transition: all`. Subscribes every animatable property — including layout — to the transition engine.
- **Why:** Recalculates every animatable property on hover, when only 3-4 actually change. Anti-pattern per CLAUDE.md.
- **Fix:** Replace with explicit property lists: `transition: background var(--b-transition), color var(--b-transition), border-color var(--b-transition);`

### #11 — `will-change: opacity, transform` permanently set on `.chat-word`, never removed
- **Severity:** HIGH (perf — GPU memory)
- **Where:** `builder.css:2267`
- **What:** `.chat-word` declares `will-change` statically. Spans persist after streaming ends; `will-change` is never removed. Hundreds of words across a session each hold a promoted compositor-layer reservation.
- **Why:** Stale `will-change` retains GPU memory proportional to total words rendered. Per project guidelines, must be removed post-animation.
- **Fix:** Remove `will-change` on `animationend`, or scope to `:is(.animating)` only during active streaming.

### #12 — `BlueprintItem` double-fires `onPointerDown` (handler + `{...listeners}` spread)
- **Severity:** HIGH (correctness)
- **Where:** `src/components/builder/ComponentLibrary.tsx:166-172`
- **What:** Tile renders `{...listeners}` (already includes dnd-kit's `onPointerDown`) AND explicitly calls `listeners?.onPointerDown?.(e)` inside the explicit handler. dnd-kit receives two pointer-down calls.
- **Why:** dnd-kit treats the second call as a new drag start, desyncing the drag state machine. Manifests as tiles sticking in dragging state on touchpads.
- **Fix:** Remove the explicit `listeners?.onPointerDown?.(e)` call. The `{...listeners}` spread handles it. One-line deletion.

### #13 — `SimulatedHighchart.ensureHighchartsModules()` called on every render
- **Severity:** HIGH (perf / correctness)
- **Where:** `src/components/builder/SimulatedHighchart.tsx:361`
- **What:** Module-init helper is called in render body. If it touches Highcharts global registration on every call (which is idempotent but not free), redundant work on every re-render. If non-idempotent, could double-register modules.
- **Why:** Performance regression during streaming-induced re-renders.
- **Fix:** Move into `useEffect(() => { ensureHighchartsModules(); }, [])`.

### #14 — `SimulatedHighchart` doesn't destroy chart instances on unmount
- **Severity:** HIGH (perf / memory leak)
- **Where:** `src/components/builder/SimulatedHighchart.tsx:399`
- **What:** `HighchartsReact` doesn't auto-destroy on unmount. Each block-remove or DS-switch leaks one chart instance + its resize observers + animation timers.
- **Why:** Accumulates leaked instances across a session. Visible memory growth on undo/redo / template-switch flows.
- **Fix:** `chartRef.current?.chart?.destroy()` in cleanup `useEffect`.

### #15 — `MarqueeLayer.onMouseDown` closes over stale `marquee` state, recreating event handler on every state tick
- **Severity:** HIGH (correctness)
- **Where:** `src/components/builder/MarqueeLayer.tsx:78`
- **What:** `marquee` is in `useCallback` dep array; `onMouseDown` recreates on every marquee state change. Once `mousemove`/`mouseup` listeners are registered they hold the capture-time closure, not the current value. The `<div>`'s event handler reference also changes per state update.
- **Why:** Cosmetic 1-frame delay on rect appearing + stable-handler invariant violated. Race-prone if React batches differently.
- **Fix:** Use a ref flag `isDraggingRef`; remove `marquee` from dep array.

### #16 — `useBlockInAnyZone` triple-walks all four zones (3 separate selectors)
- **Severity:** HIGH (perf)
- **Where:** `src/components/builder/ComponentRenderer.tsx:83-131`
- **What:** Three `useBuilder` calls each do O(n) walks across 4 zones. For a 40-block canvas, every block's render does 12 full traversals.
- **Why:** Multiplies linearly with canvas size. The infinite-loop concern that drove the multi-selector design is solvable with `useShallow`.
- **Fix:** Single selector returning `{block, parentGroupId, zone}` via `useShallow`. Or cache the lookup in the store as O(1). **needs-judgment** — touches store API.

### #17 — `BlockContextMenu` calls `close()` action during render
- **Severity:** HIGH (correctness)
- **Where:** `src/components/builder/BlockContextMenu.tsx:62-76`
- **What:** After the stale-block guard, `close()` is called directly in render body (`close(); return null;`). React 18 concurrent mode may re-invoke the render, calling `close()` multiple times.
- **Why:** Multiple unnecessary store mutations; can fight a transition.
- **Fix:** Move into `useEffect`, or auto-close in the `removeBlock` action upstream.

### #18 — `SlashInserter`'s `cursor` variable mutated during render — Strict Mode breakage
- **Severity:** HIGH (correctness)
- **Where:** `src/components/builder/SlashInserter.tsx:475`
- **What:** `let cursor = 0` declared in render body, incremented inside `sections.map()`. Strict Mode runs render twice; cursor double-counts. Wrong `startedAt` offsets → wrong `globalIdx` → keyboard `activeIndex` targets the wrong row.
- **Why:** Breaks reliably in dev Strict Mode. Also fragile under any concurrent feature.
- **Fix:** Pre-compute `sectionOffsets` in `useMemo` derived from `flatRows`.

### #19 — `BuilderApp` accent-override effect writes `:root` CSS vars without cleanup
- **Severity:** HIGH (correctness)
- **Where:** `src/components/builder/BuilderApp.tsx:64-78`
- **What:** Effect removes-then-applies accent vars on `document.documentElement`. On unmount, no cleanup — vars stay set forever.
- **Why:** Leftover `:root` vars bleed into other surfaces if the user navigates away and back. Mitigated by Next.js doc isolation but not eliminated.
- **Fix:** Return cleanup function that removes the same vars set.

### #20 — `.input-textarea:focus-visible { outline: none }` strips keyboard focus indicator
- **Severity:** HIGH (a11y — WCAG 2.4.7 fail)
- **Where:** `builder.css:2641`
- **What:** Primary chat input explicitly sets `outline: none` on `:focus-visible` with no replacement. The `.input-box.focused` class is JS-driven, not CSS-driven, so pure-keyboard navigation may show no ring at all.
- **Why:** Direct WCAG 2.1 AA failure (Focus Visible). The primary interaction surface of the app has no keyboard focus indicator.
- **Fix:** Remove the `outline: none` rule, or substitute `outline: 2px solid var(--b-accent); outline-offset: 2px;`.

### #21 — `.sessions-search-input` and `.slash-search-input` strip focus rings on `:focus`
- **Severity:** HIGH (a11y — WCAG 2.4.7 fail)
- **Where:** `builder.css:1833, 7330`
- **What:** Both inputs set `outline: none` and substitute only a `border-color` change. Border-color alone doesn't meet 3:1 contrast for focus indication.
- **Why:** Same as #20.
- **Fix:** Add `:focus-visible { outline: 2px solid rgba(126, 107, 196, 0.8); outline-offset: 1px; }` and keep border-color as decoration.

### #22 — `SettingsPanel` `<label>` elements have no `htmlFor` association
- **Severity:** MED (a11y — WCAG 1.3.1 / 4.1.2 fail)
- **Where:** `src/components/builder/SettingsPanel.tsx:186-194` and throughout
- **What:** Every `<label>` is bare; siblings have no `id`. Screen readers can't associate labels with their controls.
- **Why:** Direct CLAUDE.md violation (a11y non-negotiable).
- **Fix:** Add `htmlFor`/`id` pairs or wrap controls inside `<label>` directly.

### #23 — `ChatPanel` chat log lacks `aria-busy` on streaming
- **Severity:** MED (a11y)
- **Where:** `src/components/builder/ChatPanel.tsx:758, 833-848`
- **What:** `role="log"` with `aria-live="polite"` but no `aria-busy={isGenerating}`. Screen readers announce partial content as it streams.
- **Why:** Per CLAUDE.md "missing aria-busy on streaming" is explicitly listed.
- **Fix:** `aria-busy={isGenerating}` on the chat log container. One attribute.

### #24 — `SwapMenu` lacks role/keyboard nav/focus trap
- **Severity:** MED (a11y)
- **Where:** `src/components/builder/SwapMenu.tsx:37-62`
- **What:** Overlay with 18 focusable buttons but no `role="menu"`, no auto-focus, no Tab-trap, no Escape close. Tab moves freely out without closing.
- **Why:** Primary interaction path; CLAUDE.md a11y mandates keyboard support.
- **Fix:** Add `role="menu"`, `role="menuitem"`, `useEffect` auto-focus first item, Escape close, Tab trap.

### #25 — `ContextMenu` doesn't restore focus on close
- **Severity:** MED (a11y — WCAG 2.1.2)
- **Where:** `src/components/builder/ContextMenu.tsx:80-98`
- **What:** Focus isn't returned to the trigger element on close. Screen-reader users lose their place.
- **Fix:** Save `document.activeElement` before open; restore in `onClose`.

## Other High/Med findings (folded into PR clusters or issues)

| # | File | Severity | Tag | Summary |
|---|---|---|---|---|
| 26 | `PreviewPanel.tsx:135-154` | HIGH | perf | `PreviewBar` makes 15 individual `useBuilder` calls |
| 27 | `PreviewPanel.tsx:905-918` | HIGH | perf | `CanvasDndProvider` 9 separate selectors fired on drag-over |
| 28 | `PreviewCanvas.tsx:102-109` | HIGH | perf | `useBuilder()` full-store subscription |
| 29 | `PreviewCanvas.tsx:249-274` | HIGH | perf | Inline callbacks recreated per render inside `blocks.map()` |
| 30 | `PreviewCanvas.tsx:85-89` | HIGH | security | `dangerouslySetInnerHTML` over partially-sanitized JSON |
| 31 | `MiniPreview.tsx:21-24`, `SharedPreview.tsx:20-25`, `TemplatePreviews.tsx:9` | HIGH | quality | Hardcoded hex literals violate token rule |
| 32 | `BuilderApp.tsx:227-233` | MED | correctness | Header-scroll listener `querySelector` runs once on mount |
| 33 | `BuilderApp.tsx:132-142`, `PreviewPanel.tsx:228-239` | MED | correctness | Share/download `setTimeout` not cleared on unmount |
| 34 | `SortableBlock.tsx:412-446` | MED | perf | Resize effect re-attaches listeners on every pointermove via `[dragState]` dep |
| 35 | `ComponentRenderer.tsx:1686-1690` | MED | correctness | Wrapper `<div>` breaks layout for grid-direct children |
| 36 | `SessionsDrawer.tsx:80-123` | MED | correctness | Rename for non-active sessions silently discarded |
| 37 | `ChatPanel.tsx:584-594, 624-630` | MED | correctness | Fake "thinking" delay drops user messages sent during the window |
| 38 | `SimulatedHighchart.tsx:95` | MED | a11y | `prefers-reduced-motion` ignored on chart animations |
| 39 | `ComponentRenderer.tsx:196, 354, 452` | MED | correctness | `key={i}` array-index keys on editable rows |
| 40 | `ComponentRenderer.tsx:1688` | MED | correctness | Spread props onto child component without filtering |
| 41 | `PreviewPanel.tsx:1487-1492` | MED | correctness | StandalonePreview missing sidebar resize handle |
| 42 | `PreviewPanel.tsx:65-93` | MED | perf | `DSPreviewStyles.getFullCSS` not memoized |
| 43 | `PreviewPanel.tsx:1317-1322, 1336-1340` | MED | correctness | `cursor` style stranded if `touchend` fires before `mouseup` |
| 44 | `BuilderApp.tsx:49-56` | HIGH | correctness | Structure-padding effect missing `density` dep |
| 45 | `BuilderPreview.tsx:143-155` | MED | correctness | `AnimatePresence` direct child missing `key` (legacy file) |
| 46 | `PreviewPanel.tsx:501, 534, 562, 683, 728, 815, 851` | MED | perf | `onRemove` arrows recreated per render in zone components |
| 47 | `ZoneDropContainer.tsx:116` | MED | perf | `SortableContext items={blocks.map(...)}` not memoized |
| 48 | `ContextMenu.tsx:172` | MED | correctness | `key={item.label}` collides on duplicate labels |
| 49 | `CompareView.tsx:133-136, 149-165` | MED | perf | `handleOpen` not `useCallback`, breaks `React.memo` on quadrants |
| 50 | `builder.css:137, 275` | HIGH | build | Two `:root` blocks split tokens; merge into one |
| 51 | `builder.css:13, 40, 46+` | HIGH | quality | `.builder-shell.builder-shell` doubled-class specificity hack |
| 52 | `builder.css:504` | HIGH | perf | `.sidebar-nav li` element selector + `transition: all` |
| 53 | `builder.css:2305, 2323, 2348` | HIGH | paint | Generating-shimmer animations have no class gate |
| 54 | `builder.css:10757` | HIGH | perf | `:has(.canvas-block--experimental)` invalidation on hot mutation path |
| 55 | `builder.css:8602` | MED | correctness | `.bp-header` `position: sticky` clipped by overflow ancestor |
| 56 | `LiquidHero.tsx:309-313` | MED | paint | `motion.div animate width` triggers layout-property animation |
| 57 | `builder.css:11896-11914` | MED | build | `cb-skeleton-*` redundantly redeclares background/animation |

## What gets fixed in this round (Lane 3 — safe-fix PRs, 5 max)

Five focused PRs, no UI/interaction changes:

### PR-1 — `fix(builder): SSE chunk-boundary buffer + AbortController double-clear guard`
Covers #1, #2. ~10 lines in `useChatAPI.ts`. Highest-impact: prevents data loss in streaming.

### PR-2 — `fix(builder): Highcharts lifecycle — module init in effect, destroy on unmount, prefers-reduced-motion`
Covers #13, #14, #38. ~25 lines in `SimulatedHighchart.tsx`. Memory leak fix + perf + a11y.

### PR-3 — `fix(builder): rAF-throttle resize handlers + cleanup setTimeouts and CSS cursor on unmount`
Covers #5, #33, #43. ~30 lines across `BuilderApp.tsx`, `PreviewPanel.tsx`. Pure perf + correctness, no visual change.

### PR-4 — `fix(builder): CSS correctness — duplicate transition + transient will-change`
Covers #9, #11. Removes broken second-wins transition; scopes `will-change` to `.is-animating`. ~10 lines in `builder.css`. Pure correctness + GPU-memory win.

### PR-5 — `fix(builder): memoization wins on hot paths — DSPreviewStyles + SortableContext items + CompareView callbacks`
Covers #42, #47, #49. ~20 lines. Pure perf with no visual change.

A11y cluster (#20, #21, #22, #23, #24, #25) is **deferred to a separate batch** because focus rings are technically a visual change for keyboard users (regression-fix, but visible). Same for the bigger render-churn refactors (#3, #4, #16, #26, #27, #28, #29) — those need design-judgment touches across the store API.

## What gets filed as issues (Lane 4)

Everything not in PR-1 through PR-5, batched by theme:

1. **A11y cluster** — focus rings on inputs (#20, #21), label associations in SettingsPanel (#22), `aria-busy` on chat log (#23), SwapMenu role/keyboard (#24), ContextMenu focus restore (#25), `prefers-reduced-motion` for charts (#38)
2. **Render-churn refactor cluster** — SortableBlock subscription consolidation (#3), full-store reads (#4, #28), PreviewBar 15 selectors (#26), CanvasDndProvider 9 selectors (#27), inline callbacks in blocks.map (#29), `useBlockInAnyZone` triple-walk (#16), zone `onRemove` arrows (#46)
3. **Hero visibility gating** — WaveHero (#7) + LiquidHero (#8) IntersectionObserver
4. **CSS architecture cleanup** — two `:root` blocks (#50), `.builder-shell.builder-shell` specificity hack (#51), `:has(.canvas-block--experimental)` (#54), `transition: all` audit (#10), generating-shimmer gating (#53)
5. **`key={previewKey}` dashboard remount** (#6) — needs Highcharts test before landing
6. **Token-violation cluster** — MiniPreview, SharedPreview, TemplatePreviews hex literals (#31). Visual-change risk requires comparing literal vs token resolved value.
7. **Strict-mode correctness** — BlockContextMenu render-time `close()` (#17), SlashInserter cursor mutation (#18), `MarqueeLayer` stale closure (#15), BuilderApp accent cleanup (#19)
8. **Misc structural** — `SessionsDrawer` rename for non-active sessions (#36), `ChatPanel` fake-thinking dropped messages (#37), `ComponentRenderer` wrapper `<div>` (#35), index-key bugs (#39), spread-props (#40), StandalonePreview missing resize (#41), structure-padding density dep (#44), `AnimatePresence` legacy key (#45), `BuilderApp` querySelector mount race (#32), `SortableBlock` resize effect dep (#34), `BlueprintItem` double-fire (#12), `bp-header` sticky-clip (#55), LiquidHero width animation (#56), CSS skeleton dedup (#57), security: `dangerouslySetInnerHTML` over JSON (#30)

Total expected issues: ~12 batched (one per cluster) rather than ~52 individual issues.

## Verification at end of Lane 3 (builder)

- All 5 safe-fix PRs: `tsc --noEmit` clean.
- No UI/interaction code touched.
- Manual smoke test on `localhost:3000/builder`: chat streaming completes a message; build a template; remove a block; verify no console warnings about `setState during render` (if any of those existed before, they should be gone).
- Verify Highcharts blocks: rebuild a template that contains a chart, then remove it; check that the previous chart's GPU resources are released (best-effort via DevTools Memory snapshot before/after).
- Memory rule still in force — no merges.
