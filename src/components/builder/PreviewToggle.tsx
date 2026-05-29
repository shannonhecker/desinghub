/* ════════════════════════════════════════════════════════════
   PreviewToggle (Phase E1, 2026-05-29 builder UX cleanup)
   ════════════════════════════════════════════════════════════
   Pill segmented control in the builder top-bar. Two segments
   side-by-side: "Edit" and "Preview".

   - Active Edit    : brand-teal (Teal Input,  #49D0BE)
   - Active Preview : brand-peach (Peach Output, #E5A999)
   - Inactive       : --bc-bg-raised + --bc-fg-muted

   Reads from / writes to usePreviewMode.
   Honors prefers-reduced-motion (instant transition).
   ════════════════════════════════════════════════════════════ */

"use client";

import React from "react";
import { usePreviewMode, type BuilderMode } from "@/store/usePreviewMode";

export function PreviewToggle() {
  const mode = usePreviewMode((s) => s.mode);
  const setMode = usePreviewMode((s) => s.setMode);

  const segments: Array<{ value: BuilderMode; label: string; aria: string }> = [
    { value: "edit", label: "Edit", aria: "Edit mode" },
    { value: "preview", label: "Preview", aria: "Preview mode" },
  ];

  return (
    <div
      className="preview-toggle"
      role="group"
      aria-label="Builder mode"
    >
      {segments.map((seg) => {
        const active = mode === seg.value;
        return (
          <button
            key={seg.value}
            type="button"
            className={`preview-toggle-segment preview-toggle-segment--${seg.value} ${active ? "is-active" : ""}`}
            aria-label={seg.aria}
            aria-pressed={active}
            onClick={() => setMode(seg.value)}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
