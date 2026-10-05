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
import { builderHrefFor, isDarkActive, toggleActiveMode } from "./ui-kit/kitHandoff";
import { kitPrimitives } from "./ui-kit/kitChrome";
import { kitHref, switchHref, type KitPlace } from "./ui-kit/kitEquivalence";
import { getComponents, getFont } from "@/data/registry";
import { CarbonKitScope } from "./ui-kit/CarbonScopeStyles";
import "./ui-kit/kit-chrome.css";

/**
 * @deprecated Use `useTheme()` from `@/contexts/ThemeContext` instead.
 * Kept for backward compatibility with CodePanel and ComponentPreview.
 */
export function useActiveTheme(): ActiveTheme {
  return useTheme();
}

/* How long a system switch holds the scroll position while the new page
   settles: at least FIRST, then QUIET after each further change in the page's
   height, and for as long as the page is still too short to reach the
   position, never past LIMIT. Any input from the visitor ends it at once. */
const HOLD_FIRST_MS = 1500;
const HOLD_QUIET_MS = 1500;
const HOLD_LIMIT_MS = 8000;

/* ── MAIN APP - fully themed by active DS ── */
export function DesignHubApp({ held = false }: {
  /** True on the route that serves a link to a place (/ui-kit?c=...): the
      main column waits for the place from the URL, so the overview is never
      drawn first. The plain /ui-kit route passes nothing and its overview is
      in the server HTML. */
  held?: boolean;
} = {}) {
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

  /* Open the panel to a section — or CLOSE it if that section is already open.
     The rail button is now the open AND close affordance (the redundant
     ContentTopBar hamburger was removed), with a panel-header chevron as a
     second close path. */
  const openPanel = React.useCallback((section: PanelSection) => {
    if (store.sidebarOpen && panelSection === section) {
      store.toggleSidebar();
      return;
    }
    setPanelSection(section);
    if (!store.sidebarOpen) store.toggleSidebar();
  }, [store, panelSection]);

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
  /* ── The URL is the place ──
     ?ds=&c=&tab= (and &q=&show= on the overview, &from= on the "not in this
     system" state) is written as the visitor moves, so a reload or a shared
     link lands on the same entry and tab. Opening an entry or switching
     system adds a history step (back and forward work); mode, density, tab,
     search and filter replace the current one and never navigate. */
  /* False until the place in the URL has been applied to the store. The URL
     writer below waits for it (it must never write the pre-URL state back
     over the address), and the held route waits for it before drawing. */
  const [urlReady, setUrlReady] = React.useState(false);
  const applyPlaceFromUrl = React.useCallback(() => {
    const SYS = ["salt", "m3", "fluent", "carbon", "uoaui"];
    const params = new URLSearchParams(window.location.search);
    const st = useDesignHub.getState();
    const urlDs = params.get("ds") as SystemId | null;
    const ds = urlDs && SYS.includes(urlDs) ? urlDs : st.activeSystem;
    if (ds !== st.activeSystem) st.setActiveSystem(ds);
    const c = params.get("c");
    const from = params.get("from") as SystemId | null;
    const tab = params.get("tab");
    const has = (sys: SystemId, id: string) => id === "builder-blocks" || getComponents(sys).some((x) => x.id === id);
    if (c && from && from !== ds && SYS.includes(from) && has(from, c)) {
      useDesignHub.setState({ selectedComponent: null, missing: { from, id: c } });
    } else if (c && has(ds, c)) {
      useDesignHub.setState({ selectedComponent: c, missing: null });
    } else {
      useDesignHub.setState({ selectedComponent: null, missing: null });
    }
    if (tab) useDesignHub.setState({ activeTab: tab as ReturnType<typeof useDesignHub.getState>["activeTab"] });
    else if (c) useDesignHub.setState({ activeTab: "overview" });
    useDesignHub.setState({ searchQuery: params.get("q") ?? "", overviewFilter: params.get("show") ?? "all" });
  }, []);

  /* Layout effect: the place from the URL is applied before the first
     paint. A link to a place is served by the held route (see `held`), whose
     main column stays empty until this has run, so a deep link never draws
     the overview. The plain route renders its overview at once, on the
     server too. */
  React.useLayoutEffect(() => {
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
    applyPlaceFromUrl();
    setUrlReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const onPop = () => applyPlaceFromUrl();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [applyPlaceFromUrl]);

  const place: KitPlace = {
    ds: activeSystem,
    c: store.missing ? store.missing.id : store.selectedComponent,
    from: store.missing ? store.missing.from : null,
    tab: store.activeTab === "preview" ? "overview" : store.activeTab,
    q: store.searchQuery,
    show: store.overviewFilter,
  };
  const href = kitHref(place);
  const lastNav = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!urlReady) return;
    const navKey = `${place.ds}|${place.c ?? ""}`;
    if (window.location.pathname + window.location.search === href) { lastNav.current = navKey; return; }
    /* A new entry or system is a history step; everything else restyles or
       refines in place. */
    if (lastNav.current !== null && lastNav.current !== navKey) window.history.pushState(null, "", href);
    else window.history.replaceState(null, "", href);
    lastNav.current = navKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [href, urlReady]);


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
  /* Opening an entry (or going back to the overview) starts at the top.
     The catalogue and the detail page share one scroller, so without this a
     card picked far down the overview opened its page already scrolled. */
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const selectedComponent = store.selectedComponent;
  const lastTop = React.useRef(0);
  const hold = React.useRef<{ top: number; until: number; cap: number; height: number } | null>(null);
  /* While a system switch settles, keep putting the scroller back where it
     was: the new page's demos, panels and code mount over a few frames, and
     each one can briefly make the page shorter (which clamps the scroll) or
     taller. A frame loop is simpler and surer than observing every element.
     The visitor always wins: the hold lets go on a wheel, a touch, any key,
     a press anywhere in the scroller (its scrollbar included), on a scroll
     past the held position, and on a tab change. */
  React.useEffect(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    let raf = 0;
    const wanted = (h: { top: number }) => Math.min(h.top, Math.max(0, sc.scrollHeight - sc.clientHeight));
    const tick = () => {
      const h = hold.current;
      if (!h) return;
      const now = Date.now();
      /* Still settling: every change in the page's height (a panel's
         stylesheet arriving, a demo mounting) keeps the hold a little
         longer, up to a hard limit. A page that has stopped changing is
         let go. */
      if (sc.scrollHeight !== h.height) { h.height = sc.scrollHeight; h.until = Math.min(h.cap, Math.max(h.until, now + HOLD_QUIET_MS)); }
      /* A page still shorter than the remembered position has not finished
         arriving: its code and demos load on demand, and on a slow connection
         (or a busy machine) that takes longer than the quiet window. Letting
         go then left the visitor at the top of a page that grew under them a
         moment later. So a quiet page is only let go once the position can be
         reached; a page that really is shorter is let go at the hard limit.
         Holding longer costs nothing: any input still ends the hold at once. */
      const reachable = sc.scrollHeight - sc.clientHeight >= h.top - 1;
      if (now > h.cap || (now > h.until && reachable)) { hold.current = null; return; }
      const st = useDesignHub.getState();
      if (st.selectedComponent !== null || st.missing) {
        const want = wanted(h);
        if (Math.abs(sc.scrollTop - want) > 1) sc.scrollTop = want;
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); };
    holdStart.current = start;
    const release = () => { hold.current = null; };
    /* A scroll past the held position can only be the visitor's (the hold
       never sets a larger value and a shorter page only clamps downward),
       whatever produced it: find-in-page, an anchor, a scroll from script. */
    const onAnyScroll = () => {
      const h = hold.current;
      if (h && sc.scrollTop > h.top + 1) hold.current = null;
    };
    sc.addEventListener("wheel", release, { passive: true });
    sc.addEventListener("touchstart", release, { passive: true });
    sc.addEventListener("pointerdown", release, { passive: true });
    /* Any key, wherever focus is: Tab from the rail moves focus into the
       page and the browser scrolls to it; that must not be pulled back. */
    window.addEventListener("keydown", release);
    sc.addEventListener("scroll", onAnyScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      sc.removeEventListener("wheel", release); sc.removeEventListener("touchstart", release);
      sc.removeEventListener("pointerdown", release); window.removeEventListener("keydown", release);
      sc.removeEventListener("scroll", onAnyScroll);
    };
  }, []);
  /* A tab change is the visitor moving on: stop holding the old position. */
  const activeTab = store.activeTab;
  /* Only a tab change on its own: when the tab moves together with the
     system (the store restores it on the way back from a not-here page),
     that is the switch itself and the hold it has just set must stand. */
  const tabSystem = React.useRef(activeSystem);
  React.useEffect(() => {
    if (tabSystem.current === activeSystem) hold.current = null;
    tabSystem.current = activeSystem;
  }, [activeTab, activeSystem]);
  const holdStart = React.useRef<() => void>(() => {});
  const prevPlace = React.useRef({ system: activeSystem, entry: selectedComponent });
  React.useLayoutEffect(() => {
    const before = prevPlace.current;
    prevPlace.current = { system: activeSystem, entry: selectedComponent };
    /* A system switch keeps the scroll position: the page is the same page
       in another system (owner rule: no jumping). Only opening a different
       entry, or going back to the overview, starts at the top. */
    if (before.system !== activeSystem) {
      /* Hold the position while the new system's page settles. Code and
         demos arrive a moment later; until they do the page can be briefly
         shorter, which would clamp the scroll and read as a jump. The
         overview keeps its place by section instead (below). */
      const st = useDesignHub.getState();
      const now = Date.now();
      hold.current = st.selectedComponent || st.missing
        ? { top: lastTop.current, until: now + HOLD_FIRST_MS, cap: now + HOLD_LIMIT_MS, height: -1 }
        : null;
      if (hold.current) holdStart.current();
      return;
    }
    if (before.entry === selectedComponent) return;
    hold.current = null;
    scrollerRef.current?.scrollTo?.({ top: 0 });
    /* On phones the panel is a sheet over the content: picking an entry
       from it should reveal that entry. */
    if (window.matchMedia?.("(max-width: 768px)").matches && useDesignHub.getState().sidebarOpen) {
      useDesignHub.getState().toggleSidebar();
    }
  }, [selectedComponent, activeSystem]);

  /* Overview: a system switch keeps the section the visitor was reading.
     The section at the top of the scroller is remembered while scrolling and
     put back at the same offset once the new system's wall has rendered. */
  const overviewAnchor = React.useRef<{ section: string; offset: number } | null>(null);
  const onScroll = React.useCallback(() => {
    const sc = scrollerRef.current;
    if (!sc) return;
    /* A scroll past the held position is the visitor's: let go here, before
       the position is read, so where they went is what is remembered. */
    if (hold.current && sc.scrollTop > hold.current.top + 1) hold.current = null;
    /* While a switch is settling, a clamp is not the visitor scrolling. */
    /* A page that fits the viewport carries no position (it cannot scroll),
       so passing through one, such as the not-here state, does not forget
       where the visitor was on the pages that do. */
    if ((!hold.current || Date.now() > hold.current.cap) && sc.scrollHeight > sc.clientHeight + 4) lastTop.current = sc.scrollTop;
    if (useDesignHub.getState().selectedComponent) return;
    const top = sc.getBoundingClientRect().top;
    let found: { section: string; offset: number } | null = null;
    sc.querySelectorAll<HTMLElement>("[data-section]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top - top <= 80 && r.bottom - top > 80) found = { section: el.dataset.section!, offset: r.top - top };
    });
    overviewAnchor.current = found;
  }, []);
  React.useLayoutEffect(() => {
    const sc = scrollerRef.current;
    const a = overviewAnchor.current;
    if (!sc || !a || selectedComponent) return;
    const el = sc.querySelector<HTMLElement>(`[data-section="${a.section}"]`);
    if (el) sc.scrollTop += el.getBoundingClientRect().top - sc.getBoundingClientRect().top - a.offset;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSystem]);

  /* Entering the phone layout closes the side panel so it does not cover
     the catalogue. Keyed on the breakpoint alone: it used to watch the open
     flag too, which swallowed the first tap on Components / Search / Theme. */
  React.useEffect(() => {
    if (isNarrow && useDesignHub.getState().sidebarOpen) useDesignHub.getState().toggleSidebar();
  }, [isNarrow]);

  // Detect dark theme for logo color - logo is black SVG, invert to white in dark mode
  const isDarkTheme = isDarkActive(store);
  const logoFilter = isDarkTheme ? "brightness(0) invert(1)" : "brightness(0)";

  /* Carbon keeps its flat IBM aesthetic in the rail (radius 0). The brand
     logo stays black on light surfaces and inverts to white on dark/Carbon. */
  const isCarbon = activeSystem === "carbon";
  /* The mark follows the mode on every system. Carbon used to force the
     white mark, which vanished on its light rail (white and g10 themes). */
  const resolvedLogoFilter = logoFilter;

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
  const toggleMode = toggleActiveMode;
  const builderHref = builderHrefFor(store);

  return (
    <CarbonKitScope>
    <div className="uikit-shell" data-system={activeSystem} style={{ ...kitPrimitives(t, isDarkTheme), display: "flex", flexDirection: "column", height: "100dvh",
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

      <div className="uikit-shell-body" style={{ display: "flex", flex: 1, overflow: "hidden" }}>
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
            /* Subtle hover fill for the now-borderless rail buttons. */
            ["--dh-rail-hover" as string]: t.bg2,
            /* Read by the phone layout, where the rail splits into a top
               and a bottom bar that each need the fill and the edge. */
            ["--dh-rail-bg" as string]: railBg === "transparent" ? t.bg : railBg,
            ["--dh-rail-edge" as string]: t.borderSubtle,
            borderRight: `1px solid ${t.borderSubtle}`,
            background: railBg,
            transition: "background 200ms",
          }}
        >
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
            /* Borderless (owner): no box. Inactive buttons carry only a colour;
               the transparent fill + hover tint come from CSS (.uikit-rail-btn
               + --dh-rail-hover) since an inline bg would block the CSS :hover. */
            const sectionBtn = { color: t.fg2 };
            return (
              <>
                <div className="uikit-rail-top">
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

                <div className="uikit-rail-group" role="group" aria-label="Switch design system">
                  {DS_LIST.map(ds => {
                    const info = getSystemInfo(ds.id);
                    const isActive = activeSystem === ds.id;
                    return (
/* A real link to the same place in that system, so
                         middle-click, copy-link and screen readers get the
                         true target. A plain click switches in place. */
                      <a
                        key={ds.id}
                        href={switchHref(place, ds.id)}
                        className="uikit-rail-btn uikit-rail-ds"
                        aria-label={ds.label}
                        aria-current={isActive ? "true" : undefined}
                        title={ds.label}
                        onClick={(e) => {
                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                          e.preventDefault();
                          store.setActiveSystem(ds.id);
                        }}
                        style={{ borderRadius: railRadius, color: isActive ? t.fg : t.fg2, textDecoration: "none" }}
                      >
                        {/* "Aa" set in that system's own typeface and accent. */}
                        <span className="uikit-rail-aa" aria-hidden="true" style={{ fontFamily: getFont(ds.id), color: isActive ? t.fg : t.fg2, boxShadow: isActive ? `inset 0 -2px 0 ${t.accent}` : undefined }}>Aa</span>
                        <span className="uikit-rail-label" style={{ fontFamily: t.font }}>{ds.short}</span>
                      </a>
                    );
                  })}
                </div>

                </div>
                <div className="uikit-rail-divider" style={{ background: t.borderSubtle }} aria-hidden="true" />
                <div className="uikit-rail-rest">

                {/* Overview button removed (owner) — the brand mark at the rail
                    head already returns to the overview/landing. */}
                <div className="uikit-rail-group" role="group" aria-label="Sections">
                  <button
                    type="button"
                    className="uikit-rail-btn"
                    aria-label="Browse components"
                    aria-pressed={sidebarOpen && panelSection === "components"}
                    title="Browse components"
                    onClick={() => openPanel("components")}
                    style={{ borderRadius: railRadius, ...sectionBtn }}
                  >
                    <span className="uikit-rail-glyph material-symbols-outlined" aria-hidden="true" style={{ fontSize: t.scale.navF + 6 }}>widgets</span>
                    <span className="uikit-rail-label">Browse</span>
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
                    className="uikit-rail-btn uikit-rail-builder"
                    aria-label="Open Builder"
                    title="Open Builder"
                    /* Owner: the Builder action reads the SAME across all 5 DS
                       (not DS-tinted) — pin it to the uoaui purple AI gradient. */
                    style={{ borderRadius: railRadius, color: "#ffffff", background: "var(--dh-builder-grad, linear-gradient(135deg, #9D71D2, #7343B0))", border: "none", textDecoration: "none" }}
                  >
                    <span className="uikit-rail-glyph material-symbols-outlined" aria-hidden="true" style={{ fontSize: t.scale.navF + 6 }}>auto_awesome</span>
                    <span className="uikit-rail-label">Builder</span>
                  </Link>
                </div>
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
              ["--dh-panel-solid" as string]: t.bg,
              borderRight: `1px solid ${t.borderSubtle}`,
              background: panelBg,
              display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0,
            }}
          >
            {/* Panel header: a top-left close chevron (owner) + the DS brand.
                Closing the panel also lives on the rail section button (toggle). */}
            <div style={{ flexShrink: 0, borderBottom: `1px solid ${t.borderSubtle}`, display: "flex", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => store.toggleSidebar()}
                aria-label="Close panel"
                title="Close panel"
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "none", border: "none", cursor: "pointer", color: t.fg2,
                  padding: "12px 4px 12px 16px", borderRadius: 6,
                  ["--dh-focus-ring" as string]: t.focusRing,
                }}
              >
                <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: t.scale.navF + 4, lineHeight: 1 }}>chevron_left</span>
              </button>
              <div style={{ flex: 1, minWidth: 0, marginLeft: -12 }}>
                <SidebarDSBrand />
              </div>
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

        {/* Main - ContentTopBar (breadcrumb only; the panel toggle moved to the
            rail section buttons + the panel-header close chevron). */}
        <main id="main-content" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: stageBg }}>
          <ContentTopBar />
          <div ref={scrollerRef} onScroll={onScroll} data-testid="kit-scroller" style={{ flex: 1, overflowY: "auto", overflowAnchor: "none" }}>
            {urlReady || !held ? <MainContent /> : null}
          </div>
        </main>
      </div>
    </div>
    </CarbonKitScope>
  );
}
