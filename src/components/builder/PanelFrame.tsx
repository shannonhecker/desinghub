"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, Minimize2, SlidersHorizontal } from "lucide-react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { ComponentRenderer } from "./ComponentRenderer";
import { usePreviewReadOnly } from "./previewReadOnly";
import { PanelConfigDialog } from "./PanelConfigDialog";
import { overlayIsOpen } from "@/lib/overlayEscape";
import { LazyDataGrid as SimulatedDataGrid } from "./lazyBlocks";
import type { GridColumn, GridRow } from "@/lib/dataGridModel";
import {
  PANEL_HEADER_HEIGHT,
  PANEL_PADDING,
  PANEL_STACK_ROW, PANEL_STACK_WIDTH, PANEL_VIEW_BY_WIDTH,
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
   - Configure: expands and opens the Configuration dialog (chart
     or grid, columns and their aggregation, row and column groups,
     shares, top N), in the active system's own components.
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
  /** A colour for the panel's leading edge (one of two things compared). */
  accent?: string;
}

/** Share of the expanded panel a chart takes; its data table gets the rest. */
const EXPANDED_CHART_SHARE = 0.46;
const EXPANDED_GAP = 12;

export function PanelFrame({ system, blockId, title, subtitle, viewBy, viewByState, height, children, table, tools, accent }: PanelFrameProps) {
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
  const expandedRef = useRef<HTMLDivElement>(null);
  const restoreTool = useRef<"configure" | "expand">("expand");
  /* The Configure button, where the Configuration dialog hands focus back. */
  const configureRef = useRef<HTMLButtonElement>(null);
  const wasExpanded = useRef(false);
  /* A narrow panel cannot hold its title, the select and the tools on one
     line: the select and the tools drop to a second line, and the content
     gives up that line's height (the panel's own height is pinned). */
  const [stacked, setStacked] = useState(false);
  const canStack = hasViewBy && showTools && !expanded;
  useEffect(() => {
    const el = anchorRef.current;
    if (!el || !canStack || typeof ResizeObserver === "undefined") { setStacked(false); return; }
    const ro = new ResizeObserver(([entry]) => setStacked(entry.contentRect.width > 0 && entry.contentRect.width < PANEL_STACK_WIDTH));
    ro.observe(el);
    return () => ro.disconnect();
  }, [canStack]);
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

  // The opener is re-rendered on collapse, so restore by tool identity rather
  // than retaining a detached DOM node. Focus the expanded region after its
  // portal exists; Tab then enters its controls normally.
  useEffect(() => {
    if (expanded && host) expandedRef.current?.focus();
    if (!expanded && wasExpanded.current) {
      anchorRef.current?.querySelector<HTMLElement>(`[data-tool="${restoreTool.current}"]`)?.focus();
    }
    wasExpanded.current = expanded;
  }, [expanded, host]);

  /* Escape collapses. */
  useEffect(() => {
    if (!expanded) return;
    /* Escape collapses the panel and nothing else: it is taken before the
       builder's own Escape (which would leave Present). An open menu keeps
       its Escape. */
    let backwards = false;
    const menuOpen = () => Boolean(document.querySelector('[aria-haspopup][aria-expanded="true"], [role="combobox"][aria-expanded="true"]'));
    const focusableItems = () => [...(expandedRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"], .ag-cell') ?? [])]
      .filter(el => {
        if (!el.getClientRects().length || el.getAttribute("aria-hidden") === "true" || el.classList.contains("ag-tab-guard")) return false;
        const grid = el.closest(".dh-grid");
        if (!grid) return true;
        if (!el.classList.contains("ag-cell")) return false;
        return el === (grid.querySelector(".ag-cell:focus") ?? grid.querySelector(".ag-cell"));
      });
    const focusBoundary = (last: boolean) => {
      const items = focusableItems();
      (last ? items.at(-1) : items[0])?.focus();
    };
    const onFocus = (e: FocusEvent) => {
      /* The Configuration dialog (portalled) keeps focus itself. */
      if (expandedRef.current?.contains(e.target as Node) || menuOpen() || overlayIsOpen()) return;
      /* A dialog takes focus as it opens, before it has registered as open. */
      if (e.target instanceof Element && e.target.closest(".dh-kit-scope, .dh-kit-dialog")) return;
      focusBoundary(backwards);
    };
    const onKey = (e: KeyboardEvent) => {
      /* An open dialog over the panel takes its own Tab and Escape. */
      if (overlayIsOpen()) return;
      if (e.key === "Tab" && expandedRef.current) {
        backwards = e.shiftKey;
        if (menuOpen()) return;
        const items = focusableItems();
        const active = document.activeElement;
        // Let Highcharts and AG Grid navigate their own internal modules.
        // Only wrap at the dialog boundary; focusin catches widget exits.
        if (!items.length || active === expandedRef.current ||
            (e.shiftKey && active === items[0]) || (!e.shiftKey && active === items.at(-1))) {
          e.preventDefault();
          e.stopPropagation();
          if (items.length) focusBoundary(e.shiftKey);
          else expandedRef.current.focus();
        }
        return;
      }
      if (e.key !== "Escape" || document.querySelector('[aria-haspopup][aria-expanded="true"], [role="combobox"][aria-expanded="true"]')) return;
      e.preventDefault();
      e.stopPropagation();
      setExpandedPanel(null);
    };
    window.addEventListener("keydown", onKey, true);
    document.addEventListener("focusin", onFocus);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      document.removeEventListener("focusin", onFocus);
    };
  }, [expanded, setExpandedPanel]);

  const vars = (h: number | string) =>
    ({
      "--dh-panel-h": typeof h === "number" ? `${h}px` : h,
      "--dh-panel-header-h": `${PANEL_HEADER_HEIGHT}px`,
      "--dh-panel-pad": `${PANEL_PADDING}px`,
      "--dh-panel-viewby-w": `${PANEL_VIEW_BY_WIDTH}px`,
      "--dh-panel-stack-row": `${PANEL_STACK_ROW}px`,
      ...(accent ? { "--dh-panel-accent": accent } : {}),
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
            {...{ label: "View by", value: viewBy![0], options: viewBy, placeholder: "View by", stateKey: viewByState, inline: true }}
          />
        </div>
      ) : null}
      {showTools ? (
        <div className="dh-panel-tools" onClick={stop}>
          <button
            type="button"
            className={`dh-panel-tool${configOpen ? " is-active" : ""}`}
            data-tool="configure"
            ref={configureRef}
            aria-label={`Configure ${title || "panel"}`}
            aria-pressed={configOpen}
            title="Configure"
            onClick={() => { if (!expanded) restoreTool.current = "configure"; setExpandedPanel(configOpen ? { id: blockId!, config: false } : { id: blockId!, config: true }); }}
          >
            <SlidersHorizontal size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="dh-panel-tool"
            aria-label={expanded ? `Collapse ${title || "panel"}` : `Expand ${title || "panel"}`}
            data-tool="expand"
            title={expanded ? "Collapse (Esc)" : "Expand"}
            onClick={() => { if (!expanded) restoreTool.current = "expand"; setExpandedPanel(expanded ? null : { id: blockId!, config: false }); }}
          >
            {expanded ? <Minimize2 size={15} strokeWidth={1.8} aria-hidden="true" /> : <Maximize2 size={15} strokeWidth={1.8} aria-hidden="true" />}
          </button>
        </div>
      ) : null}
    </header>
  );

  if (!expanded) {
    return (
      <section ref={anchorRef} className={`dh-panel${stacked ? " is-stacked" : ""}${accent ? " has-accent" : ""}`} style={vars(height)} aria-label={title || undefined}>
        {header}
        <div className="dh-panel-body">{children(panelContentHeight(height) - (stacked ? PANEL_STACK_ROW : 0))}</div>
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
          <div ref={expandedRef} className="dh-expand-inner" role="dialog" aria-modal="true" aria-label={`${title || "Panel"} expanded`} tabIndex={-1} onClick={(e) => e.stopPropagation()}>

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
            {configOpen ? <PanelConfigDialog system={system} blockId={blockId!} launcher={configureRef} /> : null}
          </div>,
          host,
        )}
    </>
  );
}
