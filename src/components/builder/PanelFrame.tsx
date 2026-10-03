"use client";

import React from "react";
import type { DesignSystem } from "@/store/useBuilder";
import { ComponentRenderer } from "./ComponentRenderer";
import { usePreviewReadOnly } from "./previewReadOnly";
import {
  PANEL_HEADER_HEIGHT,
  PANEL_PADDING,
  PANEL_VIEW_BY_WIDTH,
} from "@/lib/panelMetrics";

/* ══════════════════════════════════════════════════════════
   PanelFrame - the card a chart or a data grid sits in.

   A header row (title, subtitle on the same baseline, an optional
   "View by" select on the right) over a body. Its height is fixed
   by the block, and its measurements are the same in every design
   system (panelMetrics.ts), so a template's panels land on the same
   pixels whichever system is active. Colour, type, radius and the
   select itself come from the active system: --ds-* tokens and the
   system's own Dropdown.
   ══════════════════════════════════════════════════════════ */

interface PanelFrameProps {
  system: DesignSystem;
  title: string;
  subtitle?: string;
  /** "View by" choices; the first is shown as chosen. Empty hides the select. */
  viewBy?: string[];
  /** Report-state key the select reads and writes, so the panel's data can
   *  follow the choice. Without it the select is display-only. */
  viewByState?: string;
  /** Overall height in px. */
  height: number;
  children: React.ReactNode;
}

export function PanelFrame({ system, title, subtitle, viewBy, viewByState, height, children }: PanelFrameProps) {
  const vars = {
    "--dh-panel-h": `${height}px`,
    "--dh-panel-header-h": `${PANEL_HEADER_HEIGHT}px`,
    "--dh-panel-pad": `${PANEL_PADDING}px`,
    "--dh-panel-viewby-w": `${PANEL_VIEW_BY_WIDTH}px`,
  } as React.CSSProperties;
  const hasViewBy = Boolean(viewBy && viewBy.length > 0);
  /* While presenting, using the "View by" select must not also select the
     block for the amend composer. */
  const readOnly = usePreviewReadOnly();

  return (
    <section className="dh-panel" style={vars} aria-label={title || undefined}>
      <header className="dh-panel-header">
        <div className="dh-panel-heading">
          <h3 className="dh-panel-title">{title}</h3>
          {subtitle ? <span className="dh-panel-subtitle">{subtitle}</span> : null}
        </div>
        {hasViewBy ? (
          <div className="dh-panel-viewby" onClick={readOnly ? (e) => e.stopPropagation() : undefined}>
            {/* The system's own Dropdown, fed the same props a Dropdown block takes. */}
            <ComponentRenderer
              type="SimulatedDropdown"
              system={system}
              {...{ value: viewBy![0], optionsCsv: viewBy!.join(", "), placeholder: "View by", stateKey: viewByState }}
            />
          </div>
        ) : null}
      </header>
      <div className="dh-panel-body">{children}</div>
    </section>
  );
}
