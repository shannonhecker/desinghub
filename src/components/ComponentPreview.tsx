"use client";

import { ChromeIcon } from "@/components/builder/ChromeIcon";
import React from "react";
import dynamic from "next/dynamic";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getFullCSS, getDemoComponent } from "@/data/registry";
import { useActiveTheme } from "@/components/DesignHubApp";
import { CodePanel } from "./CodePanel";
import { VariantsMatrix } from "./ui-kit/VariantsMatrix";
import { GuidanceCards } from "./ui-kit/GuidanceCards";
import { TokenSwatches } from "./ui-kit/TokenSwatches";
import { AnatomyDiagram } from "./ui-kit/AnatomyDiagram";
import { VariantExample } from "./ui-kit/VariantExample";
import { Playground } from "./ui-kit/Playground";
import { CompareView } from "./ui-kit/CompareView";
import { useEdgeFade, revealInline } from "./ui-kit/useEdgeFade";
import { COMPONENT_SUBCATS } from "@/data/componentCategories";
import { getUiKitGroup } from "./ui-kit/uiKitGroups";
import {
  COMPONENT_VARIANTS,
  COMPONENT_GUIDANCE,
  COMPONENT_TOKENS,
  COMPONENT_ANATOMY,
  COMPONENT_ACCESSIBILITY,
  COMPONENT_VARIANT_NAMING,
  DS_PROPS,
  type UiKitComponentId,
  type DesignSystemId,
} from "@/data/ui-kit-meta";

/* ChartsPage statically imports Highcharts core; lazy-load (ssr:false) so
   opening a non-chart /ui-kit component preview never pulls Highcharts into
   the preview chunk. */
const ChartsPage = dynamic(() => import("./ChartsPage").then((m) => m.ChartsPage), { ssr: false });

/* The same for AG Grid: only the AG Grid page draws it, and as a static
   import it put the whole grid library into the first load of every library
   page, the overview included. */
const DSAgGrid = dynamic(() => import("./DSAgGrid").then((m) => m.DSAgGrid), {
  ssr: false,
  /* The grid is 400px tall under a toolbar row: hold that room while it loads. */
  loading: () => <div aria-hidden style={{ height: 434, borderRadius: 8, background: "rgba(127,127,127,0.08)" }} />,
});

/* ════════════════════════════════════════════════════════════════════
   Registry-id → ui-kit-meta id map.

   The component registry keys components by varied ids ("buttons", "inputs",
   "checkboxes", "dropdowns", "tags"/"badge"/"badges", "avatars"), while the
   premium detail data in src/data/ui-kit-meta.ts is keyed by stable singular
   UiKitComponentIds ("button", "textInput", "select", …). This map bridges the
   two so the Variants / Props / Guidance / Tokens sections light up for the
   eight core components regardless of which DS-specific registry id arrives.
   Anything not in the map simply renders the Specimen + Code sections (the
   premium sections are null-guarded everywhere they're consumed).
   ════════════════════════════════════════════════════════════════════ */
export const META_ID: Record<string, UiKitComponentId> = {
  // Button
  buttons: "button",
  button: "button",
  // Text input
  inputs: "textInput",
  input: "textInput",
  "text-input": "textInput",
  "text-fields": "textInput",
  "text-field": "textInput",
  textInput: "textInput",
  // Checkbox
  checkboxes: "checkbox",
  checkbox: "checkbox",
  // Switch / toggle
  switches: "switch",
  switch: "switch",
  toggle: "switch",
  // Card / tile
  cards: "card",
  card: "card",
  tile: "card",
  // Chip / tag / pill (interactive selection elements)
  chips: "chip",
  chip: "chip",
  tags: "chip",
  tag: "chip",
  pill: "chip",
  pills: "chip",
  // Badge (status indicators: dot, count)
  badges: "badge",
  badge: "badge",
  // Select / dropdown
  dropdowns: "select",
  dropdown: "select",
  select: "select",
  multiselect: "select",
  // Avatar
  avatars: "avatar",
  avatar: "avatar",
};

export function ComponentPreview({ componentId }: { componentId: string }) {
  const store = useDesignHub();
  const { activeSystem, activeTab, setActiveTab } = store;
  const t = useActiveTheme();
  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === componentId);
  /* Probe element mounted INSIDE the DS style scope. TokenSwatches resolves the
     per-DS custom properties off this node (the DS CSS declares them on a scoped
     selector, so resolving off :root in the document head would miss them). */
  const scopeRef = React.useRef<HTMLDivElement | null>(null);
  /* The tab strip scrolls on narrow screens: fade the edge it continues
     past, and keep the selected tab in view (a shared link to Compare on a
     phone must not open with its tab off screen). */
  const tabsEl = React.useRef<HTMLDivElement | null>(null);
  const tabsFade = useEdgeFade<HTMLDivElement>();
  const tabsRef = React.useCallback((el: HTMLDivElement | null) => { tabsEl.current = el; tabsFade(el); }, [tabsFade]);
  React.useEffect(() => {
    const el = tabsEl.current;
    revealInline(el, el?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') ?? null);
  }, [activeTab, activeSystem, componentId]);
  /* The strip sticks to the top of the scroller. Only then does it take a
     backdrop, so page content passing under it stays readable; at rest it is
     just the pill group on the page. A one-pixel sentinel above it tells the
     two states apart. */
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    const mark = sentinelRef.current;
    const el = tabsEl.current;
    if (!mark || !el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => {
      const above = !entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0) + 1;
      if (above) el.setAttribute("data-stuck", ""); else el.removeAttribute("data-stuck");
    }, { root: mark.closest('[data-testid="kit-scroller"]'), threshold: 0 });
    io.observe(mark);
    return () => io.disconnect();
  }, [componentId, activeSystem]);
  if (!comp) return null;

  const densityOrSize = activeSystem === "salt" ? store.salt.density
    : activeSystem === "m3" ? store.m3.density
    : activeSystem === "carbon" ? store.carbon.density
    : activeSystem === "uoaui" ? store.uoaui.density
    : store.fluent.size;
  const css = getFullCSS(activeSystem, t.T, densityOrSize);

  /* Light vs dark + a Salt-family density, for the real per-cell VariantsMatrix
     renderer (mirrors DesignHubApp's isDark detection + ComponentRenderer's
     density guard). M3/Fluent/Carbon map it onto component sizes. */
  const isDark = activeSystem === "salt" ? store.salt.themeKey.includes("dark")
    : activeSystem === "m3" ? store.m3.themeKey.startsWith("dark")
    : activeSystem === "uoaui" ? store.uoaui.themeKey === "dark"
    : activeSystem === "carbon" ? (store.carbon.themeKey === "g90" || store.carbon.themeKey === "g100")
    : store.fluent.themeKey === "dark";
  const matrixMode: "light" | "dark" = isDark ? "dark" : "light";
  const saltLikeDensity = activeSystem === "salt" ? store.salt.density
    : activeSystem === "uoaui" ? store.uoaui.density
    : "medium";
  const matrixDensity = (["high", "medium", "low", "touch"].includes(saltLikeDensity as string)
    ? saltLikeDensity
    : "medium") as "high" | "medium" | "low" | "touch";

  const DemoComponent = getDemoComponent(activeSystem, componentId);

  const tabCls = activeSystem === "salt" ? "s-tab" : activeSystem === "m3" ? "m3-tab" : activeSystem === "uoaui" ? "a-tab" : activeSystem === "carbon" ? "cb-tab" : "f-tab";
  const isUoaui = activeSystem === "uoaui";
  const isCarbon = activeSystem === "carbon";

  /* Meta lookups for the premium detail sections (the eight core components).
     metaId may be undefined for a non-core component; every consumer guards. */
  const metaId = META_ID[componentId];
  const ds = activeSystem as DesignSystemId;
  const variants = metaId ? COMPONENT_VARIANTS[metaId] : undefined;
  const propRows = metaId ? DS_PROPS[metaId]?.[ds] : undefined;
  const guidance = metaId ? COMPONENT_GUIDANCE[metaId] : undefined;
  const tokens = metaId ? COMPONENT_TOKENS[metaId]?.[ds] : undefined;

  const pad = 48;
  /* Carbon components on the docs site always show a 5-tab nav:
     Overview (preview demo), Usage (plain-English guidance),
     Style (tokens + sizing), Code (snippet), Accessibility
     (WCAG + keyboard notes). Carbon keeps its faithful docs-tab layout;
     the other four DSs use the premium single-scroll detail page. */
  const carbonTabs = ["preview", "usage", "style", "code", "accessibility"] as const;

  /* Charts + ag-grid are full-surface tools, not catalog components — they keep
     their own single-pane render (no detail sections / TOC). */
  const isToolPage = componentId === "charts" || componentId === "ag-grid";

  /* ── Tool pages (Charts / ag-grid): single-pane, no detail sections. ── */
  if (isToolPage) {
    return (
      <div style={{ padding: `${pad}px ${pad + 8}px`, fontFamily: t.font, color: t.fg }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: t.fg, marginBottom: 8 }}>{comp.name}</h1>
          <p style={{ fontSize: 15, color: t.fg2, lineHeight: 1.6, marginBottom: 0 }}>{comp.desc}</p>
        </div>
        {componentId === "charts"
          ? <ChartsPage />
          : <DSAgGrid system={activeSystem} theme={t.T} density={densityOrSize} />}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════
     PREMIUM SINGLE-SCROLL DETAIL PAGE (Salt / M3 / Fluent / uoaui).
     Anchored sections in m3.material.io order: Specimen → Variants → Props →
     Code → Guidance → Tokens. The right-rail TOC (mounted by MainContent) keys
     off these section ids. Sections with no backing data are skipped so the TOC
     never points at an empty anchor (MainContent reads the same SECTIONS list).
     ════════════════════════════════════════════════════════════════════ */

  const specimenBg = isUoaui && t.T.gradient ? t.T.gradient : t.bg;
  const specimenRadius = isUoaui ? 14 : activeSystem === "m3" ? 12 : 8;

  /* Shared section nodes — rendered by the single-scroll layout below and
     (regrouped into tabs) by the M3 rich layout. Computed once. */
  /* Overview hero — the component shown generously on a tonal surface with a
     soft accent wash + spec chips, mirroring m3.material.io's lead visual.
     Colour-free (skins per DS from `t`): M3 reads as a tonal surface, Carbon
     stays flat (radius 0), uoaui glows over its aurora. */
  const heroSurface = (t.T.surfaceContainerLow as string) ?? t.bg2;
  const heroRadius = activeSystem === "carbon" ? 0 : 24;
  const specimenSection = (
    <section id="dh-sec-specimen" className="dh-section" aria-labelledby="dh-h-overview">
      <h2 id="dh-h-overview" style={{ position: "absolute", width: 1, height: 1, margin: -1, padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 }}>Overview</h2>
      {/* The live demo at its real size, centred on a tonal stage. The
          scope classes are the system's own, so its CSS resolves as shipped
          (Carbon's theme class, uoaui's app class). */}
      <div className="kit-hero" data-testid="detail-stage">
        <div
          ref={scopeRef}
          key={activeSystem}
          className={`kit-hero-inner${isUoaui ? " preview-uoaui a-app" : isCarbon ? ` cds--${store.carbon.themeKey}` : ""}`}
          style={{ color: t.fg }}
        >
          <style dangerouslySetInnerHTML={{ __html: css }} />
          {DemoComponent ? <DemoComponent /> : <p style={{ margin: 0, color: t.fg2 }}>No live demo for this entry.</p>}
        </div>
      </div>
      <div className="kit-chips">
        {[comp.cat === "Components & Patterns" ? (COMPONENT_SUBCATS[componentId] ?? "Component") : comp.cat].map((chip) => (
          <span key={chip}>{chip}</span>
        ))}
      </div>
      {(() => {
        const naming = COMPONENT_VARIANT_NAMING[metaId as UiKitComponentId]?.[ds];
        if (!naming) return null;
        return (
          <div style={{ marginTop: 44 }}>
            <h3 style={{ margin: "0 0 4px", color: t.fg, font: `600 18px/1.2 ${t.font}` }}>Variants</h3>
            <p style={{ margin: "0 0 20px", color: t.fg2, font: `400 14px/1.5 ${t.font}` }}>
              {/* Chips are types with distinct jobs, badges signal status; neither is an emphasis ladder. */}
              {metaId === "chip"
                ? `The ${["zero", "one", "two", "three", "four", "five", "six"][naming.length] ?? naming.length} chip types, each shaped for a different job.`
                : metaId === "badge"
                ? "Dot for presence, count for magnitude."
                : `The ${comp.name.toLowerCase()} emphasis ladder, highest to lowest.`}
            </p>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
            }}>
              {naming.map((v, i) => (
                <div key={v.name} className="kit-panel" style={{ flex: "1 1 300px", minWidth: 260, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 9 }}>
                  {/* live, component-appropriate example of this variant */}
                  <div style={{ alignSelf: "flex-start", marginBottom: 4 }}>
                    <VariantExample componentId={metaId} style={v.style} label={v.name} t={t} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      flex: "0 0 auto", width: 22, height: 22, borderRadius: 999,
                      background: t.bg2, color: t.fg2, display: "inline-flex",
                      alignItems: "center", justifyContent: "center", font: `600 11px/1 ${t.font}`,
                    }}>{i + 1}</span>
                    <span style={{ color: t.fg, font: `600 15px/1.2 ${t.font}` }}>{v.name}</span>
                  </div>
                  <p style={{ margin: 0, color: t.fg2, font: `400 13px/1.5 ${t.font}` }}>{v.desc}</p>
                  <div style={{ marginTop: 2, paddingTop: 11, borderTop: `1px solid ${t.border}` }}>
                    <span style={{ display: "block", color: t.fg2, font: `700 10px/1 ${t.font}`, letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 6 }}>Use when</span>
                    <span style={{ color: t.fg2, font: `400 13px/1.55 ${t.font}` }}>{v.use}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </section>
  );
  const variantsSection = variants ? (
    <section id="dh-sec-variants" className="dh-section" aria-labelledby="dh-h-variants">
      <h2 id="dh-h-variants" className="dh-section-h" style={{ color: t.fg }}>States</h2>
      <p className="dh-section-lede" style={{ color: t.fg2 }}>
        The {comp.name.toLowerCase()} vocabulary this design system exposes, by{" "}
        {variants.variantAxisLabel.toLowerCase()} and {variants.stateAxisLabel.toLowerCase()}.
      </p>
      <div className="kit-panel" style={{ position: "relative", padding: 8, overflow: "auto" }}>
        <div style={{ position: "relative" }}>
          <VariantsMatrix matrix={variants} componentId={metaId as UiKitComponentId} system={ds}
            mode={matrixMode} saltDensity={matrixDensity} Demo={DemoComponent} t={t} />
        </div>
      </div>
    </section>
  ) : null;
  /* Specs ‣ Anatomy — data-gated: renders only where COMPONENT_ANATOMY
     carries an entry for this component + DS (M3 Button pilot today;
     propagation = adding data, no code change here). */
  const anatomy = COMPONENT_ANATOMY[metaId as UiKitComponentId]?.[ds];
  const anatomySection = anatomy ? (
    <section id="dh-sec-anatomy" className="dh-section" aria-labelledby="dh-h-anatomy">
      <h2 id="dh-h-anatomy" className="dh-section-h" style={{ color: t.fg }}>Anatomy</h2>
      <p className="dh-section-lede" style={{ color: t.fg2 }}>
        The parts of the {comp.name.toLowerCase()} and their key measurements.
      </p>
      <AnatomyDiagram anatomy={anatomy} t={t} componentId={metaId} />
    </section>
  ) : null;
  const propsSection = propRows ? (
    <section id="dh-sec-props" className="dh-section" aria-labelledby="dh-h-props">
      <h2 id="dh-h-props" className="dh-section-h" style={{ color: t.fg }}>Props</h2>
      <p className="dh-section-lede" style={{ color: t.fg2 }}>
        The real {comp.name.toLowerCase()} API for this design system. Prop names and
        defaults follow the official package, not a normalised abstraction.
      </p>
      <div className="dh-detail-card kit-panel" style={{ borderColor: "transparent" }}>
        <table className="dh-props" style={{ fontFamily: t.font }}>
          <thead>
            <tr style={{ borderBottomColor: t.borderSubtle }}>
              {["Prop", "Type", "Default", "Description"].map((h) => (
                <th key={h} scope="col" className="dh-props-h" style={{ color: t.fg2 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {propRows.map((p) => (
              <tr key={p.name} style={{ borderBottomColor: t.borderSubtle }}>
                <td className="dh-props-cell dh-props-name" style={{ color: t.fg }}>{p.name}</td>
                <td className="dh-props-cell dh-props-type" style={{ color: t.accentText }}>{p.type}</td>
                <td className="dh-props-cell dh-props-default" style={{ color: t.fg2 }}>{p.default}</td>
                <td className="dh-props-cell" style={{ color: t.fg2 }}>{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  ) : null;
  const codeSection = (
    <section id="dh-sec-code" className="dh-section" aria-labelledby="dh-h-code">
      <h2 id="dh-h-code" className="dh-section-h" style={{ color: t.fg }}>Code</h2>
      <CodePanel componentId={componentId} />
    </section>
  );
  const guidanceSection = guidance ? (
    <section id="dh-sec-guidance" className="dh-section" aria-labelledby="dh-h-guidance">
      <h2 id="dh-h-guidance" className="dh-section-h" style={{ color: t.fg }}>Guidance</h2>
      <GuidanceCards guidance={guidance} t={t} />
    </section>
  ) : null;
  const tokensSection = (tokens && tokens.length > 0) ? (
    <section id="dh-sec-tokens" className="dh-section" aria-labelledby="dh-h-tokens">
      <h2 id="dh-h-tokens" className="dh-section-h" style={{ color: t.fg }}>Tokens</h2>
      <p className="dh-section-lede" style={{ color: t.fg2 }}>
        The design tokens that drive this {comp.name.toLowerCase()}. Values resolve live
        against the current theme, mode, and density.
      </p>
      <TokenSwatches tokens={tokens} t={t} scopeRef={scopeRef} />
    </section>
  ) : null;
  /* Accessibility — data-gated, mirroring the anatomy/guidance pattern: when
     COMPONENT_ACCESSIBILITY carries an entry for this component + DS, render
     its real keyboard map + ARIA/SR notes (+ optional contrast line) using the
     theme-skinned section styling; otherwise fall back to the shared WCAG
     boilerplate. Strings only, colour-free shell — skins from the theme `t`. */
  const a11y = metaId ? COMPONENT_ACCESSIBILITY[metaId as UiKitComponentId]?.[ds] : undefined;
  const a11yListStyle: React.CSSProperties = {
    listStyle: "none", margin: "0 0 24px", padding: 0, display: "grid", gap: 10,
  };
  const a11yItemStyle: React.CSSProperties = {
    display: "flex", gap: 12, alignItems: "flex-start",
    color: t.fg2, font: `400 14px/1.45 ${t.font}`,
  };
  const a11yMarkerStyle: React.CSSProperties = {
    /* An 18px icon on the 21px first line of its sentence. */
    flex: "0 0 auto", color: t.accent, fontSize: 18, margin: "1.5px 0",
  };
  const a11ySubheadStyle: React.CSSProperties = {
    margin: "0 0 12px", color: t.fg, font: `600 15px/1.3 ${t.font}`,
  };
  const accessibilitySection = a11y ? (
    <section id="dh-sec-accessibility" className="dh-section" aria-labelledby="dh-h-accessibility">
      <h2 id="dh-h-accessibility" className="dh-section-h" style={{ color: t.fg }}>Accessibility</h2>
      <p className="dh-section-lede" style={{ color: t.fg2 }}>
        How the {comp.name.toLowerCase()} behaves with the keyboard and assistive
        technology in this design system.
      </p>

      <h3 style={a11ySubheadStyle}>Keyboard</h3>
      <ul style={a11yListStyle}>
        {a11y.keyboard.map((line, i) => (
          <li key={`kb-${i}`} style={a11yItemStyle}>
            <ChromeIcon name="keyboard" aria-hidden="true" style={a11yMarkerStyle} />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <h3 style={a11ySubheadStyle}>Screen reader &amp; ARIA</h3>
      <ul style={a11yListStyle}>
        {a11y.aria.map((line, i) => (
          <li key={`aria-${i}`} style={a11yItemStyle}>
            <ChromeIcon name="hearing" aria-hidden="true" style={a11yMarkerStyle} />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {a11y.contrast && (
        <>
          <h3 style={a11ySubheadStyle}>Contrast</h3>
          <ul style={{ ...a11yListStyle, marginBottom: 0 }}>
            <li style={a11yItemStyle}>
              <ChromeIcon name="contrast" aria-hidden="true" style={a11yMarkerStyle} />
              <span>{a11y.contrast}</span>
            </li>
          </ul>
        </>
      )}
    </section>
  ) : (
    <section id="dh-sec-accessibility" className="dh-section" aria-labelledby="dh-h-accessibility">
      <h2 id="dh-h-accessibility" className="dh-section-h" style={{ color: t.fg }}>Accessibility</h2>
      <p className="dh-section-lede" style={{ color: t.fg2 }}>
        A keyboard map and screen reader notes are written for the core components. There
        are none for {comp.name.toLowerCase()} yet; use the system's own documentation for its
        keyboard and ARIA behaviour.
      </p>
    </section>
  );

  /* ════════════════════════════════════════════════════════════════════
     ONE DETAIL ANATOMY FOR ALL FIVE SYSTEMS.
     Overview (stage, playground, variants) / Specs (states, anatomy, props,
     tokens) / Code / Guidelines / Accessibility / Compare. The tab ids are
     the same in every system, so a system switch keeps the tab. Only the
     chrome is shared; everything inside a stage is the system's own.
     ════════════════════════════════════════════════════════════════════ */
  const TABS = [
    ["overview", "Overview"],
    ["specs", "Specs"],
    ["code", "Code"],
    ["guidelines", "Guidelines"],
    ["accessibility", "Accessibility"],
    ["compare", "Compare"],
  ] as const;
  const tab = TABS.some((x) => x[0] === activeTab) ? (activeTab as string) : "overview";

  /* Previous and next within the entry's own group, in overview order. */
  const group = getUiKitGroup(comp.id, comp.cat);
  const siblings = components
    .filter((c) => getUiKitGroup(c.id, c.cat) === group && c.cat === comp.cat)
    .sort((a, b) => (comp.cat === "Foundations" ? 0 : a.name.localeCompare(b.name)));
  const at = siblings.findIndex((c) => c.id === comp.id);
  const prev = at > 0 ? siblings[at - 1] : null;
  const next = at >= 0 && at < siblings.length - 1 ? siblings[at + 1] : null;
  const go = (id: string) => (e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    store.setSelectedComponent(id);
    setActiveTab(tab as typeof activeTab);
  };

  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = TABS.findIndex((x) => x[0] === tab);
    const n = (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setActiveTab(TABS[n][0]);
    (e.currentTarget.querySelector(`[data-tab="${TABS[n][0]}"]`) as HTMLElement | null)?.focus();
  };

  return (
    <div className="dh-detail kit-detail" data-testid="detail-page" data-component={componentId}>
      <header className="dh-detail-header">
        <h1 className="dh-detail-title" style={{ color: t.fg }}>{comp.name}</h1>
        <p className="dh-detail-desc" style={{ color: t.fg2 }}>{comp.desc}</p>
      </header>
      <div ref={sentinelRef} className="kit-tabs-mark" aria-hidden="true" />
      <div className="kit-tabs" ref={tabsRef}>
        <div role="tablist" aria-label="Component view" className="kit-seg" onKeyDown={onTabKey}>
          {TABS.map(([id, label]) => (
            <button key={id} role="tab" type="button" id={`dh-tab-${id}`} data-tab={id} aria-selected={tab === id} aria-controls="dh-tabpanel"
              tabIndex={tab === id ? 0 : -1} onClick={() => setActiveTab(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" id="dh-tabpanel" aria-labelledby={`dh-tab-${tab}`}>
        {tab === "overview" && (
          <>
            {specimenSection}
            {variants && metaId && (
              <Playground componentId={metaId} matrix={variants} system={ds} mode={matrixMode} saltDensity={matrixDensity} />
            )}
          </>
        )}
        {tab === "specs" && (
          (variantsSection || anatomySection || propsSection || tokensSection)
            ? <>{variantsSection}{anatomySection}{propsSection}{tokensSection}</>
            : <p className="dh-section-lede">A state grid, property table and token list are written for the core components (button, text input, checkbox, switch, card, chip, badge, select, avatar). {comp.name} does not have them yet; its live demo is on the Overview tab and its code on the Code tab.</p>
        )}
        {tab === "code" && codeSection}
        {tab === "guidelines" && (guidanceSection ?? (
          <p className="dh-section-lede">Written usage guidance covers the core components. There is none for {comp.name.toLowerCase()} yet.</p>
        ))}
        {tab === "accessibility" && accessibilitySection}
        {tab === "compare" && <CompareView componentId={componentId} />}
      </div>
      {(prev || next) && (
        <nav className="kit-pager" aria-label="More in this section">
          {prev && <a href={`/ui-kit?ds=${activeSystem}&c=${prev.id}`} onClick={go(prev.id)}><small>Previous</small>{prev.name}</a>}
          {next && <a className="is-next" href={`/ui-kit?ds=${activeSystem}&c=${next.id}`} onClick={go(next.id)}><small>Next</small>{next.name}</a>}
        </nav>
      )}
    </div>
  );
}

/**
 * The ordered TOC sections for a given (system, componentId). Mirrors the
 * conditional sections rendered above so the right-rail TOC in MainContent never
 * points at an anchor that isn't in the DOM. Carbon + tool pages return [] (they
 * use their own layout and MainContent renders no TOC for them).
 */
export function getDetailSections(
  system: string,
  componentId: string,
): { id: string; label: string }[] {
  // Carbon (5-tab) and M3 (4-tab, Figma/M3-style) render self-contained
  // tabbed layouts full-width, so they opt out of the single-scroll TOC rail.
  if (["carbon", "m3", "salt", "fluent", "uoaui"].includes(system)) return [];
  if (componentId === "charts" || componentId === "ag-grid") return [];

  const metaId = META_ID[componentId];
  const ds = system as DesignSystemId;
  const out: { id: string; label: string }[] = [
    { id: "dh-sec-specimen", label: "Specimen" },
  ];
  if (metaId && COMPONENT_VARIANTS[metaId]) out.push({ id: "dh-sec-variants", label: "Variants" });
  if (metaId && DS_PROPS[metaId]?.[ds]) out.push({ id: "dh-sec-props", label: "Props" });
  out.push({ id: "dh-sec-code", label: "Code" });
  if (metaId && COMPONENT_GUIDANCE[metaId]) out.push({ id: "dh-sec-guidance", label: "Guidance" });
  if (metaId && COMPONENT_TOKENS[metaId]?.[ds]?.length) out.push({ id: "dh-sec-tokens", label: "Tokens" });
  return out;
}
