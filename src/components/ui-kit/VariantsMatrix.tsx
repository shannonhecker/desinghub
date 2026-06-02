"use client";

/**
 * VariantsMatrix (W8-P3) — a live variants × states grid for one component, in
 * the spirit of the m3.material.io / spec.fluentui.com "anatomy" matrix.
 *
 * Reads COMPONENT_VARIANTS[id] from src/data/ui-kit-meta.ts (pure data on main)
 * and renders the component's real live demo specimen in every {variant,state}
 * cell, with both axes labelled. The demo we render is the SAME getDemoComponent
 * the Specimen section uses — we do NOT synthesise a per-cell variant; the grid
 * is a documentation surface that names the variant/state vocabulary the DS
 * exposes and shows the live component beside each cell so the reader can map
 * the label to the rendered control.
 *
 * Null-guarded: when the active component has no matrix entry the section is
 * simply absent (the caller already gates on COMPONENT_VARIANTS[id]).
 *
 * Pure presentation — no store writes, no hooks beyond reading the theme. Works
 * light + dark via the passed ActiveTheme token slots.
 */

import React from "react";
import type { ActiveTheme } from "@/contexts/ThemeContext";
import type { ComponentVariantMatrix } from "@/data/ui-kit-meta";

interface VariantsMatrixProps {
  matrix: ComponentVariantMatrix;
  /** The live demo component for this (system, componentId). May be null. */
  Demo: React.ComponentType | null;
  t: ActiveTheme;
}

/** Sentence-case a vocabulary token for display ("filled-darker" -> "Filled darker"). */
function pretty(label: string): string {
  const spaced = label.replace(/[-_]/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export function VariantsMatrix({ matrix, Demo, t }: VariantsMatrixProps) {
  if (!matrix) return null;

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
                {matrix.states.map((state) => (
                  <td
                    key={`${variant}-${state}`}
                    className="dh-matrix-cell"
                    style={{ borderColor: t.borderSubtle }}
                  >
                    <div className="dh-matrix-specimen">
                      {Demo ? (
                        <Demo />
                      ) : (
                        <span style={{ color: t.fg3, fontSize: 11 }}>{pretty(state)}</span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
