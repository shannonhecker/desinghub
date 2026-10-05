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
import { DEFAULT_TABLE_COLUMNS, DEFAULT_TABLE_ROWS } from "@/lib/tableData";

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

/* What a specimen shows in Compare when its everyday sample is too wide for
   a tile a fifth of the page across. The table keeps its first two columns
   (the name and the status tag: where the systems differ). The component is
   untouched; it is handed less to draw. */
const COMPARE_SPECIMEN: Record<string, Record<string, unknown>> = {
  "data-table": {
    columns: DEFAULT_TABLE_COLUMNS.slice(0, 2),
    rows: DEFAULT_TABLE_ROWS.map((row) => row.slice(0, 2)),
  },
};
/* Concepts whose specimen is as wide as its content (a table), so a narrow
   tile can still cut it: the stage draws these smaller, one scale for the
   whole row, until the widest fits. */
const FIT_TO_TILE = new Set(["data-table"]);
/** Below this the specimen is no longer one you can read. */
const MIN_FIT = 0.75;

/**
 * Sets --kit-compare-fit on the list: the largest scale (at most 1) at which
 * every tile's specimen is as wide as its tile. Measured from the specimens
 * themselves at life size, so a system whose table scrolls inside its own
 * wrapper (Carbon) is counted too.
 */
function useFitToTile(enabled: boolean, deps: React.DependencyList) {
  const ref = React.useRef<HTMLUListElement | null>(null);
  React.useEffect(() => {
    const list = ref.current;
    if (!enabled || !list) return;
    let frame = 0;
    const fit = () => {
      frame = 0;
      list.style.setProperty("--kit-compare-fit", "1");
      let scale = 1;
      for (const box of list.querySelectorAll<HTMLElement>(".kit-compare-fit")) {
        const room = box.clientWidth;
        if (room <= 0) continue;
        let over = 0;
        /* Containers only: a visually hidden label is also "wider than its box". */
        for (const el of [box, ...box.querySelectorAll<HTMLElement>("*")]) {
          if (el.clientWidth >= room / 2) over = Math.max(over, el.scrollWidth - el.clientWidth);
        }
        if (over > 0.5) scale = Math.min(scale, room / (room + over));
      }
      list.style.setProperty("--kit-compare-fit", String(Math.max(MIN_FIT, Math.floor(scale * 1000) / 1000)));
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(fit); };
    fit();
    /* The tiles change width with the page; a system's stylesheet and its
       typeface can arrive after the first paint and change the table's. */
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(queue);
    observer?.observe(list);
    list.querySelectorAll(".kit-compare-fit table").forEach((t) => observer?.observe(t));
    const mutations = new MutationObserver(queue);
    mutations.observe(document.head, { childList: true });
    void document.fonts?.ready.then(queue);
    return () => { observer?.disconnect(); mutations.disconnect(); if (frame) cancelAnimationFrame(frame); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);
  return ref;
}

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
  const fits = FIT_TO_TILE.has(concept);
  const fitRef = useFitToTile(fits, [mounted, mode, state.activeSystem, compact]);
  const listRef = React.useCallback((el: HTMLUListElement | null) => {
    fitRef.current = el;
    if (compact) fade(el);
  }, [compact, fade, fitRef]);
  if (!type || !def) return null;

  const specimen = (sys: SystemId, theme: ReturnType<typeof getTheme>) => (
    <RealComponentRenderer system={sys} type={type} mode={mode} saltDensity="medium" kit={theme} props={{ ...(entry?.defaults ?? {}), ...(COMPARE_SPECIMEN[concept] ?? {}), id: `cmp-${concept}-${sys}${compact ? "-band" : ""}` }} />
  );

  return (
    <ul className={`kit-compare${compact ? " is-compact" : ""}`} ref={listRef} data-testid="compare-panels" data-concept={concept}>
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
                fits ? <div className="kit-compare-fit">{specimen(sys, theme)}</div> : specimen(sys, theme)
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
