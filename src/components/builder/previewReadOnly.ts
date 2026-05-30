"use client";

import { createContext, useContext } from "react";

/**
 * Read-only render signal for the builder canvas.
 *
 * True when the canvas is being rendered as a *preview* rather than an
 * editable workspace — i.e. Preview mode in the main builder, and always in
 * the standalone `?preview=1` pop-out. When true, every EDITOR affordance
 * must be suppressed: inline text editing (contentEditable), block selection,
 * the "+ Add item" control, and drag-to-reorder.
 *
 * Crucially this does NOT disable the rendered product's own interactivity —
 * the design system's `:hover` / `:focus` / `:active` states and link/scroll
 * behaviour must keep firing so the preview is an honest proxy of the real
 * UI. So we gate at the editor-interaction layer, never with
 * `pointer-events: none` on content.
 *
 * Provided via context (not a prop) so it reaches both the zone renderers and
 * deeply-nested body block fields (ComponentRenderer → InlineEditable) without
 * threading a prop through every level. The Present-mode shell (P1) and
 * StandalonePreview provide `value={true}`; the editable workspace provides
 * `value={builderMode === "preview"}`.
 */
export const PreviewReadOnlyContext = createContext(false);

export function usePreviewReadOnly(): boolean {
  return useContext(PreviewReadOnlyContext);
}
