"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { getSystemInfo } from "@/data/registry";
import "./tool-page.css";

const systems: SystemId[] = ["salt", "m3", "fluent", "carbon", "uoaui"];

/** Standalone tools need their own scrolling surface; the canvas locks body. */
export function ToolPageShell({ children }: { children: ReactNode }) {
  const t = useTheme();
  const system = useDesignHub((s) => s.activeSystem);
  const setSystem = useDesignHub((s) => s.setActiveSystem);
  const mode = useDesignHub((s) => s.globalMode);
  const toggleMode = () => {
    const s = useDesignHub.getState();
    const next = mode === "dark" ? "light" : "dark";
    if (system === "salt") s.setSaltTheme(`jpm-${next}`);
    else if (system === "m3") s.setM3Theme(next);
    else if (system === "fluent") s.setFluentTheme(next);
    else if (system === "carbon") s.setCarbonTheme(next === "dark" ? "g100" : "white");
    else s.setUoauiTheme(next);
  };
  return (
    <div className="tool-page" style={{
      background: t.bg, color: t.fg,
      "--tool-bg": t.bg, "--tool-surface": t.bg2,
      "--tool-fg": t.fg, "--tool-muted": t.fg2,
      "--tool-border": t.border, "--tool-focus": t.focusRing,
      colorScheme: mode,
    } as CSSProperties}>
      <nav className="tool-page-nav" aria-label="Design tools">
        <Link href="/">uoaui.ai</Link>
        <Link href="/ui-kit">UI Kit</Link>
        <Link href="/builder">Workbench</Link>
        <Link href="/token-editor">Token reference</Link>
        <Link href="/theme-builder">Theme builder</Link>
        <div className="tool-page-settings">
          <label htmlFor="tool-system">System</label>
          <select id="tool-system" value={system} onChange={(e) => setSystem(e.target.value as SystemId)}>
            {systems.map((id) => <option key={id} value={id}>{getSystemInfo(id).name}</option>)}
          </select>
          <button type="button" onClick={toggleMode}>Switch to {mode === "dark" ? "light" : "dark"} mode</button>
        </div>
      </nav>
      {children}
    </div>
  );
}
