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

/* ── MAIN APP - fully themed by active DS ── */
export function DesignHubApp() {
  const store = useDesignHub();
  const { sidebarOpen, activeSystem } = store;
  const t = useTheme();
  const sysInfo = getSystemInfo(activeSystem);

  // Detect dark theme for logo color - logo is black SVG, invert to white in dark mode
  const isDarkTheme = activeSystem === "salt"
    ? store.salt.themeKey.includes("dark")
    : activeSystem === "m3"
    ? store.m3.themeKey.startsWith("dark")
    : activeSystem === "ausos"
    ? store.ausos.themeKey === "dark"
    : activeSystem === "carbon"
    ? store.carbon.themeKey === "g90" || store.carbon.themeKey === "g100"
    : store.fluent.themeKey === "dark";
  const logoFilter = isDarkTheme ? "brightness(0) invert(1)" : "brightness(0)";

  /* Carbon-specific chrome treatment - matches carbondesignsystem.com:
     black UI Shell header (always $background-inverse), white text
     on header regardless of main theme, Carbon-blue accent for the
     active system switcher + AI Builder button. */
  const isCarbon = activeSystem === "carbon";
  const headerBg = isCarbon ? "#161616" /* $background-inverse */ : (activeSystem === "ausos" ? "transparent" : t.bg);
  const headerFg = isCarbon ? "#ffffff" : t.fg;
  const headerBorder = isCarbon ? "#393939" : (activeSystem === "ausos" ? (isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)") : t.border);
  /* Logo stays black on white headers, white on dark/Carbon headers. */
  const resolvedLogoFilter = isCarbon ? "brightness(0) invert(1)" : logoFilter;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh",
      /* Carbon uses its own canvas bg (white / g100) so the main area
         and the outer wrapper are the same colour, matching the
         "no seam" aesthetic of carbondesignsystem.com. */
      background: activeSystem === "ausos" ? t.bg : isCarbon ? t.bg : t.bg2,
      fontFamily: t.font, color: t.fg, transition: "background 200ms, color 200ms" }}>
      {/* Inject the DS CSS (sanitized to prevent injection) */}
      <style dangerouslySetInnerHTML={{ __html: sanitizeCSS(t.css) }} />

      {/* Header - 3-column. Carbon renders as the IBM UI Shell:
          black $background-inverse bar, 48px tall, white text, no
          pill badges (Carbon uses flat text+tag pattern). Other
          DSes keep their per-theme chrome.

          Carbon theme-class wrapper: Carbon's theme tokens
          (--cds-button-primary, --cds-link-primary, etc.) are
          scoped under `.cds--<themeKey>` selectors by the Carbon
          CSS emitter. Without a matching ancestor class, only the
          :root fallback values apply — which leaves the SystemSwitcher's
          `.cb-btn-ghost` labels using unscoped or mismatched tokens.
          Applying the theme class here gives the SystemSwitcher +
          ThemeControls the correct Carbon theme context. */}
      <header
        className={isCarbon ? `cds--${store.carbon.themeKey}` : undefined}
        style={{
          display: "flex", alignItems: "center",
          padding: isCarbon ? "0 16px" : `${t.scale.gap}px ${t.scale.gap + 8}px`,
          borderBottom: `1px solid ${headerBorder}`,
          background: headerBg,
          minHeight: isCarbon ? 48 : t.scale.hdrH, flexShrink: 0,
          position: "relative",
        }}
      >
        {/* Left - logo + title */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: t.scale.gap - 1 }}>
          <img src="/aologo.svg" alt="ausōs" style={{ height: isCarbon ? 16 : t.scale.navF + 4, width: "auto", filter: resolvedLogoFilter }} />
          <span style={{ fontSize: isCarbon ? 14 : t.scale.navF + 1, fontWeight: isCarbon ? 400 : 600, color: headerFg }}>
            {isCarbon ? <><strong style={{ fontWeight: 600 }}>IBM</strong> Design Hub</> : "UI Kit Overview"}
          </span>
        </div>

        {/* Center - DS switcher, always centered */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <SystemSwitcher />
        </div>

        {/* Right - dark/light toggle + theme badge + AI Builder */}
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
              } else if (activeSystem === "carbon") {
                /* Carbon toggles white ↔ g100 (canonical light/dark).
                   Users pick g10/g90 explicitly via ThemeControls. */
                const k = store.carbon.themeKey;
                store.setCarbonTheme(k === "g100" || k === "g90" ? "white" : "g100");
              } else {
                store.setFluentTheme(store.fluent.themeKey === "dark" ? "light" : "dark");
              }
            }}
            title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: isCarbon ? "#c6c6c6" : t.fg2, display: "flex", alignItems: "center" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: t.scale.navF + 2 }}>
              {isDarkTheme ? "light_mode" : "dark_mode"}
            </span>
          </button>
          {isCarbon ? (
            /* Carbon theme badge as a Carbon tag (gray, 16px pill). */
            <span style={{ fontSize: 12, color: "#ffffff", background: "rgba(255,255,255,0.1)", padding: "3px 10px", borderRadius: 16, fontWeight: 400 }}>
              {store.carbon.themeKey.toUpperCase()}
            </span>
          ) : (
            <span style={{
              fontSize: t.scale.labF, color: t.accentText, background: t.accentWeak,
              padding: `${t.scale.gap - 3}px ${t.scale.gap + 4}px`, borderRadius: 9999, fontWeight: 600,
            }}>
              {t.T.name || sysInfo.name}
            </span>
          )}
          <Link href="/" target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: isCarbon ? 14 : t.scale.labF + 1, fontWeight: isCarbon ? 400 : 600,
            color: "#ffffff",
            background: isCarbon ? "#0f62fe" : t.accent,
            padding: isCarbon ? "10px 16px" : `${t.scale.gap - 1}px ${t.scale.gap + 8}px`,
            borderRadius: isCarbon ? 0 : 9999,
            textDecoration: "none",
          }}>
            AI Builder
          </Link>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar - DS brand → controls → sticky search → scrollable list */}
        {sidebarOpen && (
          <aside style={{
            width: t.scale.panelW,
            borderRight: `1px solid ${activeSystem === "ausos" ? (isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)") : t.border}`,
            /* Carbon sidebar sits at $layer-01 (one step up from
               canvas) matching the Carbon docs sidenav. */
            background: activeSystem === "ausos" ? "transparent" : activeSystem === "m3" ? t.bg2 : isCarbon ? t.T.layer01 : t.bg,
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

        {/* Main - ContentTopBar (hamburger + breadcrumb) always at top */}
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
