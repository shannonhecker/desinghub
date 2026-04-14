"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getFullCSS, getSystemInfo, getDemoComponent } from "@/data/registry";
import { useActiveTheme } from "@/components/DesignHubApp";

export function ComponentPreview({ componentId }: { componentId: string }) {
  const store = useDesignHub();
  const { activeSystem } = store;
  const t = useActiveTheme();
  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === componentId);
  if (!comp) return null;

  const densityOrSize = activeSystem === "salt" ? store.salt.density : activeSystem === "m3" ? store.m3.density : store.fluent.size;
  const css = getFullCSS(activeSystem, t.T, densityOrSize);

  const DemoComponent = getDemoComponent(activeSystem, componentId);

  // DS-scoped back button class
  const linkClass = activeSystem === "salt" ? "s-btn s-btn-transparent" : activeSystem === "m3" ? "m3-btn m3-btn-text" : "f-btn f-btn-subtle";

  const pad = t.scale.gap * 4;

  return (
    <div style={{ padding: pad, fontFamily: t.font, color: t.fg }}>
      <div style={{ marginBottom: t.scale.gap * 2 }}>
        <button className={linkClass} onClick={() => store.setSelectedComponent(null)}
          style={{ minWidth: "auto", padding: "0 8px", height: t.scale.navH, fontSize: t.scale.navF, marginBottom: t.scale.gap, cursor: "pointer" }}>
          ← Back to all
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: t.scale.labF, textTransform: "uppercase", color: t.accentText, background: t.accentWeak, padding: "2px 8px", borderRadius: activeSystem === "m3" ? 16 : 8, fontWeight: 600 }}>
            {comp.cat}
          </span>
        </div>
        <h2 style={{ fontSize: t.scale.navF + 10, fontWeight: 700, color: t.fg, marginBottom: 4 }}>{comp.name}</h2>
        <p style={{ fontSize: t.scale.navF, color: t.fg3, lineHeight: 1.5 }}>{comp.desc}</p>
      </div>

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
    </div>
  );
}
