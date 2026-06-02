/**
 * realBlockMap (W6-P2a, +Carbon W6-P2b) — a per-DS map of `blockType -> render
 * function` for the CORE set of builder blocks (Button, TextInput, Checkbox,
 * Switch, Card), returning the REAL design-system markup for that block.
 *
 * SCOPE: this file implements `uoaui` (className + `--a-*` token CSS, no npm
 * package) and `carbon` (real @carbon/react components).
 *
 *   - uoaui: each render fn composes the real `.a-*` classes (e.g.
 *     `<button className="a-btn a-btn-primary">`), sourced from
 *     componentApiRegistry's UOAUI `toJsx` entries and the live demos in
 *     src/data/uoaui/uoaui-documentation.jsx. Styling is injected by
 *     RealComponentRenderer's UoauiReal subtree (the existing getFullCSS /
 *     uoauiBuildCSS theme mechanism) — uoaui render fns emit DOM, never CSS.
 *
 *   - carbon (W6-P2b): each render fn returns a REAL @carbon/react component
 *     (Button kind=…, TextInput labelText + id, Checkbox labelText + id, Toggle
 *     for Switch labelText + id, Tile for Card) — prop mapping mirrors the
 *     CARBON entries in componentApiRegistry. The ~950 KB @carbon/styles global
 *     sheet is scoped at build time to `.carbon-live-scope` and lazy-loaded by
 *     CarbonScopeStyles; RealComponentRenderer's CarbonReal subtree wraps these
 *     in that scope + the `cds--white`/`cds--g100` theme so --cds-* resolve.
 *
 * STRUCTURE: the map is keyed by SystemId; Salt/M3/Fluent still render via
 * RealComponentRenderer's provider subtrees (they have no global reset, so they
 * don't need this scoped-CSS path) and are intentionally absent here.
 *
 * The render fns are pure (no hooks, no state) so they're safe to call from the
 * mounted-gated, read-only RealComponentRenderer. Inputs/controls are rendered
 * inert (readOnly / static state) to match the store-free gallery demo.
 */

import React from "react";
import {
  Button as CarbonButton,
  TextInput as CarbonTextInput,
  Checkbox as CarbonCheckbox,
  Toggle as CarbonToggle,
  Tile as CarbonTile,
} from "@carbon/react";
import type { SystemId } from "@/lib/componentApiRegistry";

/** Coerce a builder field to a string with a fallback (mirrors registry `s`). */
const s = (v: unknown, fallback = ""): string => String(v ?? fallback);

/** Stable slug from a label (mirrors registry `slug`) — Carbon's TextInput /
    Checkbox / Toggle require a unique `id`, derived from the label. */
const slug = (v: unknown, fallback = "field"): string =>
  s(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || fallback;

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

/* ── carbon: variant -> Carbon Button `kind` (mirrors carbonButtonAttrs in
   componentApiRegistry). Carbon API: kind = primary|secondary|tertiary|ghost|
   danger; tertiary is the bordered/outline button, danger the destructive kind. ── */
type CarbonButtonKind = "primary" | "secondary" | "tertiary" | "ghost" | "danger";
function carbonButtonKind(variant: string): CarbonButtonKind {
  const map: Record<string, CarbonButtonKind> = {
    primary: "primary",
    secondary: "secondary",
    outline: "tertiary",
    ghost: "ghost",
    danger: "danger",
    destructive: "danger",
  };
  return map[variant] ?? "primary";
}

/* ════════════════════════════════════════════════════════════════════
   CARBON core blocks — real @carbon/react components (W6-P2b). The global
   @carbon/styles reset is scoped to `.carbon-live-scope` (build-time, via
   public/carbon-scoped.css) + theme class, both supplied by CarbonReal in
   RealComponentRenderer. Inputs render inert (readOnly / defaultChecked) for
   the store-free gallery demo.
   ════════════════════════════════════════════════════════════════════ */
const CARBON_REAL: Partial<Record<string, RealBlockRenderer>> = {
  SimulatedButton: (p) =>
    React.createElement(
      CarbonButton,
      { kind: carbonButtonKind(s(p.variant, "primary")) },
      s(p.label, "Button"),
    ),

  SimulatedTextInput: (p) =>
    React.createElement(CarbonTextInput, {
      id: slug(p.label, "input"),
      labelText: s(p.label, "Label"),
      placeholder: s(p.placeholder),
      readOnly: true,
    }),

  SimulatedCheckbox: (p) =>
    React.createElement(CarbonCheckbox, {
      id: slug(p.label, "checkbox"),
      labelText: s(p.label),
      defaultChecked: Boolean(p.defaultChecked),
    }),

  /* Carbon's Switch maps to Toggle (a labelled on/off switch). */
  SimulatedSwitch: (p) =>
    React.createElement(CarbonToggle, {
      id: slug(p.label, "toggle"),
      labelText: s(p.label, "Switch"),
      defaultToggled: Boolean(p.defaultOn),
    }),

  /* Carbon's Card maps to Tile. */
  SimulatedCard: (p) =>
    React.createElement(
      CarbonTile,
      null,
      React.createElement("h3", { style: { margin: "0 0 4px" } }, s(p.title, "Card")),
      React.createElement("p", { style: { margin: 0 } }, s(p.content)),
    ),
};

/**
 * Per-DS real-block map. `uoaui` (className/CSS) and `carbon` (@carbon/react)
 * are implemented here; Salt/M3/Fluent are intentionally empty (they render via
 * RealComponentRenderer's provider subtrees — no global reset to scope).
 */
export const realBlockMap: Record<SystemId, Partial<Record<string, RealBlockRenderer>>> = {
  salt: {},
  m3: {},
  fluent: {},
  carbon: CARBON_REAL,
  uoaui: UOAUI_REAL,
};

/** The real-block renderer for (system, blockType), or undefined when none. */
export function getRealBlockRenderer(system: SystemId, blockType: string): RealBlockRenderer | undefined {
  return realBlockMap[system]?.[blockType];
}
