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
    { id: "carbon", label: "Carbon" },
  ];
  /* Button-class prefix picks the DS's own button styling for the
     switcher itself so it visually matches whichever system is active.
     Carbon uses .cb-btn - Phase 4 ships the full class rules. */
  const btnClass = activeSystem === "salt" ? "s-btn"
    : activeSystem === "m3" ? "m3-btn"
    : activeSystem === "fluent" ? "f-btn"
    : activeSystem === "carbon" ? "cb-btn"
    : "a-btn";
  const activeClass = activeSystem === "salt" ? "s-btn-solid"
    : activeSystem === "m3" ? "m3-btn-filled"
    : activeSystem === "fluent" ? "f-btn-primary"
    : activeSystem === "carbon" ? "cb-btn-primary"
    : "a-btn-primary";
  const inactiveClass = activeSystem === "salt" ? "s-btn-transparent"
    : activeSystem === "m3" ? "m3-btn-text"
    : activeSystem === "fluent" ? "f-btn-subtle"
    : activeSystem === "carbon" ? "cb-btn-ghost"
    : "a-btn-ghost";

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
