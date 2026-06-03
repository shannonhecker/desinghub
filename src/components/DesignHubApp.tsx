"use client";

import React from "react";
import Link from "next/link";
import { useDesignHub, type SystemId } from "@/store/useDesignHub";
import { getSystemInfo } from "@/data/registry";
import { sanitizeCSS } from "@/lib/sanitizeCSS";
import { useTheme, type ActiveTheme } from "@/contexts/ThemeContext";

import { ThemeControls } from "./ui-kit/ThemeControls";
import { SidebarDSBrand } from "./ui-kit/SidebarDSBrand";
import { SidebarSearch } from "./ui-kit/SidebarSearch";
import { ContentTopBar } from "./ui-kit/ContentTopBar";
import { ComponentList } from "./ui-kit/ComponentList";
import { MainContent } from "./ui-kit/MainContent";
import { getStageBg, getRailBg, getPanelBg } from "./ui-kit/stageTint";

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

  /* B2 ICON-RAIL: which secondary-panel section the rail last opened.
     The rail is always visible; this drives what the (toggleable) panel
     shows. "components" = the full DS brand + theme controls + search +
     tree (the prior sidebar verbatim); "search"/"theme" focus the panel
     intent for screen readers + the auto-focus effect below. The panel's
     open/closed state stays on the store's `sidebarOpen` flag so the
     ContentTopBar hamburger + narrow auto-close + Cmd-shortcuts all keep
     working unchanged. */
  type PanelSection = "components" | "search" | "theme";
  const [panelSection, setPanelSection] = React.useState<PanelSection>("components");
  const searchWrapRef = React.useRef<HTMLDivElement | null>(null);

  /* Open the panel to a given section. If the panel is closed, open it. */
  const openPanel = React.useCallback((section: PanelSection) => {
    setPanelSection(section);
    if (!store.sidebarOpen) store.toggleSidebar();
  }, [store]);

  /* When the rail opens the panel on "search", move focus into the search
     field so the keyboard path matches the visual intent (WCAG 2.4.3). */
  React.useEffect(() => {
    if (sidebarOpen && panelSection === "search") {
      const el = searchWrapRef.current?.querySelector<HTMLInputElement>("input");
      el?.focus();
    }
  }, [sidebarOpen, panelSection]);

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

  /* Carbon keeps its flat IBM aesthetic in the rail (radius 0). The brand
     logo stays black on light surfaces and inverts to white on dark/Carbon. */
  const isCarbon = activeSystem === "carbon";
  const resolvedLogoFilter = isCarbon ? "brightness(0) invert(1)" : logoFilter;

  /* C2 PER-DS STAGE: the component stage background changes per selected DS
     (neutral grey for Salt/Fluent, seam-matched canvas for Carbon, tonal
     surface for M3, transparent-over-aurora for uoaui). Computed once here
     and shared with LandingGrid via getStageBg so the shell + landing agree.
     railBg / panelBg mirror the prior <aside> per-DS fill. */
  const stageBg = getStageBg(t);
  const railBg = getRailBg(t);
  const panelBg = getPanelBg(t);

  /* Mode toggle + Open Builder relocated from the (removed) top header into
     the rail's bottom cluster. Kept as named handlers so the rail markup stays
     readable. toggleMode flips the active DS between its light/dark theme key;
     builderHref carries the current ds/mode/density/themeKey so the Builder
     opens on the same configuration the user is exploring in UI Kit. */
  const toggleMode = () => {
    if (activeSystem === "salt") {
      const key = store.salt.themeKey;
      const isDk = key.includes("dark");
      store.setSaltTheme(isDk ? key.replace("dark", "light") : key.replace("light", "dark"));
    } else if (activeSystem === "m3") {
      store.setM3Theme(store.m3.themeKey.startsWith("dark") ? "light" : "dark");
    } else if (activeSystem === "uoaui") {
      store.setUoauiTheme(store.uoaui.themeKey === "dark" ? "light" : "dark");
    } else if (activeSystem === "carbon") {
      /* Carbon toggles white ↔ g100 (canonical light/dark); users pick
         g10/g90 explicitly via ThemeControls. */
      const k = store.carbon.themeKey;
      store.setCarbonTheme(k === "g100" || k === "g90" ? "white" : "g100");
    } else {
      store.setFluentTheme(store.fluent.themeKey === "dark" ? "light" : "dark");
    }
  };
  const builderHref = (() => {
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
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh",
      /* C2 PER-DS STAGE at the shell level. uoaui gets the signature
         aurora gradient as the app-level wash so the transparent stage +
         landing + hero slab read against it; Carbon stays seam-matched
         to its own canvas (white / g100); everyone else uses the neutral
         stage tint behind the rail + panel + content. */
      background: activeSystem === "uoaui" ? (t.T.gradient as string) : isCarbon ? t.bg : stageBg,
      fontFamily: t.font, color: t.fg, transition: "background 200ms, color 200ms" }}>
      {/* Skip link is provided once by the root layout (app/layout.tsx),
          targeting this shell's <main id="main-content"> below. A per-shell
          link here was a duplicate "Skip to main content" (WCAG 2.4.1/4.1.2). */}
      {/* Inject the DS CSS (sanitized to prevent injection) */}
      <style dangerouslySetInnerHTML={{ __html: sanitizeCSS(t.css) }} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ICON-RAIL — the SOLE primary nav (owner: the old top header nav was
            redundant with the rail, so it's merged in here). Brand mark at top;
            then the 5 DS as LABELLED buttons (glyph + name, so the active DS is
            legible at a glance — no bare single letters); a divider; section
            buttons (Overview, Components, Search, Theme) that open the secondary
            panel; and a bottom cluster (pushed down) with the mode toggle +
            Open Builder. Every button keeps aria-label + title; the active DS /
            open panel section carry aria-pressed. Carbon stays flat (radius 0);
            uoaui rides transparent over the aurora. */}
        <nav
          aria-label="Design systems, sections and actions"
          className="uikit-rail"
          style={{
            ["--dh-focus-ring" as string]: t.focusRing,
            borderRight: `1px solid ${t.borderSubtle}`,
            background: railBg,
            transition: "background 200ms",
          }}
        >
          {/* Brand mark — returns to the UI Kit overview / landing. */}
          <button
            type="button"
            className="uikit-rail-logo"
            aria-label="UI Kit overview"
            title="UI Kit overview"
            onClick={() => store.setSelectedComponent(null)}
          >
            <img src="/aologo.svg" alt="" aria-hidden="true" style={{ height: 20, width: "auto", filter: resolvedLogoFilter }} />
          </button>

          {(() => {
            const DS_LIST: { id: SystemId; label: string; short: string }[] = [
              { id: "salt", label: "Salt DS", short: "Salt" },
              { id: "m3", label: "Material 3", short: "Material" },
              { id: "fluent", label: "Fluent 2", short: "Fluent" },
              { id: "uoaui", label: "uoaui DS", short: "uoaui" },
              { id: "carbon", label: "Carbon DS", short: "Carbon" },
            ];
            /* Carbon stays flat (radius 0, no shadow) to honour the IBM
               aesthetic; every other DS uses the rail-button curve token. */
            const railRadius = isCarbon ? 0 : "var(--dh-curve-sm, 6px)";
            const sectionBtn = { color: t.fg2, background: "transparent", border: `1px solid ${t.borderSubtle}` };
            return (
              <>
                <div className="uikit-rail-group" role="group" aria-label="Switch design system">
                  {DS_LIST.map(ds => {
                    const info = getSystemInfo(ds.id);
                    const isActive = activeSystem === ds.id;
                    return (
                      <button
                        key={ds.id}
                        type="button"
                        className="uikit-rail-btn"
                        aria-label={ds.label}
                        aria-pressed={isActive}
                        title={ds.label}
                        onClick={() => store.setActiveSystem(ds.id)}
                        style={{
                          borderRadius: railRadius,
                          fontFamily: t.font,
                          color: isActive ? t.accentFg : t.fg2,
                          background: isActive ? t.accent : "transparent",
                          border: isActive ? "1px solid transparent" : `1px solid ${t.borderSubtle}`,
                        }}
                      >
                        <span className="uikit-rail-glyph" aria-hidden="true" style={{ fontWeight: 700, fontSize: t.scale.navF + 1 }}>{info.icon}</span>
                        <span className="uikit-rail-label">{ds.short}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="uikit-rail-divider" style={{ background: t.borderSubtle }} aria-hidden="true" />

                <div className="uikit-rail-group" role="group" aria-label="Sections">
                  <button
                    type="button"
                    className="uikit-rail-btn"
                    aria-label="Overview"
                    aria-pressed={store.selectedComponent === null}
                    title="Overview"
                    onClick={() => store.setSelectedComponent(null)}
                    style={{ borderRadius: railRadius, ...sectionBtn }}
                  >
                    <span className="uikit-rail-glyph material-symbols-outlined" aria-hidden="true" style={{ fontSize: t.scale.navF + 6 }}>home</span>
                    <span className="uikit-rail-label">Overview</span>
                  </button>
                  <button
                    type="button"
                    className="uikit-rail-btn"
                    aria-label="Components"
                    aria-pressed={sidebarOpen && panelSection === "components"}
                    title="Components"
                    onClick={() => openPanel("components")}
                    style={{ borderRadius: railRadius, ...sectionBtn }}
                  >
                    <span className="uikit-rail-glyph material-symbols-outlined" aria-hidden="true" style={{ fontSize: t.scale.navF + 6 }}>widgets</span>
                    <span className="uikit-rail-label">Components</span>
                  </button>
                  <button
                    type="button"
                    className="uikit-rail-btn"
                    aria-label="Search components"
                    aria-pressed={sidebarOpen && panelSection === "search"}
                    title="Search components"
                    onClick={() => openPanel("search")}
                    style={{ borderRadius: railRadius, ...sectionBtn }}
                  >
                    <span className="uikit-rail-glyph material-symbols-outlined" aria-hidden="true" style={{ fontSize: t.scale.navF + 6 }}>search</span>
                    <span className="uikit-rail-label">Search</span>
                  </button>
                  <button
                    type="button"
                    className="uikit-rail-btn"
                    aria-label="Theme controls"
                    aria-pressed={sidebarOpen && panelSection === "theme"}
                    title="Theme controls"
                    onClick={() => openPanel("theme")}
                    style={{ borderRadius: railRadius, ...sectionBtn }}
                  >
                    <span className="uikit-rail-glyph material-symbols-outlined" aria-hidden="true" style={{ fontSize: t.scale.navF + 6 }}>tune</span>
                    <span className="uikit-rail-label">Theme</span>
                  </button>
                </div>

                {/* Global actions — pushed to the rail bottom (material.io
                    pattern). Mode toggle + Open Builder, both labelled. The
                    Builder link carries the live ds/mode/density/themeKey. */}
                <div className="uikit-rail-group uikit-rail-bottom" role="group" aria-label="Actions">
                  <button
                    type="button"
                    className="uikit-rail-btn"
                    aria-label={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
                    title={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
                    onClick={toggleMode}
                    style={{ borderRadius: railRadius, ...sectionBtn }}
                  >
                    <span className="uikit-rail-glyph material-symbols-outlined" aria-hidden="true" style={{ fontSize: t.scale.navF + 6 }}>{isDarkTheme ? "light_mode" : "dark_mode"}</span>
                    <span className="uikit-rail-label">{isDarkTheme ? "Light" : "Dark"}</span>
                  </button>
                  <Link
                    href={builderHref}
                    className="uikit-rail-btn"
                    aria-label="Open Builder"
                    title="Open Builder"
                    style={{ borderRadius: railRadius, color: t.accentFg, background: t.accent, border: "1px solid transparent", textDecoration: "none" }}
                  >
                    <span className="uikit-rail-glyph material-symbols-outlined" aria-hidden="true" style={{ fontSize: t.scale.navF + 6 }}>auto_awesome</span>
                    <span className="uikit-rail-label">Builder</span>
                  </Link>
                </div>
              </>
            );
          })()}
        </nav>

        {/* SECONDARY PANEL — slides out of the rail. Holds the EXISTING
            DS brand → theme controls → search → component tree, verbatim.
            Open/close is the store's sidebarOpen flag (driven by the rail
            section buttons + the ContentTopBar hamburger + narrow
            auto-close), so all prior wiring keeps working. */}
        {sidebarOpen && (
          <aside
            className="uikit-panel"
            aria-label="Component navigation panel"
            style={{
              width: t.scale.panelW,
              borderRight: `1px solid ${t.borderSubtle}`,
              background: panelBg,
              display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
            }}
          >
            <div style={{ flexShrink: 0, borderBottom: `1px solid ${t.borderSubtle}` }}>
              <SidebarDSBrand />
            </div>
            {/* #6 panel rhythm: even ~8px inter-section gaps + a single 24px
                left edge shared by every section (brand / controls / search /
                list) so the panel reads tidy. Vertical rhythm is conservative
                here — owner to eyeball on preview. */}
            <div style={{ padding: "16px 24px 8px", flexShrink: 0 }}>
              <ThemeControls />
            </div>
            <div ref={searchWrapRef} style={{ padding: "8px 24px 16px", flexShrink: 0 }}>
              <SidebarSearch />
            </div>
            <div style={{ padding: "8px 24px 24px", overflowY: "auto", flex: 1 }}>
              <nav aria-label="Component navigation"><ComponentList /></nav>
            </div>
          </aside>
        )}

        {/* Main - ContentTopBar (hamburger + breadcrumb) always at top */}
        <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: stageBg }}>
          <ContentTopBar />
          <div style={{ flex: 1, overflowY: "auto" }}>
            <MainContent />
          </div>
        </main>
      </div>
    </div>
  );
}
