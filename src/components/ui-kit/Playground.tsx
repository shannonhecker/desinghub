"use client";

import React from "react";
import type { ComponentVariantMatrix, UiKitComponentId } from "@/data/ui-kit-meta";
import type { SystemId } from "@/lib/componentApiRegistry";
import { RealComponentRenderer, canRenderReal } from "./RealComponentRenderer";
import { BLOCK_TYPE, cellProps } from "./VariantsMatrix";
import { useTheme } from "@/contexts/ThemeContext";

const pretty = (v: string) => { const s = v.replace(/[-_]/g, " "); return s.charAt(0).toUpperCase() + s.slice(1); };

/* Settings survive a system switch: the label and the disabled flag always
   carry over; the variant carries over when the new system has one of the
   same name, and otherwise falls to that system's first variant. */
const carried: { label: string; disabled: boolean; variant: Partial<Record<UiKitComponentId, string>> } = { label: "", disabled: false, variant: {} };

/**
 * A small live playground: the system's real component with the props that
 * mean something for it. Only offered where a real renderer exists.
 */
export function Playground({ componentId, matrix, system, mode, saltDensity }: {
  componentId: UiKitComponentId;
  matrix: ComponentVariantMatrix;
  system: SystemId;
  mode: "light" | "dark";
  saltDensity: "high" | "medium" | "low" | "touch";
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const t = useTheme();
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  const type = BLOCK_TYPE[componentId];
  if (!type || !canRenderReal(system, type)) return null;

  const wanted = carried.variant[componentId];
  const variant = wanted && matrix.variants.includes(wanted) ? wanted : matrix.variants[0];
  const state = carried.disabled ? "disabled" : matrix.states.find((s) => s !== "disabled") ?? matrix.states[0];
  const base = cellProps(componentId, variant, state) ?? {};
  const props = { ...base, id: `play-${componentId}`, ...(carried.label ? { label: carried.label, title: carried.label } : {}) };
  const hasLabel = "label" in base || "title" in base;

  return (
    <section className="dh-section" aria-labelledby="dh-h-play">
      <h2 id="dh-h-play" className="dh-section-h">Playground</h2>
      <p className="dh-section-lede">The real component with its own props. Settings stay as you switch system.</p>
      <div className="kit-panel kit-play" data-testid="playground">
        <div className="kit-play-stage">
          {mounted ? <RealComponentRenderer system={system} type={type} mode={mode} saltDensity={saltDensity} props={props} kit={t.T} /> : null}
        </div>
        <div className="kit-play-controls">
          <fieldset>
            <legend>{matrix.variantAxisLabel}</legend>
            <div className="kit-seg" role="group" aria-label={matrix.variantAxisLabel}>
              {matrix.variants.map((v) => (
                <button key={v} type="button" aria-pressed={v === variant} onClick={() => { carried.variant[componentId] = v; force(); }}>{pretty(v)}</button>
              ))}
            </div>
          </fieldset>
          {matrix.states.includes("disabled") && (
            <fieldset>
              <legend>{matrix.stateAxisLabel}</legend>
              <div className="kit-seg" role="group" aria-label={matrix.stateAxisLabel}>
                <button type="button" aria-pressed={!carried.disabled} onClick={() => { carried.disabled = false; force(); }}>Enabled</button>
                <button type="button" aria-pressed={carried.disabled} onClick={() => { carried.disabled = true; force(); }}>Disabled</button>
              </div>
            </fieldset>
          )}
          {hasLabel && (
            <div>
              <label htmlFor="play-label">Label</label>
              <input id="play-label" type="text" value={carried.label} placeholder={String((base as { label?: string; title?: string }).label ?? (base as { title?: string }).title ?? "")} onChange={(e) => { carried.label = e.target.value; force(); }} maxLength={40} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
