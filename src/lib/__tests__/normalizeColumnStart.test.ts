import { describe, it, expect } from "vitest";
import { normalizeColumnStart } from "../layoutResolver";

/* P3-3 per-block column-START. A block's gridCol is authored as a canonical-12
   column LINE (1..12); normalizeColumnStart maps it to the zone's column
   RESOLUTION exactly like normalizeColumns maps a span — so a pinned block holds
   its relative position on 8 / 12 / 16-col grids and the canvas matches every
   exporter. The span (already in cols-space) is passed in so start + span can
   never overflow the row: an out-of-range start is pulled flush to the last
   track that still fits. A non-finite start = no pin (auto-place, today's
   default). */
describe("normalizeColumnStart — canonical-12 start maps + clamps to each grid resolution", () => {
  it("is identity on a 12-col grid when start + span fits", () => {
    // start line 7 (left edge at 50%), span 3 -> cols 7,8,9
    expect(normalizeColumnStart(7, 12, 3)).toBe(7);
    expect(normalizeColumnStart(4, 12, 3)).toBe(4);
    expect(normalizeColumnStart(1, 12, 6)).toBe(1);
  });

  it("preserves the relative position across grid resolutions (proportional)", () => {
    // start 7/12 = left edge 50% -> on 16 cols, 50% is start line 9
    expect(normalizeColumnStart(7, 16, 4)).toBe(9);
    // right-half block: start 7, half span -> stays the right half on 16 cols
    expect(normalizeColumnStart(7, 16, 8)).toBe(9); // 9..16 = right half of 16
    // start 7 on an 8-col grid -> round(6/12*8)+1 = 5 (left edge ~50%)
    expect(normalizeColumnStart(7, 8, 2)).toBe(5);
  });

  it("clamps so start + span never overflows the row (pulls flush to the end)", () => {
    // start 12 + span 4 would run to col 15 on a 12-col grid -> pull back to 9
    expect(normalizeColumnStart(12, 12, 4)).toBe(9); // 9..12 fits flush-right
    // start beyond the last track still lands on a valid line
    expect(normalizeColumnStart(99, 12, 1)).toBe(12);
  });

  it("lower-clamps to 1 and never returns 0 or negative", () => {
    expect(normalizeColumnStart(0, 12, 3)).toBe(1);
    expect(normalizeColumnStart(-5, 12, 3)).toBe(1);
  });

  it("returns undefined for a non-finite start (auto-place, the back-compat default)", () => {
    expect(normalizeColumnStart(NaN, 12, 3)).toBeUndefined();
    expect(normalizeColumnStart(Infinity, 12, 3)).toBeUndefined();
    expect(normalizeColumnStart(-Infinity, 16, 3)).toBeUndefined();
  });
});
