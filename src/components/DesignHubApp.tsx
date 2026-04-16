"use client";

import React from "react";
import Link from "next/link";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { getSystemInfo } from "@/data/registry";
import { sanitizeCSS } from "@/lib/sanitizeCSS";
import { useTheme, type ActiveTheme } from "@/contexts/ThemeContext";

import { SystemSwitcher } from "./ui-kit/SystemSwitcher";
import { ThemeControls } from "./ui-kit/ThemeControls";
import { SidebarDSBrand } from "./ui-kit/SidebarDSBrand";
import { SidebarSearch } from "./ui-kit/SidebarSearch";
import { ContentTopBar } from "./ui-kit/ContentTopBar";
import { ComponentList } from "./ui-kit/ComponentList";
import { MainContent } from "./ui-kit/MainContent";

/**
 * @deprecated Use `useTheme()` from `@/contexts/ThemeContext` instead.
 * Kept for backward compatibility with CodePanel and ComponentPreview.
 */
export function useActiveTheme(): ActiveTheme {
  return useTheme();
}

/* ── MAIN APP — fully themed by active DS ── */
export function DesignHubApp() {
  const store = useDesignHub();
  const { sidebarOpen, activeSystem } = store;
  const t = useTheme();
  const sysInfo = getSystemInfo(activeSystem);

  // Detect dark theme for logo color — logo is black SVG, invert to white in dark mode
  const isDarkTheme = activeSystem === "salt"
    ? store.salt.themeKey.includes("dark")
    : activeSystem === "m3"
    ? store.m3.themeKey.startsWith("dark")
    : activeSystem === "ausos"
    ? store.ausos.themeKey === "dark"
    : store.fluent.themeKey === "dark";
  const logoFilter = isDarkTheme ? "brightness(0) invert(1)" : "brightness(0)";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: activeSystem === "ausos" ? t.bg : t.bg2, fontFamily: t.font, color: t.fg, transition: "background 200ms, color 200ms" }}>
      {/* Inject the DS CSS (sanitized to prevent injection) */}
      <style dangerouslySetInnerHTML={{ __html: sanitizeCSS(t.css) }} />

      {/* Header — 3-column, height + padding scale with density */}
      <header style={{
        display: "flex", alignItems: "center",
        padding: `${t.scale.gap}px ${t.scale.gap + 8}px`,
        borderBottom: `1px solid ${activeSystem === "ausos" ? (isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)") : t.border}`,
        background: activeSystem === "ausos" ? "transparent" : t.bg,
        minHeight: t.scale.hdrH, flexShrink: 0,
        position: "relative",
      }}>
        {/* Left — logo + title */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: t.scale.gap - 1 }}>
          <img src="/aologo.svg" alt="ausōs" style={{ height: t.scale.navF + 4, width: "auto", filter: logoFilter }} />
          <span style={{ fontSize: t.scale.navF + 1, fontWeight: 600, color: t.fg }}>UI Kit Overview</span>
        </div>

        {/* Center — DS switcher, always centered */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SystemSwitcher />
        </div>

        {/* Right — dark/light toggle + theme badge + AI Builder */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: t.scale.gap, justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              if (activeSystem === "salt") {
                const key = store.salt.themeKey;
                const isDk = key.includes("dark");
                store.setSaltTheme(isDk ? key.replace("dark", "light") : key.replace("light", "dark"));
              } else if (activeSystem === "m3") {
                store.setM3Theme(store.m3.themeKey.startsWith("dark") ? "light" : "dark");
              } else if (activeSystem === "ausos") {
                store.setAusosTheme(store.ausos.themeKey === "dark" ? "light" : "dark");
              } else {
                store.setFluentTheme(store.fluent.themeKey === "dark" ? "light" : "dark");
              }
            }}
            title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: t.fg2, display: "flex", alignItems: "center" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: t.scale.navF + 2 }}>
              {isDarkTheme ? "light_mode" : "dark_mode"}
            </span>
          </button>
          <span style={{
            fontSize: t.scale.labF, color: t.accentText, background: t.accentWeak,
            padding: `${t.scale.gap - 3}px ${t.scale.gap + 4}px`, borderRadius: 9999, fontWeight: 600,
          }}>
            {t.T.name || sysInfo.name}
          </span>
          <Link href="/" target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: t.scale.labF + 1, fontWeight: 600, color: t.accentFg,
            background: t.accent,
            padding: `${t.scale.gap - 1}px ${t.scale.gap + 8}px`, borderRadius: 9999, textDecoration: "none",
          }}>
            AI Builder
          </Link>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar — DS brand → controls → sticky search → scrollable list */}
        {sidebarOpen && (
          <aside style={{
            width: t.scale.panelW,
            borderRight: `1px solid ${activeSystem === "ausos" ? (isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)") : t.border}`,
            background: activeSystem === "ausos" ? "transparent" : activeSystem === "m3" ? t.bg2 : t.bg,
            display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
            transition: "background 200ms",
          }}>
            <div style={{ flexShrink: 0, borderBottom: `1px solid ${t.border}` }}>
              <SidebarDSBrand />
            </div>
            <div style={{ padding: "20px 24px 12px", flexShrink: 0 }}>
              <ThemeControls />
            </div>
            <div style={{ padding: "12px 24px 16px", flexShrink: 0 }}>
              <SidebarSearch />
            </div>
            <div style={{ padding: "8px 24px 24px", overflowY: "auto", flex: 1 }}>
              <nav aria-label="Component navigation"><ComponentList /></nav>
            </div>
          </aside>
        )}

        {/* Main — ContentTopBar (hamburger + breadcrumb) always at top */}
        <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: activeSystem === "ausos" ? "transparent" : t.bg }}>
          <ContentTopBar />
          <div style={{ flex: 1, overflowY: "auto" }}>
            <MainContent />
          </div>
        </main>
      </div>
    </div>
  );
}
