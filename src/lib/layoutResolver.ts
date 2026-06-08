/**
 * Layout resolver - single source of truth for turning a block's
 * optional `layout` metadata (+ the container's `ZoneLayout`) into
 * the inline CSS needed to position it inside a flex / grid / stack
 * container.
 *
 * Design goals:
 * - One helper the renderer calls; no ad-hoc logic scattered across
 *   PreviewCanvas / SortableBlock / ComponentRenderer.
 * - Backward compatible: a block with no `layout` but `props.colSpan`
 *   still gets the 1/2/3 column widths the pre-flex Builder rendered.
 * - All width tokens normalised to concrete CSS strings so the
 *   container and item agree (e.g. "50%" stays percentage, "240px"
 *   stays fixed, "auto" flips flex-grow off).
 * - Behaviour documented per mode so future sub-phases (min/max
 *   constraints, alignment overrides, LayoutGroup nesting) have
 *   a stable contract to read.
 */

import type { Block, LayoutProps, LayoutWidth, ZoneLayout, LayoutJustify } from "@/store/useBuilder";
import { normalizePadding, normalizeGap } from "@/store/useBuilder";
import type { SystemId } from "@/lib/componentApiRegistry";

/* Translate a LayoutWidth token to a CSS length string, or `null`
   for special modes (auto/fill) that flow through other properties.
   Bare numbers are treated as pixels. */
function toCss(w: LayoutWidth | undefined): string | null {
  if (w === undefined) return null;
  if (typeof w === "number") return `${w}px`;
  if (w === "fill" || w === "auto") return null;
  return w;
}

/* Sliver guard: a block sized to an extremely small EXPLICIT width (a typo'd
   "3%", a fat-fingered px) collapses to an unusable column and its content
   ladders character-by-character. When the block carries no explicit minWidth,
   floor it so it degrades to a readable minimum instead of breaking. Scoped to
   TINY explicit widths only — auto / fill / normal percentages and any block
   that sets its own minWidth are untouched, so intentionally-narrow inline
   blocks (chips, badges) keep their size. This is the single render-time
   chokepoint, so it heals slivers from any entry path AND already-saved
   projects, not just new input. */
const SLIVER_MIN_PX = 80;
function isTinyWidth(w: LayoutWidth | undefined): boolean {
  if (typeof w === "number") return w > 0 && w < 60;
  if (typeof w === "string") {
    if (w.endsWith("px")) { const n = parseFloat(w); return n > 0 && n < 60; }
    if (w.endsWith("%")) { const n = parseFloat(w); return n > 0 && n < 10; }
  }
  return false;
}

/* Map colSpan 1|2|3 to a percentage width so old templates keep
   looking right in the new flex body. Anything outside 1..3 is
   treated as "fill" (100%). Exported so the one-time colSpan→width
   migration (blockMigrations.ts) shares this exact mapping. */
export function colSpanToWidth(colSpan: unknown): LayoutWidth | undefined {
  const n = Number(colSpan);
  if (!Number.isFinite(n)) return undefined;
  if (n === 1) return "33.333%";
  if (n === 2) return "66.666%";
  if (n === 3) return "fill";
  return undefined;
}

/* Each DS's native grid column count. Canonical pattern widths are authored in
   12-fr; Carbon's grid is 16-col, the rest are 12. The layout registry is the
   ONLY place this normalization happens, so one pattern def lands correctly on
   every DS's real grid. (Verified against installed packages: @carbon/react
   Column supports lg up to 16; Salt GridLayout / MUI Grid default to 12.) */
export function nativeColumnsFor(ds: SystemId): number {
  return ds === "carbon" ? 16 : 12;
}

/* Map a canonical 12-fr span to a DS's native column count. round-half-up,
   clamped to [1, nativeCols]. Non-finite fr (an unsized block) spans the full
   native row. */
export function normalizeColumns(fr: number, nativeCols: number): number {
  if (!Number.isFinite(fr)) return nativeCols;
  const scaled = Math.round((fr / 12) * nativeCols);
  return Math.max(1, Math.min(nativeCols, scaled));
}

/* Resolve the effective layout for a block given its container mode.
   Merges, in priority order: the block's own `layout`, a colSpan
   fallback from `props`, and defaults implied by the container. */
function effectiveLayout(block: Block, containerMode: ZoneLayout["mode"]): LayoutProps {
  const explicit = block.layout ?? {};
  /* colSpan back-compat: if no explicit width was set on the block's
     `layout` object, derive it from the legacy `props.colSpan`. */
  if (explicit.width === undefined) {
    const legacy = colSpanToWidth(block.props.colSpan);
    if (legacy !== undefined) {
      return { ...explicit, width: legacy };
    }
  }
  /* Stack containers default every child to width: "fill" so the
     old sidebar/header behaviour (each item full-width of the
     column) still holds. Row + Grid containers leave it undefined
     so the flex engine decides. */
  if (explicit.width === undefined && containerMode === "stack") {
    return { ...explicit, width: "fill" };
  }
  return explicit;
}

/* Counter-axis (height) sizing — P3 height engine. Mirrors the width
   contract on the LayoutWidth union but writes the height / minHeight /
   maxHeight / align-self properties:
     'auto'       → Hug   (content height; nothing emitted, the box hugs)
     'fill'       → Fill  (stretch to the container). In stack mode the
                    item is the MAIN axis (flex-grow vertically); in
                    row / grid mode height is the CROSS axis, so we stretch
                    via alignSelf:stretch (+ height:100% as a definite-parent
                    fallback so it works even when the row has a height).
     '{N}px/%/fr' → Fixed (explicit height).
   Mutates `style` in place. Height is undefined on pre-P3 saved blocks, so
   this is a no-op for them (full back-compat — the box renders as before). */
function applyHeight(style: React.CSSProperties, layout: LayoutProps, mode: ZoneLayout["mode"]): void {
  const h = layout.height;
  if (h === undefined) {
    /* Hug is the implicit default. Still honour explicit min/max so a
       content-sized box can be floored / capped without setting a height. */
    const minH = toCss(layout.minHeight);
    const maxH = toCss(layout.maxHeight);
    if (minH) style.minHeight = minH;
    if (maxH) style.maxHeight = maxH;
    return;
  }
  if (h === "auto") {
    style.height = "auto";
  } else if (h === "fill") {
    if (mode === "stack") {
      /* Stack = vertical main axis: grow to fill remaining column height.
         The width logic owns the cross axis (horizontal) here, so setting
         flex-grow for vertical fill is safe and additive. */
      style.flexGrow = 1;
      style.height = "100%";
    } else {
      /* Row / grid = height is the cross axis → stretch. */
      style.alignSelf = "stretch";
      style.height = "100%";
    }
  } else {
    /* Fixed: px / % / fr (fr is non-sensical for a single box → treat as the
       raw string, CSS will ignore an invalid value gracefully). */
    const hCss = toCss(h);
    if (hCss) style.height = hCss;
  }
  const minH = toCss(layout.minHeight);
  const maxH = toCss(layout.maxHeight);
  if (minH) style.minHeight = minH;
  if (maxH) style.maxHeight = maxH;
}

/* Compute the inline style object applied to a block's wrapper.
   Items are placed by their container (flex or grid); this helper
   just controls sizing + growth. The container class handles the
   flow. */
export function computeItemStyle(
  block: Block,
  zoneLayout: ZoneLayout,
): React.CSSProperties {
  const layout = effectiveLayout(block, zoneLayout.mode);

  const style: React.CSSProperties = { position: "relative" };

  const widthCss = toCss(layout.width);
  const minCss = toCss(layout.minWidth);
  const maxCss = toCss(layout.maxWidth);

  /* Grid-mode container: items use gridColumn span when the width
     is a fraction (fr) OR a legacy colSpan is present; percentage
     and pixel widths still apply as overrides. */
  if (zoneLayout.mode === "grid") {
    const cols = zoneLayout.columns ?? 3;
    const w = layout.width;
    if (typeof w === "string" && w.endsWith("fr")) {
      const fr = parseFloat(w);
      if (Number.isFinite(fr)) {
        /* fr-mode items span `round(fr)` columns out of the grid's
           column count. Defaults to 1 if invalid. */
        const span = Math.max(1, Math.min(cols, Math.round(fr)));
        style.gridColumn = `span ${span}`;
      }
    } else if (typeof w === "string" && w.endsWith("%")) {
      /* Percentage in a grid maps to a proportional column span
         (e.g. 50% of a 12-col grid = span 6) so the item occupies a
         real slice of the row instead of auto-placing into one track. */
      const pct = parseFloat(w);
      if (Number.isFinite(pct)) {
        const span = Math.max(1, Math.min(cols, Math.round((pct / 100) * cols)));
        style.gridColumn = `span ${span}`;
      }
    } else if (w === "fill" || w === undefined) {
      /* fill / unset spans the full row. This is the fix for blocks
         (charts, tables) collapsing into a single 1/N track when a
         template sets width:"fill" in a grid body, or when an unsized
         block lands on the now-default 12-col grid. */
      style.gridColumn = "1 / -1";
    } else if (widthCss) {
      /* A fixed-px block is narrower than its auto-placed 1fr track, so pin it
         to the start of the track instead of letting it float centered — the
         resize-recenter bug (#298). The fill / span branches above set
         `gridColumn` and must keep stretching to their span, so they are
         deliberately left un-pinned (no container-level justify-items:start). */
      style.width = widthCss;
      style.justifySelf = "start";
    }
    if (minCss) style.minWidth = minCss;
    else if (isTinyWidth(layout.width)) style.minWidth = `${SLIVER_MIN_PX}px`;
    if (maxCss) style.maxWidth = maxCss;
    if (layout.align) style.alignSelf = layout.align;
    if (layout.margin) style.margin = `${layout.margin}px`;
    /* Counter-axis height (Hug/Fill/Fixed). align-self is set by `layout.align`
       above when present; applyHeight only overrides it for fill on the cross
       axis (grid). */
    applyHeight(style, layout, zoneLayout.mode);
    return style;
  }

  /* Flex containers (row / stack): set flex-basis + flex-grow +
     width based on the mode. */
  const grow = layout.grow ?? (layout.width === "fill" ? 1 : 0);
  const shrink = layout.width === "auto" || typeof layout.width === "number" || (typeof layout.width === "string" && layout.width.endsWith("px")) ? 0 : 1;

  if (layout.width === "auto") {
    style.flex = `0 0 auto`;
    style.width = "auto";
  } else if (layout.width === "fill" || layout.width === undefined) {
    /* Row mode: fill = take remaining row space, but respect content
       minimum so blocks wrap to the next row instead of squishing to
       zero. flex-basis: auto lets items report their intrinsic width,
       so flex-wrap engages when the sum overflows the container.
       Stack mode: fill = stretch to container width (100%). */
    if (zoneLayout.mode === "row") {
      style.flex = "1 1 auto";
      style.minWidth = minCss || "min-content";
    } else {
      style.width = "100%";
    }
  } else if (widthCss) {
    /* Fixed px, %, or fr-in-flex-container: use flex-basis.
       Row mode adds `gap` BETWEEN items on top of their flex-basis, so
       N items at (100/N)% overflow the line and the last wraps (the
       classic flex gap-vs-percentage trap). For a PERCENTAGE width in a
       row, subtract one gap from the basis so a row summing to <=100%
       fits on one line instead of wrapping; genuine overflow (widths
       summing to >100%) still wraps. px is left literal (an explicit
       fixed size), auto/fill are handled above, and stack mode is
       excluded because its gap runs along the cross axis (vertical). */
    /* The row %-width trap is about the MAIN-axis (between-column) gap, so use
       the object form's `col` when present, else the uniform value (legacy
       number normalizes to col === row). */
    const gapObj = normalizeGap(zoneLayout.gap);
    const gap = gapObj?.col ?? 0;
    const gapAware =
      zoneLayout.mode === "row" &&
      gap > 0 &&
      typeof layout.width === "string" &&
      layout.width.endsWith("%");
    const basis = gapAware ? `calc(${widthCss} - ${gap}px)` : widthCss;
    style.flex = `${grow} ${shrink} ${basis}`;
    style.width = basis;
  }

  if (minCss && layout.width !== "fill") style.minWidth = minCss;
  else if (!minCss && isTinyWidth(layout.width)) style.minWidth = `${SLIVER_MIN_PX}px`;
  if (maxCss) style.maxWidth = maxCss;
  if (layout.align) style.alignSelf = layout.align;
  if (layout.margin) style.margin = `${layout.margin}px`;

  /* Counter-axis height (Hug/Fill/Fixed) for flex (row / stack) containers. */
  applyHeight(style, layout, zoneLayout.mode);

  return style;
}

/* Main-axis distribution → CSS. justify-content (flex) and justify-items (grid)
   take different value sets, so map each. Default `start` pins items to the
   start of their track — without it a sub-span / fixed-width grid item floats
   centered, which was the resize-recenter bug (#298). */
const FLEX_JUSTIFY: Record<LayoutJustify, NonNullable<React.CSSProperties["justifyContent"]>> = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  "space-between": "space-between",
  "space-around": "space-around",
};
const GRID_JUSTIFY_ITEMS: Record<LayoutJustify, NonNullable<React.CSSProperties["justifyItems"]>> = {
  start: "start",
  center: "center",
  end: "end",
  // justify-items has no space-* value; pin items to start and let the
  // grid tracks distribute via justify-content below.
  "space-between": "start",
  "space-around": "start",
};

/* Inline style for the container itself. Picks flex-direction,
   wrap, gap, padding, align-items, and main-axis justify based on the ZoneLayout. */
export function computeContainerStyle(zoneLayout: ZoneLayout): React.CSSProperties {
  const base: React.CSSProperties = {};
  /* P5 padding — normalize the legacy number / new {t,r,b,l} object to one
     shape, then emit compact `padding` when uniform (identical to the legacy
     single-number output) or explicit per-side properties otherwise. A 0 on
     every side is a no-op (matches the old `if (zoneLayout.padding)` truthiness
     for a 0 number). */
  const pad = normalizePadding(zoneLayout.padding);
  if (pad && (pad.t || pad.r || pad.b || pad.l)) {
    if (pad.t === pad.r && pad.r === pad.b && pad.b === pad.l) {
      base.padding = `${pad.t}px`;
    } else {
      base.paddingTop = `${pad.t}px`;
      base.paddingRight = `${pad.r}px`;
      base.paddingBottom = `${pad.b}px`;
      base.paddingLeft = `${pad.l}px`;
    }
  }
  /* P5 gap — normalize the legacy number / new {row,col} object; emit compact
     `gap` when both axes match (identical to the legacy single-number output)
     or rowGap/columnGap otherwise. */
  const gap = normalizeGap(zoneLayout.gap);
  if (gap) {
    if (gap.row === gap.col) base.gap = `${gap.row}px`;
    else {
      base.rowGap = `${gap.row}px`;
      base.columnGap = `${gap.col}px`;
    }
  }

  if (zoneLayout.mode === "grid") {
    const cols = zoneLayout.columns ?? 3;
    base.display = "grid";
    base.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    base.alignItems = zoneLayout.align ?? "start";
    /* Additive: only emit justify when the user sets one. Leaving it unset
       keeps the default justify-items behavior (stretch) so fill / span items
       fill their column span — forcing `start` here would shrink them. */
    if (zoneLayout.justify) {
      base.justifyItems = GRID_JUSTIFY_ITEMS[zoneLayout.justify];
      if (zoneLayout.justify === "space-between" || zoneLayout.justify === "space-around") {
        base.justifyContent = zoneLayout.justify;
      }
    }
    return base;
  }

  base.display = "flex";
  if (zoneLayout.justify) base.justifyContent = FLEX_JUSTIFY[zoneLayout.justify];
  base.flexDirection = zoneLayout.mode === "stack" ? "column" : "row";
  /* Stack mode defaults to nowrap (items flow down, never into a
     second column). Row mode defaults to wrap (overflow items
     hop to the next line rather than overflowing horizontally).
     Either default can be overridden by an explicit `wrap` in
     ZoneLayout. */
  const defaultWrap = zoneLayout.mode === "stack" ? false : true;
  const wrap = zoneLayout.wrap ?? defaultWrap;
  base.flexWrap = wrap ? "wrap" : "nowrap";
  base.alignItems = zoneLayout.align ?? (zoneLayout.mode === "stack" ? "stretch" : "flex-start");
  return base;
}

/* Derive a ZoneLayout-shaped config from a LayoutGroup block's
   props so the same computeContainerStyle helper styles both zones
   and groups. Missing / invalid values fall through to sensible
   defaults matching the LayoutGroup blueprint registered in
   `blockRegistry.tsx`. */
export function computeGroupStyle(block: Block): React.CSSProperties {
  const rawDir = block.props.direction;
  const mode: ZoneLayout["mode"] = rawDir === "row" || rawDir === "grid" ? rawDir : "stack";
  const gapRaw = Number(block.props.gap);
  const padRaw = Number(block.props.padding);
  const synthetic: ZoneLayout = {
    mode,
    gap: Number.isFinite(gapRaw) ? gapRaw : 12,
    padding: Number.isFinite(padRaw) ? padRaw : 0,
    /* Stacks inside a group should never wrap to a second column,
       and rows inside a group share the parent row's wrap setting
       by default. */
    wrap: mode === "stack" ? false : true,
    align: mode === "stack" ? "stretch" : "start",
  };
  return computeContainerStyle(synthetic);
}

/* Compute the per-item style for a child of a LayoutGroup. Mirrors
   computeItemStyle but uses a synthetic ZoneLayout so nested items
   honour the group's own direction/gap instead of the body zone's. */
export function computeGroupItemStyle(block: Block, group: Block): React.CSSProperties {
  const rawDir = group.props.direction;
  const mode: ZoneLayout["mode"] = rawDir === "row" || rawDir === "grid" ? rawDir : "stack";
  /* Thread the group's gap so row-group children get the same gap-aware
     percentage basis as zone children (computeGroupStyle defaults an
     absent gap to 12). */
  const gapRaw = Number(group.props.gap);
  const synthetic: ZoneLayout = { mode, gap: Number.isFinite(gapRaw) ? gapRaw : 12 };
  return computeItemStyle(block, synthetic);
}

/* Convenience: the current flex-colSpan for a block. Kept for the
   SortableBlock colSpan-cycle button until it's replaced by the
   Inspector width control in sub-phase 5. Returns 1|2|3 computed
   from layout.width when possible, else from props.colSpan, else 3. */
export function deriveColSpan(block: Block): number {
  const w = block.layout?.width;
  if (typeof w === "string") {
    if (w.endsWith("%")) {
      const pct = parseFloat(w);
      if (pct >= 99) return 3;
      if (pct >= 55) return 2;
      return 1;
    }
    if (w === "fill") return 3;
  }
  const legacy = Number(block.props.colSpan);
  if (legacy === 1 || legacy === 2 || legacy === 3) return legacy;
  return 3;
}
