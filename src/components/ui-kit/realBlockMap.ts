/**
 * realBlockMap (W6-P2a) — a per-DS map of `blockType -> render function` for the
 * CORE set of builder blocks (Button, TextInput, Checkbox, Switch, Card),
 * returning the REAL design-system markup for that block.
 *
 * SCOPE: this PR implements ONLY uoaui. uoaui has no npm package — it is
 * className + `--a-*` token CSS (glassmorphism). So each render fn composes the
 * real `.a-*` classes (e.g. `<button className="a-btn a-btn-primary">`), sourced
 * from componentApiRegistry's UOAUI `toJsx` entries (the JSX-string exporter) and
 * the live demos in src/data/uoaui/uoaui-documentation.jsx. The styling for those
 * classes is injected by RealComponentRenderer's UoauiReal subtree (via the
 * existing getFullCSS / uoauiBuildCSS theme mechanism) — this file only emits the
 * DOM, never CSS.
 *
 * STRUCTURE: the map is keyed by SystemId so Carbon (needs scoped-CSS work) and
 * Salt/M3/Fluent (currently rendered by RealComponentRenderer's provider
 * subtrees) can be migrated into this same map later. Only `uoaui` is populated
 * here; everything else is intentionally absent.
 *
 * The render fns are pure (no hooks, no state) so they're safe to call from the
 * mounted-gated, read-only RealComponentRenderer. Inputs/controls are rendered
 * inert (readOnly / static class state) to match the store-free gallery demo.
 */

import React from "react";
import type { SystemId } from "@/lib/componentApiRegistry";

/** Coerce a builder field to a string with a fallback (mirrors registry `s`). */
const s = (v: unknown, fallback = ""): string => String(v ?? fallback);

/** A render fn takes the block's resolved props and returns the real markup. */
export type RealBlockRenderer = (props: Record<string, unknown>) => React.ReactNode;

/* ── uoaui: variant -> button class suffix (mirrors uoauiButtonClass in
   componentApiRegistry). uoaui has NO danger button, so danger falls to
   primary — the closest real class. ── */
function uoauiButtonClass(variant: string): string {
  const map: Record<string, string> = {
    primary: "a-btn-primary",
    secondary: "a-btn-secondary",
    outline: "a-btn-outline",
    ghost: "a-btn-ghost",
    danger: "a-btn-primary",
    destructive: "a-btn-primary",
  };
  return map[variant] ?? map.primary;
}

/* ════════════════════════════════════════════════════════════════════
   UOAUI core blocks — real `.a-*` markup (CSS injected by UoauiReal).
   ════════════════════════════════════════════════════════════════════ */
const UOAUI_REAL: Partial<Record<string, RealBlockRenderer>> = {
  SimulatedButton: (p) =>
    React.createElement(
      "button",
      { type: "button", className: `a-btn ${uoauiButtonClass(s(p.variant, "primary"))}` },
      s(p.label, "Button"),
    ),

  SimulatedTextInput: (p) =>
    React.createElement(
      "div",
      { className: "a-input-wrap" },
      React.createElement("label", { className: "a-input-label" }, s(p.label, "Label")),
      React.createElement("input", { className: "a-input", placeholder: s(p.placeholder), readOnly: true }),
    ),

  SimulatedCheckbox: (p) => {
    const checked = Boolean(p.defaultChecked);
    return React.createElement(
      "label",
      { className: `a-checkbox${checked ? " checked" : ""}` },
      React.createElement("span", { className: "a-cb-box", "aria-hidden": "true" }, checked ? "✓" : ""),
      s(p.label),
    );
  },

  /* uoaui DOES ship a real `.a-switch` CSS class (see uoauiBuildCSS / the
     Switches demo) — it's only OMITTED from the registry's className exporter
     because the on/off behaviour needs runtime state to emit honest static JSX.
     For the read-only live demo we render the on/off CSS state directly. */
  SimulatedSwitch: (p) => {
    const on = Boolean(p.defaultOn);
    return React.createElement(
      "button",
      { type: "button", className: `a-switch${on ? " on" : ""}`, role: "switch", "aria-checked": on, "aria-label": s(p.label, "Switch") },
      React.createElement("span", { className: "a-sw-thumb" }),
    );
  },

  SimulatedCard: (p) =>
    React.createElement(
      "div",
      { className: "a-card" },
      React.createElement("h3", { style: { margin: "0 0 4px" } }, s(p.title, "Card")),
      React.createElement("p", { style: { margin: 0 } }, s(p.content)),
    ),
};

/**
 * Per-DS real-block map. Only `uoaui` is implemented in this PR; the other DSs
 * are intentionally empty here (Salt/M3/Fluent render via RealComponentRenderer's
 * provider subtrees, Carbon awaits scoped-CSS work).
 */
export const realBlockMap: Record<SystemId, Partial<Record<string, RealBlockRenderer>>> = {
  salt: {},
  m3: {},
  fluent: {},
  carbon: {},
  uoaui: UOAUI_REAL,
};

/** The real-block renderer for (system, blockType), or undefined when none. */
export function getRealBlockRenderer(system: SystemId, blockType: string): RealBlockRenderer | undefined {
  return realBlockMap[system]?.[blockType];
}
