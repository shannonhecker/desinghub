"use client";

/* ════════════════════════════════════════════════════════════
   ResizeHUD — floating value + unit-toggle overlay shown DURING
   a resize drag (pointer or keyboard). Experimental-flag only.
   Renders above the block being resized; positions itself using
   the anchor rect so the value tracks the block.

   Styling uses --bc-* chrome tokens only so the HUD stays stable
   when the user swaps design systems (Salt / MD3 / Fluent /
   Carbon affect preview content, not tool chrome).

   ARIA:
   - role="status" + aria-live="polite" so the live value is
     announced to screen readers as it changes.
   - SR-only text reads "Width {value} {unit}" for clarity.

   Keyboard:
   - `P` toggles to px.
   - `%` (Shift+5) toggles to %.
   Both are window-level while HUD is mounted.
   ════════════════════════════════════════════════════════════ */

import React, { useEffect, useMemo } from "react";

export interface ResizeHUDProps {
  /** Current numeric value in the active unit. */
  value: number;
  /** Current unit — toggles between px and %. */
  unit: "px" | "%";
  /** Called when the user flips units (click or P / % keys). */
  onUnitChange: (u: "px" | "%") => void;
  /** Bounding rect of the block being resized. HUD anchors
     itself just above the top-right corner of this rect. When
     null, HUD centers in the viewport (fallback). */
  anchorRect: DOMRect | null;
  /** Optional floor — passed through for future use (e.g. when
     the HUD wants to render a clamp hint). Not displayed today. */
  min?: number;
  /** Optional ceiling — same as min. */
  max?: number;
}

export function ResizeHUD({ value, unit, onUnitChange, anchorRect }: ResizeHUDProps) {
  /* Keyboard unit toggle — works while the HUD is mounted. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      /* Ignore if user is typing in a field. */
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      /* `%` arrives as Shift+5 in US layout — match on key value so
         other layouts that produce `%` via a different shortcut work. */
      if (e.key === "%") {
        e.preventDefault();
        onUnitChange("%");
        return;
      }
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        onUnitChange("px");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onUnitChange]);

  /* Position: fixed, top-right corner of the block, 8px above
     the top edge. Falls back to viewport center if no anchor. */
  const style = useMemo<React.CSSProperties>(() => {
    if (!anchorRect) {
      return {
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }
    return {
      position: "fixed",
      top: Math.max(8, anchorRect.top - 8),
      left: anchorRect.right,
      transform: "translate(-100%, -100%)",
    };
  }, [anchorRect]);

  const displayValue = unit === "%" ? Math.round(value) : Math.round(value);
  const srText = `Width ${displayValue} ${unit === "%" ? "percent" : "pixels"}`;

  return (
    <div className="bc-resize-hud" style={style} role="status" aria-live="polite">
      <span className="bc-resize-hud__value" aria-hidden="true">
        {displayValue}
      </span>
      <button
        type="button"
        className="bc-resize-hud__unit"
        onClick={() => onUnitChange(unit === "px" ? "%" : "px")}
        aria-label={`Toggle unit (currently ${unit === "%" ? "percent" : "pixels"})`}
        title="Toggle unit (P / %)"
      >
        {unit}
      </button>
      <span className="bc-sr-only">{srText}</span>
    </div>
  );
}
