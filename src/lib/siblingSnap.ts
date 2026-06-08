/* ════════════════════════════════════════════════════════════
   Sibling smart-guides — pure snap math (P7 / Figma-parity).
   ════════════════════════════════════════════════════════════
   When a block is resized, its moving edge can snap to a sibling
   block's left / center / right edge — Figma's "smart guides".
   This is the side-effect-free core: given the moving edge and a
   set of sibling snap-line candidates (all in the same px space),
   it picks the nearest candidate within the magnetic pull, honours
   release hysteresis so a snap "sticks" until deliberately dragged
   away, and returns every coincident candidate so the renderer can
   draw one guide per aligned reference.

   It deliberately mirrors the percent-snap hysteresis already in
   SortableBlock's applyWidth, but operates on absolute sibling px
   rather than the fixed 12-col percentage grid — the two snap
   layers compose (percent snap = the grid; this = the neighbours).
   Pointer-only by design: applyWidth is also reused by keyboard
   arrow-resize, so sibling-snap is layered on top of it in the
   pointer move handler, never inside it.
   ════════════════════════════════════════════════════════════ */

/** Magnetic pull (px): an edge within this of a candidate snaps.
    Matches SortableBlock's SNAP_PULL_PX so grid- and sibling-snap
    feel identical under the pointer. */
export const SIBLING_SNAP_PULL_PX = 6;
/** Release (px): once snapped, the edge must travel past this wider
    threshold before the snap breaks (hysteresis — kills jitter at the
    boundary). Matches SortableBlock's SNAP_RELEASE_PX. */
export const SIBLING_SNAP_RELEASE_PX = 10;

export type SiblingGuideKind = "edge" | "center";

export interface SiblingCandidate {
  /** Snap-line position (px) in the same space as the moving edge. */
  pos: number;
  /** What the line represents on the sibling (drives the guide style). */
  kind: SiblingGuideKind;
  /** Originating sibling block id — for debugging / future labels. */
  siblingId?: string;
}

export interface SiblingSnapInput {
  /** The dragged block's moving edge (px). */
  edge: number;
  /** Sibling snap-line candidates (px). */
  candidates: readonly SiblingCandidate[];
  /** Were we snapped to a sibling line on the previous frame? */
  wasSnapped: boolean;
  /** The candidate pos we were snapped to last frame (hysteresis anchor). */
  lastSnapPos: number | null;
  /** Override pull distance (px). Defaults to SIBLING_SNAP_PULL_PX. */
  pull?: number;
  /** Override release distance (px). Defaults to SIBLING_SNAP_RELEASE_PX. */
  release?: number;
}

export interface SiblingSnapResult {
  /** The snapped edge position (px), or null when nothing is in range. */
  snappedPos: number | null;
  /** Every candidate coincident with the snap line — one guide each. */
  guides: SiblingCandidate[];
}

export function computeSiblingSnap(input: SiblingSnapInput): SiblingSnapResult {
  const {
    edge,
    candidates,
    wasSnapped,
    lastSnapPos,
    pull = SIBLING_SNAP_PULL_PX,
    release = SIBLING_SNAP_RELEASE_PX,
  } = input;

  if (candidates.length === 0) return { snappedPos: null, guides: [] };

  /* Nearest candidate by absolute distance. Strict `<` keeps the
     first candidate on ties, so the result is deterministic
     (mirrors applyWidth's nearest-percent scan). */
  let nearest = candidates[0];
  let bestDelta = Math.abs(edge - nearest.pos);
  for (const c of candidates) {
    const d = Math.abs(edge - c.pos);
    if (d < bestDelta) {
      bestDelta = d;
      nearest = c;
    }
  }

  /* Hysteresis: only the line we were stuck to last frame gets the
     wider release zone. A different, nearer line still captures on
     the tighter pull — this is what lets the edge hop guide-to-guide
     the way Figma does. */
  const stickingToSame = wasSnapped && lastSnapPos !== null && lastSnapPos === nearest.pos;
  const threshold = stickingToSame ? release : pull;

  if (bestDelta > threshold) return { snappedPos: null, guides: [] };

  /* Surface every candidate on the winning line so coincident
     references (e.g. one sibling's right edge == another's center)
     each draw their own guide. */
  const guides = candidates.filter((c) => c.pos === nearest.pos);
  return { snappedPos: nearest.pos, guides };
}
