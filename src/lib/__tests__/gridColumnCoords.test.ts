import { describe, it, expect } from "vitest";
import { toCanonicalColumn, toDisplayColumn } from "../gridColumnCoords";

/* P3-3 inspector coordinate conversions. gridCol is stored canonical-12, but the
   "Column start" control shows the zone's actual column count. These map both
   directions proportionally (same model as normalizeColumnStart) and round-trip
   within rounding, so the control reads back the value it wrote. */
describe("toCanonicalColumn — display column (1..cols) -> canonical-12 line", () => {
  it("is identity on a 12-col grid", () => {
    expect(toCanonicalColumn(7, 12)).toBe(7);
    expect(toCanonicalColumn(1, 12)).toBe(1);
    expect(toCanonicalColumn(12, 12)).toBe(12);
  });

  it("maps a non-12 display column proportionally", () => {
    expect(toCanonicalColumn(5, 8)).toBe(7); // 5th of 8 (50%) -> canonical 7
    expect(toCanonicalColumn(1, 8)).toBe(1);
    expect(toCanonicalColumn(8, 8)).toBe(12);
    expect(toCanonicalColumn(9, 16)).toBe(7); // 9th of 16 (50%) -> canonical 7
  });
});

describe("toDisplayColumn — canonical-12 -> display column (1..cols)", () => {
  it("is identity on a 12-col grid", () => {
    expect(toDisplayColumn(7, 12)).toBe(7);
    expect(toDisplayColumn(1, 12)).toBe(1);
    expect(toDisplayColumn(12, 12)).toBe(12);
  });

  it("maps canonical-12 to a non-12 grid proportionally", () => {
    expect(toDisplayColumn(7, 8)).toBe(5); // canonical 7 (50%) -> 5th of 8
    expect(toDisplayColumn(7, 16)).toBe(9); // canonical 7 (50%) -> 9th of 16
  });
});

describe("round-trips within rounding", () => {
  it("display -> canonical -> display returns the start (8 and 16 col)", () => {
    expect(toDisplayColumn(toCanonicalColumn(5, 8), 8)).toBe(5);
    expect(toDisplayColumn(toCanonicalColumn(9, 16), 16)).toBe(9);
  });
});
