/* ══════════════════════════════════════════════════════════
   frameFit - scale the canvas frame to the stage instead of
   re-flowing it.

   The canvas used to take whatever width the stage had left. With
   the chat and the inspector docked, a desktop dashboard was laid
   out ~800px wide in Edit and 1320px wide in Present, so the body's
   narrow-canvas ladder re-spanned its rows (a 4-up KPI row became
   2x2) and Edit stopped matching Present.

   Each device preset now has ONE design width. The frame is always
   laid out at that width; when the stage is narrower the frame is
   scaled down to fit, the way a design tool zooms an artboard. The
   layout a user edits is therefore the layout they present.
   ══════════════════════════════════════════════════════════ */

export type FrameDevice = "desktop" | "tablet" | "mobile";

/** Design size per device preset. Desktop width mirrors --bc-stage-cap
 *  (chrome-tokens.css), the width Present mode already caps the frame at. */
export const FRAME_PRESETS: Record<FrameDevice, { width: number; height: number; label: string }> = {
  desktop: { width: 1320, height: 800, label: "1320 × 800" },
  tablet: { width: 768, height: 1024, label: "768 × 1024" },
  mobile: { width: 375, height: 812, label: "375 × 812" },
};

export interface FrameFit {
  /** Scale applied to the frame: 1 when the stage is wide enough. */
  zoom: number;
  /** Frame max-height in design px (before scaling). */
  maxHeight: number;
}

/** Fit a frame of `designWidth` x `designHeight` into a stage with
 *  `availWidth` x `availHeight` of room.
 *
 *  - Wide enough (or not measured yet): no scaling, the preset height cap.
 *  - Narrower: scale to the stage width. The height cap grows to use the
 *    stage's full height at that scale, so a scaled-down frame shows more
 *    of the page rather than leaving the stage half empty. */
export function fitFrame(
  designWidth: number,
  designHeight: number,
  availWidth: number,
  availHeight: number,
): FrameFit {
  if (!(availWidth > 0) || availWidth >= designWidth) {
    return { zoom: 1, maxHeight: designHeight };
  }
  /* Floor to 3 places: rounding up could make the scaled frame a fraction
     of a pixel wider than the stage and bring back a horizontal scrollbar. */
  const zoom = Math.max(0.1, Math.floor((availWidth / designWidth) * 1000) / 1000);
  const fill = availHeight > 0 ? Math.floor(availHeight / zoom) : designHeight;
  return { zoom, maxHeight: Math.max(designHeight, fill) };
}
