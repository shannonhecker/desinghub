"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getFullCSS, getDemoComponent } from "@/data/registry";
import { useActiveTheme } from "@/components/DesignHubApp";
import { CodePanel } from "./CodePanel";
import { ChartsPage } from "./ChartsPage";
import { DSAgGrid } from "./DSAgGrid";

/* ── ausos Props Documentation ── */
const AUSOS_PROPS: Record<string, { name: string; type: string; default: string; desc: string }[]> = {
  buttons: [
    { name: "appearance", type: '"primary" | "secondary" | "ghost" | "outline"', default: '"secondary"', desc: "Visual style variant" },
    { name: "disabled", type: "boolean", default: "false", desc: "Disables interaction" },
    { name: "onClick", type: "() => void", default: "-", desc: "Click handler" },
    { name: "children", type: "ReactNode", default: "-", desc: "Button label content" },
  ],
  inputs: [
    { name: "label", type: "string", default: "-", desc: "Field label above input" },
    { name: "placeholder", type: "string", default: "-", desc: "Placeholder text" },
    { name: "type", type: '"text" | "email" | "password" | "number"', default: '"text"', desc: "Input type" },
    { name: "disabled", type: "boolean", default: "false", desc: "Disables input" },
    { name: "value", type: "string", default: "-", desc: "Controlled value" },
    { name: "onChange", type: "(e) => void", default: "-", desc: "Change handler" },
  ],
  cards: [
    { name: "children", type: "ReactNode", default: "-", desc: "Card content" },
    { name: "onClick", type: "() => void", default: "-", desc: "Makes card interactive" },
    { name: "padding", type: "number | string", default: "16", desc: "Inner padding" },
  ],
  tabs: [
    { name: "value", type: "string", default: "-", desc: "Active tab value" },
    { name: "onChange", type: "(value) => void", default: "-", desc: "Tab change handler" },
    { name: "children", type: "Tab[]", default: "-", desc: "Tab components" },
  ],
  badges: [
    { name: "variant", type: '"accent" | "default" | "success" | "warning" | "danger"', default: '"default"', desc: "Status variant" },
    { name: "children", type: "ReactNode", default: "-", desc: "Badge label" },
  ],
  switches: [
    { name: "checked", type: "boolean", default: "false", desc: "Toggle state" },
    { name: "onChange", type: "(checked) => void", default: "-", desc: "Toggle handler" },
    { name: "label", type: "string", default: "-", desc: "Accessible label" },
    { name: "disabled", type: "boolean", default: "false", desc: "Disables switch" },
  ],
  checkboxes: [
    { name: "checked", type: "boolean", default: "false", desc: "Checked state" },
    { name: "onChange", type: "(checked) => void", default: "-", desc: "Check handler" },
    { name: "label", type: "string", default: "-", desc: "Checkbox label" },
  ],
  alerts: [
    { name: "variant", type: '"info" | "success" | "warning" | "danger"', default: '"info"', desc: "Alert status" },
    { name: "children", type: "ReactNode", default: "-", desc: "Alert message" },
  ],
  dialog: [
    { name: "open", type: "boolean", default: "false", desc: "Controls visibility" },
    { name: "onClose", type: "() => void", default: "-", desc: "Close handler" },
    { name: "title", type: "string", default: "-", desc: "Dialog heading" },
    { name: "children", type: "ReactNode", default: "-", desc: "Dialog body content" },
  ],
  progress: [
    { name: "value", type: "number", default: "0", desc: "Progress percentage (0-100)" },
    { name: "label", type: "string", default: "-", desc: "Progress label" },
  ],
  "date-picker": [
    { name: "value", type: "Date", default: "-", desc: "Selected date" },
    { name: "onChange", type: "(date) => void", default: "-", desc: "Date change handler" },
    { name: "label", type: "string", default: "-", desc: "Field label" },
  ],
};

export function ComponentPreview({ componentId }: { componentId: string }) {
  const store = useDesignHub();
  const { activeSystem, activeTab, setActiveTab } = store;
  const t = useActiveTheme();
  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === componentId);
  if (!comp) return null;

  const densityOrSize = activeSystem === "salt" ? store.salt.density
    : activeSystem === "m3" ? store.m3.density
    : activeSystem === "carbon" ? store.carbon.density
    : activeSystem === "ausos" ? store.ausos.density
    : store.fluent.size;
  const css = getFullCSS(activeSystem, t.T, densityOrSize);

  const DemoComponent = getDemoComponent(activeSystem, componentId);

  const tabCls = activeSystem === "salt" ? "s-tab" : activeSystem === "m3" ? "m3-tab" : activeSystem === "ausos" ? "a-tab" : activeSystem === "carbon" ? "cb-tab" : "f-tab";
  const isAusos = activeSystem === "ausos";
  const isCarbon = activeSystem === "carbon";

  const pad = 48;
  /* Carbon components on the docs site always show a 5-tab nav:
     Overview (preview demo), Usage (plain-English guidance),
     Style (tokens + sizing), Code (snippet), Accessibility
     (WCAG + keyboard notes). For other DSes we keep the minimal
     Preview / Code pair. */
  const carbonTabs = ["preview", "usage", "style", "code", "accessibility"] as const;
  const visibleTabs: readonly ("preview" | "usage" | "style" | "code" | "accessibility")[] =
    isCarbon ? carbonTabs : (["preview", "code"] as const);
  const currentTab: typeof visibleTabs[number] =
    (visibleTabs as readonly string[]).includes(activeTab as string)
      ? (activeTab as typeof visibleTabs[number])
      : "preview";

  return (
    <div style={{ padding: `${pad}px ${pad + 8}px`, fontFamily: t.font, color: t.fg }}>
      {/* Title section — category already conveyed by breadcrumb in ContentTopBar */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: t.fg, marginBottom: 8 }}>{comp.name}</h2>
        <p style={{ fontSize: 15, color: t.fg3, lineHeight: 1.6, marginBottom: 0 }}>{comp.desc}</p>
      </div>

      {/* Tabs - below title, ARIA tablist.
          Carbon shows 5 tabs matching carbondesignsystem.com:
          Overview / Usage / Style / Code / Accessibility.
          Other DSes render the original Preview / Code pair. */}
      <div role="tablist" aria-label="Component view" style={{
        display: "flex",
        borderBottom: `1px solid ${t.border}`,
        marginBottom: 32,
      }}>
        {visibleTabs.map((tab) => {
          const active = currentTab === tab;
          const label = tab === "preview" ? (isCarbon ? "Overview" : "Preview")
            : tab === "code" ? "Code"
            : tab === "usage" ? "Usage"
            : tab === "style" ? "Style"
            : "Accessibility";
          return isAusos ? (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab)}
              style={{
                position: "relative",
                height: t.scale.tabH,
                padding: `0 ${t.scale.gap + 14}px`,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontSize: t.scale.navF,
                fontWeight: 500,
                fontFamily: t.font,
                color: active ? t.accent : t.fg3,
                transition: "color 150ms",
              }}
            >
              {label}
              {active && (
                <span style={{
                  position: "absolute", bottom: 0, left: t.scale.gap + 6, right: t.scale.gap + 6,
                  height: 2, borderRadius: 1,
                  background: t.accent,
                }} />
              )}
            </button>
          ) : isCarbon ? (
            /* Carbon tabs - exact carbondesignsystem.com treatment:
               padding 12x16, 14px/400, 2px $interactive active underline,
               $text-primary active / $text-secondary inactive. */
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab)}
              style={{
                position: "relative",
                height: 40,
                padding: "10px 16px",
                border: 0,
                background: "transparent",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
                fontFamily: t.font,
                color: active ? t.fg : t.fg2,
                borderBottom: active ? `2px solid ${t.accent}` : "2px solid transparent",
                marginBottom: -1,
                transition: "color 70ms cubic-bezier(0.2, 0, 0.38, 0.9)",
              }}
            >
              {label}
            </button>
          ) : (
            <button
              key={tab}
              role="tab"
              aria-selected={active}
              className={`${tabCls}${active ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
              style={{ fontFamily: t.font, fontSize: t.scale.navF }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {currentTab === "code" ? (
        <CodePanel componentId={componentId} />
      ) : currentTab === "usage" ? (
        /* Usage tab - Carbon only. Plain-English guidance + link
           to the official docs page for authoritative content. */
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
      ) : componentId === "charts" ? (
        <ChartsPage />
      ) : componentId === "ag-grid" ? (
        <DSAgGrid system={activeSystem} theme={t.T} density={densityOrSize} />
      ) : (
        <div
          /* Carbon theming is applied via a wrapper className that
             matches the Carbon runtime pattern (.cds--white /
             .cds--g10 / .cds--g90 / .cds--g100). The className drives
             the token cascade emitted by carbonBuildCSS, so swapping
             the theme here hot-swaps every --cds-* variable without
             rebuilding the CSS string. */
          className={isCarbon ? `cds--${store.carbon.themeKey}` : undefined}
          style={{
            background: isAusos && t.T.gradient ? t.T.gradient : isCarbon ? t.T.layer01 : t.bg,
            borderRadius: isAusos ? 14 : activeSystem === "m3" ? 12 : isCarbon ? 0 : 8,
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

      {/* Props table - ausos DS only */}
      {currentTab === "preview" && isAusos && AUSOS_PROPS[componentId] && (
        <div style={{ marginTop: t.scale.gap * 3, borderRadius: 12, border: `1px solid ${t.border}`, overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", borderBottom: `1px solid ${t.border}`, fontSize: 12, fontWeight: 600, color: t.fg }}>Props</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: t.font }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                {["Prop", "Type", "Default", "Description"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 11, fontWeight: 600, color: t.fg3 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUSOS_PROPS[componentId].map((p: { name: string; type: string; default: string; desc: string }) => (
                <tr key={p.name} style={{ borderBottom: `1px solid ${t.border}` }}>
                  <td style={{ padding: "8px 12px", fontWeight: 500, color: t.fg }}>{p.name}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: t.accent }}>{p.type}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11, color: t.fg3 }}>{p.default}</td>
                  <td style={{ padding: "8px 12px", color: t.fg2 }}>{p.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
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
