"use client";

import React, { useCallback } from "react";
import { useBuilder, type DesignSystem, type Block } from "@/store/useBuilder";
import { ComponentRenderer } from "./ComponentRenderer";
import { PreviewReadOnlyContext } from "./previewReadOnly";
import { getPreviewOfficialScope } from "@/lib/officialTokens";
import type { SystemId } from "@/store/useDesignHub";

/* ══════════════════════════════════════════════════════════
   Compare DS Mode - grid showing the same canvas in all five
   design systems simultaneously.

   Purpose: non-technical users want to see "what does our
   app look like in Salt vs Material 3 vs Fluent vs uoaui vs
   IBM Carbon?" without manually swapping the DS switcher five
   times.

   The mini canvases are read-only but every block comes from
   the live store, so changes made in the main editor are
   reflected across all five previews.

   Fidelity: each quadrant renders exactly what Preview / Present
   render for that DS. It provides PreviewReadOnlyContext (so
   ComponentRenderer takes the REAL component path for registry-
   covered blocks) and carries getPreviewOfficialScope's class +
   attrs (so the official --salt-* / --cds-* token values resolve).
   Before this the flagship cross-DS screen showed five facsimiles
   without official tokens — the least faithful view in the app.
   ══════════════════════════════════════════════════════════ */

/* Default theme key per DS for a mode (mirrors the store's setDesignSystem
   map). The ACTIVE DS keeps the store's live themeKey; the other four are
   rendered at their mode default, exactly as switching to them would. */
const DEFAULT_THEME_KEY: Record<DesignSystem, { light: string; dark: string }> = {
  salt:   { light: "jpm-light", dark: "jpm-dark" },
  m3:     { light: "light",     dark: "dark" },
  fluent: { light: "light",     dark: "dark" },
  uoaui:  { light: "light",     dark: "dark" },
  carbon: { light: "white",     dark: "g100" },
};

const SYSTEMS: { key: DesignSystem; label: string; color: string; org: string }[] = [
  { key: "salt",   label: "Salt DS",     color: "#1B7F9E", org: "J.P. Morgan" },
  { key: "m3",     label: "Material 3",  color: "#6750A4", org: "Google" },
  { key: "fluent", label: "Fluent 2",    color: "#0F6CBD", org: "Microsoft" },
  { key: "uoaui",  label: "uoaui DS",    color: "#8A58C9", org: "uoaui" },
  { key: "carbon", label: "IBM Carbon",  color: "#0F62FE", org: "IBM" },
];

interface CompareQuadrantProps {
  ds: DesignSystem;
  label: string;
  color: string;
  org: string;
  active: boolean;
  density: string;
  mode: "light" | "dark";
  themeKey: string;
  headerBlocks: Block[];
  sidebarBlocks: Block[];
  bodyBlocks: Block[];
  footerBlocks: Block[];
  /* P2 Frames: a removed peripheral frame (visible === false) is dropped from
     every compare quadrant too, so compare mode matches the canvas + export. */
  headerVisible: boolean;
  sidebarVisible: boolean;
  footerVisible: boolean;
  /* Stable store-bound handler; the quadrant binds its own `ds` so the
     parent never has to create a per-quadrant arrow (which defeated memo). */
  onOpen: (ds: DesignSystem) => void;
}

const CompareQuadrant = React.memo(function CompareQuadrant({
  ds, label, color, org, active, density, mode, themeKey,
  headerBlocks, sidebarBlocks, bodyBlocks, footerBlocks,
  headerVisible, sidebarVisible, footerVisible,
  onOpen,
}: CompareQuadrantProps) {
  /* Same wiring PreviewPanel applies to the main canvas: the extra class +
     data attrs under which the OFFICIAL token values are defined. */
  const officialScope = getPreviewOfficialScope(ds as SystemId, mode, themeKey, density);
  return (
    /* One labelled region per DS. The quadrant's zones are plain divs: five
       nested <main>/<header>/<nav>/<footer> would be five duplicate landmark
       sets on one page (the page's own <main> is the builder canvas). */
    <section className={`compare-quadrant ${active ? "is-active" : ""}`} aria-label={`${label} preview`}>
      {/* Label bar - always interactive */}
      <div className="compare-quadrant-header">
        <span className="compare-quadrant-dot" style={{ background: color }} aria-hidden="true" />
        <div className="compare-quadrant-meta">
          <span className="compare-quadrant-label">{label}</span>
          <span className="compare-quadrant-org">{org}</span>
        </div>
        {active ? (
          <span className="compare-quadrant-active-badge">Editing</span>
        ) : (
          <button className="compare-quadrant-open" onClick={() => onOpen(ds)} aria-label={`Switch editor to ${label}`}>
            Open
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14, marginLeft: 4 }}>
              arrow_forward
            </span>
          </button>
        )}
      </div>

      {/* Mini dashboard - scoped by preview-${ds} (+ the official-token scope),
          read-only so registry-covered blocks render as REAL DS components. */}
      <PreviewReadOnlyContext.Provider value={true}>
      <div
        className={`compare-quadrant-body bp-dashboard preview-${ds} density-${density}${officialScope.className ? ` ${officialScope.className}` : ""}`}
        {...officialScope.attrs}
      >
        {headerVisible && (
          <div className="bp-header compare-mini-zone">
            {headerBlocks.map((b) => (
              <div key={b.id} className="compare-mini-block">
                <ComponentRenderer type={b.type} system={ds} blockId={b.id} {...b.props} />
              </div>
            ))}
          </div>
        )}

        <div className="bp-body">
          {sidebarVisible && (
            <div className="bp-sidebar compare-mini-zone compare-mini-sidebar">
              {sidebarBlocks.map((b) => (
                <div key={b.id} className="compare-mini-block">
                  <ComponentRenderer type={b.type} system={ds} blockId={b.id} {...b.props} />
                </div>
              ))}
            </div>
          )}
          <div className="bp-main compare-mini-main">
            {bodyBlocks.length === 0 ? (
              <div className="compare-mini-empty">No blocks yet - start building in the editor.</div>
            ) : (
              <div className="compare-mini-grid">
                {bodyBlocks.map((b) => {
                  const colSpan = Math.max(
                    1,
                    Math.min(3, (b.props.colSpan as number | undefined) ?? 3),
                  );
                  return (
                    <div
                      key={b.id}
                      className="compare-mini-block"
                      style={{ gridColumn: `span ${colSpan}` }}
                    >
                      <ComponentRenderer type={b.type} system={ds} blockId={b.id} {...b.props} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {footerVisible && (
          <div className="bp-footer compare-mini-zone">
            {footerBlocks.map((b) => (
              <div key={b.id} className="compare-mini-block">
                <ComponentRenderer type={b.type} system={ds} blockId={b.id} {...b.props} />
              </div>
            ))}
          </div>
        )}
      </div>
      </PreviewReadOnlyContext.Provider>
    </section>
  );
});

export function CompareView() {
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  /* P2 Frames: per-zone visibility (undefined defaults to shown). */
  const headerVisible = useBuilder((s) => s.zoneLayouts.header.visible !== false);
  const sidebarVisible = useBuilder((s) => s.zoneLayouts.sidebar.visible !== false);
  const footerVisible = useBuilder((s) => s.zoneLayouts.footer.visible !== false);
  const density = useBuilder((s) => s.density);
  const mode = useBuilder((s) => (s.mode === "light" ? "light" : "dark"));
  const activeThemeKey = useBuilder((s) => s.themeKey);
  const activeDS = useBuilder((s) => s.designSystem);
  const setDesignSystem = useBuilder((s) => s.setDesignSystem);
  const setCompareMode = useBuilder((s) => s.setCompareMode);

  /* useCallback so each CompareQuadrant's `onOpen` prop is stable
     across renders. Without it, the inline arrow at the call site
     produced a new function reference per CompareView render —
     defeating React.memo on CompareQuadrant entirely and causing
     all five quadrants to re-render on any unrelated store change. */
  const handleOpen = useCallback((ds: DesignSystem) => {
    setDesignSystem(ds);
    setCompareMode(false);
  }, [setDesignSystem, setCompareMode]);

  return (
    <div className="compare-view">
      <div className="compare-view-banner">
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, marginRight: 6 }}>
          dashboard
        </span>
        Compare mode - same canvas, five design systems.
        Click <strong>Open</strong> on any quadrant to keep building in that DS, or
        press the <kbd>Compare</kbd> toolbar button again to return to a single view.
      </div>
      <div className="compare-grid">
        {SYSTEMS.map((s) => (
          <CompareQuadrant
            key={s.key}
            ds={s.key}
            label={s.label}
            color={s.color}
            org={s.org}
            active={activeDS === s.key}
            density={density}
            mode={mode}
            themeKey={activeDS === s.key ? activeThemeKey : DEFAULT_THEME_KEY[s.key][mode]}
            headerBlocks={headerBlocks}
            sidebarBlocks={sidebarBlocks}
            bodyBlocks={blocks}
            footerBlocks={footerBlocks}
            headerVisible={headerVisible}
            sidebarVisible={sidebarVisible}
            footerVisible={footerVisible}
            onOpen={handleOpen}
          />
        ))}
      </div>
    </div>
  );
}
