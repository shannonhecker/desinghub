"use client";

import React from "react";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { useTheme } from "@/contexts/ThemeContext";

export function SystemSwitcher() {
  const activeSystem = useDesignHub((s) => s.activeSystem);
  const setActiveSystem = useDesignHub((s) => s.setActiveSystem);
  const theme = useTheme();
  const systems: { id: SystemId; label: string }[] = [
    { id: "salt", label: "Salt DS" },
    { id: "m3", label: "Material 3" },
    { id: "fluent", label: "Fluent 2" },
    { id: "ausos", label: "ausos" },
  ];
  const btnClass = activeSystem === "salt" ? "s-btn" : activeSystem === "m3" ? "m3-btn" : activeSystem === "fluent" ? "f-btn" : "a-btn";
  const activeClass = activeSystem === "salt" ? "s-btn-solid" : activeSystem === "m3" ? "m3-btn-filled" : activeSystem === "fluent" ? "f-btn-primary" : "a-btn-primary";
  const inactiveClass = activeSystem === "salt" ? "s-btn-transparent" : activeSystem === "m3" ? "m3-btn-text" : activeSystem === "fluent" ? "f-btn-subtle" : "a-btn-ghost";

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {systems.map((s) => (
        <button key={s.id} className={`${btnClass} ${activeSystem === s.id ? activeClass : inactiveClass}`}
          onClick={() => setActiveSystem(s.id)}
          style={{ minWidth: "auto", padding: "0 12px", height: activeSystem === "m3" ? 32 : undefined, fontSize: 12 }}>
          {s.label}
        </button>
      ))}
    </div>
  );
}
