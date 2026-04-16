"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";

export const SidebarSearch = React.memo(function SidebarSearch() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const searchQuery = useDesignHub((s) => s.searchQuery);
  const setSearchQuery = useDesignHub((s) => s.setSearchQuery);
  const t = useTheme();
  const inputClass = activeSystem === "salt" ? "s-input" : activeSystem === "m3" ? "" : "f-input";
  return (
    <div style={{ position: "relative" }}>
      <span className="material-symbols-outlined" style={{
        position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)",
        fontSize: 15, color: t.fg3, pointerEvents: "none", lineHeight: 1,
      }}>search</span>
      <input
        type="text"
        placeholder="Search..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className={inputClass}
        style={{
          background: activeSystem === "ausos" ? "transparent" : activeSystem === "m3" ? t.bg : t.bg2,
          color: t.fg, border: `1px solid ${t.border}`,
          borderRadius: activeSystem === "ausos" ? 9999 : activeSystem === "m3" ? 28 : 4,
          padding: `${t.scale.gap - 1}px 10px ${t.scale.gap - 1}px 28px`,
          fontSize: t.scale.navF, fontFamily: t.font, outline: "none", width: "100%",
          boxSizing: "border-box" as const,
          ...(activeSystem === "m3" ? { height: t.scale.navH - 8 } : {}),
        }}
      />
    </div>
  );
});
