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
    { name: "onClick", type: "() => void", default: "—", desc: "Click handler" },
    { name: "children", type: "ReactNode", default: "—", desc: "Button label content" },
  ],
  inputs: [
    { name: "label", type: "string", default: "—", desc: "Field label above input" },
    { name: "placeholder", type: "string", default: "—", desc: "Placeholder text" },
    { name: "type", type: '"text" | "email" | "password" | "number"', default: '"text"', desc: "Input type" },
    { name: "disabled", type: "boolean", default: "false", desc: "Disables input" },
    { name: "value", type: "string", default: "—", desc: "Controlled value" },
    { name: "onChange", type: "(e) => void", default: "—", desc: "Change handler" },
  ],
  cards: [
    { name: "children", type: "ReactNode", default: "—", desc: "Card content" },
    { name: "onClick", type: "() => void", default: "—", desc: "Makes card interactive" },
    { name: "padding", type: "number | string", default: "16", desc: "Inner padding" },
  ],
  tabs: [
    { name: "value", type: "string", default: "—", desc: "Active tab value" },
    { name: "onChange", type: "(value) => void", default: "—", desc: "Tab change handler" },
    { name: "children", type: "Tab[]", default: "—", desc: "Tab components" },
  ],
  badges: [
    { name: "variant", type: '"accent" | "default" | "success" | "warning" | "danger"', default: '"default"', desc: "Status variant" },
    { name: "children", type: "ReactNode", default: "—", desc: "Badge label" },
  ],
  switches: [
    { name: "checked", type: "boolean", default: "false", desc: "Toggle state" },
    { name: "onChange", type: "(checked) => void", default: "—", desc: "Toggle handler" },
    { name: "label", type: "string", default: "—", desc: "Accessible label" },
    { name: "disabled", type: "boolean", default: "false", desc: "Disables switch" },
  ],
  checkboxes: [
    { name: "checked", type: "boolean", default: "false", desc: "Checked state" },
    { name: "onChange", type: "(checked) => void", default: "—", desc: "Check handler" },
    { name: "label", type: "string", default: "—", desc: "Checkbox label" },
  ],
  alerts: [
    { name: "variant", type: '"info" | "success" | "warning" | "danger"', default: '"info"', desc: "Alert status" },
    { name: "children", type: "ReactNode", default: "—", desc: "Alert message" },
  ],
  dialog: [
    { name: "open", type: "boolean", default: "false", desc: "Controls visibility" },
    { name: "onClose", type: "() => void", default: "—", desc: "Close handler" },
    { name: "title", type: "string", default: "—", desc: "Dialog heading" },
    { name: "children", type: "ReactNode", default: "—", desc: "Dialog body content" },
  ],
  progress: [
    { name: "value", type: "number", default: "0", desc: "Progress percentage (0-100)" },
    { name: "label", type: "string", default: "—", desc: "Progress label" },
  ],
  "date-picker": [
    { name: "value", type: "Date", default: "—", desc: "Selected date" },
    { name: "onChange", type: "(date) => void", default: "—", desc: "Date change handler" },
    { name: "label", type: "string", default: "—", desc: "Field label" },
  ],
};

export function ComponentPreview({ componentId }: { componentId: string }) {
  const store = useDesignHub();
  const { activeSystem, activeTab, setActiveTab } = store;
  const t = useActiveTheme();
  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === componentId);
  if (!comp) return null;

  const densityOrSize = activeSystem === "salt" ? store.salt.density : activeSystem === "m3" ? store.m3.density : store.fluent.size;
  const css = getFullCSS(activeSystem, t.T, densityOrSize);

  const DemoComponent = getDemoComponent(activeSystem, componentId);

  const tabCls = activeSystem === "salt" ? "s-tab" : activeSystem === "m3" ? "m3-tab" : activeSystem === "ausos" ? "a-tab" : "f-tab";
  const isAusos = activeSystem === "ausos";

  const pad = t.scale.gap * 4;

  return (
    <div style={{ padding: pad, fontFamily: t.font, color: t.fg }}>
      {/* Title section — no back button, breadcrumb handles navigation */}
      <div style={{ marginBottom: t.scale.gap }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: t.scale.labF, textTransform: "uppercase", color: t.accentText, background: t.accentWeak, padding: "2px 8px", borderRadius: activeSystem === "m3" ? 16 : 8, fontWeight: 600 }}>
            {comp.cat}
          </span>
        </div>
        <h2 style={{ fontSize: t.scale.navF + 10, fontWeight: 700, color: t.fg, marginBottom: 4 }}>{comp.name}</h2>
        <p style={{ fontSize: t.scale.navF, color: t.fg3, lineHeight: 1.5, marginBottom: 0 }}>{comp.desc}</p>
      </div>

      {/* Tabs — below title, ARIA tablist */}
      <div role="tablist" aria-label="Component view" style={{
        display: "flex",
        borderBottom: `1px solid ${t.border}`,
        marginBottom: t.scale.gap * 2,
      }}>
        {(["preview", "code"] as const).map((tab) => {
          const active = activeTab === tab;
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
              {tab === "preview" ? "Preview" : "Code"}
              {active && (
                <span style={{
                  position: "absolute", bottom: 0, left: t.scale.gap + 6, right: t.scale.gap + 6,
                  height: 2, borderRadius: 1,
                  background: t.accent,
                }} />
              )}
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
              {tab === "preview" ? "Preview" : "Code"}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "code" ? (
        <CodePanel componentId={componentId} />
      ) : componentId === "charts" ? (
        <ChartsPage />
      ) : componentId === "ag-grid" ? (
        <DSAgGrid system={activeSystem} theme={t.T} density={densityOrSize} />
      ) : (
        <div style={{
          background: isAusos && t.T.gradient ? t.T.gradient : t.bg,
          borderRadius: isAusos ? 14 : activeSystem === "m3" ? 12 : 8,
          border: `1px solid ${t.border}`, padding: pad, color: t.fg,
        }}>
          <style dangerouslySetInnerHTML={{ __html: css }} />
          {DemoComponent ? <DemoComponent /> : (
            <div style={{ padding: pad, borderRadius: 8, border: `1px dashed ${t.border}`,
              display: "flex", alignItems: "center", justifyContent: "center", color: t.fg2, fontSize: t.scale.navF }}>
              Demo loading...
            </div>
          )}
        </div>
      )}

      {/* Props table — ausos DS only */}
      {activeTab === "preview" && isAusos && AUSOS_PROPS[componentId] && (
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
