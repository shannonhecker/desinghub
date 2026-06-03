# Builder: edit/preview parity + zone customization — design

Date: 2026-06-03 · Status: approved (owner chose "all 5 together", full edge-dock model)

## Problem (owner's 5 asks)

1. Remove the "weird padding" (left indent) on the builder canvas in edit mode.
2. The `+` insert button should only show on hover (not reserve space).
3. Edit mode should look **exactly** like preview, just with editability.
4. Move the **Compare** control into preview/present mode too.
5. Make the **header** and **left panel** customisable: removable, resizable, and dockable to **any side**.

## Recon findings (what exists today)

- **One shared render path:** `BuilderCanvas` (`PreviewPanel.tsx`) renders in edit, preview side-panel, and present (`PresentStage.tsx`). Edit vs preview is gated by `data-builder-mode` + CSS `display:none` on ~14 chrome classes, plus a `PreviewReadOnlyContext`. So "edit = preview + editing chrome" is already structurally true.
- **Insertion slots** (`InsertionSlot.tsx`, `builder.css:13037+`): idle `--bc-size-slot: 4px` with `--bc-gap-xxs: 2px` negative margins each side → **net-zero between items**. Expands to `--bc-size-slot-hover: 20px` on hover; the `+` is already `opacity:0 → 1` on hover. The visible "padding"/shift is the **leading slot's hover-expand shifting layout** and/or zone padding — to be pinned by live inspection, not assumed.
- **Compare:** `useBuilder.compareMode` (+ `toggleCompareMode`); button currently in the edit overflow menu (`PreviewPanel.tsx:559`). `PresentBar` already *reads* `compareMode` (hides device picker, static DS badge) but has no toggle.
- **Zones:** `ZoneId = body|header|sidebar|footer` (`useBuilder.ts`). `zoneLayouts` map holds per-zone mode/cols/gap/padding. Positions are **hardcoded** (header top, sidebar left, footer bottom). Sidebar is **already runtime-resizable** (`dashSidebarWidth`). No removability, no reposition. `ZoneId` is referenced across 80+ files.

## Design

### Bucket A — parity + Compare (PR1, low-risk)

- **#1/#2/#3:** Make editing chrome reserve **zero** idle layout space so the edit canvas matches preview pixel-for-pixel, while keeping the gap **hoverable** (so the `+` still appears) and **drop-targetable during drag**. Concretely: idle slot size 0 but expand on `:hover`/`:focus-within` AND while a drag is active (a drag-state class), with `overflow: visible` so the button escapes. Exact selector + leading-slot/zone-padding fix confirmed by live computed-style inspection before committing.
- **#4:** Add a Compare toggle to `PresentBar` (after theme, before Share), `toggleCompareMode()`; keep the edit-overflow entry too ("too").
- **Verify:** screenshot edit vs preview of the same canvas; layouts must be identical.

### Bucket B — edge-dock zone customization (PR2-5)

**Model:** full edge-dock — every peripheral zone (header, sidebar, footer) can dock to any of top/bottom/left/right, be resized, or removed. Body is the fixed center.

- **State (`useBuilder`):** `zoneLayout: Record<ZoneId, { edge: 'top'|'bottom'|'left'|'right'; size: number; visible: boolean; order: number }>`. Defaults: header=top, sidebar=left, footer=bottom. Actions: `setZoneEdge`, `setZoneSize`, `setZoneVisible`, `reorderZoneOnEdge`.
- **Layout engine (`BuilderCanvas`):** replace hardcoded zone placement with a shell driven by `zoneLayout` — top/bottom edges are horizontal bars (size = height), left/right are vertical panels (size = width); multiple zones on one edge stack by `order`. Likely CSS grid with computed `grid-template-areas`.
- **Interactions:** drag handle → edge drop-targets → re-dock (reuse `@dnd-kit`); resize handle on every edge (generalise the sidebar handle); `×` to remove (blocks retained); "+ add panel" menu to re-add hidden zones.
- **Persistence:** add `zoneLayout` to project save + `SharedCanvas` (share links), with sane decode defaults for older links.
- **Responsive:** narrow viewport collapses side panels (extend the existing responsive sidebar-hide); refined in PR5.

### Defaults (owner may veto)

- Dockable zones = header + sidebar + footer; body stays center.
- Remove = hide (blocks retained), not delete.
- Same-edge panels stack in drop order.
- Mobile collapses side panels.

## Phasing (sequential PRs — respects the `builder.css` one-PR-at-a-time race)

1. **PR1** — parity (idle-zero chrome) + Compare-in-preview. *(low risk; fixes the screenshots)*
2. **PR2** — `zoneLayout` state + removable zones + persistence.
3. **PR3** — resizable zones on all edges.
4. **PR4** — reposition engine + drag-to-dock UI.
5. **PR5** — responsive polish + edge cases.

## Risks

- `builder.css` one-PR-at-a-time race → strictly sequential PRs.
- Builder canvas is hard to verify headless (login + onboarding + float-chat); verify via `/builder?shared=<hash>` (bypasses onboarding) on local `next start`, screenshotting edit vs preview.
- `ZoneId` reposition touches 80+ files: `resolveDestinationZone` must skip hidden zones and route to the next visible edge.
- Idle-zero slots must remain drop-targetable during drag — do not regress drag-to-insert.
