"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, SlidersHorizontal } from "lucide-react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { ComponentRenderer } from "./ComponentRenderer";
import { usePreviewReadOnly } from "./previewReadOnly";
import { PanelConfigDrawer } from "./PanelConfigDrawer";
import { SimulatedDataGrid } from "./SimulatedDataGrid";
import type { GridColumn, GridRow } from "@/lib/dataGridModel";
import {
  PANEL_HEADER_HEIGHT,
  PANEL_PADDING,
  PANEL_VIEW_BY_WIDTH,
  panelContentHeight,
} from "@/lib/panelMetrics";

/* ══════════════════════════════════════════════════════════
   PanelFrame - the card a chart or a data grid sits in.

   A header row (title, subtitle on the same baseline, an optional
   "View by" select, and the panel tools) over a body. Its height
   is fixed by the block, and its measurements are the same in
   every design system (panelMetrics.ts), so a template's panels
   land on the same pixels whichever system is active. Colour,
   type, radius and the select itself come from the active system:
   --ds-* tokens and the system's own Dropdown.

   Panel tools (data-bound panels only):
   - Expand: the panel takes over the canvas body, with the data
     behind a chart shown as a table beneath it.
   - Configure: expands and opens the configuration drawer (chart
     or grid, rows, pivot columns, values).
   ══════════════════════════════════════════════════════════ */

interface PanelFrameProps {
  system: DesignSystem;
  /** Block id: enables the panel tools and keys the "View by" state. */
  blockId?: string;
  title: string;
  subtitle?: string;
  /** "View by" choices; the first is shown as chosen. Empty hides the select. */
  viewBy?: string[];
  /** Report-state key the select reads and writes, so the panel's data can
   *  follow the choice. Without it the select is display-only. */
  viewByState?: string;
  /** Overall height in px. */
  height: number;
  /** The panel's content at a given height (the frame decides the height:
   *  in place, and again when expanded). */
  children: (contentHeight: number) => React.ReactNode;
  /** The data behind a chart, shown as a table when the panel is expanded. */
  table?: { columns: GridColumn[]; rows: GridRow[] } | null;
  /** True when the panel is data-bound and can be expanded / configured. */
  tools?: boolean;
}

/** Share of the expanded panel a chart takes; its data table gets the rest. */
const EXPANDED_CHART_SHARE = 0.56;
const EXPANDED_GAP = 12;

export function PanelFrame({ system, blockId, title, subtitle, viewBy, viewByState, height, children, table, tools }: PanelFrameProps) {
  const hasViewBy = Boolean(viewBy && viewBy.length > 0);
  /* While presenting, using the "View by" select or a panel tool must not
     also select the block for the amend composer. */
  const readOnly = usePreviewReadOnly();
  const stop = readOnly ? (e: React.MouseEvent) => e.stopPropagation() : undefined;
  const expandedPanel = useBuilder((s) => s.expandedPanel);
  const setExpandedPanel = useBuilder((s) => s.setExpandedPanel);
  const expanded = Boolean(blockId && expandedPanel?.id === blockId);
  const configOpen = expanded && Boolean(expandedPanel?.config);
  const showTools = Boolean(tools && blockId);

  /* Expanded: the panel is portalled into the canvas body (.bp-main), whose
     other content is hidden by a class. */
  const anchorRef = useRef<HTMLElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [hostHeight, setHostHeight] = useState(0);
  useEffect(() => {
    if (!expanded) return;
    const main = anchorRef.current?.closest<HTMLElement>(".bp-main");
    if (!main) return;
    const slot = document.createElement("div");
    slot.className = "dh-expand";
    main.appendChild(slot);
    main.classList.add("dh-expanded");
    main.scrollTop = 0;
    setHost(slot);
    const measure = () => setHostHeight(slot.clientHeight);
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(slot);
    return () => {
      ro?.disconnect();
      main.classList.remove("dh-expanded");
      slot.remove();
      setHost(null);
    };
  }, [expanded]);

  /* Escape collapses. */
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setExpandedPanel(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [expanded, setExpandedPanel]);

  const vars = (h: number | string) =>
    ({
      "--dh-panel-h": typeof h === "number" ? `${h}px` : h,
      "--dh-panel-header-h": `${PANEL_HEADER_HEIGHT}px`,
      "--dh-panel-pad": `${PANEL_PADDING}px`,
      "--dh-panel-viewby-w": `${PANEL_VIEW_BY_WIDTH}px`,
    }) as React.CSSProperties;

  const header = (
    <header className="dh-panel-header">
      <div className="dh-panel-heading">
        <h3 className="dh-panel-title">{title}</h3>
        {subtitle ? <span className="dh-panel-subtitle">{subtitle}</span> : null}
      </div>
      {hasViewBy ? (
        <div className="dh-panel-viewby" onClick={stop}>
          {/* The system's own Dropdown, fed the same props a Dropdown block takes. */}
          <ComponentRenderer
            type="SimulatedDropdown"
            system={system}
            {...{ value: viewBy![0], options: viewBy, placeholder: "View by", stateKey: viewByState, compact: true }}
          />
        </div>
      ) : null}
      {showTools ? (
        <div className="dh-panel-tools" onClick={stop}>
          <button
            type="button"
            className={`dh-panel-tool${configOpen ? " is-active" : ""}`}
            aria-label={`Configure ${title || "panel"}`}
            aria-pressed={configOpen}
            title="Configure"
            onClick={() => setExpandedPanel(configOpen ? { id: blockId!, config: false } : { id: blockId!, config: true })}
          >
            <SlidersHorizontal size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="dh-panel-tool"
            aria-label={expanded ? `Collapse ${title || "panel"}` : `Expand ${title || "panel"}`}
            title={expanded ? "Collapse (Esc)" : "Expand"}
            onClick={() => setExpandedPanel(expanded ? null : { id: blockId!, config: false })}
          >
            {expanded ? <Minimize2 size={15} strokeWidth={1.8} aria-hidden="true" /> : <Maximize2 size={15} strokeWidth={1.8} aria-hidden="true" />}
          </button>
        </div>
      ) : null}
    </header>
  );

  if (!expanded) {
    return (
      <section ref={anchorRef} className="dh-panel" style={vars(height)} aria-label={title || undefined}>
        {header}
        <div className="dh-panel-body">{children(panelContentHeight(height))}</div>
      </section>
    );
  }

  /* Expanded. In place, an empty frame keeps the panel's slot in the layout
     (the body is hidden while expanded, but the grid must not re-flow). */
  const avail = Math.max(0, hostHeight - PANEL_HEADER_HEIGHT - PANEL_PADDING);
  const chartHeight = table ? Math.round((avail - EXPANDED_GAP) * EXPANDED_CHART_SHARE) : avail;
  const tableHeight = table ? avail - EXPANDED_GAP - chartHeight : 0;
  return (
    <>
      <section ref={anchorRef} className="dh-panel" style={vars(height)} aria-hidden="true" />
      {host &&
        createPortal(
          /* A portal still bubbles React events to the block that owns it.
             Everything in the expanded view is the panel's own interaction,
             so no click here may select (or pin) that block. */
          <div className="dh-expand-inner" onClick={(e) => e.stopPropagation()}>
            <section className="dh-panel dh-panel-expanded" style={vars("100%")} aria-label={title || undefined}>
              {header}
              <div className="dh-panel-body">
                {hostHeight > 0 ? (
                  <>
                    {children(chartHeight)}
                    {table ? (
                      <div className="dh-panel-table" style={{ marginTop: EXPANDED_GAP }}>
                        <SimulatedDataGrid columns={table.columns} rows={table.rows} height={tableHeight} label={`${title} data`} />
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            </section>
            {configOpen ? <PanelConfigDrawer system={system} blockId={blockId!} /> : null}
          </div>,
          host,
        )}
    </>
  );
}
