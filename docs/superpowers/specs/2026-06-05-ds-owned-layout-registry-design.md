# DS-Owned Layout via a Registry Layer

**Date:** 2026-06-05
**Status:** Design — awaiting owner review
**Builds on:** `2026-05-31-templates-as-ds-framework-design.md` (one DS-agnostic pattern → 5 DS via registry)
**Owner directive:** "the templates should be reusing the patterns from the DS library — the layout and grid as well; let the DS define it, not a custom one."
**Hard constraint from owner:** "don't want the extra padding when in editable mode; don't break the layout."

---

## 1. Problem

Two surfaces render layout with a **custom skeleton themed by DS-colored CSS classes**, not the design system's own layout primitives:

### 1a. UI-Kit gallery pattern pages (the screenshots)
The 8 patterns — App Shell, Data Table Page, Form, List + Detail, Login, Search, Settings Page, Wizard — are defined in `src/data/salt/components.ts:71-79` and **hand-coded separately in every `*-documentation.jsx`** (Salt, M3, Fluent, Carbon, uoaui). That is **~40 hand-rolled renderers** (`PatAppShell`, `PatDataTable`, …) that:

- Build layout with inline-style flex/grid + custom classes (`.cb-table`, `.cb-sidenav`, `.s-btn`) — **not** `UIShell`/`Grid`/`Column` (Carbon) or `StackLayout`/`FlexLayout`/`GridLayout` (Salt).
- **Disagree with their own Code tab**, which already shows idealized DS-native code (`<FlexLayout>`, `<Grid>`, `<Column>`). Preview says one thing, code says another.

### 1b. Builder templates + canvas
`src/lib/builderTemplates.ts` (Analytics / Settings / CRM / Login flow / Landing) drive `applyTemplate.ts` → the builder canvas. Layout is resolved by `src/lib/layoutResolver.ts`, which emits a **custom `repeat(12,1fr)` CSS grid** (`computeContainerStyle`, line 182). `componentApiRegistry.ts` maps blocks → real DS components for render + export — but has **no layout entries**, so downloaded code falls back to generic `<div>` + CSS (`reactExporter.blockToJsx`), never the DS's real grid.

**Net:** every layout in the product is a custom grid wearing DS colors. The DS never actually owns the grid.

---

## 2. Goal & Non-Goals

### Goal
One **DS-agnostic** pattern/template definition compiles, through a new **layout registry**, to **each DS's real grid/layout primitives** — identically for (a) live render, (b) the Code tab, and (c) export/download. Carbon renders real `UIShell`/`Grid`/`Column`; Salt renders real `StackLayout`/`GridLayout`/`BorderLayout`; downloaded code imports them.

### Non-Goals
- **Not** rebuilding the builder's editing surface out of literal DS grid components (owner rejected — reintroduces DS container padding, breaks edit==preview, differs per DS). The editable model stays; only what the resolver *emits* changes.
- **Not** touching the token layer (`theme-next.css`, `--md-sys-*`, `--cds-*`, `--a-*`).
- **Not** PR4 reposition-to-any-side / PR5 responsive (separate threads).
- **Not** inventing DS APIs. Where a DS has no real layout component (Fluent v9), we emit its **idiomatic** layout (`makeStyles` + spacing tokens) and label it honestly — same omission discipline the registry already uses (`componentApiRegistry.ts:14-17`).

---

## 3. Architecture

### 3.1 New layer: `LAYOUT_REGISTRY[ds]`
A parallel registry to the existing component registry, same file or a sibling (`src/lib/layoutRegistry.ts`). It maps a small set of **abstract layout primitives** to each DS's real layout, with **children recursion**:

```ts
export type LayoutPrimitive = "grid" | "stack" | "row" | "appShell" | "split";

export interface LayoutApiEntry {
  imports: ImportRequirement;               // reuse componentApiRegistry's type
  // children already rendered to JSX strings; entry wraps them
  toJsx: (props: LayoutProps2, children: string[]) => string;
}

type LAYOUT_REGISTRY = Record<SystemId, Record<LayoutPrimitive, LayoutApiEntry>>;
```

`LayoutProps2` carries the abstract intent: `columns` (in 12-fr canonical units), per-child `span` (fr), `gap`, `direction`, plus shell regions (`header`/`sidenav`/`main`/`footer`) for `appShell`.

### 3.2 Column normalization lives in one place
The pattern language stays in canonical **12-fr** (matching today's `"6fr"`). The registry owns the per-DS column-count mapping. `layoutResolver.ts` already computes fraction→span in exactly one spot (`computeItemStyle`, lines 87-112) — normalization extends it:

| DS | Native grid | 12-fr canonical → native |
|---|---|---|
| Salt | `GridLayout columns={12}` + `GridItem colSpan` | 1:1 (Salt grid defaults to 12) |
| M3 (MUI) | `Grid container` + `Grid size={n}` (12-col) | 1:1 |
| Carbon | `Grid` + `Column lg={n}` (16-col at lg) | `n16 = round(fr/12 * 16)` |
| Fluent | `makeStyles` CSS grid, `gridColumn: span n` + `tokens.spacing*` gap | 1:1 (idiomatic, not a component) |
| uoaui | `.a-grid` + `--a-*` gap, `grid-column: span n` | 1:1 |

### 3.3 Per-DS layout primitive mapping

| Abstract | Salt | M3 (MUI) | Fluent 2 | Carbon | uoaui |
|---|---|---|---|---|---|
| `grid` | `GridLayout`/`GridItem` | `Grid container`/`Grid size` | `makeStyles` grid* | `Grid`/`Column` | `.a-grid` |
| `stack` (v) | `StackLayout` | `Stack` | `makeStyles` flex-col* | `Stack` (gap) | `.a-stack` |
| `row` (h) | `FlexLayout` | `Stack direction="row"` | `makeStyles` flex-row* | `Stack orientation="horizontal"` | `.a-row` |
| `appShell` | `BorderLayout`/`BorderItem` | `Box` regions | region `makeStyles`* | `UIShell` (`Header`/`SideNav`/`Content`) | `.a-shell` |
| `split` | `SplitLayout` | `Grid` 2-col | `makeStyles` 2-col* | `Grid` 2-col | `.a-split` |

\* Fluent v9 ships no `Grid`/`Stack` component; idiomatic layout = `makeStyles` with `tokens.spacing*`. Emitted as such, labeled in the Code tab as "Fluent idiomatic (no layout component)".

uoaui `.a-grid/.a-stack/.a-row/.a-shell/.a-split` classes are added to `uoauiBuildCSS` (token-driven), since uoaui is className-based.

### 3.4 Render path vs export path — one source
- **Render (live preview + canvas):** `ComponentRenderer` already dispatches blocks through the component registry. Layout containers (zones, `LayoutGroup`) route through `LAYOUT_REGISTRY[ds].<primitive>` to mount the real DS layout component **as the wrapper**, with resolved children inside.
- **Export:** `reactExporter` gains **children recursion** (the one structural exporter change) so a layout container emits `<Grid><Column>…</Column></Grid>` with nested block JSX, and `collectImports` gathers the layout imports.
- **Code tab:** generated from the same pattern def + registry, so preview and Code can never drift again (replaces hand-written `code-snippets.ts` pattern entries).

### 3.5 Builder: editable model preserved (the hard constraint)
- The builder keeps `zoneLayouts` + per-block `layout.width` as the **editable source of truth**. Drag-resize, drag-reorder, span editing are unchanged.
- `layoutResolver` is **repointed**, not removed: in **edit mode** it keeps emitting the lightweight inline grid it does today (so there is **zero extra padding** and **edit stays pixel-identical to preview** — no regression of PR1 #277); in **render-for-output and export** it resolves the same model to the DS's real layout components.
- Concretely: the editable canvas grid is a transparent passthrough (`display:grid; gap` only, no DS container chrome); the **DS layout component is mounted in preview/present + emitted on export**. This is the seam that satisfies "DS owns the grid" without "DS padding leaks into edit."

> **Decision (locks the owner constraint):** the DS layout component must contribute **no extra box-model** (padding/margin/border) in edit mode. Where a DS layout component injects intrinsic padding (e.g. Carbon `Grid` gutters), edit mode neutralizes it via a scoped `--bc-*` override and preview/export restores the real DS spacing. Edit==preview is verified per phase.

### 3.6 Gallery patterns: 40 → 8
The hand-coded `Pat*` renderers across all five `*-documentation.jsx` collapse to **8 DS-agnostic pattern definitions** (one per pattern), each resolved through `LAYOUT_REGISTRY` + the component registry to all 5 DS. `getDemoComponent(ds, patternId)` renders from the shared def instead of per-DS hand code.

---

## 4. Phasing (each phase = its own PR, verified before the next)

Conflict-aware ordering (respects the `builder.css` one-PR-at-a-time race rule from prior sessions):

- **Phase 0 — Layout registry scaffold.** Add `layoutRegistry.ts` with the `grid`/`stack`/`row` primitives for all 5 DS + the 12-fr→native normalization in `layoutResolver`. No surface change yet; unit tests on the normalization math (Carbon 16-col especially). _Oracle: vitest._
- **Phase 1 — Carbon gallery proof.** Re-render the 8 patterns for **Carbon only** from shared defs through the registry (`UIShell`, `Grid`/`Column`, `DataTable`, `Stack`). Owner eyeballs against real IBM Carbon. _Oracle: visual + Code-tab matches preview._
- **Phase 2 — Gallery, remaining 4 DS.** Salt / M3 / Fluent / uoaui patterns from the same defs. Fanned-out workflow, per-DS adversarial visual verify. Deletes the 40 hand-coded `Pat*`.
- **Phase 3 — Builder resolver repoint.** `layoutResolver` emits DS layout in preview/present + export; edit mode unchanged (no padding). _Oracle: edit==preview screenshot diff per DS + drag-resize still works._
- **Phase 4 — Export + Code-tab generation.** `reactExporter` children recursion + layout imports; Code tab generated from registry. _Oracle: `scripts/verify-exports.sh` builds all 5 DS with real layout imports._

---

## 5. Verification (ultracode)

- **Build oracle:** `scripts/verify-exports.sh [ds]` — generates the real Vite bootstrap from fixtures, `npm install`, `tsc -b && vite build`. A phase isn't done until all touched DS pass (5/5 today).
- **Visual oracle:** per-DS, per-pattern screenshot vs the real DS documentation site (Carbon, Salt, Material, Fluent), adversarially verified by independent agents (does this look like *real* Carbon UIShell, not a themed div?).
- **Edit==preview oracle:** screenshot edit vs preview per DS; assert zero box-model delta (guards the owner constraint).
- **Drag oracle:** confirm resize/reorder still function after the resolver repoint.

---

## 6. Risks & open questions

| Risk | Mitigation |
|---|---|
| DS layout component injects intrinsic padding → breaks edit==preview | Phase 3 scoped `--bc-*` neutralization in edit; per-phase edit==preview screenshot gate |
| Carbon 16-col vs canonical 12-fr rounding drifts visually | Normalization unit-tested in Phase 0; round-half-up, clamp [1, native] |
| Fluent has no real layout component | Emit idiomatic `makeStyles` + tokens; label honestly (no fabricated API) |
| `reactExporter` recursion touches export for ALL blocks | Recursion is additive (leaf blocks unchanged); covered by `verify-exports.sh` |
| `builder.css` one-PR race (bit us in #274) | One layout PR in flight at a time; rebase before merge |
| 80-file `ZoneId` coupling | Untouched — we repoint the resolver, not the zone system |

**Open (surface at the relevant phase, don't pre-decide):**
1. uoaui `appShell` — does it get a real `.a-shell` grid, or compose `.a-grid` + `.a-stack`? (Phase 2)
2. Code tab for Fluent — show `makeStyles` block verbatim or a simplified note? (Phase 4)
3. Do the 5 `builderTemplates.ts` templates get re-authored to canonical patterns, or just inherit the repointed resolver? (Phase 3)

---

## 7. Hard constraints (carry into every phase)

- **No extra padding in edit mode; edit stays pixel-identical to preview** (owner). Do not regress PR1 #277.
- **Don't break existing layouts.** Each phase ships only if edit==preview + drag still work + exports build.
- **Branch + PR, never direct-to-main. Never auto-merge** — explicit per-PR go.
- **`builder.css`: one PR in flight at a time**; rebase before merge; verify the artifact on main after squash.
- **Never fabricate a DS API** — omit or emit idiomatic-and-labeled.
