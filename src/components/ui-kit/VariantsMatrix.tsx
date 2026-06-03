"use client";

/**
 * VariantsMatrix (W8-P3, real per-cell W9) — a live variants × states grid for
 * one component, in the spirit of the m3.material.io / spec.fluentui.com
 * "anatomy" matrix.
 *
 * Reads COMPONENT_VARIANTS[id] from src/data/ui-kit-meta.ts and renders the REAL
 * design-system control for each {variant, state} cell via RealComponentRenderer
 * — so every cell shows that ACTUAL variant in that ACTUAL state (e.g. a Salt
 * Button solid/bordered/transparent across default/disabled), not N clones of
 * one demo. The cell axes are mapped to real DS props per component:
 *
 *   - button:    variant axis -> `variant`; state axis -> `disabled` (hover /
 *                focus are CSS-only, rendered in default state).
 *   - textInput: variant axis -> `validationStatus`; state axis -> filled value
 *                + `disabled`.
 *   - checkbox:  variant axis -> checked / indeterminate; state axis -> disabled.
 *   - switch:    variant axis -> on / off; state axis -> disabled.
 *   - card:      variant axis -> card `variant` (states are CSS-only).
 *
 * When (system, component) has no real renderer (badge / select / avatar are out
 * of RealComponentRenderer's core set), the cell falls back to the live demo
 * specimen so the grid still reads, with the cell's state named beneath it.
 *
 * Each cell is given a calm, scrollable stage that constrains overflow without
 * clipping the control (no transform-scale clip), and the grid is aligned via a
 * uniform cell min-height.
 *
 * Pure presentation — no store writes, no hooks beyond the mounted gate that
 * keeps the DS style engines (MUI emotion / Fluent griffel) off SSR. Works light
 * + dark via the passed ActiveTheme token slots.
 */

import React from "react";
import type { ActiveTheme } from "@/contexts/ThemeContext";
import type { ComponentVariantMatrix, UiKitComponentId } from "@/data/ui-kit-meta";
import { RealComponentRenderer, canRenderReal } from "@/components/ui-kit/RealComponentRenderer";
import type { SystemId } from "@/lib/componentApiRegistry";

interface VariantsMatrixProps {
  matrix: ComponentVariantMatrix;
  /** Stable component key (button/textInput/…) — drives per-cell prop mapping. */
  componentId: UiKitComponentId;
  /** Active design system, for the real per-cell renderer. */
  system: SystemId;
  /** Light vs dark, derived from the active theme by the caller. */
  mode: "light" | "dark";
  /** Salt-family density (high/medium/low/touch). Ignored by M3/Fluent/Carbon. */
  saltDensity: "high" | "medium" | "low" | "touch";
  /** The live demo component for this (system, componentId) — fallback only. */
  Demo: React.ComponentType | null;
  t: ActiveTheme;
}

/** The Simulated* registry block type RealComponentRenderer keys off. */
const BLOCK_TYPE: Partial<Record<UiKitComponentId, string>> = {
  button: "SimulatedButton",
  textInput: "SimulatedTextInput",
  checkbox: "SimulatedCheckbox",
  switch: "SimulatedSwitch",
  card: "SimulatedCard",
};

/** Sentence-case a vocabulary token for display ("filled-darker" -> "Filled darker"). */
function pretty(label: string): string {
  const spaced = label.replace(/[-_]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Lowercase, hyphenate a token for use in a unique DOM id ("On / Off" -> "on-off"). */
function slugify(v: string): string {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "x";
}

/**
 * Map a cell's (variant, state) to the real props RealComponentRenderer consumes
 * for this component. The variant axis usually drives the visual variant; the
 * state axis drives interaction state (disabled is real; hover/focus/rest/open
 * are CSS-only and render in the default state, which is honest for a static
 * grid). Returns null when this component isn't in the real core set.
 */
function cellProps(
  componentId: UiKitComponentId,
  variant: string,
  state: string,
): Record<string, unknown> | null {
  const disabled = state === "disabled";
  // Stable, unique-per-cell id so DS renderers that need a DOM id (e.g. Carbon's
  // TextInput / Checkbox / Toggle) don't collide across cells — the display label
  // can stay constant, but every cell's control id must be unique (valid HTML +
  // unambiguous for screen readers / label association).
  const cellId = `vm-${componentId}-${slugify(variant)}-${slugify(state)}`;
  switch (componentId) {
    case "button":
      return { variant, label: pretty(variant), disabled };
    case "textInput":
      return {
        id: cellId,
        label: "Label",
        placeholder: "Placeholder",
        // "filled" state shows a real value; "empty" leaves the placeholder.
        value: state === "filled" ? "Value" : "",
        validationStatus: variant === "default" ? undefined : variant,
        disabled,
      };
    case "checkbox":
      return {
        id: cellId,
        label: "Option",
        defaultChecked: variant === "checked",
        indeterminate: variant === "indeterminate",
        disabled,
      };
    case "switch":
      return { id: cellId, label: "Toggle", defaultOn: variant === "on", disabled };
    case "card":
      // Card has no variant prop in the real renderer; the variant names the
      // surface treatment and the renderer shows the canonical card. State is
      // CSS-only. Title names the variant so the cell reads distinctly.
      return { title: pretty(variant), content: "Card content" };
    default:
      return null;
  }
}

export function VariantsMatrix({
  matrix,
  componentId,
  system,
  mode,
  saltDensity,
  Demo,
  t,
}: VariantsMatrixProps) {
  /* Gate the DS style engines (MUI emotion / Fluent griffel) off SSR / first
     hydration — mirrors RealComponentRenderer's caller contract. */
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!matrix) return null;

  const blockType = BLOCK_TYPE[componentId];
  const canReal = mounted && blockType ? canRenderReal(system, blockType) : false;

  return (
    <div className="dh-detail-card" style={{ borderColor: t.border, background: t.bg2 }}>
      {/* Axis legend — names the two vocabularies the DS exposes for this
          component, so the reader knows what "Variant × State" means here. */}
      <div className="dh-matrix-legend" style={{ color: t.fg3, borderBottomColor: t.borderSubtle }}>
        <span>
          <strong style={{ color: t.fg2 }}>{matrix.variantAxisLabel}</strong>
          {" "}down · {matrix.variants.length} value{matrix.variants.length === 1 ? "" : "s"}
        </span>
        <span aria-hidden="true" style={{ opacity: 0.4 }}>×</span>
        <span>
          <strong style={{ color: t.fg2 }}>{matrix.stateAxisLabel}</strong>
          {" "}across · {matrix.states.length} value{matrix.states.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="dh-matrix-scroll">
        <table className="dh-matrix" style={{ fontFamily: t.font }}>
          <thead>
            <tr>
              <th
                scope="col"
                className="dh-matrix-corner"
                style={{ color: t.fg3, borderColor: t.borderSubtle }}
              >
                <span className="dh-matrix-axis-x">{matrix.variantAxisLabel}</span>
              </th>
              {matrix.states.map((state) => (
                <th
                  key={state}
                  scope="col"
                  className="dh-matrix-colhead"
                  style={{ color: t.fg2, borderColor: t.borderSubtle }}
                >
                  {pretty(state)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.variants.map((variant) => (
              <tr key={variant}>
                <th
                  scope="row"
                  className="dh-matrix-rowhead"
                  style={{ color: t.fg2, borderColor: t.borderSubtle }}
                >
                  {pretty(variant)}
                </th>
                {matrix.states.map((state) => {
                  const real = canReal ? cellProps(componentId, variant, state) : null;
                  return (
                    <td
                      key={`${variant}-${state}`}
                      className="dh-matrix-cell"
                      style={{ borderColor: t.borderSubtle }}
                    >
                      <div className="dh-matrix-specimen">
                        {real && blockType ? (
                          <RealComponentRenderer
                            system={system}
                            type={blockType}
                            mode={mode}
                            saltDensity={saltDensity}
                            props={real}
                          />
                        ) : Demo ? (
                          <Demo />
                        ) : (
                          <span style={{ color: t.fg3, fontSize: t.scale.labF }}>{pretty(state)}</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
