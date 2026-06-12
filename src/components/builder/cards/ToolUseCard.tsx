"use client";

import React, { useId, useState } from "react";
import { MiniPreview } from "../MiniPreview";
import { DS_LABELS } from "@/lib/assumptionDims";
import type { ToolUseEvent } from "@/lib/toolUseEvents";
import type { DesignSystem, ZoneId } from "@/store/useBuilder";
import "./chat-feedback.css";

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
  /* PR (b): always-visible typed summary row rendered below the head
     (thumbnail + labels). Replaces the expandable JSON dump for the
     typed variants — when a card supplies `summary` and no `children`,
     the expand affordance is dropped entirely. */
  summary?: React.ReactNode;
  /* Optional expanded-state body. PR (a) base passes a generic
     param dump; PR (b) variants render typed summary rows instead and
     omit this. When absent the head renders as a static row (no
     chevron, no aria-expanded button). */
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
  summary,
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

  /* Typed variants pass `summary` with no `children`: the card has
     nothing to expand, so the head drops the button semantics + the
     chevron rather than offering an affordance that opens nothing. */
  const expandable = children !== undefined && children !== null;

  const headContent = (
    <>
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
    </>
  );

  return (
    <div
      className={`tool-use-card${undone ? " tool-use-card--undone" : ""}`}
      style={{ ["--tu-stagger-index" as string]: staggerIndex }}
      data-action={title}
    >
      {expandable ? (
        <button
          type="button"
          className="tool-use-card__head"
          aria-expanded={expanded}
          aria-controls={paramsId}
          onClick={() => setExpanded((v) => !v)}
        >
          {headContent}
          <span
            className="material-symbols-outlined tool-use-card__chevron"
            aria-hidden="true"
            data-open={expanded}
          >
            expand_more
          </span>
        </button>
      ) : (
        <div className="tool-use-card__head tool-use-card__head--static">
          {headContent}
        </div>
      )}

      {summary && <div className="tool-use-card__summary">{summary}</div>}

      {expandable && (
        <div
          id={paramsId}
          className="tool-use-card__params"
          hidden={!expanded}
        >
          {children}
        </div>
      )}

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

/* ════════════════════════════════════════════════════════════
   Phase 3a PR (b): typed per-action card variants.
   ────────────────────────────────────────────────────────────
   Each variant slots a typed, always-visible summary into the base
   shell instead of the PR (a) JSON dump. Actions without a typed
   variant fall back to the base card (raw params behind the
   expand affordance) via ToolUseEventCard below.
   ════════════════════════════════════════════════════════════ */

/* "SimulatedStatCard" → "Stat Card". Mirrors the scope-chip labeller
   in ChatPanel so AI cards and the composer speak the same names. */
function friendlyBlockType(type: string): string {
  return type
    .replace(/^Simulated/, "")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

const ZONE_LABEL: Record<ZoneId, string> = {
  header: "Header",
  sidebar: "Sidebar",
  body: "Body",
  footer: "Footer",
};

interface VariantProps {
  event: ToolUseEvent;
  staggerIndex?: number;
  onUndo?: () => void;
}

/* MiniPreview SVG thumbnail of the block type + zone label. Reuses
   the library panel's silhouette renderer so the card thumbnail and
   the palette tile read as the same object. */
export function AddBlockCard({ event, staggerIndex, onUndo }: VariantProps) {
  const v = (event.value ?? {}) as { type?: string };
  const type = typeof v.type === "string" ? v.type : "Block";
  const zone: ZoneId = event.zone ?? "body";
  return (
    <ToolUseCard
      icon="add_box"
      title="Add block"
      staggerIndex={staggerIndex}
      onUndo={onUndo}
      summary={
        <>
          <span className="tool-use-card__thumb">
            <MiniPreview type={type} />
          </span>
          <span className="tool-use-card__summary-label">
            {friendlyBlockType(type)}
          </span>
          <span className="tool-use-card__summary-zone">
            {ZONE_LABEL[zone]}
          </span>
        </>
      }
    />
  );
}

/* DS display name + icon dot pair. The dot reuses the data-ds
   convention from the DS reply chips (.prompt-bubble-ds-dot). */
export function ChangeDSCard({ event, staggerIndex }: VariantProps) {
  const ds =
    typeof event.value === "string" && event.value in DS_LABELS
      ? (event.value as DesignSystem)
      : null;
  const label = ds ? DS_LABELS[ds] : String(event.value ?? "");
  return (
    <ToolUseCard
      icon="palette"
      title="Switch design system"
      staggerIndex={staggerIndex}
      summary={
        <>
          <span
            className="tool-use-card__ds-dot"
            data-ds={ds ?? undefined}
            aria-hidden="true"
          />
          <span className="tool-use-card__summary-label">{label}</span>
        </>
      }
    />
  );
}

/* Removed block's label. applyAIActions enriches the event value with
   the block's `type` at emit time (the block is gone from the store
   by render time); the id is the fallback for older emitters. */
export function RemoveBlockCard({ event, staggerIndex }: VariantProps) {
  const v = (event.value ?? {}) as { blockId?: string; type?: string };
  const label =
    typeof v.type === "string" && v.type
      ? friendlyBlockType(v.type)
      : (v.blockId ?? "Block");
  return (
    <ToolUseCard
      icon="remove"
      title="Remove block"
      staggerIndex={staggerIndex}
      summary={<span className="tool-use-card__summary-label">{label}</span>}
    />
  );
}

/* Display maps for actions without a typed variant yet. Moved here
   from ChatPanel so card concerns live in the cards layer. */
const TOOL_USE_TITLE: Record<string, string> = {
  addBlock: "Add block",
  removeBlock: "Remove block",
  moveBlock: "Move block",
  updateBlockProps: "Update block props",
  updateBlockLayout: "Update block layout",
  setDesignSystem: "Switch design system",
  setMode: "Switch mode",
  setDensity: "Switch density",
  setComponents: "Set components",
  setInterfaceType: "Set interface type",
  setThemeKey: "Switch theme",
  setColorOverride: "Override color",
  clearCanvas: "Clear canvas",
  setZoneLayout: "Update zone layout",
};
const TOOL_USE_ICON: Record<string, string> = {
  addBlock: "add_box",
  removeBlock: "remove",
  moveBlock: "swap_horiz",
  updateBlockProps: "tune",
  updateBlockLayout: "view_quilt",
  setDesignSystem: "palette",
  setMode: "contrast",
  setDensity: "density_medium",
  setComponents: "widgets",
  setInterfaceType: "dashboard",
  setThemeKey: "format_color_fill",
  setColorOverride: "colorize",
  clearCanvas: "delete_sweep",
  setZoneLayout: "view_module",
};

/* Single entry point ChatPanel renders per event: dispatches to the
   typed variant for the action, or the base card with raw params. */
export function ToolUseEventCard({ event, staggerIndex = 0, onUndo }: VariantProps) {
  switch (event.action) {
    case "addBlock":
      return (
        <AddBlockCard event={event} staggerIndex={staggerIndex} onUndo={onUndo} />
      );
    case "setDesignSystem":
      return <ChangeDSCard event={event} staggerIndex={staggerIndex} />;
    case "removeBlock":
      return <RemoveBlockCard event={event} staggerIndex={staggerIndex} />;
    default: {
      const title = TOOL_USE_TITLE[event.action] ?? event.action;
      const icon = TOOL_USE_ICON[event.action] ?? "bolt";
      const subtitle =
        typeof event.value === "string" ? event.value : undefined;
      return (
        <ToolUseCard
          icon={icon}
          title={title}
          subtitle={subtitle}
          staggerIndex={staggerIndex}
          onUndo={onUndo}
        >
          <pre className="tool-use-card__params-pre">
            {JSON.stringify(event.value, null, 2)}
          </pre>
        </ToolUseCard>
      );
    }
  }
}
