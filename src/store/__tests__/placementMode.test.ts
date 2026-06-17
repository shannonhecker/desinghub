import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder } from "../useBuilder";

/**
 * Placement mode is a USER-LEVEL workspace preference (how a dropped block
 * resolves its position: Auto / Grid / Freeform), not canvas content.
 *
 * Two invariants pin the persistence model so the placement roadmap can build
 * on it without a silent regression:
 *   1. Defaults to 'auto' — today's responsive flow, the export-safe path.
 *   2. Survives startNewSession — like density / structurePadding, it's part of
 *      the user's workspace setup, NOT the session. (It must also stay OUT of
 *      TRACKED_KEYS so it never bloats the autosaved canvas payload.)
 */
describe("useBuilder — placementMode workspace preference", () => {
  beforeEach(() => {
    // Reset to a known non-default before each persistence assertion.
    useBuilder.getState().setPlacementMode("auto");
  });

  it("defaults to 'auto' (responsive flow, export-safe)", () => {
    expect(useBuilder.getState().placementMode).toBe("auto");
  });

  it("setPlacementMode updates the slice", () => {
    useBuilder.getState().setPlacementMode("grid");
    expect(useBuilder.getState().placementMode).toBe("grid");
    useBuilder.getState().setPlacementMode("freeform");
    expect(useBuilder.getState().placementMode).toBe("freeform");
  });

  it("survives startNewSession (workspace preference, not session state)", () => {
    useBuilder.getState().setPlacementMode("grid");
    useBuilder.getState().startNewSession();
    expect(useBuilder.getState().placementMode).toBe("grid");
  });
});
