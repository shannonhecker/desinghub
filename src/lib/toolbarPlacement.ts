/* Pure placement rule for the block toolbar (HoverInspector). Given the
   selected block's rect, the rects of every other block, the bounds of the
   editable area and the pill's on-screen size, pick the first placement
   whose pill rect is inside the bounds and clear of every other block:
   above (right then left aligned), below (right then left), else inside the
   block's own top-right corner. Screen pixels throughout. */
export type Rect = { left: number; top: number; right: number; bottom: number };
export type Placement = "above-right" | "above-left" | "below-right" | "below-left" | "inside" | "inside-middle";

export function placeToolbar(
  block: Rect,
  others: Rect[],
  bounds: Rect,
  pill: { width: number; height: number; gap: number },
): Placement {
  const { width: w, height: h, gap } = pill;
  const middleTop = (block.top + block.bottom) / 2 - h / 2;
  const candidates: Array<[Placement, Rect]> = [
    ["above-right", { left: block.right - w, right: block.right, top: block.top - gap - h, bottom: block.top - gap }],
    ["above-left", { left: block.left, right: block.left + w, top: block.top - gap - h, bottom: block.top - gap }],
    ["below-right", { left: block.right - w, right: block.right, top: block.bottom + gap, bottom: block.bottom + gap + h }],
    ["below-left", { left: block.left, right: block.left + w, top: block.bottom + gap, bottom: block.bottom + gap + h }],
    /* Inside the block's own top-right corner (over its padding); a block
       shorter than the pill takes it centred on its own height instead. */
    ["inside", { left: block.right - gap - w, right: block.right - gap, top: block.top + gap, bottom: block.top + gap + h }],
    ["inside-middle", { left: block.right - gap - w, right: block.right - gap, top: middleTop, bottom: middleTop + h }],
  ];
  const intersects = (a: Rect, b: Rect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  const area = (a: Rect, b: Rect) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
  const inside = (a: Rect, b: Rect) => a.left >= b.left && a.right <= b.right && a.top >= b.top && a.bottom <= b.bottom;
  const tall = block.bottom - block.top >= h + 2 * gap;
  for (const [name, r] of candidates) {
    if (name === "inside" && !tall) continue;
    if (name === "inside-middle" && tall) continue;
    if (!inside(r, bounds) && name !== "inside" && name !== "inside-middle") continue;
    if (others.some((o) => intersects(r, o))) continue;
    return name;
  }
  /* Nothing is fully clear: the placement that covers the least of the others. */
  let best: Placement = tall ? "inside" : "inside-middle";
  let least = Infinity;
  for (const [name, r] of candidates) {
    if ((name === "inside" && !tall) || (name === "inside-middle" && tall)) continue;
    const covered = others.reduce((sum, o) => sum + area(r, o), 0);
    if (covered < least) { least = covered; best = name; }
  }
  return best;
}
