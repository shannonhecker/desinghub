"use client";

import React, { useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { RealComponentRenderer } from "@/components/ui-kit/RealComponentRenderer";
import type { KitDialogModel } from "@/components/ui-kit/RealDialogKit";
import type { SystemId } from "@/lib/componentApiRegistry";
import { formatPrice } from "@/lib/executionModel";
import { compareOrders, percentDoneSeries, SAMPLE_CONFIRMATION, validateAmendment, type Market } from "@/lib/executionOrders";
import type { ReportDataset } from "@/lib/reportData/types";
import type { ThemeVars } from "./SimulatedHighchart";
import { orderActions, showToast } from "./useOrderSession";

/* ══════════════════════════════════════════════════════════
   ExecutionDialogs - the FX template's small dialogs, each the active
   design system's own (RealComponentRenderer, KitDialog).

   PR D: Amend (one price field: the keyboard and dialog path of the
   limit-line drag) and Compare (ten measures for the two orders and a
   small percent-done chart). PR B and C add Go to and Settings beside
   them. Nothing here sends anything.
   ══════════════════════════════════════════════════════════ */

export interface DialogContext {
  system: SystemId;
  mode: "light" | "dark";
  launcher: HTMLElement | null;
  tones: React.CSSProperties;
}

/** Amend limit price: one field, prefilled; Amend steps the limit series. */
export function AmendDialog({ ctx, open, order, current, start, market, latest }: {
  ctx: DialogContext;
  open: boolean;
  order: { id: string; status: string };
  current: number;
  start: number;
  market: Market;
  latest: () => number;
}) {
  const [text, setText] = useState(formatPrice(start));
  const [error, setError] = useState<string | null>(null);
  const submit = () => {
    const r = validateAmendment(order, text, market);
    if (!r.ok) { setError(r.error); return; }
    orderActions.close();
    if (r.price !== current) orderActions.amend({ order: order.id, time: latest(), price: r.price });
    showToast(SAMPLE_CONFIRMATION);
  };
  const model: KitDialogModel = {
    open,
    name: "amend",
    title: "Amend limit price",
    description: `Order ${order.id}. Limit now ${formatPrice(current)}. Sample data, nothing is sent.`,
    size: "small",
    rows: [[{ kind: "text", id: "dh-amend-price", label: "New limit price", value: text, inputMode: "decimal", align: "end", error, onChange: (v) => { setText(v); if (error) setError(null); } }]],
    primary: { label: "Amend", onClick: submit },
    secondary: { label: "Cancel" },
    onClose: orderActions.close,
    returnFocus: { current: ctx.launcher },
    tones: ctx.tones,
  };
  return <RealComponentRenderer system={ctx.system} type="KitDialog" mode={ctx.mode} saltDensity="medium" props={{ model }} />;
}

/* The small chart's size and type (Highcharts takes CSS lengths). */
const CHART_HEIGHT = 220;
const AXIS_FONT = `${10}px`;

/** Compare orders: a measure per row, an order per column, and both
 *  orders' percent done over the session. Follows the feed while open. */
export function CompareDialog({ ctx, open, dataset, vars, palette }: { ctx: DialogContext; open: boolean; dataset: ReportDataset; vars: ThemeVars | null; palette: string[] }) {
  const table = useMemo(() => compareOrders(dataset), [dataset]);
  const series = useMemo(() => percentDoneSeries(dataset), [dataset]);
  const options = useMemo<Highcharts.Options | null>(() => {
    if (!vars) return null;
    const label = { style: { color: vars.fgTer, fontSize: AXIS_FONT } };
    return {
      chart: { height: CHART_HEIGHT, backgroundColor: "transparent", animation: false, spacing: [8, 4, 4, 4], style: { fontFamily: "inherit" } },
      title: { text: undefined },
      credits: { enabled: false },
      /* The table above is the data; the chart is not a tab stop of its own. */
      accessibility: { description: "Percent done over the session for each order.", keyboardNavigation: { enabled: false } },
      /* On top, beside the title: always in view, and the plot keeps the height. */
      legend: { align: "right", verticalAlign: "top", padding: 0, margin: 6, itemStyle: { color: vars.fgSec, fontSize: AXIS_FONT, fontWeight: "400" }, itemHoverStyle: { color: vars.fg } },
      xAxis: { title: { text: "Session bar", style: label.style }, labels: label, lineColor: vars.border, tickColor: vars.border },
      yAxis: { min: 0, max: 100, title: { text: undefined }, gridLineColor: Highcharts.color(vars.border).setOpacity(0.5).get("rgba") as string, labels: { ...label, format: "{value}%" } },
      tooltip: { shared: true, backgroundColor: vars.card ?? vars.surface, borderColor: vars.border, style: { color: vars.fg }, valueDecimals: 1, valueSuffix: "%" },
      plotOptions: { series: { animation: false, marker: { enabled: false }, lineWidth: 1.6 } },
      series: series.map((s, i) => ({ type: "line" as const, name: `${s.side} ${s.id}`, color: palette[i % palette.length], data: s.points })),
    };
  }, [vars, palette, series]);

  const model: KitDialogModel = {
    open,
    name: "compare",
    title: "Compare orders",
    description: "Sample data, for this session.",
    size: "medium",
    table: {
      caption: "The two orders compared",
      columns: ["Measure", ...table.orders.map((o) => `${o.side} ${o.id}`)],
      rows: table.rows.map((r) => ({ cells: [r.measure, ...r.values], tones: r.tones })),
    },
    extra: options ? (
      <figure className="dh-kit-figure">
        <figcaption className="dh-kit-figure-title">Percent done</figcaption>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </figure>
    ) : null,
    secondary: { label: "Close" },
    onClose: orderActions.close,
    returnFocus: { current: ctx.launcher },
    tones: ctx.tones,
  };
  return <RealComponentRenderer system={ctx.system} type="KitDialog" mode={ctx.mode} saltDensity="medium" props={{ model }} />;
}
