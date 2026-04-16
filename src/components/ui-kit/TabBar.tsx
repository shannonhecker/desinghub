"use client";

import React from "react";
import { useDesignHub, type ActiveTab } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";

export const TabBar = React.memo(function TabBar() {
  const activeTab = useDesignHub((s) => s.activeTab);
  const setActiveTab = useDesignHub((s) => s.setActiveTab);
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const t = useTheme();
  const tabs: { id: ActiveTab; label: string }[] = [
    { id: "preview", label: "Preview" },
    { id: "code", label: "Code" },
  ];

  if (activeSystem === "m3") {
    return (
      <div style={{ display: "flex", background: t.bg, flexShrink: 0, borderBottom: `1px solid ${t.border}` }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              position: "relative", height: t.scale.tabH, padding: `0 ${t.scale.gap + 18}px`,
              border: "none", background: "transparent", cursor: "pointer",
              fontSize: t.scale.navF, fontWeight: 500, letterSpacing: "0.1px", fontFamily: t.font,
              color: active ? t.accent : t.fg2, transition: "color 150ms",
            }}>
              {tab.label}
              {active && <span style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: t.accent, borderRadius: "3px 3px 0 0", display: "block" }} />}
            </button>
          );
        })}
      </div>
    );
  }

  if (activeSystem === "salt") {
    return (
      <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, background: t.bg, flexShrink: 0 }}>
        {tabs.map(tab => (
          <button key={tab.id} className={`s-tab${activeTab === tab.id ? " active" : ""}`}
            onClick={() => setActiveTab(tab.id)} style={{ fontFamily: t.font, fontSize: t.scale.navF }}>
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  if (activeSystem === "ausos") {
    return (
      <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        {tabs.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              position: "relative", height: t.scale.tabH, padding: `0 ${t.scale.gap + 14}px`,
              border: "none", background: "transparent", cursor: "pointer",
              fontSize: t.scale.navF, fontWeight: 500, fontFamily: t.font,
              color: active ? t.accent : t.fg3, transition: "color 150ms",
            }}>
              {tab.label}
              {active && <span style={{ position: "absolute", bottom: 0, left: t.scale.gap + 6, right: t.scale.gap + 6, height: 2, borderRadius: 1, background: t.accent }} />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", borderBottom: `1px solid ${t.border}`, background: t.bg, flexShrink: 0 }}>
      {tabs.map(tab => (
        <button key={tab.id} className={`f-tab${activeTab === tab.id ? " active" : ""}`}
          onClick={() => setActiveTab(tab.id)} style={{ fontFamily: t.font, fontSize: t.scale.navF }}>
          {tab.label}
        </button>
      ))}
    </div>
  );
});
