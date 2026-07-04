/* ── P4 "Snap grid (2D)" — the pure quantizer ───────────────────────────────
   A free drop is expressed as ZONE-FRACTIONS (0..1) of the container, never
   pixels (fractions survive zoom / canvas-resize / DS-switch and make
   re-quantizing at a denser grid migration-free). At drop time it is converted
   to representable, export-bound fields and the raw position is DISCARDED:

     width   -> `${n}fr`  (canonical-12, reuses the existing proportional model)
     gridCol -> 1..12     (canonical-12 column start, clamped so start+span fits)
     gridRow -> 0..N      (a SORT KEY only — never a CSS track, so it can't escape
                           the grid; document order is the one thing flexbox and
                           CSS grid honor identically across all 5 DS)

   There is no x/y/left/top field anywhere in the output, so absolute positioning
   cannot leak to export — the moat invariant is enforced at the source.
   ───────────────────────────────────────────────────────────────────────── */

import type { LayoutProps } from "@/store/useBuilder";

/* A free drop, in zone-fractions (0..1). Transient drag-layer input only —
   never stored, never exported. */
export interface FreeDrop {
  xFrac: number; // left edge as a fraction of zone width
  yFrac: number; // top edge as a fraction of zone height
  wFrac: number; // width as a fraction of zone width
  hFrac: number; // height as a fraction of zone height
}

/* The representable result. Only flow fields — no positional keys exist. */
export interface QuantizedLayout {
  width: string; // `${n}fr`
  gridCol: number; // 1..12 canonical column start
  gridRow: number; // 0-based band index, sort key only
}

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

/* Width fraction -> canonical-12 fr span (round to the nearest twelfth, never
   below 1, never above a full row). */
export function quantizeWidth(wFrac: number): number {
  return clamp(Math.round(wFrac * 12), 1, 12);
}

/* Left-edge fraction -> canonical-12 column START. Column N starts at (N-1)/12,
   so the inverse is round(xFrac*12)+1. Clamped so the block (start + its span)
   never overflows the 12-track row — a far-right drop snaps flush to the last
   track that still fits. */
export function quantizeColumn(xFrac: number, widthFr: number): number {
  const start = Math.round(xFrac * 12) + 1;
  return clamp(start, 1, 12 - widthFr + 1);
}

/* Fraction of the SHORTER vertical span that two spans share. Used to decide
   whether two free-dropped blocks belong to the same row. Zero-height spans
   fall back to "any overlap = full" so a degenerate drop still clusters. */
function verticalOverlap(t1: number, b1: number, t2: number, b2: number): number {
  const overlap = Math.max(0, Math.min(b1, b2) - Math.max(t1, t2));
  const minH = Math.min(b1 - t1, b2 - t2);
  return minH > 0 ? overlap / minH : overlap > 0 ? 1 : 0;
}

/* Y-axis -> a coarse ROW index per block (the band-clustering graft from the
   proximity / anchor designs — more intent-faithful than a raw floor(y/band)).
   Blocks are swept top-to-bottom; a block joins the current row band if its
   vertical span overlaps the band's anchor by >50%, else it opens a new band.
   The returned index is a SORT KEY only — it never becomes a CSS grid-row, so
   it can't escape the grid; it just orders the blocks (gridRow asc, then gridCol
   asc) for document order, the one thing flexbox + CSS grid honor identically.
   Returned in the INPUT order. */
export function assignRowBands(drops: FreeDrop[]): number[] {
  const order = drops.map((_, i) => i).sort((a, b) => drops[a].yFrac - drops[b].yFrac);
  const rows = new Array<number>(drops.length).fill(0);
  let band = -1;
  let refTop = 0;
  let refBot = 0;
  for (const i of order) {
    const top = drops[i].yFrac;
    const bot = top + Math.max(0, drops[i].hFrac);
    if (band < 0 || verticalOverlap(top, bot, refTop, refBot) <= 0.5) {
      band += 1;
      refTop = top;
      refBot = bot;
    }
    rows[i] = band;
  }
  return rows;
}

/* Convert a set of free drops (zone-fractions) into representable layouts. The
   X-axis (width + column start) is per-block; the Y-axis is the shared row-band
   assignment. The raw fractions are consumed here and never returned — the
   result is pure flow. */
export function freeQuantize(drops: FreeDrop[]): QuantizedLayout[] {
  const rows = assignRowBands(drops);
  return drops.map((d, i) => {
    const w = quantizeWidth(d.wFrac);
    return { width: `${w}fr`, gridCol: quantizeColumn(d.xFrac, w), gridRow: rows[i] };
  });
}

/* A rendered block's bounding box (screen coords, y down). */
export interface Rect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/* Where in the body array a free-dropped block belongs, in READING order
   (top-to-bottom rows, left-to-right within a row), given the rendered rects of
   the OTHER blocks (in array order). This is the single-drop counterpart to
   assignRowBands: rather than store a gridRow, we translate the 2D drop straight
   into an array index, because array order is already the one ordering authority
   every render surface shares (so canvas == export by construction). A block
   counts as "before" the drop if its center is in an earlier row, or in the same
   row (within half its height) and to the left. Returns 0..rects.length. */
export function insertionIndexForDrop(point: { x: number; y: number }, rects: Rect[]): number {
  let idx = 0;
  for (const r of rects) {
    const cy = (r.top + r.bottom) / 2;
    const cx = (r.left + r.right) / 2;
    const rowEps = (r.bottom - r.top) / 2;
    let before: boolean;
    if (cy < point.y - rowEps) before = true; // clearly an earlier row
    else if (cy > point.y + rowEps) before = false; // clearly a later row
    else before = cx < point.x; // same row -> left of the drop comes first
    if (before) idx += 1;
  }
  return idx;
}

/* A free-dropped block's default layout, snapped to the grid by the drop's
   content-box x-fraction. Two cases:
     - explicit non-fr width ('auto' / 'fill' / px / %): an intentionally sized
       block (e.g. a hug-content checkbox / switch / Spacer). A sized width in a
       grid already renders as a span and a column pin on a non-spanning block is
       meaningless, so keep the layout untouched. This is what stops a checkbox
       dropped in Snap-grid mode from becoming a half-row "selected bar".
     - fr-width OR unsized: snap to a canonical-12 span (half width when unsized,
       so the column pin is actually visible) and pin the dropped column.
   Pure + moat-safe: it only ever returns flow fields (width / gridCol), never
   x/y/left/top, so absolute positioning cannot leak to export. */
export function layoutForFreeDrop(base: LayoutProps, xFrac: number): LayoutProps {
  const w = base.width;
  if (typeof w === "string" && !w.endsWith("fr")) return { ...base };
  const baseFr = typeof w === "string" ? parseFloat(w) / 12 : 0.5;
  const widthFr = quantizeWidth(baseFr);
  return { ...base, width: `${widthFr}fr` as LayoutProps["width"], gridCol: quantizeColumn(xFrac, widthFr) };
}

/* Reposition an EXISTING block: re-pin its grid column from the drop's
   content-box x-fraction WITHOUT changing its width (a move, not a resize —
   width has its own resize handles). Only a block that actually spans (fr width)
   carries a column pin; hug / fill / full-row blocks ignore gridCol, so they are
   returned untouched (and never gain a meaningless pin). The block's own current
   span clamps the new start so start + span never overflows the row. An absent
   layout is returned as-is. Moat-safe: only ever touches gridCol. */
export function regridExistingBlock(layout: LayoutProps | undefined, xFrac: number): LayoutProps | undefined {
  const w = layout?.width;
  if (typeof w !== "string" || !w.endsWith("fr")) return layout;
  const span = Math.max(1, Math.min(12, Math.round(parseFloat(w) || 1)));
  return { ...layout, gridCol: quantizeColumn(xFrac, span) };
}
