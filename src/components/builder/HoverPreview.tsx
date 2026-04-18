"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MiniPreview } from "./MiniPreview";

/* ══════════════════════════════════════════════════════════
   HoverPreview - fly-out tooltip next to a hovered tile.
   Rendered via portal to escape the sidebar's clipping.

   Activation contract:
     - Parent (BlueprintItem) manages a per-tile hover timer
       (300ms) and, on activation, calls show(type, label, rect).
     - HoverPreview renders a positioned popover to the left of
       the tile (sidebar is on the right edge) with a larger
       MiniPreview + component name + friendly description.
     - Moving the cursor off the tile calls hide() which removes
       the popover with a short fade.
   ══════════════════════════════════════════════════════════ */

export interface HoverPreviewState {
  type: string;
  label: string;
  desc?: string;
  rect: { top: number; left: number; width: number; height: number };
}

/** Human-readable one-liner for common types. Fallback returns a
 *  generic hint so the popover always has something useful. */
const TYPE_DESCRIPTIONS: Record<string, string> = {
  SimulatedButton: "Primary / secondary / outline / ghost variants, click to trigger actions.",
  SimulatedTextInput: "Single-line text field with label + placeholder.",
  SimulatedMultilineInput: "Multi-line textarea with configurable row count.",
  SimulatedNumberInput: "Numeric input with min / max / step controls.",
  SimulatedCheckbox: "Boolean input; defaults to unchecked.",
  SimulatedSwitch: "Toggle pill; defaults to off.",
  SimulatedRadioGroup: "Single-choice list from comma-separated options.",
  SimulatedSlider: "Range slider with min / max / value.",
  SimulatedDropdown: "Single-select menu; label + placeholder.",
  SimulatedComboBox: "Searchable dropdown with free-text + suggestions.",
  SimulatedListBox: "Selectable list, optionally multi-select.",
  SimulatedDatePicker: "Calendar grid with month + year props.",
  SimulatedFileDropZone: "Drop target for file uploads.",
  SimulatedTokenizedInput: "Input with deletable token chips.",
  Alert: "Info / success / warning / error banner with title + message.",
  SimulatedCard: "Container with a title + body area.",
  SimulatedStatCard: "Metric + value + progress bar. Supports colSpan.",
  SimulatedBadge: "Small label chip with status colour.",
  SimulatedPill: "Dismissible tag with optional X.",
  SimulatedProgress: "Horizontal progress bar 0–100%.",
  SimulatedAvatar: "Initial-based circle with presence indicator.",
  SimulatedAvatarGroup: "Overlapping avatars + 'max' overflow.",
  SimulatedPersona: "Avatar + name + role + presence.",
  SimulatedTabs: "Horizontal tab strip from CSV labels.",
  SimulatedBreadcrumb: "Path-separator navigation with chevrons.",
  SimulatedAccordion: "Collapsible panel with title + content.",
  SimulatedDialog: "Modal dialog with title + message.",
  SimulatedTooltip: "Hover hint attached to a button.",
  SimulatedPopover: "Click-triggered popover with title + content.",
  SimulatedChatMessage: "Conversation bubble (user or system).",
  SimulatedChart: "Simple bar chart with title + dataPoints.",
  SimulatedTree: "Nested list built from 'Parent > Child' CSV.",
  SimulatedRating: "Star rating with label + max + value.",
  SimulatedSkeleton: "Loading placeholder: card / text / avatar variants.",
  SimulatedSearchbox: "Icon + text input for search.",
  SimulatedNavDrawer: "Vertical nav with CSV items.",
  SimulatedLink: "Inline hyperlink with optional arrow.",
  SimulatedToggleButton: "Button that stays pressed/unpressed.",
  SimulatedSegmentedGroup: "Connected option row; single-select.",
  SimulatedTitle: "Heading H1–H4 with text content.",
  HighchartLine: "Line chart - trend over time.",
  HighchartArea: "Area chart - filled trend.",
  HighchartColumn: "Vertical bar chart - comparison.",
  HighchartBar: "Horizontal bar chart.",
  HighchartPie: "Pie chart - share of whole.",
  HighchartDonut: "Donut chart - pie with center hole.",
  HighchartScatter: "Scatter plot - XY points.",
  HighchartSpline: "Smooth curve trend.",
  HighchartStackedColumn: "Stacked vertical bars.",
  HighchartGauge: "Gauge meter with value.",
  HighchartHeatmap: "Grid of colour-coded cells.",
  HighchartTreemap: "Hierarchical rectangle chart.",
  AppBrand: "Header brand/logo label.",
  StatusPill: "Header status indicator.",
  NavItem: "Sidebar nav item with icon + active state.",
  FooterText: "Footer text + version.",
};

function friendlyFor(type: string): string {
  return TYPE_DESCRIPTIONS[type] ?? "Drag onto the canvas or click to add to the active zone.";
}

export function HoverPreview({ state }: { state: HoverPreviewState | null }) {
  const [mounted, setMounted] = useState(false);

  /* Portal requires a DOM node; mount flag prevents SSR mismatch. */
  useEffect(() => setMounted(true), []);
  if (!mounted || !state) return null;
  if (typeof document === "undefined") return null;

  /* Position to the left of the tile - the sidebar is on the right
     edge of the viewport so there's always room. Cap within the
     viewport with a small margin. */
  const POPOVER_W = 240;
  const POPOVER_H = 160;
  const MARGIN = 12;
  let left = state.rect.left - POPOVER_W - 10;
  if (left < MARGIN) left = MARGIN;
  let top = state.rect.top + state.rect.height / 2 - POPOVER_H / 2;
  if (top < MARGIN) top = MARGIN;
  const maxTop = window.innerHeight - POPOVER_H - MARGIN;
  if (top > maxTop) top = maxTop;

  const desc = state.desc ?? friendlyFor(state.type);

  return createPortal(
    <div
      className="lib-hover-preview"
      style={{ top, left, width: POPOVER_W }}
      role="tooltip"
    >
      <div className="lib-hover-preview-thumb">
        <MiniPreview type={state.type} />
      </div>
      <div className="lib-hover-preview-text">
        <div className="lib-hover-preview-label">{state.label}</div>
        <div className="lib-hover-preview-desc">{desc}</div>
        <div className="lib-hover-preview-hint">Click to add · drag to place</div>
      </div>
    </div>,
    document.body
  );
}
