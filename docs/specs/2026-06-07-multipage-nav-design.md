# Multi-page builder — design spec (Option B: full page-tree + routed export)

**Status:** approved (owner picked Option B, 2026-06-07). Build phased.
**Goal:** sidebar nav tabs (Overview/Events/Users/…) become real pages — clicking a tab loads its own editable body, and the user authors content per page. Header/sidebar/footer are shared chrome. Export emits real Next.js routes.

## Why this is low-risk despite being a big feature

The two hardest pieces already exist:
- **4-zone split** (`useBuilder.ts:13` `ZoneId = body|header|sidebar|footer`) means only the **body** must become per-page; header/sidebar/footer stay shared.
- **Edit-vs-navigate seam exists**: `usePreviewReadOnly()` threads through `PreviewPanel.tsx:811` + `ComponentRenderer.tsx:755`; the live NavItem onClick is already `readOnly`-gated (`PreviewPanel.tsx:854`). In edit a click selects; in preview it should navigate.

## Data model

```ts
interface Page { id: string; name: string; body: Block[]; bodyLayout?: ZoneLayout }
// added to BuilderState:
pages: Page[];
activePageId: string;
// NavItem.props gains a link target (explicit binding, B):
target?: { kind: 'page' | 'url' | 'anchor'; pageId?: string; href?: string; anchorId?: string }
```

- `s.blocks` stays the **live body mirror** = `pages[activePageId].body`, re-pointed on every page switch — so all existing body mutations (`setBlocks`, `addBlockFromLibrary`, group ops at useBuilder `:419-490`) keep working unchanged.
- Header/sidebar/footer + their `zoneLayouts` stay top-level (shared chrome).

## Resolved decisions (defaults — veto any)

1. **Chrome:** header/sidebar/footer fully shared across pages in v1. (Per-page chrome override deferred.)
2. **Nav binding:** explicit `target` (B), but **auto-nav default** — adding a NavItem auto-creates + binds a new empty page; the inspector dropdown can re-point it. `url`/`anchor` targets are Phase 5.
3. **Edit-mode click:** clicking a sidebar tab in **edit** switches the canvas to that page (so the author can edit its body) **and** selects the NavItem (inspector shows props + binding). In **preview/present** it navigates only. Matches "click tab → add page content."
4. **Provisioning:** templates seed N pages (page 1 = template content, others empty) so every tab works immediately; a manually-added NavItem auto-creates its page.
5. **Scope:** general Pages capability — a Pages panel (add/rename/duplicate/remove/reorder).
6. **Export:** Next.js route-per-page + shared `layout.tsx` hoisting header/sidebar/footer. Single-page projects still export as today (back-compat).
7. **Deletion:** block deleting the last page; deleting a NavItem warns + offers to delete its bound page; deleting a page unbinds/removes its NavItem.

## Phasing (each phase ships independently; respect builder.css one-PR-at-a-time)

- **Phase 1 — foundation (this session):** `pages[]` + `activePageId` in store (blocks-as-mirror), `setActivePage`/`addPage` (+ implicit-single-page migration in-memory), NavItem click switches page in preview AND edit, active-tab `aria-current`. Tests. PR1 (store, no css) + PR2 (nav wiring + active css).
- **Phase 2 — persistence:** `CanvasSnapshot` pages-aware (undo across page swaps), `TRACKED_KEYS += activePageId,pages`, `ProjectSnapshot` optional `pages?` + `loadProject` legacy migration, share `v:2`.
- **Phase 3 — authoring:** Pages panel (add/rename/duplicate/remove/reorder) + NavItem binding inspector (page dropdown). builder.css — solo PR.
- **Phase 4 — routed export:** Next.js app-router folders + shared `layout.tsx`.
- **Phase 5 — polish:** url/anchor targets, nested/dropdown nav, multi-page template variants.

## Back-compat

Existing single-canvas projects/sessions/share-links load as one implicit page: `pages = [{ id: firstSidebarNavId ?? 'p0', name: 'Page 1', body: blocks, bodyLayout: zoneLayouts.body }]`. Persistence fields are added as optional with fallbacks (mirrors how `zoneLayouts` was added).

## Key files

`useBuilder.ts` (state + actions), `PreviewPanel.tsx:793,854` (DashboardSidebar native nav render + onClick), `builderHistory.ts:28-44` (snapshot), `useAutoSave.ts:34` (TRACKED_KEYS), `firebase.ts:60` (ProjectSnapshot), `shareState.ts:29` (SharedCanvas v:1), `src/lib/export/reactExporter.ts:205-208` (zone render), `applyTemplate.ts:20-38`, `builderTemplates.ts` (seed pages).
