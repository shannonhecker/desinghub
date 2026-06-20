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
