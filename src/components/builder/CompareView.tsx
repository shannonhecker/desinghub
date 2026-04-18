"use client";

import React from "react";
import { useBuilder, type DesignSystem, type Block } from "@/store/useBuilder";
import { ComponentRenderer } from "./ComponentRenderer";

/* ══════════════════════════════════════════════════════════
   Compare DS Mode — 2x2 grid showing the same canvas in all
   four design systems simultaneously.

   Purpose: non-technical users want to see "what does our
   app look like in Salt vs Material 3 vs Fluent vs ausos?"
   without manually swapping the DS switcher four times.

   The mini canvases are read-only (pointer-events: none on
   the content) but every block comes from the live store,
   so changes made in the main editor are reflected across
   all four previews.
   ══════════════════════════════════════════════════════════ */

const SYSTEMS: { key: DesignSystem; label: string; color: string; org: string }[] = [
  { key: "salt",   label: "Salt DS",     color: "#1B7F9E", org: "J.P. Morgan" },
  { key: "m3",     label: "Material 3",  color: "#6750A4", org: "Google" },
  { key: "fluent", label: "Fluent 2",    color: "#0F6CBD", org: "Microsoft" },
  { key: "ausos",  label: "ausos DS",    color: "#7E6BC4", org: "ausos" },
];

interface CompareQuadrantProps {
  ds: DesignSystem;
  label: string;
  color: string;
  org: string;
  active: boolean;
  density: string;
  headerBlocks: Block[];
  sidebarBlocks: Block[];
  bodyBlocks: Block[];
  footerBlocks: Block[];
  onOpen: () => void;
}

function CompareQuadrant({
  ds, label, color, org, active, density,
  headerBlocks, sidebarBlocks, bodyBlocks, footerBlocks,
  onOpen,
}: CompareQuadrantProps) {
  return (
    <div className={`compare-quadrant ${active ? "is-active" : ""}`}>
      {/* Label bar — always interactive */}
      <div className="compare-quadrant-header">
        <span className="compare-quadrant-dot" style={{ background: color }} aria-hidden="true" />
        <div className="compare-quadrant-meta">
          <span className="compare-quadrant-label">{label}</span>
          <span className="compare-quadrant-org">{org}</span>
        </div>
        {active ? (
          <span className="compare-quadrant-active-badge">Editing</span>
        ) : (
          <button className="compare-quadrant-open" onClick={onOpen} aria-label={`Switch editor to ${label}`}>
            Open
            <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 14, marginLeft: 4 }}>
              arrow_forward
            </span>
          </button>
        )}
      </div>

      {/* Mini dashboard — scoped by preview-${ds} class, read-only content */}
      <div className={`compare-quadrant-body bp-dashboard preview-${ds} density-${density}`}>
        <header className="bp-header compare-mini-zone">
          {headerBlocks.map((b) => (
            <div key={b.id} className="compare-mini-block">
              <ComponentRenderer type={b.type} system={ds} blockId={b.id} {...b.props} />
            </div>
          ))}
        </header>

        <div className="bp-body">
          <nav className="bp-sidebar compare-mini-zone compare-mini-sidebar">
            {sidebarBlocks.map((b) => (
              <div key={b.id} className="compare-mini-block">
                <ComponentRenderer type={b.type} system={ds} blockId={b.id} {...b.props} />
              </div>
            ))}
          </nav>
          <main className="bp-main compare-mini-main">
            {bodyBlocks.length === 0 ? (
              <div className="compare-mini-empty">No blocks yet — start building in the editor.</div>
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
          </main>
        </div>

        <footer className="bp-footer compare-mini-zone">
          {footerBlocks.map((b) => (
            <div key={b.id} className="compare-mini-block">
              <ComponentRenderer type={b.type} system={ds} blockId={b.id} {...b.props} />
            </div>
          ))}
        </footer>
      </div>
    </div>
  );
}

export function CompareView() {
  const blocks = useBuilder((s) => s.blocks);
  const headerBlocks = useBuilder((s) => s.headerBlocks);
  const sidebarBlocks = useBuilder((s) => s.sidebarBlocks);
  const footerBlocks = useBuilder((s) => s.footerBlocks);
  const density = useBuilder((s) => s.density);
  const activeDS = useBuilder((s) => s.designSystem);
  const setDesignSystem = useBuilder((s) => s.setDesignSystem);
  const setCompareMode = useBuilder((s) => s.setCompareMode);

  const handleOpen = (ds: DesignSystem) => {
    setDesignSystem(ds);
    setCompareMode(false);
  };

  return (
    <div className="compare-view">
      <div className="compare-view-banner">
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 16, marginRight: 6 }}>
          dashboard
        </span>
        Compare mode — same canvas, four design systems.
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
            headerBlocks={headerBlocks}
            sidebarBlocks={sidebarBlocks}
            bodyBlocks={blocks}
            footerBlocks={footerBlocks}
            onOpen={() => handleOpen(s.key)}
          />
        ))}
      </div>
    </div>
  );
}
