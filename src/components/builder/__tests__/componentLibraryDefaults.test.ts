import { describe, it, expect } from "vitest";
import { LIB_DEFAULT_EXPANDED } from "../ComponentLibrary";

/**
 * Hierarchy pass: the component palette should rest as a scannable index of
 * category headers, not a ~28-row wall of every tile. Only the 1-2 heaviest /
 * most-used categories (Inputs, Charts) open by default; the rest stay
 * collapsed (one click away). `isCategoryOpen` treats `!== false` as open, so
 * collapsed keys must be an explicit `false`, never undefined.
 */
describe("component palette — default category expansion (hierarchy pass)", () => {
  it("opens only the heaviest categories (Inputs, Charts) by default", () => {
    expect(LIB_DEFAULT_EXPANDED.inputs).toBe(true);
    expect(LIB_DEFAULT_EXPANDED.charts).toBe(true);
  });

  it("collapses every other category with an explicit false (not undefined)", () => {
    for (const key of ["actions", "data-display", "navigation", "feedback", "containment", "content"]) {
      expect(LIB_DEFAULT_EXPANDED[key]).toBe(false);
    }
  });

  it("keeps the resting panel a scannable index (at most 2 categories open)", () => {
    const openCount = Object.values(LIB_DEFAULT_EXPANDED).filter(Boolean).length;
    expect(openCount).toBeLessThanOrEqual(2);
  });
});
