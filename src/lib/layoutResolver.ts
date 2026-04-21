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

import type { Block, LayoutProps, LayoutWidth, ZoneLayout } from "@/store/useBuilder";

/* Translate a LayoutWidth token to a CSS length string, or `null`
   for special modes (auto/fill) that flow through other properties.
   Bare numbers are treated as pixels. */
function toCss(w: LayoutWidth | undefined): string | null {
  if (w === undefined) return null;
  if (typeof w === "number") return `${w}px`;
  if (w === "fill" || w === "auto") return null;
  return w;
}

/* Map colSpan 1|2|3 to a percentage width so old templates keep
   looking right in the new flex body. Anything outside 1..3 is
   treated as "fill" (100%). */
function colSpanToWidth(colSpan: unknown): LayoutWidth | undefined {
  const n = Number(colSpan);
  if (!Number.isFinite(n)) return undefined;
  if (n === 1) return "33.333%";
  if (n === 2) return "66.666%";
  if (n === 3) return "fill";
  return undefined;
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
    const w = layout.width;
    if (typeof w === "string" && w.endsWith("fr")) {
      const fr = parseFloat(w);
      if (Number.isFinite(fr)) {
        /* fr-mode items span `round(fr)` columns out of the grid's
           column count. Defaults to 1 if invalid. */
        const span = Math.max(1, Math.min(zoneLayout.columns ?? 3, Math.round(fr)));
        style.gridColumn = `span ${span}`;
      }
    } else if (widthCss) {
      style.width = widthCss;
    }
    if (minCss) style.minWidth = minCss;
    if (maxCss) style.maxWidth = maxCss;
    if (layout.align) style.alignSelf = layout.align;
    if (layout.margin) style.margin = `${layout.margin}px`;
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
    /* Fixed px, %, or fr-in-flex-container: use flex-basis. */
    style.flex = `${grow} ${shrink} ${widthCss}`;
    style.width = widthCss;
  }

  if (minCss && layout.width !== "fill") style.minWidth = minCss;
  if (maxCss) style.maxWidth = maxCss;
  if (layout.align) style.alignSelf = layout.align;
  if (layout.margin) style.margin = `${layout.margin}px`;

  return style;
}

/* Inline style for the container itself. Picks flex-direction,
   wrap, gap, padding, and align-items based on the ZoneLayout. */
export function computeContainerStyle(zoneLayout: ZoneLayout): React.CSSProperties {
  const base: React.CSSProperties = {};
  if (zoneLayout.padding) base.padding = `${zoneLayout.padding}px`;
  if (zoneLayout.gap !== undefined) base.gap = `${zoneLayout.gap}px`;

  if (zoneLayout.mode === "grid") {
    const cols = zoneLayout.columns ?? 3;
    base.display = "grid";
    base.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    base.alignItems = zoneLayout.align ?? "start";
    return base;
  }

  base.display = "flex";
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
