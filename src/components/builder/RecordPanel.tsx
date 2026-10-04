"use client";

import React from "react";
import { ArrowDown, ArrowUp, MousePointerClick } from "lucide-react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { toneColor, type GridTone } from "@/lib/dataGridModel";
import { panelHeightOf } from "@/lib/panelMetrics";
import { isRecordBinding, resolveRecord, type ResolvedSection } from "@/lib/recordPanelModel";
import { PanelFrame } from "./PanelFrame";
import { SimulatedHighchart } from "./SimulatedHighchart";
import { useCanvasDataset } from "./useBoundData";

/* ══════════════════════════════════════════════════════════
   RecordPanel - the detail of the record a grid has selected.

   A fixed panel, not a rail that pushes in: the page keeps the
   same geometry whether or not something is selected, which is
   what lets a template promise identical panel positions. With
   nothing selected it says how to select.
   ══════════════════════════════════════════════════════════ */

const TREND_HEIGHT = 150;
const toneStyle = (tone: GridTone): React.CSSProperties => ({ "--dh-tone": toneColor(tone) }) as React.CSSProperties;

function Section({ section, system }: { section: ResolvedSection; system: DesignSystem }) {
  if (section.type === "pairs") {
    return (
      <dl className="dh-record-pairs">
        {section.items.map((item) => (
          <div key={item.label} className="dh-record-pair">
            <dt>{item.label}</dt>
            <dd>
              {item.flag ? <span aria-hidden="true">{item.flag} </span> : null}
              {item.tone ? <span className="dh-cell-badge" style={toneStyle(item.tone)}>{item.text}</span> : item.text}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  if (section.type === "table") {
    const hasChange = section.rows.some((r) => r.change);
    return (
      <div className="dh-record-section">
        {section.title ? <h4 className="dh-record-heading">{section.title}</h4> : null}
        <table className="dh-record-table">
          <thead>
            <tr>
              <th scope="col"><span className="dh-visually-hidden">Measure</span></th>
              {section.columns.map((c) => <th key={c} scope="col">{c}</th>)}
              {hasChange ? <th scope="col">Change</th> : null}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {r.cells.map((c, i) => <td key={i}>{c}</td>)}
                {hasChange ? (
                  <td>
                    {r.change && r.change.direction !== "flat" ? (
                      <span className="dh-record-change" style={toneStyle(r.change.tone)}>
                        {r.change.direction === "up" ? <ArrowUp size={13} strokeWidth={2.2} aria-hidden="true" /> : <ArrowDown size={13} strokeWidth={2.2} aria-hidden="true" />}
                        <span className="dh-visually-hidden">{r.change.direction === "up" ? "Up" : "Down"}</span>
                      </span>
                    ) : (
                      <span className="dh-record-flat" aria-label="No change">-</span>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (section.points.length < 2) return null;
  return (
    <div className="dh-record-section">
      {section.title ? <h4 className="dh-record-heading">{section.title}</h4> : null}
      <SimulatedHighchart
        chartType="line"
        title={section.title ?? ""}
        system={system}
        categories={section.categories}
        series={[{ name: section.seriesName, data: section.points }]}
        height={TREND_HEIGHT}
        hideTitle
        legend={false}
      />
    </div>
  );
}

export function RecordPanelBlock({ system, blockId }: { system: DesignSystem; blockId?: string }) {
  const block = useBuilder((s) => (blockId ? s.blocks.find((b) => b.id === blockId) : undefined));
  const reportState = useBuilder((s) => s.reportState);
  const setReportState = useBuilder((s) => s.setReportState);
  const dataset = useCanvasDataset();
  const p = (block?.props ?? {}) as Record<string, unknown>;
  const binding = isRecordBinding(p.binding) ? p.binding : null;
  const record = binding && dataset ? resolveRecord(binding, dataset, reportState) : null;
  const fallbackTitle = typeof p.title === "string" && p.title ? p.title : "Detail";

  return (
    <PanelFrame
      system={system}
      blockId={blockId}
      title={record ? record.title : fallbackTitle}
      subtitle={record ? fallbackTitle : undefined}
      height={panelHeightOf(p)}
    >
      {(height) => (
        <div className="dh-record" style={{ height }}>
          {record ? (
            <>
              {record.sections.map((section, i) => <Section key={i} section={section} system={system} />)}
              <button type="button" className="dh-record-clear" onClick={(e) => { e.stopPropagation(); setReportState(binding!.state, null); }}>
                Clear selection
              </button>
            </>
          ) : (
            <div className="dh-record-empty">
              <MousePointerClick size={20} strokeWidth={1.6} aria-hidden="true" />
              <p>{typeof p.emptyText === "string" && p.emptyText ? p.emptyText : "Select a row to see its detail."}</p>
            </div>
          )}
        </div>
      )}
    </PanelFrame>
  );
}
