"use client";

import React from "react";
import Link from "next/link";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getComponents, getSystemInfo } from "@/data/registry";
import { COMPONENT_SUBCATS, SUBCAT_ORDER } from "@/data/componentCategories";
import { COMPONENT_VARIANTS } from "@/data/ui-kit-meta";
import { META_ID } from "@/components/ComponentPreview";
import { getUiKitGroup, BUILDER_BLOCKS } from "./uiKitGroups";
import { isDarkActive, toggleActiveMode } from "./kitHandoff";
import { LiveSpecimen } from "./LiveSpecimen";
import { ComparePanels } from "./CompareView";
import { CONCEPTS } from "./kitEquivalence";
import { useEdgeFade } from "./useEdgeFade";

/* One plain sentence per system. Only things the kit itself documents. */
const SYSTEM_LEDE: Record<SystemId, string> = {
  salt: "J.P. Morgan's system for dense financial interfaces: four densities on a three-layer token model.",
  m3: "Google's system built on dynamic colour, tonal surfaces and expressive shape.",
  fluent: "Microsoft's system for app surfaces, with brand theming and three control sizes.",
  uoaui: "The house system: frosted glass layers over aurora gradients, in four densities.",
  carbon: "IBM's open-source system on a 2px grid, with four themes.",
};
/* Base spacing unit as each system's Spacing foundation states it. Material
   has no spacing foundation page here, so it shows none. */
const BASE_UNIT: Partial<Record<SystemId, number>> = { salt: 4, fluent: 4, uoaui: 4, carbon: 2 };

export type KitSection = "foundations" | "components" | "patterns" | "tools";
export type KitFilter = "all" | KitSection;

interface Entry { id: string; name: string; desc: string; sub?: string }
interface ToolEntry extends Entry { icon: string; href?: string }

const TOOL_ICON: Record<string, string> = { tokens: "palette", audit: "fact_check", "builder-blocks": "widgets" };
const PAGE_TOOLS: ToolEntry[] = [
  { id: "page-token-reference", name: "Token reference", icon: "table_rows", href: "/token-editor",
    desc: "Every colour token for the system in view in one searchable table. Copy single values or the whole set as JSON." },
  { id: "page-theme-builder", name: "Theme builder", icon: "format_paint", href: "/theme-builder",
    desc: "Change a system's colours, check contrast against a live preview, then copy the changes as JSON." },
];
const COMPARE_PICKS = ["button", "text-input", "data-table", "checkbox", "switch"];

const matches = (q: string, ...fields: (string | undefined)[]) => !q || fields.some((f) => f && f.toLowerCase().includes(q));
/** The first sentence, so a card never ends in an ellipsis mid-thought. */
const lead = (desc: string) => {
  const m = desc.match(/^(.{24,}?[.!?])(\s|$)/);
  return (m ? m[1] : desc).replace(/\s*-\s*$/, "");
};
/** Shared bigrams, for "nearest match" suggestions on an empty search. */
const bigrams = (s: string) => { const out = new Set<string>(); const t = s.toLowerCase(); for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2)); return out; };
function nearest(q: string, pool: Entry[], n = 3): Entry[] {
  const qb = bigrams(q);
  return pool
    .map((e) => { const eb = bigrams(e.name); let hit = 0; qb.forEach((b) => { if (eb.has(b)) hit++; }); return { e, score: hit / Math.max(1, qb.size) }; })
    .filter((x) => x.score >= 0.34)
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.e);
}

/**
 * Column spans that make every row complete. A section rarely has a multiple
 * of four entries, so its first tiles are widened (featured) by exactly the
 * number of columns the last row would otherwise leave empty.
 */
export function rowSpans(n: number, cols: number): number[] {
  const spans = new Array<number>(n).fill(1);
  if (n === 0 || cols <= 1) return spans;
  if (n < cols) {
    /* One short row: share it out. */
    let spare = cols - n;
    for (let i = 0; spare > 0; i = (i + 1) % n) { spans[i]++; spare--; }
    return spans;
  }
  let spare = (cols - (n % cols)) % cols;
  for (let i = 0; spare > 0 && i < n; i++) { spans[i] = 2; spare--; }
  return spans;
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q);
  if (i < 0) return <>{text}</>;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

const DENSITY_OPTIONS: Record<SystemId, { value: string; label: string }[]> = {
  salt: ["high", "medium", "low", "touch"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
  uoaui: ["high", "medium", "low", "touch"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
  fluent: ["small", "medium", "large"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
  carbon: ["compact", "normal", "spacious"].map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })),
  m3: [{ value: "0", label: "Default" }, { value: "-1", label: "-1" }, { value: "-2", label: "-2" }, { value: "-3", label: "-3" }],
};

/** Live fingerprint: the system's own face, palette, corners, row height and
    spacing unit, drawn from its tokens. Mode and density are real controls. */
function Fingerprint() {
  const state = useDesignHub();
  const t = useTheme();
  const sys = state.activeSystem;
  const dark = isDarkActive(state);
  /* The system's typeface is the first family its stack names (a
     var(--font-...) entry is a loader alias for the family named after it).
     That is the fact the Typography page states too, so the two agree. Where
     this browser cannot draw it (Segoe UI ships with Windows only), the
     caption says which face stands in, instead of renaming the system's
     typeface after the fallback. */
  const families = t.font.split(",").map((f) => f.replace(/['"]/g, "").trim()).filter((f) => f && !f.startsWith("var("));
  const fontName = families[0] ?? "System";
  const aliased = /^\s*var\(/.test(t.font);
  const [standIn, setStandIn] = React.useState<string | null>(null);
  React.useEffect(() => {
    let live = true;
    const detect = () => {
      let next: string | null = null;
      try {
        /* A loader alias is always available: the app hosts that face. For a
           named family, document.fonts.check answers true for anything it has
           no face rule for, so measure instead: a family the browser cannot
           draw sets the sample exactly as the generic fallback does. */
        const ctx = document.createElement("canvas").getContext("2d");
        const sample = "mmmmmmmmmmlliWQ@#0123456789";
        const width = (family: string) => { ctx!.font = `72px ${family}`; return ctx!.measureText(sample).width; };
        const drawable = (f: string) => !!ctx && (width(`"${f}", monospace`) !== width("monospace") || width(`"${f}", serif`) !== width("serif"));
        if (ctx && !aliased && !drawable(fontName)) {
          const apple = /Mac|iPhone|iPad/.test(navigator.platform);
          const system = (f: string) => f === "system-ui" || f === "sans-serif" || (apple && (f === "-apple-system" || f === "BlinkMacSystemFont"));
          /* Walk the stack in order: the first entry this browser can use. */
          const used = families.slice(1).find((f) => system(f) || (!f.startsWith("-") && f !== "BlinkMacSystemFont" && drawable(f)));
          next = !used || system(used) ? "the system sans" : used;
        }
      } catch { /* leave the caption plain */ }
      if (live) setStandIn(next);
    };
    /* Web fonts arrive after first paint: measure once they are in, and
       again whenever another face finishes loading. */
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    if (!fonts?.ready) { detect(); return; }
    void fonts.ready.then(detect);
    fonts.addEventListener?.("loadingdone", detect);
    return () => { live = false; fonts.removeEventListener?.("loadingdone", detect); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.font]);
  const palette = [t.accent, t.accentWeak, t.successStrong, t.warningStrong, t.dangerStrong, t.infoStrong, t.fg, t.fg2, t.bg3]
    .filter((c): c is string => typeof c === "string" && c.length > 0)
    .filter((c, i, a) => a.indexOf(c) === i)
    .slice(0, 8);
  const density =
    sys === "salt" ? state.salt.density : sys === "m3" ? String(state.m3.density) : sys === "fluent" ? state.fluent.size
    : sys === "carbon" ? state.carbon.density : state.uoaui.density;
  const setDensity = (v: string) => {
    if (sys === "salt") state.setSaltDensity(v);
    else if (sys === "m3") state.setM3Density(Number(v));
    else if (sys === "fluent") state.setFluentSize(v);
    else if (sys === "carbon") state.setCarbonDensity(v);
    else state.setUoauiDensity(v);
  };
  const unit = BASE_UNIT[sys];
  const fade = useEdgeFade<HTMLDivElement>();
  return (
    <div className="kit-fp" ref={fade} aria-label={`${getSystemInfo(sys).name} at a glance`}>
      <div className="kit-fp-cell kit-fp-type">
        <span className="kit-fp-aa" aria-hidden="true">Aa</span>
        <span><b>{fontName}</b><i>{standIn ? `Typeface, shown in ${standIn}` : "Typeface"}</i></span>
      </div>
      <div className="kit-fp-cell">
        <span className="kit-fp-ramp" aria-hidden="true">{palette.map((c) => <span key={c} style={{ background: c }} />)}</span>
        <i>Core palette</i>
      </div>
      <div className="kit-fp-cell">
        <span className="kit-fp-shapes" aria-hidden="true">
          <span className="kit-fp-corner is-control" />
          <span className="kit-fp-corner" />
          <span className="kit-fp-row" style={{ height: t.scale.navH }} />
        </span>
        <i>Corners, {t.scale.navH}px row{unit ? `, ${unit}px unit` : ""}</i>
      </div>
      <div className="kit-fp-cell kit-fp-controls">
        <div className="kit-seg" role="group" aria-label="Mode">
          <button type="button" aria-pressed={!dark} onClick={() => { if (dark) toggleActiveMode(); }}>Light</button>
          <button type="button" aria-pressed={dark} onClick={() => { if (!dark) toggleActiveMode(); }}>Dark</button>
        </div>
        <div className="kit-seg" role="group" aria-label={sys === "fluent" ? "Size" : "Density"}>
          {DENSITY_OPTIONS[sys].map((o) => (
            <button key={o.value} type="button" aria-pressed={density === o.value} onClick={() => setDensity(o.value)}>{o.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

export const LandingGrid = React.memo(function LandingGrid() {
  const filter = useDesignHub((s) => s.overviewFilter) as KitFilter;
  const onFilter = useDesignHub((s) => s.setOverviewFilter);
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const setSelectedComponent = useDesignHub((s) => s.setSelectedComponent);
  const searchQuery = useDesignHub((s) => s.searchQuery);
  const setSearchQuery = useDesignHub((s) => s.setSearchQuery);
  const components = getComponents(activeSystem);
  const sysInfo = getSystemInfo(activeSystem);
  const searchRef = React.useRef<HTMLInputElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [pick, setPick] = React.useState(COMPARE_PICKS[0]);
  const filtersFade = useEdgeFade<HTMLDivElement>();
  const picksFade = useEdgeFade<HTMLDivElement>();

  /* "/" jumps to search from anywhere on the overview (unless typing). */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const q = searchQuery.trim().toLowerCase();

  /* Grouping reads the same source of truth as the side panel. */
  const allFoundations: Entry[] = components.filter((c) => getUiKitGroup(c.id, c.cat) === "Foundations");
  const allComponents: Entry[] = components
    .filter((c) => c.cat === "Components & Patterns" && getUiKitGroup(c.id, c.cat) === "Components")
    .map((c) => ({ ...c, sub: COMPONENT_SUBCATS[c.id] ?? "More" }));
  const allPatterns: Entry[] = components.filter((c) => c.cat === "Patterns" && getUiKitGroup(c.id, c.cat) === "Components");
  const allTools: ToolEntry[] = [
    ...components.filter((c) => getUiKitGroup(c.id, c.cat) === "Tools").map((c) => ({ id: c.id, name: c.name, desc: c.desc, icon: TOOL_ICON[c.id] ?? "build" })),
    { id: BUILDER_BLOCKS.id, name: BUILDER_BLOCKS.name, desc: BUILDER_BLOCKS.desc, icon: TOOL_ICON[BUILDER_BLOCKS.id] },
    ...PAGE_TOOLS,
  ];

  const foundations = allFoundations.filter((c) => matches(q, c.name, c.desc));
  const componentGroups = [...SUBCAT_ORDER, "More"]
    .map((sub) => ({ sub, items: allComponents.filter((c) => c.sub === sub && matches(q, c.name, c.desc, sub)).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((g) => g.items.length > 0);
  const patterns = allPatterns.filter((c) => matches(q, c.name, c.desc)).sort((a, b) => a.name.localeCompare(b.name));
  const tools = allTools.filter((c) => matches(q, c.name, c.desc));

  const counts: Record<KitSection, number> = {
    foundations: foundations.length,
    components: componentGroups.reduce((n, g) => n + g.items.length, 0),
    patterns: patterns.length,
    tools: tools.length,
  };
  const total = counts.foundations + counts.components + counts.patterns + counts.tools;
  const visibleTotal = filter === "all" ? total : counts[filter];
  const show = (s: KitSection) => (filter === "all" || filter === s) && counts[s] > 0;
  const filters: { id: KitFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: total },
    { id: "foundations", label: "Foundations", count: counts.foundations },
    { id: "components", label: "Components", count: counts.components },
    { id: "patterns", label: "Patterns", count: counts.patterns },
    { id: "tools", label: "Tools", count: counts.tools },
  ];
  const suggestions = q && total === 0 ? nearest(q, [...allComponents, ...allFoundations, ...allPatterns, ...allTools.filter((x) => !x.href)]) : [];

  /* Arrow keys walk the results in reading order; Enter in the field opens
     the first one. */
  const hits = () => [...(rootRef.current?.querySelectorAll<HTMLElement>(".uikit-card-hit") ?? [])];
  const onSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && searchQuery) { e.preventDefault(); setSearchQuery(""); }
    else if (e.key === "ArrowDown") { e.preventDefault(); hits()[0]?.focus(); }
    else if (e.key === "Enter" && q) { e.preventDefault(); hits()[0]?.click(); }
  };
  const onWallKey = (e: React.KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
    const list = hits();
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    e.preventDefault();
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? i + 1 : i - 1;
    if (next < 0) searchRef.current?.focus(); else list[Math.min(next, list.length - 1)]?.focus();
  };

  const metaLine = (c: Entry): string | null => {
    const v = COMPONENT_VARIANTS[META_ID[c.id]];
    if (v) return `${v.variants.length} ${v.variants.length === 1 ? "variant" : "variants"}, ${v.states.length} states`;
    return null;
  };

  const wall = (items: Entry[], Heading: "h3" | "h4") => {
    const s4 = rowSpans(items.length, 4), s3 = rowSpans(items.length, 3), s2 = rowSpans(items.length, 2);
    return (
      <ul className="kit-wall">
        {items.map((c, i) => {
          const meta = metaLine(c);
          return (
            <li key={c.id} className="uikit-card kit-tile" data-entry={c.id}
              style={{ "--s4": s4[i], "--s3": s3[i], "--s2": s2[i] } as React.CSSProperties}>
              {/* The system's real component, live. It is shown here, not
                  operated: inert keeps its controls out of the tab order
                  and the whole tile opens the detail page. */}
              <div className="kit-stage" aria-hidden="true" inert>
                <LiveSpecimen id={c.id} />
              </div>
              <div className="kit-tile-text">
                <Heading className="kit-tile-name">
                  <button type="button" className="uikit-card-hit" onClick={() => setSelectedComponent(c.id)}><Highlight text={c.name} q={q} /></button>
                </Heading>
                {c.desc && <p className="kit-tile-desc">{lead(c.desc)}</p>}
                {meta && <p className="kit-tile-meta">{meta}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  const jump = (id: string) => rootRef.current?.querySelector(`#${id}`)?.scrollIntoView({ block: "start" });

  return (
    <div className="kit-page" ref={rootRef} data-system={activeSystem} onKeyDown={onWallKey}>
      <header className="kit-head">
        <div className="kit-head-copy">
          <h1 className="kit-title">{sysInfo.name}</h1>
          <p className="kit-lede">{SYSTEM_LEDE[activeSystem]}</p>
        </div>
        <Fingerprint />
      </header>

      <div className="kit-toolbar">
        <div className="kit-search">
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <label htmlFor="kit-search" className="sr-only">Search {sysInfo.name}</label>
          <input
            id="kit-search" ref={searchRef} type="search" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={onSearchKey}
            placeholder={`Search ${sysInfo.name}`} aria-describedby="kit-search-status" autoComplete="off" spellCheck={false}
          />
          <kbd aria-hidden="true">/</kbd>
        </div>
        <div className="kit-filters" ref={filtersFade} role="group" aria-label="Show">
          {filters.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} disabled={f.count === 0 && filter !== f.id} onClick={() => onFilter(f.id)}>
              {f.label} <span>{f.count}</span>
            </button>
          ))}
        </div>
        <p id="kit-search-status" className="sr-only" role="status" aria-live="polite">
          {q ? `${visibleTotal} ${visibleTotal === 1 ? "entry matches" : "entries match"}` : `${visibleTotal} entries`}
        </p>
      </div>

      <div className="kit-body">
        {/* In-page rail: the sections, in reach on wide screens. */}
        <nav className="kit-rail" aria-label="Sections">
          {(["foundations", "components", "patterns", "tools"] as KitSection[]).filter(show).map((s) => (
            <a key={s} href={`#kit-${s}`} onClick={(e) => { e.preventDefault(); jump(`kit-${s}`); }}>
              {s[0].toUpperCase() + s.slice(1)} <span>{counts[s]}</span>
            </a>
          ))}
        </nav>

        <div className="kit-sections">
          {!q && filter === "all" && (
            <section className="kit-band" aria-labelledby="kit-band-h">
              <div className="kit-section-head">
                <h2 id="kit-band-h">Same component, five systems</h2>
                <p>One component drawn by each system's own library, in the mode you are viewing.</p>
              </div>
              <div className="kit-seg kit-band-picks" ref={picksFade} role="group" aria-label="Component to compare">
                {COMPARE_PICKS.map((k) => (
                  <button key={k} type="button" aria-pressed={pick === k} onClick={() => setPick(k)}>{CONCEPTS[k].label}</button>
                ))}
              </div>
              <ComparePanels key={pick} concept={pick} compact />
            </section>
          )}

          {show("foundations") && (
            <section className="kit-section" id="kit-foundations" data-section="foundations" aria-labelledby="kit-foundations-h">
              <div className="kit-section-head">
                <h2 id="kit-foundations-h">Foundations <span>{counts.foundations}</span></h2>
                <p>Colour, type, spacing and the rules the components are built on.</p>
              </div>
              {wall(foundations, "h3")}
            </section>
          )}

          {show("components") && (
            <section className="kit-section" id="kit-components" data-section="components" aria-labelledby="kit-components-h">
              <div className="kit-section-head">
                <h2 id="kit-components-h">Components <span>{counts.components}</span></h2>
                <p>Live specimens. Open one for states, properties, tokens, code and a five-system comparison.</p>
              </div>
              {componentGroups.map((g) => (
                <div key={g.sub} className="kit-subgroup">
                  <h3>{g.sub} <span>{g.items.length}</span></h3>
                  {wall(g.items, "h4")}
                </div>
              ))}
            </section>
          )}

          {show("patterns") && (
            <section className="kit-section" id="kit-patterns" data-section="patterns" aria-labelledby="kit-patterns-h">
              <div className="kit-section-head">
                <h2 id="kit-patterns-h">Patterns <span>{counts.patterns}</span></h2>
                <p>Page layouts and flows assembled from several components.</p>
              </div>
              {wall(patterns, "h3")}
            </section>
          )}

          {show("tools") && (
            <section className="kit-section" id="kit-tools" data-section="tools" aria-labelledby="kit-tools-h">
              <div className="kit-section-head">
                <h2 id="kit-tools-h">Tools <span>{counts.tools}</span></h2>
                <p>Inspect tokens, audit pasted code and edit a theme.</p>
              </div>
              <ul className="kit-tools">
                {tools.map((c) => (
                  <li key={c.id} className="uikit-card kit-tool">
                    <span className="material-symbols-outlined kit-tool-icon" aria-hidden="true">{c.icon}</span>
                    <div>
                      <h3 className="kit-tile-name">
                        {c.href
                          ? <Link href={c.href} className="uikit-card-hit"><Highlight text={c.name} q={q} /></Link>
                          : <button type="button" className="uikit-card-hit" onClick={() => setSelectedComponent(c.id)}><Highlight text={c.name} q={q} /></button>}
                      </h3>
                      <p className="kit-tool-desc">{c.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {visibleTotal === 0 && (
            <div className="kit-empty">
              <strong>
                {q ? <>Nothing in {sysInfo.name} matches &ldquo;{searchQuery.trim()}&rdquo;</> : <>No {filter} in {sysInfo.name}</>}
              </strong>
              <p>
                {q && filter !== "all" && total > 0
                  ? `There ${total === 1 ? "is 1 match" : `are ${total} matches`} in other sections.`
                  : suggestions.length > 0
                  ? "Closest names in this system:"
                  : q
                  ? "Try a shorter word, or a component name such as button or table."
                  : "Choose another section."}
              </p>
              <div className="kit-empty-actions">
                {suggestions.map((s) => (
                  <button key={s.id} type="button" className="is-tonal" onClick={() => { setSearchQuery(""); setSelectedComponent(s.id); }}>{s.name}</button>
                ))}
                {q && <button type="button" onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}>Clear search</button>}
                {filter !== "all" && <button type="button" onClick={() => onFilter("all")}>Show all sections</button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
