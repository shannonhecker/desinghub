"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getComponents, getSystemInfo } from "@/data/registry";

export function ContentTopBar() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const selectedComponent = useDesignHub((s) => s.selectedComponent);
  const setSelectedComponent = useDesignHub((s) => s.setSelectedComponent);
  const sidebarOpen = useDesignHub((s) => s.sidebarOpen);
  const toggleSidebar = useDesignHub((s) => s.toggleSidebar);
  const t = useTheme();
  const sysInfo = getSystemInfo(activeSystem);

  const comp = selectedComponent ? getComponents(activeSystem).find(c => c.id === selectedComponent) : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: t.scale.gap + 4,
      padding: `0 ${t.scale.gap + 12}px`,
      height: t.scale.tabH, flexShrink: 0,
      background: "transparent",
    }}>
      <button
        onClick={toggleSidebar}
        aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        style={{
          background: "none", border: "none", cursor: "pointer", padding: 4,
          display: "flex", alignItems: "center", color: t.fg2, borderRadius: 4,
          transition: "color 150ms",
        }}
      >
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: t.scale.navF + 4, lineHeight: 1 }}>
          {sidebarOpen ? "chevron_left" : "menu"}
        </span>
      </button>

      <nav style={{ display: "flex", alignItems: "center", gap: t.scale.gap, fontSize: t.scale.navF - 1, fontFamily: t.font }}>
        {comp ? (
          <>
            <button onClick={() => setSelectedComponent(null)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: `${t.scale.gap - 2}px 0`, fontSize: t.scale.navF - 1, color: t.accent, fontFamily: t.font }}>
              {sysInfo.name}
            </button>
            <span style={{ color: t.fg3, fontSize: t.scale.labF }}>/</span>
            <span style={{ color: t.fg, fontWeight: 500, padding: `${t.scale.gap - 2}px 0` }}>{comp.name}</span>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "baseline", gap: t.scale.gap }}>
            <span style={{ color: t.fg, fontWeight: 500 }}>{sysInfo.name}</span>
            <span style={{ fontSize: t.scale.labF - 1, color: t.fg3, fontWeight: 400 }}>Interactive Documentation</span>
          </div>
        )}
      </nav>
    </div>
  );
}
