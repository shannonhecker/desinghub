"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getFullCSS, getDemoComponent } from "@/data/registry";
import { useActiveTheme } from "@/components/DesignHubApp";
import { CodePanel } from "./CodePanel";
import { ChartsPage } from "./ChartsPage";
import { DSAgGrid } from "./DSAgGrid";

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

  const tabCls = activeSystem === "salt" ? "s-tab" : activeSystem === "m3" ? "m3-tab" : "f-tab";

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

      {/* Tabs — below title */}
      <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, marginBottom: t.scale.gap * 2 }}>
        {(["preview", "code"] as const).map((tab) => (
          <button
            key={tab}
            className={`${tabCls}${activeTab === tab ? " active" : ""}`}
            onClick={() => setActiveTab(tab)}
            style={{ fontFamily: t.font, fontSize: t.scale.navF }}
          >
            {tab === "preview" ? "Preview" : "Code"}
          </button>
        ))}
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
          background: t.bg, borderRadius: activeSystem === "m3" ? 12 : 8,
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
    </div>
  );
}
