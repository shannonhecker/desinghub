"use client";

/* ════════════════════════════════════════════════════════════
   SizeChipRail — one-click width presets shown ABOVE a selected
   block (not during drag). Experimental-flag only.

   Chips: Auto · Fill · ⅓ · ½ · ⅔ · Custom…

   Keyboard:
   - ArrowLeft / ArrowRight cycle focused chip.
   - Enter / Space activates the focused chip.
   - When "Custom…" is active an inline numeric field opens;
     Enter commits, Escape cancels.

   ARIA:
   - Rail is role="radiogroup" aria-label="Block width".
   - Each chip is role="radio" with aria-checked reflecting
     whether it matches the block's current width token.

   Styling uses --bc-* chrome tokens only.
   ════════════════════════════════════════════════════════════ */

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LayoutWidth, ZoneId } from "@/store/useBuilder";
import { useBuilder } from "@/store/useBuilder";

interface ChipDef {
  /** Short visible label. */
  label: string;
  /** Accessible name (when the glyph isn't self-descriptive). */
  ariaLabel: string;
  /** Width token this chip applies. `null` = opens custom editor. */
  width: LayoutWidth | null;
  /** Unique id for focus tracking. */
  id: string;
}

const CHIPS: ChipDef[] = [
  { id: "auto",   label: "Auto",    ariaLabel: "Auto",          width: "auto" },
  { id: "fill",   label: "Fill",    ariaLabel: "Fill",          width: "fill" },
  { id: "third",  label: "\u2153",  ariaLabel: "One third",     width: "33%" },
  { id: "half",   label: "\u00BD",  ariaLabel: "One half",      width: "50%" },
  { id: "twothird", label: "\u2154", ariaLabel: "Two thirds",   width: "66%" },
  { id: "custom", label: "Custom\u2026", ariaLabel: "Custom width", width: null },
];

/* Normalise the current block width into the id of the chip that
   matches it (if any). Used to set the active chip + ARIA state. */
function matchChip(width: LayoutWidth | undefined): string | null {
  if (width === undefined) return null;
  if (width === "auto") return "auto";
  if (width === "fill") return "fill";
  if (typeof width === "string") {
    if (width.endsWith("%")) {
      const pct = parseFloat(width);
      if (Math.abs(pct - 33) <= 1 || Math.abs(pct - 33.333) <= 1) return "third";
      if (Math.abs(pct - 50) <= 1) return "half";
      if (Math.abs(pct - 66) <= 1 || Math.abs(pct - 66.666) <= 1) return "twothird";
    }
  }
  return null;
}

/* Guess default custom-unit from the current width token. */
function defaultCustomUnit(
  width: LayoutWidth | undefined,
  zoneMode: "stack" | "row" | "grid",
): "px" | "%" {
  if (typeof width === "string") {
    if (width.endsWith("%")) return "%";
    if (width.endsWith("px")) return "px";
  }
  if (typeof width === "number") return "px";
  return zoneMode === "stack" ? "px" : "%";
}

/* Guess default numeric value for the custom editor — use the
   current width if parseable, else a sensible fallback. */
function defaultCustomValue(width: LayoutWidth | undefined): number {
  if (typeof width === "number") return Math.round(width);
  if (typeof width === "string") {
    if (width.endsWith("%") || width.endsWith("px")) {
      const n = parseFloat(width);
      if (Number.isFinite(n)) return Math.round(n);
    }
  }
  return 50;
}

export interface SizeChipRailProps {
  zone: ZoneId;
  blockId: string;
  currentWidth: LayoutWidth | undefined;
}

export function SizeChipRail({ zone, blockId, currentWidth }: SizeChipRailProps) {
  const updateBlockLayout = useBuilder((s) => s.updateBlockLayout);
  const zoneLayouts = useBuilder((s) => s.zoneLayouts);
  const zoneMode = zoneLayouts[zone]?.mode ?? "row";

  const active = matchChip(currentWidth);
  const [focused, setFocused] = useState<string>(active ?? "auto");
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState<string>(() => String(defaultCustomValue(currentWidth)));
  const [customUnit, setCustomUnit] = useState<"px" | "%">(() => defaultCustomUnit(currentWidth, zoneMode));

  const inputRef = useRef<HTMLInputElement | null>(null);
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  /* Re-focus the active chip when it changes (e.g. the parent
     selects a different block). Don't steal focus if the user
     is already interacting with the custom editor. */
  useEffect(() => {
    if (active && !customOpen) setFocused(active);
  }, [active, customOpen]);

  useEffect(() => {
    if (customOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [customOpen]);

  const applyChip = (chip: ChipDef) => {
    if (chip.width === null) {
      /* Custom — open inline editor, seed with current value. */
      setCustomValue(String(defaultCustomValue(currentWidth)));
      setCustomUnit(defaultCustomUnit(currentWidth, zoneMode));
      setCustomOpen(true);
      return;
    }
    updateBlockLayout(zone, blockId, { width: chip.width });
  };

  const commitCustom = () => {
    const n = parseFloat(customValue);
    if (!Number.isFinite(n) || n <= 0) {
      setCustomOpen(false);
      return;
    }
    const rounded = customUnit === "px" ? Math.round(n) : Math.max(1, Math.min(100, Math.round(n)));
    const w = `${rounded}${customUnit}` as LayoutWidth;
    updateBlockLayout(zone, blockId, { width: w });
    setCustomOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const idx = CHIPS.findIndex((c) => c.id === focused);
      const nextIdx = e.key === "ArrowRight"
        ? (idx + 1) % CHIPS.length
        : (idx - 1 + CHIPS.length) % CHIPS.length;
      const nextChip = CHIPS[nextIdx];
      setFocused(nextChip.id);
      btnRefs.current[nextChip.id]?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const chip = CHIPS.find((c) => c.id === focused);
      if (chip) applyChip(chip);
    }
  };

  const headingId = useMemo(() => `size-chip-rail-${blockId}`, [blockId]);

  return (
    <div
      className="bc-chip-rail"
      role="radiogroup"
      aria-label="Block width"
      aria-labelledby={headingId}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <span id={headingId} className="bc-sr-only">Block width</span>
      {CHIPS.map((chip) => {
        const isActive = active === chip.id;
        return (
          <button
            key={chip.id}
            ref={(el) => { btnRefs.current[chip.id] = el; }}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={chip.ariaLabel}
            tabIndex={focused === chip.id ? 0 : -1}
            className={`bc-chip${isActive ? " is-active" : ""}`}
            onFocus={() => setFocused(chip.id)}
            onClick={() => applyChip(chip)}
          >
            {chip.label}
          </button>
        );
      })}
      {customOpen && (
        <span className="bc-chip-custom">
          <input
            ref={inputRef}
            className="bc-chip-custom__input"
            type="number"
            inputMode="numeric"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                commitCustom();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setCustomOpen(false);
              }
            }}
            aria-label="Custom width value"
          />
          <button
            type="button"
            className="bc-chip-custom__unit"
            onClick={() => setCustomUnit((u) => (u === "px" ? "%" : "px"))}
            aria-label={`Toggle unit (currently ${customUnit === "%" ? "percent" : "pixels"})`}
            title="Toggle unit"
          >
            {customUnit}
          </button>
          <button
            type="button"
            className="bc-chip-custom__commit"
            onClick={commitCustom}
            aria-label="Apply custom width"
          >
            Set
          </button>
        </span>
      )}
    </div>
  );
}
