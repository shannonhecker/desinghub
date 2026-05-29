"use client";

import React, { useId, useState } from "react";

/* ── Phase 3a (N4 Tool-Use Cards): base wrapper ──
 *
 * Renders one parsed AI action as an inline card below the assistant
 * message that produced it. The base ships in PR (a) — per-action-
 * type variants (AddBlockCard, ChangeDSCard, RemoveBlockCard, …)
 * land in PR (b) and slot their content into this shell.
 *
 * Visual direction (per the chatbox plan, "Visual direction" §):
 *   - Instrument-panel feel, not chatty.
 *   - 6px radius (`--bc-radius-sm`), no rounded-3xl, no gradients,
 *     no glassmorphism on the card body.
 *   - 10px internal padding (denser than messages so a 4-action turn
 *     doesn't feel like a wall).
 *   - Monochrome Material Symbols icon (Design Hub uses Material
 *     Symbols for chrome; Phosphor would be a fresh dep — defer).
 *   - Mount motion: translate-y-2 + opacity, staggered 40ms via
 *     CSS custom property `--tu-stagger-index`. Reduced-motion
 *     wraps the keyframe in `@media (prefers-reduced-motion: reduce)`.
 *
 * Accessibility:
 *   - Expand/collapse is a real `<button>` with `aria-expanded` +
 *     `aria-controls` pointing at the params region.
 *   - Per-card undo is a `<button>` with explicit label so screen
 *     readers don't conflate with the bubble's other affordances.
 *   - Card is rendered inside the assistant message tree (sibling to
 *     `<MemoFadingWords>`) — inherits the bubble's aria-live region.
 */

export interface ToolUseCardProps {
  /* Icon glyph (Material Symbols name) — variants in PR (b) pass the
     right one per action type. Base accepts any string. */
  icon: string;
  /* Short action label rendered on the card head (e.g. "Add block",
     "Switch design system"). PR (b) variants supply per-type copy. */
  title: string;
  /* Optional short subtitle / param summary collapsed onto the head
     row when the card is not expanded (e.g. "SimulatedCard · body"). */
  subtitle?: string;
  /* Stable stagger index — usually the action's position within the
     parent assistant turn. Drives `animation-delay` via CSS var so
     multi-action turns reveal in sequence without JS timing. */
  staggerIndex?: number;
  /* Optional expanded-state body. PR (a) base passes a generic
     param dump; PR (b) variants render typed param rows. */
  children?: React.ReactNode;
  /* When supplied, the card surfaces an "Undo this action" button.
     Variants are responsible for the actual reversal (e.g. removeBlock
     by id for addBlock). PR (a): wired for addBlock only. */
  onUndo?: () => void;
  /* Defaults to false so a multi-card turn doesn't auto-expand. */
  defaultExpanded?: boolean;
}

export function ToolUseCard({
  icon,
  title,
  subtitle,
  staggerIndex = 0,
  children,
  onUndo,
  defaultExpanded = false,
}: ToolUseCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [undone, setUndone] = useState(false);
  const reactId = useId();
  const paramsId = `tool-use-params-${reactId}`;

  const handleUndo = () => {
    if (undone || !onUndo) return;
    onUndo();
    setUndone(true);
  };

  return (
    <div
      className={`tool-use-card${undone ? " tool-use-card--undone" : ""}`}
      style={{ ["--tu-stagger-index" as string]: staggerIndex }}
      data-action={title}
    >
      <button
        type="button"
        className="tool-use-card__head"
        aria-expanded={expanded}
        aria-controls={paramsId}
        onClick={() => setExpanded((v) => !v)}
      >
        <span
          className="material-symbols-outlined tool-use-card__icon"
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="tool-use-card__title">{title}</span>
        {subtitle && (
          <span className="tool-use-card__subtitle">{subtitle}</span>
        )}
        <span
          className="material-symbols-outlined tool-use-card__chevron"
          aria-hidden="true"
          data-open={expanded}
        >
          expand_more
        </span>
      </button>

      <div
        id={paramsId}
        className="tool-use-card__params"
        hidden={!expanded}
      >
        {children}
      </div>

      {onUndo && (
        <div className="tool-use-card__footer">
          <button
            type="button"
            className="tool-use-card__undo"
            onClick={handleUndo}
            disabled={undone}
            aria-label={undone ? "Action undone" : "Undo this action"}
          >
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={{ fontSize: 14 }}
            >
              {undone ? "check" : "undo"}
            </span>
            <span>{undone ? "Undone" : "Undo this action"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
