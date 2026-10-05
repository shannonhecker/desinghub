"use client";

import React from "react";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { getComponents, getFont, getTheme } from "@/data/registry";
import { kitEntry } from "@/lib/kitCatalog";
import { RealComponentRenderer, canRenderReal } from "./RealComponentRenderer";
import { CONCEPTS, EQ_SYSTEMS, SYSTEM_LABEL, conceptOf, kitHref } from "./kitEquivalence";
import { isDarkActive } from "./kitHandoff";
import { useTheme } from "@/contexts/ThemeContext";
import { useEdgeFade } from "./useEdgeFade";

/**
 * Compare: one component, five design systems, side by side.
 *
 * Every panel is drawn by RealComponentRenderer in that system's styling:
 * the official Salt, Fluent and Carbon packages, MUI wearing the kit's
 * Material 3 theme, and the uoaui classes, each on that system's own
 * surface and typeface, in the mode in view. Which entry is
 * "the same component" in each system comes from kitEquivalence, the same
 * map the system switcher uses.
 */

/* Concepts with a real cross-system renderer, and the builder block that
   draws each. Anything else is listed honestly instead of faked. */
export const COMPARE_BLOCK: Record<string, string> = {
  button: "SimulatedButton",
  "text-input": "SimulatedTextInput",
  checkbox: "SimulatedCheckbox",
  switch: "SimulatedSwitch",
  card: "SimulatedCard",
  tag: "SimulatedPill",
  badge: "SimulatedBadge",
  link: "SimulatedLink",
  alert: "Alert",
  progress: "SimulatedProgress",
  avatar: "SimulatedAvatar",
  dropdown: "SimulatedDropdown",
  search: "SimulatedSearchbox",
  segmented: "SimulatedSegmentedGroup",
  accordion: "SimulatedAccordion",
  "data-table": "SimulatedDataTable",
};

const MODE_THEME: Record<SystemId, { light: string; dark: string }> = {
  salt: { light: "jpm-light", dark: "jpm-dark" },
  m3: { light: "light", dark: "dark" },
  fluent: { light: "light", dark: "dark" },
  uoaui: { light: "light", dark: "dark" },
  carbon: { light: "white", dark: "g100" },
};
const CANVAS_KEY: Record<SystemId, string> = { salt: "bg", m3: "surface", fluent: "bg1", uoaui: "bg", carbon: "bg" };
const TEXT_KEY: Record<SystemId, string> = { salt: "fg", m3: "onSurface", fluent: "fg1", uoaui: "fg", carbon: "fg" };

/** True when Compare can draw this concept live. */
export function canCompare(concept: string | null): boolean {
  return !!concept && concept in COMPARE_BLOCK;
}

export function ComparePanels({ concept, compact = false }: { concept: string; compact?: boolean }) {
  const state = useDesignHub();
  const active = useTheme();
  const dark = isDarkActive(state);
  const mode = dark ? "dark" : "light";
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const type = COMPARE_BLOCK[concept];
  const entry = type ? kitEntry(type) : null;
  const def = CONCEPTS[concept];
  const fade = useEdgeFade<HTMLUListElement>();
  if (!type || !def) return null;

  return (
    <ul className={`kit-compare${compact ? " is-compact" : ""}`} ref={compact ? fade : undefined} data-testid="compare-panels" data-concept={concept}>
      {EQ_SYSTEMS.map((sys) => {
        const id = def.ids[sys];
        const current = sys === state.activeSystem;
        /* The system in view uses the very theme its page draws from (custom
           accents and Material custom colours included). */
        const theme = current ? active.T : getTheme(sys, MODE_THEME[sys][mode]);
        const real = !!id && canRenderReal(sys, type);
        const name = id ? getComponents(sys).find((c) => c.id === id)?.name : null;
        return (
          <li key={sys} className="kit-compare-panel" data-system={sys} data-current={current || undefined}>
            <div
              className="kit-compare-stage"
              style={{
                backgroundColor: String(theme[CANVAS_KEY[sys]] ?? "transparent"),
                backgroundImage: sys === "uoaui" && theme.gradient ? String(theme.gradient) : undefined,
                color: String(theme[TEXT_KEY[sys]] ?? "inherit"),
                fontFamily: getFont(sys),
              }}
            >
              {real && mounted ? (
                <RealComponentRenderer system={sys} type={type} mode={mode} saltDensity="medium" kit={theme} props={{ ...(entry?.defaults ?? {}), id: `cmp-${concept}-${sys}${compact ? "-band" : ""}` }} />
              ) : real ? null : (
                <p className="kit-compare-none">{def.systemOnly ? `${SYSTEM_LABEL[sys]} has no ${def.label.toLowerCase()}.` : `No ${def.label.toLowerCase()} page for ${SYSTEM_LABEL[sys]} in this library yet.`}</p>
              )}
            </div>
            <div className="kit-compare-meta">
              <strong>{SYSTEM_LABEL[sys]}</strong>
              {id && name ? (
                current
                  ? <span>{name}, in view</span>
                  : <a href={kitHref({ ds: sys, c: id })} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); state.setActiveSystem(sys); }}>{name}</a>
              ) : <span>{def.systemOnly ? "Not in this system" : "No page here yet"}</span>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** The Compare tab of a detail page. */
export function CompareView({ componentId }: { componentId: string }) {
  const system = useDesignHub((s) => s.activeSystem);
  const concept = conceptOf(system, componentId);
  const def = concept ? CONCEPTS[concept] : null;
  if (!concept || !def) return null;
  const have = EQ_SYSTEMS.filter((s) => def.ids[s]);

  return (
    <section className="dh-section" aria-labelledby="dh-h-compare">
      <h2 id="dh-h-compare" className="dh-section-h">{def.label} in five systems</h2>
      <p className="dh-section-lede kit-compare-lede">
        {canCompare(concept)
          ? "The same component in each system's own styling, on its own surface and typeface, in the mode you are viewing. Choose a system to open its page here."
          : `A live side-by-side is not built for ${def.label.toLowerCase()} yet. These systems document it:`}
      </p>
      {canCompare(concept) ? <ComparePanels concept={concept} /> : (
        <ul className="kit-compare-list">
          {EQ_SYSTEMS.map((s) => (
            <li key={s}>
              <strong>{SYSTEM_LABEL[s]}</strong>
              {def.ids[s]
                ? <a href={kitHref({ ds: s, c: def.ids[s]!, tab: "compare" })} onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; e.preventDefault(); useDesignHub.getState().setActiveSystem(s); }}>{getComponents(s).find((c) => c.id === def.ids[s])?.name}</a>
                : <span>{def.systemOnly ? "Not in this system" : "No page here yet"}</span>}
            </li>
          ))}
        </ul>
      )}
      {have.length < EQ_SYSTEMS.length && canCompare(concept) && (
        <p className="kit-note">{def.systemOnly ? `${have.length} of 5 systems ship a ${def.label.toLowerCase()}.` : `This library documents the ${def.label.toLowerCase()} for ${have.length} of the 5 systems so far.`}</p>
      )}
    </section>
  );
}
