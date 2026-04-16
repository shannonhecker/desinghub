"use client";

import React from "react";
import { useDesignHub } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";
import { getComponents, getSystemInfo } from "@/data/registry";

export const SidebarDSBrand = React.memo(function SidebarDSBrand() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const t = useTheme();
  const sysInfo = getSystemInfo(activeSystem);
  const components = getComponents(activeSystem);

  const badge = { label: activeSystem === "salt" ? "S" : activeSystem === "m3" ? "M3" : activeSystem === "fluent" ? "F2" : "A", bg: t.accent, color: t.accentFg };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 24px" }}>
      <div style={{
        width: t.scale.navF + 14, height: t.scale.navF + 14, borderRadius: activeSystem === "m3" ? 10 : 6,
        background: badge.bg, color: badge.color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: t.scale.labF, fontWeight: 700, flexShrink: 0, fontFamily: t.font,
      }}>
        {badge.label}
      </div>
      <div>
        <div style={{ fontSize: t.scale.navF, fontWeight: 600, color: t.fg, lineHeight: 1.2 }}>{sysInfo.name}</div>
        <div style={{ fontSize: t.scale.labF - 1, color: t.fg2, marginTop: 1 }}>{components.length} components</div>
      </div>
    </div>
  );
});
