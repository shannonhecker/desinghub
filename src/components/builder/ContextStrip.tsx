"use client";

import React from "react";
import { useBuilder } from "@/store/useBuilder";
import type { DesignSystem } from "@/store/useBuilder";

/* ══════════════════════════════════════════════════════════
   ContextStrip - visual surface for the `[Current state: ...]`
   block that useChatAPI prepends to every user message.

   Sits ABOVE the composer textarea as a row of context pills:
   - Theme: <DS label>
   - Mode:  <light/dark>
   - Scope: <block label> (only when a block is click-to-edit
                           scoped on the canvas)
   - Density: <density> (only when non-default)

   Only the Scope pill is clearable (its × clears the selected-block
   state, auditable via the chat-scope-chip on the input bar). Theme /
   Mode / Density are current-state indicators — there is no defined
   "clear" target for them (clear theme to WHAT?), so they render NO ×.
   A future PR may wire a reset-to-default and re-add the affordance.

   Hides when there is nothing to display.
   ══════════════════════════════════════════════════════════ */

const DS_LABEL: Record<DesignSystem, string> = {
  salt: "Salt",
  m3: "Material 3",
  fluent: "Fluent",
  uoaui: "uoaui",
  carbon: "Carbon",
};

function Pill({
  kind,
  label,
  value,
  onClear,
  clearLabel,
}: {
  kind: "theme" | "mode" | "scope" | "density";
  label: string;
  value: string;
  /* Optional: only clearable pills (Scope) render an × button. Theme /
     Mode / Density are read-only state indicators — passing no onClear
     means no dead affordance is shown. */
  onClear?: () => void;
  clearLabel?: string;
}) {
  const clearable = Boolean(onClear);
  return (
    <span
      className={`ctx-pill ctx-pill-${kind}${clearable ? "" : " ctx-pill-static"}`}
      role="listitem"
    >
      <span className="ctx-pill-label">{label}:</span>
      <span className="ctx-pill-value">{value}</span>
      {clearable && (
        <button
          type="button"
          className="ctx-pill-clear"
          onClick={onClear}
          aria-label={clearLabel}
          title={clearLabel}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
        </button>
      )}
    </span>
  );
}

export function ContextStrip() {
  const designSystem = useBuilder((s) => s.designSystem);
  const mode = useBuilder((s) => s.mode);
  const density = useBuilder((s) => s.density);
  const selectedBlockId = useBuilder((s) => s.selectedBlockId);
  const selectedBlockZone = useBuilder((s) => s.selectedBlockZone);
  const setSelectedBlock = useBuilder((s) => s.setSelectedBlock);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const bodyBlocks = useBuilder((s) => s.blocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);

  /* Resolve the selected block's friendly label, mirroring the
     chat-scope-chip's strategy in ChatPanel. We only need the
     "friendly" half here - the full prop detail lives in the
     existing scope chip above the textarea, so this pill stays
     compact. */
  const scopeLabel = (() => {
    if (!selectedBlockId) return null;
    const all = [
      ...headerBlocks,
      ...sidebarBlocks,
      ...bodyBlocks,
      ...footerBlocks,
    ];
    const block = all.find((b) => b.id === selectedBlockId);
    if (!block) return null;
    return block.type
      .replace(/^Simulated/, "")
      .replace(/([A-Z])/g, " $1")
      .trim();
  })();

  /* Density only shows when it's been moved off the default
     "medium" - keeps the strip quiet by default. */
  const showDensity = density && density !== "medium";

  /* Theme + mode are always part of the injected context, so the
     strip is visible whenever the rest of the chat is. We still
     guard the entire surface in case the store ever loads in a
     transient state where designSystem is empty. */
  const visiblePills =
    Boolean(designSystem) || Boolean(mode) || Boolean(scopeLabel) || showDensity;

  if (!visiblePills) return null;

  return (
    <div
      className="context-strip"
      role="list"
      aria-label="Current chat context"
    >
      {designSystem && (
        <Pill kind="theme" label="Theme" value={DS_LABEL[designSystem]} />
      )}
      {mode && (
        <Pill kind="mode" label="Mode" value={mode === "dark" ? "Dark" : "Light"} />
      )}
      {scopeLabel && (
        <Pill
          kind="scope"
          label="Scope"
          value={scopeLabel}
          onClear={() => setSelectedBlock(null, null)}
          clearLabel={`Clear scope from ${scopeLabel}`}
        />
      )}
      {showDensity && (
        <Pill
          kind="density"
          label="Density"
          value={density.charAt(0).toUpperCase() + density.slice(1)}
        />
      )}
      {/* Reference `selectedBlockZone` so it isn't dead-code -
          the value is used by setSelectedBlock callers elsewhere
          but reading it here keeps the subscription live, which
          forces a re-render when the user re-selects a block in
          a different zone (same id, different zone -> scope
          label can change). */}
      <span
        className="context-strip-zone-marker"
        data-zone={selectedBlockZone ?? ""}
        aria-hidden="true"
      />
    </div>
  );
}
