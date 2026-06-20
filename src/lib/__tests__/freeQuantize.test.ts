import { describe, it, expect } from "vitest";
import {
  quantizeWidth,
  quantizeColumn,
  assignRowBands,
  freeQuantize,
  insertionIndexForDrop,
  type FreeDrop,
  type Rect,
} from "../freeQuantize";

const R = (top: number, bottom: number, left: number, right: number): Rect => ({ top, bottom, left, right });

const D = (xFrac: number, yFrac: number, wFrac: number, hFrac: number): FreeDrop => ({ xFrac, yFrac, wFrac, hFrac });

/* P4 "Snap grid (2D)" — the pure quantizer. A free drop (zone-fractions 0..1)
   is converted to representable, export-bound fields. The X-axis reuses the
   canonical-12 proportional model the rest of the builder already uses:
   width -> `${n}fr`, x-edge -> a 1..12 column start, clamped so start+span never
   overflows the row. */
describe("quantizeWidth — width fraction -> canonical-12 fr", () => {
  it("maps common fractions to the expected fr", () => {
    expect(quantizeWidth(0.5)).toBe(6); // half
    expect(quantizeWidth(1)).toBe(12); // full
    expect(quantizeWidth(0.25)).toBe(3); // quarter
    expect(quantizeWidth(1 / 3)).toBe(4); // a third = 4/12
  });

  it("clamps to [1, 12] — never 0, never overflow", () => {
    expect(quantizeWidth(0)).toBe(1);
    expect(quantizeWidth(0.01)).toBe(1);
    expect(quantizeWidth(5)).toBe(12);
  });
});

describe("quantizeColumn — x-edge fraction -> canonical-12 column start", () => {
  it("maps the left edge proportionally (column N starts at (N-1)/12)", () => {
    expect(quantizeColumn(0, 6)).toBe(1); // far left
    expect(quantizeColumn(0.5, 6)).toBe(7); // 50% -> column 7
  });

  it("clamps the start so start + span never overflows 12", () => {
    // a span-6 block dropped at the far right can't start past column 7
    expect(quantizeColumn(1, 6)).toBe(7); // 12 - 6 + 1
    // a span-4 block at 80% would want col 11, but clamps to 9 (9..12)
    expect(quantizeColumn(0.8, 4)).toBe(9);
  });

  it("never returns below 1", () => {
    expect(quantizeColumn(-0.5, 3)).toBe(1);
  });
});

describe("assignRowBands — vertically-overlapping blocks share a row (sort key)", () => {
  it("two side-by-side blocks (same top) land in the same row", () => {
    expect(assignRowBands([D(0, 0, 0.5, 0.2), D(0.5, 0, 0.5, 0.2)])).toEqual([0, 0]);
  });

  it("two stacked blocks (no overlap) land in different rows", () => {
    expect(assignRowBands([D(0, 0, 0.5, 0.2), D(0, 0.5, 0.5, 0.2)])).toEqual([0, 1]);
  });

  it("clusters by >50% overlap: two near-aligned on top, one below", () => {
    expect(assignRowBands([D(0, 0, 0.5, 0.2), D(0.5, 0.02, 0.5, 0.2), D(0, 0.6, 0.5, 0.2)])).toEqual([0, 0, 1]);
  });

  it("returns rows in INPUT order regardless of vertical sort", () => {
    // input is below-then-above; the lower block must still get the higher row index
    expect(assignRowBands([D(0, 0.6, 0.5, 0.2), D(0, 0, 0.5, 0.2)])).toEqual([1, 0]);
  });
});

describe("freeQuantize — free drops -> representable layouts", () => {
  it("quantizes a single drop's width + column + row", () => {
    expect(freeQuantize([D(0.5, 0, 0.5, 0.3)])).toEqual([{ width: "6fr", gridCol: 7, gridRow: 0 }]);
  });

  it("two halves side-by-side share a row and split the columns", () => {
    expect(freeQuantize([D(0, 0, 0.5, 0.3), D(0.5, 0, 0.5, 0.3)])).toEqual([
      { width: "6fr", gridCol: 1, gridRow: 0 },
      { width: "6fr", gridCol: 7, gridRow: 0 },
    ]);
  });

  it("MOAT: every output carries ONLY flow fields — no x/y/left/top/position can exist", () => {
    const out = freeQuantize([D(0.3, 0.1, 0.4, 0.2), D(0.7, 0.7, 0.3, 0.2)]);
    for (const q of out) {
      // the type itself has only these 3 keys; this locks it at runtime too
      expect(Object.keys(q).sort()).toEqual(["gridCol", "gridRow", "width"]);
    }
  });
});

describe("insertionIndexForDrop — 2D drop -> array index in reading order", () => {
  // row 1: A(left) B(right) ; row 2: C(left)
  const A = R(0, 100, 0, 100);
  const B = R(0, 100, 100, 200);
  const C = R(100, 200, 0, 100);

  it("empty body -> index 0", () => {
    expect(insertionIndexForDrop({ x: 0, y: 0 }, [])).toBe(0);
  });

  it("a block above the drop comes first; a block below does not", () => {
    expect(insertionIndexForDrop({ x: 50, y: 200 }, [A])).toBe(1);
    expect(insertionIndexForDrop({ x: 50, y: -50 }, [A])).toBe(0);
  });

  it("orders left-to-right within the same row", () => {
    expect(insertionIndexForDrop({ x: 120, y: 50 }, [A, B])).toBe(1); // between A and B
    expect(insertionIndexForDrop({ x: 10, y: 50 }, [A, B])).toBe(0); // left of both
  });

  it("orders by row then column across two rows", () => {
    expect(insertionIndexForDrop({ x: 150, y: 150 }, [A, B, C])).toBe(3); // bottom-right, after all
    expect(insertionIndexForDrop({ x: 50, y: 150 }, [A, B, C])).toBe(2); // bottom-left, before C
    expect(insertionIndexForDrop({ x: 50, y: 50 }, [A, B, C])).toBe(0); // top-left, before all
  });
});
