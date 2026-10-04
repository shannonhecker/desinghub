"use client";

import React, { useMemo } from "react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { EXECUTION_KEYS, formatPrice, resolveExecution, splitQuote } from "@/lib/executionModel";
import { feedSwitchedOn } from "@/lib/executionFeed";
import { ExecutionFeedControls, type FeedStatus } from "./ExecutionFeedControls";
import { usePreviewReadOnly } from "./previewReadOnly";
import { useCanvasDataset } from "./useBoundData";
import { useExecutionFeed, useFeedDataset } from "./useExecutionFeed";

/* ══════════════════════════════════════════════════════════
   InstrumentHeader - what is being traded, and the order worked.

   Line one: the pair, its last bar (open, high, low, close and the
   change), and a two-sided quote. Line two: how the chart is being
   read, the orders as tabs (choosing one re-reads the whole page),
   the sample feed's controls, and a note that the figures are sample
   data. While presenting, the figures follow the feed; they are not
   announced on every tick (the header is aria-live="off").
   ══════════════════════════════════════════════════════════ */

export function InstrumentHeaderBlock(p: Record<string, unknown>) {
  const canvas = useCanvasDataset();
  const reportState = useBuilder((s) => s.reportState);
  const setReportState = useBuilder((s) => s.setReportState);
  const readOnly = usePreviewReadOnly();
  const switchedOn = feedSwitchedOn(reportState);
  const feed = useExecutionFeed({ dataset: canvas, state: reportState, active: readOnly && switchedOn });
  const dataset = useFeedDataset(canvas);
  const view = useMemo(() => (dataset ? resolveExecution(dataset, reportState) : null), [dataset, reportState]);

  if (!view || !view.last) {
    return <div className="dh-instrument"><div className="dh-instrument-main"><h1 className="dh-instrument-symbol">{String(p.symbol ?? "Instrument")}</h1></div></div>;
  }
  const { last, order } = view;
  const status: FeedStatus = feed.running ? "live" : feed.ended ? "ended" : !readOnly && switchedOn ? "edit" : "paused";
  const up = last.changePips >= 0;
  const [base] = [view.pair.slice(0, 3)];
  const sell = splitQuote(last.bid);
  const buy = splitQuote(last.ask);
  const figure = (label: string, value: number, tone?: "up" | "down") => (
    <span className="dh-instrument-figure">
      <span className="dh-instrument-figure-label">{label}</span>
      <span className={tone ? `is-${tone}` : undefined}>{formatPrice(value)}</span>
    </span>
  );

  return (
    <div className="dh-instrument" aria-live="off" data-feed-bars={readOnly ? feed.samples.length : 0} onClick={readOnly ? (e) => e.stopPropagation() : undefined}>
      <div className="dh-instrument-main">
        <h1 className="dh-instrument-symbol">{view.pair}</h1>
        <span className="dh-instrument-meta">{view.description}</span>
        <span className="dh-instrument-meta dh-instrument-mono" title="Fills">{order.fills}/{order.fillsTarget}</span>
        <span className="dh-instrument-ohlc" role="group" aria-label="Last bar">
          {figure("O", last.open)}
          {figure("H", last.high, "up")}
          {figure("L", last.low, "down")}
          {figure("C", last.close)}
          <span className={`dh-instrument-change ${up ? "is-up" : "is-down"}`}>
            {up ? "+" : ""}{last.changePips.toFixed(2)} ({up ? "+" : ""}{last.changePct.toFixed(2)}%)
          </span>
        </span>
        <span className="dh-instrument-spacer" />
        <span className="dh-instrument-quote" role="group" aria-label="Quote">
          <span className="dh-instrument-handle">{sell.handle}</span>
          <span className="dh-instrument-side"><span className="dh-instrument-side-label">S {base}</span><span className="dh-instrument-pips">{sell.pips}</span></span>
          <span className="dh-instrument-side"><span className="dh-instrument-side-label">B {base}</span><span className="dh-instrument-pips">{buy.pips}</span></span>
          <span className="dh-instrument-handle">{buy.handle}</span>
        </span>
      </div>
      <div className="dh-instrument-sub">
        <span className="dh-instrument-status">{view.interval} {view.chartStyle} · {order.algo} · {order.pctDone}% done</span>
        <div className="dh-instrument-orders" role="tablist" aria-label="Orders">
          {view.orders.map((o) => (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={o.id === order.id}
              className={`dh-instrument-order${o.id === order.id ? " is-active" : ""}`}
              onClick={() => setReportState(EXECUTION_KEYS.order, o.id)}
            >
              <span className={`dh-instrument-dot ${o.side === "BUY" ? "is-up" : "is-down"}`} aria-hidden="true" />
              <span className="dh-instrument-order-side">{o.side}</span>
              <span className="dh-instrument-mono">{o.id}</span>
              <span className="dh-instrument-order-status">{o.status}</span>
            </button>
          ))}
        </div>
        <span className="dh-instrument-spacer" />
        <ExecutionFeedControls system={(p.system as DesignSystem) ?? "salt"} status={status} canReset={readOnly && feed.samples.length > 0} presenting={readOnly} />
        <span className="dh-instrument-note">{String(p.note ?? "Sample data")}</span>
      </div>
    </div>
  );
}
