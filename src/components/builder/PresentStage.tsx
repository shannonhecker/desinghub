"use client";

/* ══════════════════════════════════════════════════════════
   PresentStage — full-stage, read-only "Present" mode (PR-A).
   ══════════════════════════════════════════════════════════
   Entered when usePreviewMode.mode === "preview". BuilderApp
   early-returns <PresentStage/> in place of the .builder-shell
   (mirroring the isStandalone early-return), so this REPLACES
   the editor rather than overlaying it — no z-index, no focus
   trap, no portal.

   Two load-bearing details:

   1. The root renders data-builder-mode="preview" (NOT a new
      "present" value). That makes the existing chrome-hide
      cascade in builder.css (resize handles, hover inspector,
      component sidebar, …) and the JS gates (HoverInspector)
      apply unchanged — Present
      mode inherits read-only suppression for free instead of
      reimplementing it.

   2. The canvas is the shared <BuilderCanvas>, wrapped in
      <CanvasDndProvider readOnly> so PreviewReadOnlyContext is
      true throughout the tree (inline edit / +Add / selection
      gated; the product's own DS hover/focus still fires). Same
      render path as the in-app preview — Present mode is that
      preview promoted to the whole viewport, on a neutral stage.

   Exit: PresentBar's Edit button or Esc (handled globally in
   BuilderApp) returns to edit. Shift+Cmd+P also toggles. Those
   listeners live on BuilderApp, which stays mounted because the
   early-return sits after all of its hooks. */

import React, { useEffect, useRef } from "react";
import { useBuilder } from "@/store/useBuilder";
import { CanvasDndProvider, BuilderCanvas, DSPreviewStyles } from "./PreviewPanel";
import { PresentBar } from "./PresentBar";
import { AmendableContext } from "./previewAmendable";
import { PresentAmendComposer } from "./PresentAmendComposer";

export function PresentStage({
  /* "recipient" + sharedHash are passed by SharedPreview (the shared-link
     route) to swap the PresentBar's exit for Edit + Home. The
     in-app author path (BuilderApp) renders <PresentStage/> with no props
     → PresentBar defaults to the "author" variant. */
  barVariant,
  sharedHash,
}: {
  barVariant?: "author" | "recipient";
  sharedHash?: string;
} = {}) {
  /* Canvas theme (light/dark) drives the .builder-light scope so the
     --bc-* chrome tokens + DS rendering resolve correctly, exactly as
     StandalonePreview does. */
  const mode = useBuilder((s) => s.mode);

  /* Box-model parity with the editor shell. BuilderApp sets BOTH
     data-builder-mode AND data-canvas-spacing on .builder-shell, but
     PresentStage REPLACES that shell (early return) — so without this
     attribute no ancestor carries the spacing value in Present mode and
     the [data-canvas-spacing="tight"] gate in builder.css (padding /
     margin-bottom / border-width: 0 on .canvas-block) never applies:
     preview blocks pick up the editor-only 12px/8px/1px box while edit
     shows 0/0/0. Mirroring the store value keeps both modes on one box
     model ("component locations and padding styles the same"). */
  const canvasSpacing = useBuilder((s) => s.canvasSpacing);

  /* Amend flow (Phase 1): only the AUTHOR's Present mode is amendable —
     clicking a block selects it for the in-place composer. The shared-link
     recipient variant stays a pure read-only preview. */
  const amendable = barVariant !== "recipient";
  const clearSelection = useBuilder((s) => s.clearSelection);

  const stageRef = useRef<HTMLDivElement | null>(null);

  /* Focus capture on enter / restore on exit. On mount we remember
     whatever was focused (usually the Edit/Preview toggle that fired
     entry) and move focus onto the stage so keyboard / screen-reader
     users land in the present context rather than on a now-unmounted
     editor control. On unmount we restore the original element if it's
     still in the DOM; otherwise we hand focus to the relocated toggle
     once the editor re-mounts. */
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    stageRef.current?.focus();
    return () => {
      if (previouslyFocused && previouslyFocused.isConnected && typeof previouslyFocused.focus === "function") {
        previouslyFocused.focus();
        return;
      }
      requestAnimationFrame(() => {
        const toggle = document.querySelector<HTMLElement>(".preview-toggle button");
        toggle?.focus();
      });
    };
  }, []);

  return (
    <div
      ref={stageRef}
      className={`present-stage ${mode === "light" ? "builder-light" : ""}`}
      data-builder-mode="preview"
      data-canvas-spacing={canvasSpacing}
      role="region"
      aria-label="Present mode preview"
      tabIndex={-1}
    >
      {/* Inject DS-specific CSS (Carbon tokens + .cb-* rules) just like
          the other shells, so a Carbon canvas styles correctly here. */}
      <DSPreviewStyles />

      <AmendableContext.Provider value={amendable}>
        <CanvasDndProvider readOnly>
          <div
            className="present-stage-viewport"
            onClick={
              amendable
                ? (e) => {
                    /* Click on empty stage (not a block) clears the amend
                       selection. Block clicks select via SortableBlock and
                       carry a [data-block-id] ancestor, so they're skipped. */
                    if (!(e.target as HTMLElement).closest("[data-block-id]")) {
                      clearSelection();
                    }
                  }
                : undefined
            }
          >
            <BuilderCanvas framed responsive resizableSidebar allowEmptyState />
          </div>
        </CanvasDndProvider>
        {amendable && <PresentAmendComposer />}
      </AmendableContext.Provider>

      <PresentBar variant={barVariant} sharedHash={sharedHash} />
    </div>
  );
}
