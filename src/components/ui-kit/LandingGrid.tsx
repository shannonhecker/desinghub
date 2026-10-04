"use client";

import React from "react";
import Link from "next/link";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getComponents, getSystemInfo, getPreviews } from "@/data/registry";
import { COMPONENT_SUBCATS, SUBCAT_ORDER } from "@/data/componentCategories";
import { getUiKitGroup, BUILDER_BLOCKS } from "./uiKitGroups";
import { isDarkActive } from "./kitHandoff";
import styles from "./LandingGrid.module.css";

/* One plain sentence per system. Only things the kit itself shows: the
   density ladder, theme count and token model each have a Foundations page. */
const SYSTEM_LEDE: Record<SystemId, string> = {
  salt: "J.P. Morgan's system for dense financial interfaces: four densities on a three-layer token model.",
  m3: "Google's system built on dynamic colour, tonal surfaces and expressive shape.",
  fluent: "Microsoft's system for app surfaces, with brand theming and three control sizes.",
  uoaui: "The house system: frosted glass layers over aurora gradients, in four densities.",
  carbon: "IBM's open-source system on a 2px grid, with four themes.",
};

type Section = "foundations" | "components" | "patterns" | "tools";
type Filter = "all" | Section;

interface Entry { id: string; name: string; desc: string; }
interface ToolEntry extends Entry { icon: string; href?: string; }

const TOOL_ICON: Record<string, string> = { tokens: "palette", audit: "fact_check", "builder-blocks": "widgets" };

/* The two full-page tools. They keep the system and mode chosen here. */
const PAGE_TOOLS: ToolEntry[] = [
  { id: "page-token-reference", name: "Token reference", icon: "table_rows", href: "/token-editor",
    desc: "Every colour token for the system in view in one searchable table. Copy single values or the whole set as JSON." },
  { id: "page-theme-builder", name: "Theme builder", icon: "format_paint", href: "/theme-builder",
    desc: "Change a system's colours, check contrast against a live preview, then copy the changes as JSON." },
];

const matches = (q: string, ...fields: (string | undefined)[]) =>
  !q || fields.some((f) => f && f.toLowerCase().includes(q));

function densityLabel(system: SystemId, value: string | number): string {
  if (system === "m3") return value === 0 ? "Default" : `${value}`;
  const s = String(value);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export const LandingGrid = React.memo(function LandingGrid() {
  const state = useDesignHub();
  const { activeSystem, setSelectedComponent, searchQuery, setSearchQuery } = state;
  const t = useTheme();
  const components = getComponents(activeSystem);
  const sysInfo = getSystemInfo(activeSystem);
  const previews = getPreviews(activeSystem);
  const [filter, setFilter] = React.useState<Filter>("all");
  const searchRef = React.useRef<HTMLInputElement | null>(null);

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
  const foundations: Entry[] = components.filter((c) => getUiKitGroup(c.id, c.cat) === "Foundations" && matches(q, c.name, c.desc));
  const componentItems = components.filter((c) => c.cat === "Components & Patterns" && getUiKitGroup(c.id, c.cat) === "Components");
  const componentGroups = [...SUBCAT_ORDER, "More"]
    .map((sub) => ({
      sub,
      items: componentItems
        .filter((c) => (COMPONENT_SUBCATS[c.id] ?? "More") === sub && matches(q, c.name, c.desc, sub))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((g) => g.items.length > 0);
  const componentCount = componentGroups.reduce((n, g) => n + g.items.length, 0);
  const patterns: Entry[] = components
    .filter((c) => c.cat === "Patterns" && getUiKitGroup(c.id, c.cat) === "Components" && matches(q, c.name, c.desc))
    .sort((a, b) => a.name.localeCompare(b.name));
  const tools: ToolEntry[] = [
    ...components
      .filter((c) => getUiKitGroup(c.id, c.cat) === "Tools")
      .map((c) => ({ id: c.id, name: c.name, desc: c.desc, icon: TOOL_ICON[c.id] ?? "build" })),
    { id: BUILDER_BLOCKS.id, name: BUILDER_BLOCKS.name, desc: BUILDER_BLOCKS.desc, icon: TOOL_ICON[BUILDER_BLOCKS.id] },
    ...PAGE_TOOLS,
  ].filter((c) => matches(q, c.name, c.desc));

  const counts: Record<Section, number> = {
    foundations: foundations.length,
    components: componentCount,
    patterns: patterns.length,
    tools: tools.length,
  };
  const total = counts.foundations + counts.components + counts.patterns + counts.tools;
  const visibleTotal = filter === "all" ? total : counts[filter];
  const show = (s: Section) => (filter === "all" || filter === s) && counts[s] > 0;

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: total },
    { id: "foundations", label: "Foundations", count: counts.foundations },
    { id: "components", label: "Components", count: counts.components },
    { id: "patterns", label: "Patterns", count: counts.patterns },
    { id: "tools", label: "Tools", count: counts.tools },
  ];

  const dark = isDarkActive(state);
  const density =
    activeSystem === "salt" ? state.salt.density :
    activeSystem === "m3" ? state.m3.density :
    activeSystem === "fluent" ? state.fluent.size :
    activeSystem === "carbon" ? state.carbon.density :
    state.uoaui.density;

  /* Chrome only. Card shape follows the system (Carbon square, Material
     round); the specimen inside is the system's own component, untouched. */
  const radius = activeSystem === "m3" ? 16 : activeSystem === "uoaui" ? 14 : activeSystem === "carbon" ? 0 : 8;
  const cardBg =
    activeSystem === "uoaui" ? (t.T.cardBg as string)
    : activeSystem === "carbon" ? ((t.T.layer01 as string) ?? t.bg2)
    : activeSystem === "m3" ? t.bg
    : t.bg;
  const vars = {
    "--kit-bg": t.bg,
    "--kit-card": cardBg,
    "--kit-fg": t.fg,
    "--kit-muted": t.fg2,
    "--kit-border": t.border,
    "--kit-accent": t.accent,
    "--kit-accent-fg": t.accentFg,
    "--kit-accent-text": t.accentText,
    "--kit-focus": t.focusRing,
    "--kit-radius": `${radius}px`,
    "--kit-title-weight": activeSystem === "salt" ? 700 : activeSystem === "carbon" ? 300 : 500,
    "--kit-glass": activeSystem === "uoaui" ? (t.T.glass as string) : "none",
    fontFamily: t.font,
  } as React.CSSProperties;

  const card = (c: Entry, Heading: "h3" | "h4") => {
    const Preview = previews[c.id];
    return (
      <li key={c.id} className={`uikit-card ${styles.card}`}>
        {/* The specimen is the system's real component. It is shown, not
            operated, here: inert keeps its controls out of the tab order and
            the whole card opens the detail page. */}
        <div className={`uikit-card-thumb ${styles.stage}`} aria-hidden="true" inert>
          {Preview
            ? <div className="uikit-card-specimen"><Preview /></div>
            : <span className={`material-symbols-outlined ${styles.stageIcon}`}>widgets</span>}
        </div>
        <div className={styles.caption}>
          <Heading className={styles.cardName}>
            <button type="button" className="uikit-card-hit" onClick={() => setSelectedComponent(c.id)}>{c.name}</button>
          </Heading>
          {c.desc && <p className={styles.cardDesc}>{c.desc}</p>}
        </div>
      </li>
    );
  };

  return (
    <div className={styles.page} style={vars} data-system={activeSystem}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>{sysInfo.name}</h1>
          <p className={styles.lede}>{SYSTEM_LEDE[activeSystem]}</p>
        </div>
        <dl className={styles.facts} aria-label="Current view">
          <div><dt>Maintainer</dt><dd>{sysInfo.org}</dd></div>
          <div><dt>Mode</dt><dd>{dark ? "Dark" : "Light"}</dd></div>
          <div><dt>{activeSystem === "fluent" ? "Size" : "Density"}</dt><dd>{densityLabel(activeSystem, density)}</dd></div>
        </dl>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <span className="material-symbols-outlined" aria-hidden="true">search</span>
          <label htmlFor="kit-search" className="sr-only">Search {sysInfo.name}</label>
          <input
            id="kit-search"
            ref={searchRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape" && searchQuery) { e.preventDefault(); setSearchQuery(""); } }}
            placeholder={`Search ${sysInfo.name}`}
            aria-describedby="kit-search-status"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd aria-hidden="true">/</kbd>
        </div>
        <div className={styles.filters} role="group" aria-label="Show">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              disabled={f.count === 0 && filter !== f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label} <span>{f.count}</span>
            </button>
          ))}
        </div>
        <p id="kit-search-status" className="sr-only" role="status" aria-live="polite">
          {q ? `${visibleTotal} ${visibleTotal === 1 ? "entry matches" : "entries match"}` : `${visibleTotal} entries`}
        </p>
      </div>

      {show("foundations") && (
        <section className={styles.section} aria-labelledby="kit-foundations">
          <div className={styles.sectionHead}>
            <h2 id="kit-foundations">Foundations</h2>
            <span>{counts.foundations}</span>
            <p>Colour, type, spacing and the rules the components are built on.</p>
          </div>
          <ul className={styles.grid}>{foundations.map((c) => card(c, "h3"))}</ul>
        </section>
      )}

      {show("components") && (
        <section className={styles.section} aria-labelledby="kit-components">
          <div className={styles.sectionHead}>
            <h2 id="kit-components">Components</h2>
            <span>{counts.components}</span>
            <p>Live specimens. Open one for variants, properties, tokens and code.</p>
          </div>
          {componentGroups.map((g) => (
            <div key={g.sub} className={styles.subgroup}>
              <h3>{g.sub}</h3>
              <ul className={styles.grid}>{g.items.map((c) => card(c, "h4"))}</ul>
            </div>
          ))}
        </section>
      )}

      {show("patterns") && (
        <section className={styles.section} aria-labelledby="kit-patterns">
          <div className={styles.sectionHead}>
            <h2 id="kit-patterns">Patterns</h2>
            <span>{counts.patterns}</span>
            <p>Page layouts and flows assembled from several components.</p>
          </div>
          <ul className={styles.grid}>{patterns.map((c) => card(c, "h3"))}</ul>
        </section>
      )}

      {show("tools") && (
        <section className={styles.section} aria-labelledby="kit-tools">
          <div className={styles.sectionHead}>
            <h2 id="kit-tools">Tools</h2>
            <span>{counts.tools}</span>
            <p>Inspect tokens, audit pasted code and edit a theme.</p>
          </div>
          <ul className={styles.toolGrid}>
            {tools.map((c) => (
              <li key={c.id} className={`uikit-card ${styles.tool}`}>
                <span className={`material-symbols-outlined ${styles.toolIcon}`} aria-hidden="true">{c.icon}</span>
                <div className={styles.toolBody}>
                  <h3 className={styles.cardName}>
                    {c.href
                      ? <Link href={c.href} className="uikit-card-hit">{c.name}</Link>
                      : <button type="button" className="uikit-card-hit" onClick={() => setSelectedComponent(c.id)}>{c.name}</button>}
                  </h3>
                  <p className={styles.toolDesc}>{c.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {visibleTotal === 0 && (
        <div className={styles.empty}>
          <strong>
            {q ? <>Nothing in {sysInfo.name} matches &ldquo;{searchQuery.trim()}&rdquo;</> : <>No {filter} in {sysInfo.name}</>}
          </strong>
          <p>
            {q && filter !== "all" && total > 0
              ? `There ${total === 1 ? "is 1 match" : `are ${total} matches`} in other sections.`
              : q
              ? "Try a shorter word, or a component name such as button or table."
              : "Choose another section."}
          </p>
          <div className={styles.emptyActions}>
            {q && <button type="button" onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}>Clear search</button>}
            {filter !== "all" && <button type="button" onClick={() => setFilter("all")}>Show all sections</button>}
          </div>
        </div>
      )}
    </div>
  );
});
