/* Pure placement rule for the block toolbar (HoverInspector). The pill sits
   OUTSIDE the block: above its top-right edge first (slid left past the
   zone's layout toolbar when that is in the way, so the two share a row),
   then above-left, then below. A place is free when the pill is inside the
   bounds and covers no obstacle: obstacles are other blocks' CONTENT (text,
   controls, charts), not their empty padding, plus the layout toolbar. Only
   when no outside place is free does the pill go inside the block, at the
   corner where it covers the least of the block's own content. Screen
   pixels throughout. */
export type Rect = { left: number; top: number; right: number; bottom: number };
export type Placement =
  | "above-right" | "above-left" | "below-right" | "below-left"
  | "inside" | "inside-tl" | "inside-br" | "inside-bl" | "inside-middle";
export interface Placed { placement: Placement; /** px the pill slides left from the block's right edge */ shift: number }

const intersects = (a: Rect, b: Rect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
const area = (a: Rect, b: Rect) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
const within = (a: Rect, b: Rect) => a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;

export function placeToolbarAt(
  block: Rect,
  obstacles: Rect[],
  bars: Rect[],
  own: Rect[],
  bounds: Rect,
  pill: { width: number; height: number; gap: number; barGap?: number },
): Placed {
  const { width: w, height: h, gap } = pill;
  const barGap = pill.barGap ?? 8;
  const above = { top: block.top - gap - h, bottom: block.top - gap };
  const below = { top: block.bottom + gap, bottom: block.bottom + gap + h };
  const outside: Array<[Placement, number, Rect]> = [];
  const push = (name: Placement, band: { top: number; bottom: number }, shift: number, leftAligned: boolean) => {
    const r = leftAligned
      ? { left: block.left, right: block.left + w, ...band }
      : { left: block.right - shift - w, right: block.right - shift, ...band };
    outside.push([name, shift, r]);
  };
  for (const [name, band] of [["above-right", above], ["below-right", below]] as const) {
    push(name, band, 0, false);
    /* Slide left past a layout toolbar in the same band: one row, 8px apart. */
    for (const bar of bars) {
      if (bar.top < band.bottom && bar.bottom > band.top && bar.left < block.right && bar.right > block.right - w) {
        push(name, band, Math.max(0, block.right - (bar.left - barGap)), false);
      }
    }
    push(name === "above-right" ? "above-left" : "below-left", band, 0, true);
  }
  /* Above first (right, slid, left), then below. */
  outside.sort((a, b) => (a[0].startsWith("above") ? 0 : 1) - (b[0].startsWith("above") ? 0 : 1));
  const all = obstacles.concat(bars);
  for (const [name, shift, r] of outside) {
    if (!within(r, bounds)) continue;
    if (all.some((o) => intersects(r, o))) continue;
    return { placement: name, shift };
  }
  /* No outside place: inside, at the corner covering the least own content. */
  const tall = block.bottom - block.top >= h + 2 * gap;
  if (!tall) return { placement: "inside-middle", shift: 0 };
  const corners: Array<[Placement, Rect]> = [
    ["inside", { left: block.right - gap - w, right: block.right - gap, top: block.top + gap, bottom: block.top + gap + h }],
    ["inside-br", { left: block.right - gap - w, right: block.right - gap, top: block.bottom - gap - h, bottom: block.bottom - gap }],
    ["inside-tl", { left: block.left + gap, right: block.left + gap + w, top: block.top + gap, bottom: block.top + gap + h }],
    ["inside-bl", { left: block.left + gap, right: block.left + gap + w, top: block.bottom - gap - h, bottom: block.bottom - gap }],
  ];
  let best: Placement = "inside";
  let least = Infinity;
  for (const [name, r] of corners) {
    const covered = own.reduce((sum, o) => sum + area(r, o), 0) + bars.reduce((sum, o) => sum + area(r, o) * 4, 0);
    if (covered < least) { least = covered; best = name; }
  }
  return { placement: best, shift: 0 };
}
