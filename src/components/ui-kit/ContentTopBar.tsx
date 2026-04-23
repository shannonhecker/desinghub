"use client";

import React, { useEffect, useState } from "react";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getComponents, getSystemInfo } from "@/data/registry";

const DS_OPTIONS: Array<{ id: SystemId; label: string }> = [
  { id: "salt",   label: "Salt DS" },
  { id: "m3",     label: "Material 3" },
  { id: "fluent", label: "Fluent 2" },
  { id: "ausos",  label: "ausos" },
  { id: "carbon", label: "Carbon" },
];

export function ContentTopBar() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const selectedComponent = useDesignHub((s) => s.selectedComponent);
  const setSelectedComponent = useDesignHub((s) => s.setSelectedComponent);
  const setActiveSystem = useDesignHub((s) => s.setActiveSystem);
  const sidebarOpen = useDesignHub((s) => s.sidebarOpen);
  const toggleSidebar = useDesignHub((s) => s.toggleSidebar);
  const t = useTheme();
  const sysInfo = getSystemInfo(activeSystem);

  const comp = selectedComponent ? getComponents(activeSystem).find(c => c.id === selectedComponent) : null;

  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => setIsNarrow(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [dsOpen, setDsOpen] = useState(false);

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

      <nav style={{ display: "flex", alignItems: "center", gap: t.scale.gap, fontSize: t.scale.navF - 1, fontFamily: t.font, position: "relative" }}>
        {/* Narrow viewports: DS name becomes a dropdown (header SystemSwitcher is hidden below 768px).
            Wide viewports: keep plain text behaviour — SystemSwitcher covers DS nav. */}
        {isNarrow ? (
          <>
            {dsOpen && (
              <div style={{ position: "fixed", inset: 0, zIndex: 98 }} onClick={() => setDsOpen(false)} />
            )}
            <button
              onClick={() => setDsOpen(v => !v)}
              aria-haspopup="listbox"
              aria-expanded={dsOpen}
              style={{
                background: "none", border: `1px solid ${dsOpen ? t.accent : t.border}`,
                borderRadius: 4, padding: `${t.scale.gap - 2}px ${t.scale.gap}px`,
                fontSize: t.scale.navF - 1, color: t.fg, cursor: "pointer", fontFamily: t.font,
                display: "inline-flex", alignItems: "center", gap: 6,
                transition: "border-color 150ms",
              }}
            >
              <span style={{ fontWeight: 500 }}>{sysInfo.name}</span>
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, color: t.fg3 }}>
                {dsOpen ? "expand_less" : "expand_more"}
              </span>
            </button>
            {dsOpen && (
              <div role="listbox" aria-label="Design system" style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 99,
                minWidth: 180,
                /* ausos' t.bg2 is a glass layer — can read thin over its
                   gradient/beam bg. Prefer its cardBg (opaque glass fill)
                   when present so the dropdown stays legible. */
                background: t.T.cardBg || t.bg2 || t.bg,
                border: `1px solid ${t.border}`,
                borderRadius: 4, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", overflow: "hidden",
                fontFamily: t.font,
                backdropFilter: t.T.glass as string | undefined,
                WebkitBackdropFilter: t.T.glass as string | undefined,
              }}>
                {DS_OPTIONS.map(opt => {
                  const isSelected = activeSystem === opt.id;
                  return (
                    <button
                      key={opt.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => { setActiveSystem(opt.id); setDsOpen(false); }}
                      style={{
                        display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 12px", border: "none", cursor: "pointer",
                        fontFamily: t.font, fontSize: 13, textAlign: "left",
                        background: isSelected ? t.accentWeak : "transparent",
                        color: isSelected ? t.accentText : t.fg,
                        transition: "background 100ms",
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, color: t.accentText }}>check</span>}
                    </button>
                  );
                })}
              </div>
            )}
            {comp && (
              <>
                <span style={{ color: t.fg3, fontSize: t.scale.labF }}>/</span>
                <span style={{ color: t.fg, fontWeight: 500, padding: `${t.scale.gap - 2}px 0` }}>{comp.name}</span>
              </>
            )}
          </>
        ) : comp ? (
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
          </div>
        )}
      </nav>
    </div>
  );
}
