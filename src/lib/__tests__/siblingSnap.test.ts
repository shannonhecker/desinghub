/* ════════════════════════════════════════════════════════════
   Sibling smart-guides — pure snap math (P7 / Figma-parity).
   ════════════════════════════════════════════════════════════
   `computeSiblingSnap` is the side-effect-free core that decides,
   for a resized block's moving edge, whether it snaps to a sibling
   block's edge/center and which guide lines to draw. Tested
   directly (the codebase's convention for pure layout math — see
   scrub.test.ts), so the React plumbing in SortableBlock stays a
   thin shell that only samples rects and renders.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import {
  computeSiblingSnap,
  SIBLING_SNAP_PULL_PX,
  SIBLING_SNAP_RELEASE_PX,
  type SiblingCandidate,
} from "../siblingSnap";

const edge = (pos: number, kind: SiblingCandidate["kind"] = "edge", siblingId = "s"): SiblingCandidate => ({
  pos,
  kind,
  siblingId,
});

describe("computeSiblingSnap", () => {
  it("no candidates → never snaps", () => {
    const r = computeSiblingSnap({ edge: 120, candidates: [], wasSnapped: false, lastSnapPos: null });
    expect(r.snappedPos).toBeNull();
    expect(r.guides).toEqual([]);
  });

  it("edge within the magnetic pull → snaps to the candidate position", () => {
    // edge 124, candidate 120, delta 4 ≤ pull 6 → snap.
    const r = computeSiblingSnap({
      edge: 124,
      candidates: [edge(120)],
      wasSnapped: false,
      lastSnapPos: null,
    });
    expect(r.snappedPos).toBe(120);
    expect(r.guides).toHaveLength(1);
    expect(r.guides[0].pos).toBe(120);
  });

  it("edge outside the pull (and not already snapped) → no snap", () => {
    // delta 9 > pull 6, wasSnapped false → no snap.
    const r = computeSiblingSnap({
      edge: 129,
      candidates: [edge(120)],
      wasSnapped: false,
      lastSnapPos: null,
    });
    expect(r.snappedPos).toBeNull();
    expect(r.guides).toEqual([]);
  });

  it("hysteresis: once snapped, the wider release zone keeps it stuck", () => {
    // delta 8 is past pull (6) but within release (10). Because we were
    // snapped to THIS line last frame, the snap holds — Figma "sticky" feel.
    const r = computeSiblingSnap({
      edge: 128,
      candidates: [edge(120)],
      wasSnapped: true,
      lastSnapPos: 120,
    });
    expect(r.snappedPos).toBe(120);
  });

  it("hysteresis gap is real: same distance does NOT snap when not previously stuck", () => {
    // Identical geometry to the test above (delta 8) but wasSnapped false →
    // the tighter pull (6) applies → no snap. Proves the gap, not luck.
    const r = computeSiblingSnap({
      edge: 128,
      candidates: [edge(120)],
      wasSnapped: false,
      lastSnapPos: null,
    });
    expect(r.snappedPos).toBeNull();
  });

  it("hysteresis breaks once the edge travels past the release zone", () => {
    // delta 12 > release 10 → the snap finally lets go.
    const r = computeSiblingSnap({
      edge: 132,
      candidates: [edge(120)],
      wasSnapped: true,
      lastSnapPos: 120,
    });
    expect(r.snappedPos).toBeNull();
  });

  it("picks the nearer of two candidates", () => {
    const r = computeSiblingSnap({
      edge: 122,
      candidates: [edge(120), edge(160, "center")],
      wasSnapped: false,
      lastSnapPos: null,
    });
    expect(r.snappedPos).toBe(120);
    expect(r.guides.map((g) => g.pos)).toEqual([120]);
  });

  it("returns every coincident candidate so each aligned reference draws a guide", () => {
    // A sibling's right edge and another sibling's center both at x=200:
    // the snap should report BOTH so the renderer draws two guide lines.
    const r = computeSiblingSnap({
      edge: 203,
      candidates: [edge(200, "edge", "a"), edge(200, "center", "b"), edge(260, "edge", "c")],
      wasSnapped: false,
      lastSnapPos: null,
    });
    expect(r.snappedPos).toBe(200);
    expect(r.guides).toHaveLength(2);
    expect(r.guides.map((g) => g.siblingId).sort()).toEqual(["a", "b"]);
  });

  it("can jump from one stuck guide to a different nearer one within pull", () => {
    // Was stuck to 120, but the edge is now hugging 200 (delta 2). The new
    // line wins on the tighter pull because hysteresis only protects the
    // SAME line — matches Figma's guide-to-guide hopping.
    const r = computeSiblingSnap({
      edge: 202,
      candidates: [edge(120), edge(200)],
      wasSnapped: true,
      lastSnapPos: 120,
    });
    expect(r.snappedPos).toBe(200);
  });

  it("exposes pull/release constants matching the existing resize engine", () => {
    expect(SIBLING_SNAP_PULL_PX).toBe(6);
    expect(SIBLING_SNAP_RELEASE_PX).toBe(10);
  });
});
