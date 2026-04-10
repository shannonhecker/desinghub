"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { getComponents, getTheme, getFullCSS, getFont, getSystemInfo, activateTheme, getDemoComponent } from "@/data/registry";

export function ComponentPreview({ componentId }: { componentId: string }) {
  const store = useDesignHub();
  const { activeSystem } = store;
  const components = getComponents(activeSystem);
  const comp = components.find((c) => c.id === componentId);
  if (!comp) return null;

  const T = activeSystem === "salt"
    ? getTheme("salt", store.salt.themeKey)
    : activeSystem === "m3"
    ? getTheme("m3", store.m3.themeKey, store.m3.customColor, store.m3.isDarkCustom)
    : getTheme("fluent", store.fluent.themeKey);

  activateTheme(activeSystem, T);

  const densityOrSize = activeSystem === "salt" ? store.salt.density : activeSystem === "m3" ? store.m3.density : store.fluent.size;
  const css = getFullCSS(activeSystem, T, densityOrSize);
  const font = getFont(activeSystem);
  const bg = activeSystem === "salt" ? T.bg : activeSystem === "m3" ? T.surface : T.bg1;
  const fg = activeSystem === "salt" ? T.fg : activeSystem === "m3" ? T.onSurface : T.fg1;
  const fg2 = activeSystem === "salt" ? T.fg2 : activeSystem === "m3" ? T.onSurfaceVariant : T.fg2;
  const fg3 = activeSystem === "salt" ? T.fg3 : activeSystem === "m3" ? T.outline : T.fg3;
  const accent = activeSystem === "salt" ? (T.accentText || T.accent) : activeSystem === "m3" ? T.primary : T.brandFg1;
  const accentWeak = activeSystem === "salt" ? T.accentWeak : activeSystem === "m3" ? T.primaryContainer : T.brandBg2;
  const border = activeSystem === "salt" ? T.border : activeSystem === "m3" ? T.outlineVariant : T.stroke2;

  const DemoComponent = getDemoComponent(activeSystem, componentId);

  // Use DS link/button for back nav
  const linkClass = activeSystem === "salt" ? "s-btn s-btn-transparent" : activeSystem === "m3" ? "m3-btn m3-btn-text" : "f-btn f-btn-subtle";

  return (
    <div style={{ padding: 24, fontFamily: font, color: fg }}>
      <div style={{ marginBottom: 16 }}>
        <button className={linkClass} onClick={() => store.setSelectedComponent(null)}
          style={{ minWidth: "auto", padding: "0 8px", height: 28, fontSize: 12, marginBottom: 8 }}>
          ← Back to all
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 10, textTransform: "uppercase", color: accent, background: accentWeak, padding: "2px 8px", borderRadius: activeSystem === "m3" ? 16 : 8, fontWeight: 600 }}>
            {comp.cat}
          </span>
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: fg, marginBottom: 4 }}>{comp.name}</h2>
        <p style={{ fontSize: 13, color: fg3, lineHeight: 1.5 }}>{comp.desc}</p>
      </div>

      <div style={{
        background: bg, borderRadius: activeSystem === "m3" ? 12 : 8,
        border: `1px solid ${border}`, padding: 24, color: fg,
      }}>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        {DemoComponent ? <DemoComponent /> : (
          <div style={{ padding: 24, borderRadius: 8, border: `1px dashed ${border}`,
            display: "flex", alignItems: "center", justifyContent: "center", color: fg2, fontSize: 13 }}>
            Demo loading...
          </div>
        )}
      </div>
    </div>
  );
}
