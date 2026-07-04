import { describe, it, expect } from "vitest";
import { GAP_STOPS, snapGapToToken, stepGap } from "../ZoneLayoutOverlay";

/**
 * The gap snap-handle commits ONLY token-scale gap values — "tokens over
 * literals". The scrub math (drag px → nearest stop) is throwaway; the single
 * persisted artifact is ZoneLayout.gap. These pin the magnetism.
 */
describe("gap snapping — token magnetism", () => {
  it("uses the 4px-base spacing token scale", () => {
    expect([...GAP_STOPS]).toEqual([0, 4, 8, 12, 16, 24, 32]);
  });

  it("snaps an arbitrary px gap to the nearest token (non-tie cases)", () => {
    expect(snapGapToToken(3)).toBe(4);
    expect(snapGapToToken(7)).toBe(8);
    expect(snapGapToToken(11)).toBe(12);
    expect(snapGapToToken(15)).toBe(16);
    expect(snapGapToToken(22)).toBe(24);
    expect(snapGapToToken(30)).toBe(32);
  });

  it("clamps below 0 and above the max stop", () => {
    expect(snapGapToToken(-50)).toBe(0);
    expect(snapGapToToken(999)).toBe(32);
  });

  it("steps to the adjacent stop, clamped at both ends", () => {
    expect(stepGap(8, 1)).toBe(12);
    expect(stepGap(8, -1)).toBe(4);
    expect(stepGap(0, -1)).toBe(0);
    expect(stepGap(32, 1)).toBe(32);
  });

  it("steps from an off-token value by snapping first", () => {
    expect(stepGap(13, 1)).toBe(16); // 13→12, +1 → 16
    expect(stepGap(13, -1)).toBe(8); // 13→12, -1 → 8
  });
});
