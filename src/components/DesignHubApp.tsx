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

  /* Hydrate from URL params on mount — Builder → UI Kit handoff
     passes ?ds=&mode=&density=&themeKey= so the UI Kit opens on the
     same configuration the user was just exploring in Builder. The
     params reflect Builder's flat state shape (single mode/density/
     themeKey); we map them onto UI Kit's per-DS state slots. Run
     once on mount; URL is left alone after hydration. */
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ds = params.get("ds") as SystemId | null;
    const mode = params.get("mode");
    const density = params.get("density");
    const themeKey = params.get("themeKey");

    if (ds && ["salt", "m3", "fluent", "carbon", "uoaui"].includes(ds)) {
      store.setActiveSystem(ds);
    }
    /* themeKey is per-DS so apply to whichever DS is now active. */
    const targetDs = ds ?? activeSystem;
    if (themeKey) {
      if (targetDs === "salt") store.setSaltTheme(themeKey);
      else if (targetDs === "m3") store.setM3Theme(themeKey);
      else if (targetDs === "fluent") store.setFluentTheme(themeKey);
      else if (targetDs === "carbon") store.setCarbonTheme(themeKey);
      else if (targetDs === "uoaui") store.setUoauiTheme(themeKey);
    } else if (mode) {
      /* Fallback: use mode (light/dark) when no themeKey was passed. */
      if (targetDs === "salt") store.setSaltTheme(mode === "dark" ? "jpm-dark" : "jpm-light");
      else if (targetDs === "m3") store.setM3Theme(mode === "dark" ? "dark" : "light");
      else if (targetDs === "fluent") store.setFluentTheme(mode === "dark" ? "dark" : "light");
      else if (targetDs === "carbon") store.setCarbonTheme(mode === "dark" ? "g100" : "white");
      else if (targetDs === "uoaui") store.setUoauiTheme(mode === "dark" ? "dark" : "light");
    }
    if (density) {
      if (targetDs === "salt") store.setSaltDensity(density);
      else if (targetDs === "fluent") store.setFluentSize(density);
      else if (targetDs === "carbon") store.setCarbonDensity(density);
      else if (targetDs === "uoaui") store.setUoauiDensity(density);
      /* M3 density is numeric (-3..0); skip non-numeric handoff. */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [isNarrow, setIsNarrow] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const handler = () => setIsNarrow(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  /* Keyboard shortcuts — Cmd/Ctrl+1..5 cycle through the five DSes
     in the order they appear in SystemSwitcher (Salt 1, M3 2, Fluent
     3, Carbon 4, uoaui 5). Mirrors Builder's Cmd+Z/Cmd+Shift+Z
     undo-redo binding pattern. Skipped when focus is in an editable
     field so users can still type "1" in the search box. */
  React.useEffect(() => {
    const SYSTEM_KEYS: SystemId[] = ["salt", "m3", "fluent", "carbon", "uoaui"];
    const handler = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const target = e.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable) {
          return;
        }
      }
      const num = parseInt(e.key, 10);
      if (Number.isInteger(num) && num >= 1 && num <= SYSTEM_KEYS.length) {
        e.preventDefault();
        store.setActiveSystem(SYSTEM_KEYS[num - 1]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [store]);
  const didAutoCloseRef = React.useRef(false);
  React.useEffect(() => {
    if (isNarrow && sidebarOpen && !didAutoCloseRef.current) {
      didAutoCloseRef.current = true;
      store.toggleSidebar();
    }
    if (!isNarrow) didAutoCloseRef.current = false;
  }, [isNarrow, sidebarOpen, store]);

  // Detect dark theme for logo color - logo is black SVG, invert to white in dark mode
  const isDarkTheme = activeSystem === "salt"
    ? store.salt.themeKey.includes("dark")
    : activeSystem === "m3"
    ? store.m3.themeKey.startsWith("dark")
    : activeSystem === "uoaui"
    ? store.uoaui.themeKey === "dark"
    : activeSystem === "carbon"
    ? store.carbon.themeKey === "g90" || store.carbon.themeKey === "g100"
    : store.fluent.themeKey === "dark";
  const logoFilter = isDarkTheme ? "brightness(0) invert(1)" : "brightness(0)";

  /* Carbon-specific chrome treatment - matches carbondesignsystem.com:
     black UI Shell header (always $background-inverse), white text
     on header regardless of main theme, Carbon-blue accent for the
     active system switcher + AI Builder button. */
  const isCarbon = activeSystem === "carbon";
  const headerBg = isCarbon ? "#161616" /* $background-inverse */ : (activeSystem === "uoaui" ? "transparent" : t.bg);
  const headerFg = isCarbon ? "#ffffff" : t.fg;
  const headerBorder = isCarbon ? "#393939" : (activeSystem === "uoaui" ? (isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)") : t.border);
  /* Logo stays black on white headers, white on dark/Carbon headers. */
  const resolvedLogoFilter = isCarbon ? "brightness(0) invert(1)" : logoFilter;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh",
      /* Carbon uses its own canvas bg (white / g100) so the main area
         and the outer wrapper are the same colour, matching the
         "no seam" aesthetic of carbondesignsystem.com. */
      background: activeSystem === "uoaui" ? t.bg : isCarbon ? t.bg : t.bg2,
      fontFamily: t.font, color: t.fg, transition: "background 200ms, color 200ms" }}>
      {/* Skip link is provided once by the root layout (app/layout.tsx),
          targeting this shell's <main id="main-content"> below. A per-shell
          link here was a duplicate "Skip to main content" (WCAG 2.4.1/4.1.2). */}
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
          <img src="/aologo.svg" alt="uoaui" style={{ height: isCarbon ? 16 : t.scale.navF + 4, width: "auto", filter: resolvedLogoFilter }} />
          <span style={{ fontSize: isCarbon ? 14 : t.scale.navF + 1, fontWeight: isCarbon ? 400 : 600, color: headerFg }}>
            {isCarbon ? <><strong style={{ fontWeight: 600 }}>IBM</strong> Design Hub</> : "UI Kit Overview"}
          </span>
        </div>

        {/* Center - DS switcher. Hidden on narrow viewports; sidebar list
            remains the way to navigate inside the active DS, and the header
            theme-name chip (right side) still shows which DS is active. */}
        {!isNarrow && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SystemSwitcher />
          </div>
        )}

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
              } else if (activeSystem === "uoaui") {
                store.setUoauiTheme(store.uoaui.themeKey === "dark" ? "light" : "dark");
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
            /* Carbon theme label — plain text, not a pill. The pill
               treatment drew the eye to what's really just a status
               label. */
            <span style={{ fontSize: 11, color: "#c6c6c6", letterSpacing: "0.06em", fontWeight: 400 }}>
              {store.carbon.themeKey.toUpperCase()}
            </span>
          ) : (
            /* Same rationale for the other DSes: drop the accent-weak
               pill, keep a plain label. */
            <span style={{
              fontSize: t.scale.labF, color: t.fg2, letterSpacing: "0.04em", fontWeight: 500,
            }}>
              {t.T.name || sysInfo.name}
            </span>
          )}
          {/* Open Builder — passes current ds/mode/density/themeKey
              so the Builder lands on the same configuration the user
              is already exploring in UI Kit. */}
          <Link
            href={(() => {
              const ds = activeSystem;
              const mode = isDarkTheme ? "dark" : "light";
              const themeKey =
                ds === "salt" ? store.salt.themeKey :
                ds === "m3" ? store.m3.themeKey :
                ds === "fluent" ? store.fluent.themeKey :
                ds === "carbon" ? store.carbon.themeKey :
                store.uoaui.themeKey;
              const density =
                ds === "salt" ? store.salt.density :
                ds === "fluent" ? store.fluent.size :
                ds === "carbon" ? store.carbon.density :
                ds === "uoaui" ? store.uoaui.density :
                String(store.m3.density);
              return `/builder?ds=${ds}&mode=${mode}&density=${encodeURIComponent(density)}&themeKey=${encodeURIComponent(themeKey)}`;
            })()}
            aria-label="Open Builder"
            title="Open Builder"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              fontSize: isCarbon ? 14 : t.scale.labF + 1, fontWeight: isCarbon ? 400 : 600,
              /* On-accent text must use the DS accent-foreground token, not a
                 hardcoded white. M3 dark `primary` is a LIGHT lavender whose
                 `onPrimary` is dark, so white failed (~1.6:1); accentFg resolves
                 to onPrimary / fgOnBrand / accentFg per DS and meets AA. */
              color: isCarbon ? "#ffffff" : t.accentFg,
              background: isCarbon ? "#0f62fe" : t.accent,
              padding: isNarrow ? "8px 10px" : isCarbon ? "10px 16px" : `${t.scale.gap - 1}px ${t.scale.gap + 8}px`,
              borderRadius: isCarbon ? 0 : 9999,
              textDecoration: "none",
            }}>
            {isNarrow ? (
              <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">auto_awesome</span>
            ) : "Open Builder"}
          </Link>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar - DS brand → controls → sticky search → scrollable list */}
        {sidebarOpen && (
          <aside style={{
            width: t.scale.panelW,
            borderRight: `1px solid ${activeSystem === "uoaui" ? (isDarkTheme ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)") : t.border}`,
            /* Carbon sidebar sits at $layer-01 (one step up from
               canvas) matching the Carbon docs sidenav. */
            background: activeSystem === "uoaui" ? "transparent" : activeSystem === "m3" ? t.bg2 : isCarbon ? t.T.layer01 : t.bg,
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
        <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: activeSystem === "uoaui" ? "transparent" : t.bg }}>
          <ContentTopBar />
          <div style={{ flex: 1, overflowY: "auto" }}>
            <MainContent />
          </div>
        </main>
      </div>
    </div>
  );
}
