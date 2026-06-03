"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getFullCSS, getDemoComponent } from "@/data/registry";
import { useActiveTheme } from "@/components/DesignHubApp";
import { CodePanel } from "./CodePanel";
import { DSAgGrid } from "./DSAgGrid";
import { VariantsMatrix } from "./ui-kit/VariantsMatrix";
import { GuidanceCards } from "./ui-kit/GuidanceCards";
import { TokenSwatches } from "./ui-kit/TokenSwatches";
import {
  COMPONENT_VARIANTS,
  COMPONENT_GUIDANCE,
  COMPONENT_TOKENS,
  DS_PROPS,
  type UiKitComponentId,
  type DesignSystemId,
} from "@/data/ui-kit-meta";

/* ChartsPage statically imports Highcharts core; lazy-load (ssr:false) so
   opening a non-chart /ui-kit component preview never pulls Highcharts into
   the preview chunk. */
const ChartsPage = dynamic(() => import("./ChartsPage").then((m) => m.ChartsPage), { ssr: false });

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
const META_ID: Record<string, UiKitComponentId> = {
  // Button
  buttons: "button",
  button: "button",
  // Text input
  inputs: "textInput",
  input: "textInput",
  "text-input": "textInput",
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
  // Badge / tag / pill / chip
  badges: "badge",
  badge: "badge",
  tags: "badge",
  tag: "badge",
  pill: "badge",
  chip: "badge",
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
  if (!comp) return null;

  const densityOrSize = activeSystem === "salt" ? store.salt.density
    : activeSystem === "m3" ? store.m3.density
    : activeSystem === "carbon" ? store.carbon.density
    : activeSystem === "uoaui" ? store.uoaui.density
    : store.fluent.size;
  const css = getFullCSS(activeSystem, t.T, densityOrSize);

  /* Light vs dark + a Salt-family density, for the real per-cell VariantsMatrix
     renderer (mirrors DesignHubApp's isDark detection + ComponentRenderer's
     density guard). M3/Fluent/Carbon ignore saltDensity in the renderer. */
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

  /* ── Carbon: preserve the authentic 5-tab carbondesignsystem.com layout. ── */
  if (isCarbon && !isToolPage) {
    const visibleTabs = carbonTabs;
    const currentTab: typeof visibleTabs[number] =
      (visibleTabs as readonly string[]).includes(activeTab as string)
        ? (activeTab as typeof visibleTabs[number])
        : "preview";
    return (
      <div style={{ padding: `${pad}px ${pad + 8}px`, fontFamily: t.font, color: t.fg }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: t.fg, marginBottom: 8 }}>{comp.name}</h2>
          <p style={{ fontSize: 15, color: t.fg3, lineHeight: 1.6, marginBottom: 0 }}>{comp.desc}</p>
        </div>
        <div role="tablist" aria-label="Component view" style={{
          display: "flex", borderBottom: `1px solid ${t.border}`, marginBottom: 32,
        }}>
          {visibleTabs.map((tab) => {
            const active = currentTab === tab;
            const label = tab === "preview" ? "Overview"
              : tab === "code" ? "Code"
              : tab === "usage" ? "Usage"
              : tab === "style" ? "Style"
              : "Accessibility";
            return (
              <button
                key={tab}
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab)}
                style={{
                  position: "relative", height: 40, padding: "10px 16px", border: 0,
                  background: "transparent", cursor: "pointer", fontSize: 14,
                  fontWeight: active ? 600 : 400, fontFamily: t.font,
                  color: active ? t.fg : t.fg2,
                  borderBottom: active ? `2px solid ${t.accent}` : "2px solid transparent",
                  marginBottom: -1, transition: "color 70ms cubic-bezier(0.2, 0, 0.38, 0.9)",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
        {currentTab === "code" ? (
          <CodePanel componentId={componentId} />
        ) : currentTab === "usage" ? (
          <CarbonDocStub title="Usage" componentId={componentId} sectionSlug="usage" body={
            `${comp.name} is for ${comp.desc.toLowerCase()} Use it when the interaction calls for ${comp.cat.toLowerCase()} guidance. For the full usage rules, anatomy, and do/don't examples, see the official ${comp.name} usage page on carbondesignsystem.com.`
          } t={t} />
        ) : currentTab === "style" ? (
          <CarbonDocStub title="Style" componentId={componentId} sectionSlug="style" body={
            `Exact sizing, spacing, and typography specs for ${comp.name} live in the Style tab on carbondesignsystem.com. The demo in Overview is built with the same token set (see Code tab for the @carbon/react import).`
          } t={t} />
        ) : currentTab === "accessibility" ? (
          <CarbonDocStub title="Accessibility" componentId={componentId} sectionSlug="accessibility" body={
            `${comp.name} ships with WCAG 2.1 AA compliance. Focus rings, keyboard navigation, and ARIA semantics are documented on the Accessibility tab on carbondesignsystem.com.`
          } t={t} />
        ) : (
          <div
            className={`cds--${store.carbon.themeKey}`}
            style={{
              background: t.T.layer01, borderRadius: 0,
              border: `1px solid ${t.border}`, padding: pad, color: t.fg,
            }}
          >
            <style dangerouslySetInnerHTML={{ __html: css }} />
            {DemoComponent ? <DemoComponent /> : (
              <div style={{ padding: pad, borderRadius: 8, border: `1px dashed ${t.border}`,
                display: "flex", alignItems: "center", justifyContent: "center", color: t.fg2, fontSize: t.scale.navF }}>
                Demo loading...
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  /* ── Tool pages (Charts / ag-grid): single-pane, no detail sections. ── */
  if (isToolPage) {
    return (
      <div style={{ padding: `${pad}px ${pad + 8}px`, fontFamily: t.font, color: t.fg }}>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: t.fg, marginBottom: 8 }}>{comp.name}</h2>
          <p style={{ fontSize: 15, color: t.fg3, lineHeight: 1.6, marginBottom: 0 }}>{comp.desc}</p>
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

  return (
    <div className="dh-detail" style={{ fontFamily: t.font, color: t.fg }}>
      {/* Header */}
      <header className="dh-detail-header">
        <h2 className="dh-detail-title" style={{ color: t.fg }}>{comp.name}</h2>
        <p className="dh-detail-desc" style={{ color: t.fg3 }}>{comp.desc}</p>
      </header>

      {/* 1 ── Specimen: the live demo, in a generous framed stage. ── */}
      <section id="dh-sec-specimen" className="dh-section" aria-labelledby="dh-h-specimen">
        <h3 id="dh-h-specimen" className="dh-section-h" style={{ color: t.fg }}>Specimen</h3>
        <div
          ref={scopeRef}
          className={isUoaui ? "preview-uoaui a-app dh-specimen" : "dh-specimen"}
          style={{
            background: specimenBg,
            borderRadius: specimenRadius,
            border: `1px solid ${t.border}`,
            color: t.fg,
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: css }} />
          {DemoComponent ? <DemoComponent /> : (
            <div style={{ padding: pad, borderRadius: 8, border: `1px dashed ${t.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", color: t.fg2, fontSize: t.scale.navF }}>
              Demo loading...
            </div>
          )}
        </div>
      </section>

      {/* 2 ── Variants × states matrix. ── */}
      {variants && (
        <section id="dh-sec-variants" className="dh-section" aria-labelledby="dh-h-variants">
          <h3 id="dh-h-variants" className="dh-section-h" style={{ color: t.fg }}>Variants</h3>
          <p className="dh-section-lede" style={{ color: t.fg3 }}>
            The {comp.name.toLowerCase()} vocabulary this design system exposes, by{" "}
            {variants.variantAxisLabel.toLowerCase()} and {variants.stateAxisLabel.toLowerCase()}.
          </p>
          <VariantsMatrix
            matrix={variants}
            componentId={metaId as UiKitComponentId}
            system={ds}
            mode={matrixMode}
            saltDensity={matrixDensity}
            Demo={DemoComponent}
            t={t}
          />
        </section>
      )}

      {/* 3 ── Props table (all 5 DS, generalized from DS_PROPS). ── */}
      {propRows && (
        <section id="dh-sec-props" className="dh-section" aria-labelledby="dh-h-props">
          <h3 id="dh-h-props" className="dh-section-h" style={{ color: t.fg }}>Props</h3>
          <p className="dh-section-lede" style={{ color: t.fg3 }}>
            The real {comp.name.toLowerCase()} API for this design system. Prop names and
            defaults follow the official package, not a normalised abstraction.
          </p>
          <div className="dh-detail-card" style={{ borderColor: t.border, background: t.bg2 }}>
            <table className="dh-props" style={{ fontFamily: t.font }}>
              <thead>
                <tr style={{ borderBottomColor: t.borderSubtle }}>
                  {["Prop", "Type", "Default", "Description"].map((h) => (
                    <th key={h} scope="col" className="dh-props-h" style={{ color: t.fg3 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {propRows.map((p) => (
                  <tr key={p.name} style={{ borderBottomColor: t.borderSubtle }}>
                    <td className="dh-props-cell dh-props-name" style={{ color: t.fg }}>{p.name}</td>
                    <td className="dh-props-cell dh-props-type" style={{ color: t.accentText }}>{p.type}</td>
                    <td className="dh-props-cell dh-props-default" style={{ color: t.fg3 }}>{p.default}</td>
                    <td className="dh-props-cell" style={{ color: t.fg2 }}>{p.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 4 ── Code (existing CodePanel). ── */}
      <section id="dh-sec-code" className="dh-section" aria-labelledby="dh-h-code">
        <h3 id="dh-h-code" className="dh-section-h" style={{ color: t.fg }}>Code</h3>
        <CodePanel componentId={componentId} />
      </section>

      {/* 5 ── Do / Don't guidance. ── */}
      {guidance && (
        <section id="dh-sec-guidance" className="dh-section" aria-labelledby="dh-h-guidance">
          <h3 id="dh-h-guidance" className="dh-section-h" style={{ color: t.fg }}>Guidance</h3>
          <GuidanceCards guidance={guidance} t={t} />
        </section>
      )}

      {/* 6 ── Design tokens (live getComputedStyle, resolved off the specimen scope). ── */}
      {tokens && tokens.length > 0 && (
        <section id="dh-sec-tokens" className="dh-section" aria-labelledby="dh-h-tokens">
          <h3 id="dh-h-tokens" className="dh-section-h" style={{ color: t.fg }}>Tokens</h3>
          <p className="dh-section-lede" style={{ color: t.fg3 }}>
            The design tokens that drive this {comp.name.toLowerCase()}. Values resolve live
            against the current theme, mode, and density.
          </p>
          <TokenSwatches tokens={tokens} t={t} scopeRef={scopeRef} />
        </section>
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
  if (system === "carbon") return [];
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

/* ══════════════════════════════════════════════════════════
   CarbonDocStub - Usage / Style / Accessibility tab content
   ══════════════════════════════════════════════════════════
   Carbon's authoritative source for these tabs is carbondesignsystem.com.
   We render a brief component-specific intro + a deep link to
   the official page. Keeps the UI Kit faithful to Carbon's docs
   layout without duplicating IBM's content. */
function CarbonDocStub({
  title,
  componentId,
  sectionSlug,
  body,
  t,
}: {
  title: string;
  componentId: string;
  sectionSlug: "usage" | "style" | "accessibility";
  body: string;
  t: ReturnType<typeof useActiveTheme>;
}) {
  /* Map our internal componentId to Carbon's URL slug. Most match
     directly (e.g. "button"); a few aliases are listed below. */
  const urlSlug: Record<string, string> = {
    buttons: "button",
    "icon-button": "button",
    inputs: "text-input",
    alerts: "notification",
    tags: "tag",
    cards: "tile",
    radios: "radio-button",
    switches: "toggle",
    dropdowns: "dropdown",
    tabs: "tabs",
    accordion: "accordion",
    breadcrumbs: "breadcrumb",
    "data-table": "data-table",
    "structured-list": "structured-list",
    pagination: "pagination",
    dialog: "modal",
    tooltips: "tooltip",
    link: "link",
    slider: "slider",
    progress: "progress-bar",
    loading: "loading",
    "content-switcher": "content-switcher",
    skeleton: "skeleton",
    popover: "popover",
    checkboxes: "checkbox",
    search: "search",
    avatars: "button", /* Carbon has no Avatar component */
  };
  const slug = urlSlug[componentId] ?? componentId;
  const href = `https://carbondesignsystem.com/components/${slug}/${sectionSlug}/`;

  return (
    <div style={{ maxWidth: 720, fontFamily: t.font }}>
      <h3 style={{ fontSize: 28, fontWeight: 400, color: t.fg, lineHeight: 1.2, marginBottom: 16, letterSpacing: "-0.16px" }}>
        {title}
      </h3>
      <p style={{ fontSize: 16, color: t.fg2, lineHeight: 1.5, marginBottom: 24 }}>
        {body}
      </p>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          fontSize: 14, color: t.accent, textDecoration: "underline",
        }}
      >
        Read the full {title.toLowerCase()} guide on carbondesignsystem.com
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
      </a>
    </div>
  );
}
