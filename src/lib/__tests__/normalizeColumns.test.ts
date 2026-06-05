import { describe, it, expect } from "vitest";
import { nativeColumnsFor, normalizeColumns } from "../layoutResolver";

/* Phase 0 of the DS-owned layout registry: pattern widths are authored in a
   canonical 12-fr grid; each DS's native grid column count differs (Carbon is
   16, the rest 12). normalizeColumns is the single place that mapping happens,
   so a pattern authored once lands correctly on every DS's real grid. */
describe("normalizeColumns — canonical 12-fr maps to each DS's native grid", () => {
  it("is identity on a 12-col DS (Salt/M3/Fluent/uoaui)", () => {
    expect(normalizeColumns(6, 12)).toBe(6);
    expect(normalizeColumns(12, 12)).toBe(12);
    expect(normalizeColumns(3, 12)).toBe(3);
  });

  it("scales to Carbon's 16-col grid with round-half-up", () => {
    expect(normalizeColumns(6, 16)).toBe(8); // half of 16
    expect(normalizeColumns(12, 16)).toBe(16); // full
    expect(normalizeColumns(4, 16)).toBe(5); // round(5.333)
    expect(normalizeColumns(3, 16)).toBe(4); // quarter
  });

  it("clamps to [1, nativeCols] and treats non-finite as a full row", () => {
    expect(normalizeColumns(0, 12)).toBe(1);
    expect(normalizeColumns(99, 16)).toBe(16);
    expect(normalizeColumns(NaN, 12)).toBe(12); // unsized => full native row
  });

  it("nativeColumnsFor returns 16 for carbon, 12 otherwise", () => {
    expect(nativeColumnsFor("carbon")).toBe(16);
    expect(nativeColumnsFor("salt")).toBe(12);
    expect(nativeColumnsFor("m3")).toBe(12);
    expect(nativeColumnsFor("fluent")).toBe(12);
    expect(nativeColumnsFor("uoaui")).toBe(12);
  });
});
