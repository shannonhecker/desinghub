"use client";

import React, { useEffect, useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { DesignSystem } from "@/store/useBuilder";
import { RealComponentRenderer } from "@/components/ui-kit/RealComponentRenderer";
import type { KitDialogModel } from "@/components/ui-kit/RealDialogKit";
import type { FormDialogModel } from "@/components/ui-kit/RealFormDialog";
import type { SystemId } from "@/lib/componentApiRegistry";
import { dayLabel, parseGoTo, type GoToField } from "@/lib/chartViewport";
import { monthOf } from "@/lib/calendarGrid";
import { formatPrice } from "@/lib/executionModel";
import { compareOrders, percentDoneSeries, SAMPLE_CONFIRMATION, validateAmendment, type Market } from "@/lib/executionOrders";
import type { ReportDataset } from "@/lib/reportData/types";
import type { ThemeVars } from "./SimulatedHighchart";
import { orderActions, showToast } from "./useOrderSession";

/* ══════════════════════════════════════════════════════════
   The FX Execution chart's dialogs, each the active design system's own
   (RealComponentRenderer "FormDialog"). PR B: Go to. Later PRs add
   Compare, Settings and Amend here.

   Go to, as in the original: "Date" (a day on the calendar and a time:
   about ninety minutes around it) or "Custom range" (the calendar fills
   From, then To; each has a time). Only days with sample data can be
   picked; typed dates outside the data get a plain message.
   ══════════════════════════════════════════════════════════ */

const MODES = ["Date", "Custom range"] as const;
type GoToMode = (typeof MODES)[number];

export interface GoToDialogProps {
  system: DesignSystem;
  mode: "light" | "dark";
  open: boolean;
  onClose: () => void;
  launcher: React.RefObject<HTMLElement | null>;
  /** Days with sample data the chart can reach ("YYYY-MM-DD"), sorted. */
  days: readonly string[];
  /** Move the chart to [from, to] (ms). A string is a plain error to show. */
  onGo: (from: number, to: number) => string | null;
}

export function GoToDialog({ system, mode, open, onClose, launcher, days, onGo }: GoToDialogProps) {
  const first = days[0] ?? "";
  const last = days[days.length - 1] ?? "";
  const daySet = useMemo(() => new Set(days), [days]);
  const [goMode, setGoMode] = useState<GoToMode>("Date");
  const [date, setDate] = useState(last);
  const [time, setTime] = useState("10:30");
  const [fromDate, setFromDate] = useState(last);
  const [fromTime, setFromTime] = useState("10:00");
  const [toDate, setToDate] = useState(last);
  const [toTime, setToTime] = useState("11:00");
  /* The end of the range the calendar fills next; null once both are chosen (the next pick starts a new range). */
  const [armed, setArmed] = useState<"from" | "to" | null>("from");
  const [month, setMonth] = useState(monthOf(last || "2026-01-01"));
  const [error, setError] = useState<{ field: GoToField | "form"; text: string } | null>(null);

  /* Each opening starts clean on the latest day with data. */
  useEffect(() => {
    if (!open) return;
    setError(null);
    setArmed("from");
    const inside = (d: string) => Boolean(d) && d >= first && d <= last;
    const shownDate = inside(date) ? date : last;
    const shownFrom = inside(fromDate) ? fromDate : last;
    if (shownDate !== date) setDate(shownDate);
    if (shownFrom !== fromDate) setFromDate(shownFrom);
    if (!inside(toDate)) setToDate(last);
    setMonth(monthOf((goMode === "Date" ? shownDate : shownFrom) || "2026-01-01"));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- on open only
  }, [open]);

  const clear = (field: GoToField) => (v: string, set: (v: string) => void) => { set(v); if (error?.field === field || error?.field === "form") setError(null); };
  const typed = (field: GoToField, set: (v: string) => void, followMonth = false) => (v: string) => {
    clear(field)(v, set);
    if (followMonth && /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= first && v <= last) setMonth(monthOf(v));
  };
  const errorOf = (field: GoToField) => (error?.field === field ? error.text : null);

  const submit = () => {
    /* A half-typed time (the browser's own field reports it, with an empty
       value) is not midnight: say so. */
    const times: GoToField[] = goMode === "Date" ? ["time"] : ["fromTime", "toTime"];
    const half = times.find((f) => (document.getElementById(`fx-goto-${f}`) as HTMLInputElement | null)?.validity?.badInput);
    if (half) {
      setError({ field: half, text: "Enter the whole time as HH:MM, for example 10:30." });
      document.getElementById(`fx-goto-${half}`)?.focus();
      return;
    }
    const r = parseGoTo(goMode === "Date" ? { mode: "date", date, time } : { mode: "range", fromDate, fromTime, toDate, toTime }, { first, last });
    if (!r.ok) {
      setError({ field: r.field, text: r.error });
      document.getElementById(`fx-goto-${r.field}`)?.focus();
      return;
    }
    const refused = onGo(r.from, r.to);
    if (refused) {
      const field: GoToField = goMode === "Date" ? "date" : "fromDate";
      setError({ field, text: refused });
      document.getElementById(`fx-goto-${field}`)?.focus();
      return;
    }
    onClose();
  };

  const pick = (day: string) => {
    setError(null);
    if (goMode === "Date") { setDate(day); return; }
    if (armed !== "to") { setFromDate(day); if (toDate < day) setToDate(day); setArmed("to"); return; }
    if (day < fromDate) { setToDate(fromDate); setFromDate(day); } else setToDate(day);
    setArmed(null);
  };

  const field = (id: GoToField, label: string, type: "date" | "time", value: string, set: (v: string) => void) => ({
    id: `fx-goto-${id}`, label, type, value, error: errorOf(id),
    /* As the original's From and To buttons did: the end in hand is the one the calendar fills next. */
    ...(id === "fromDate" || id === "fromTime" ? { onFocus: () => setArmed("from") } : id === "toDate" || id === "toTime" ? { onFocus: () => setArmed("to") } : {}),
    onChange: typed(id, set, type === "date"),
    ...(type === "date" ? { min: first, max: last } : { placeholder: "HH:MM" }),
  });

  const model: FormDialogModel = {
    open,
    title: "Go to",
    note: first ? `Sample data from ${dayLabel(first)} to ${dayLabel(last)}.` : undefined,
    choice: { label: "Go to a", options: [...MODES], value: goMode, onChange: (v) => { setGoMode(v as GoToMode); setError(null); setMonth(monthOf((v === "Date" ? date : fromDate) || last)); } },
    calendar: {
      label: goMode === "Date" ? "Pick a day" : "Pick the start and end days",
      month, onMonth: setMonth,
      selected: goMode === "Date" ? [date] : [fromDate, toDate],
      enabled: (d) => daySet.has(d), onPick: pick, min: first, max: last,
      /* An instruction only while that end is pending; then the range chosen. */
      prompt: goMode === "Date" ? undefined : armed === "from" ? "Pick the start day" : armed === "to" ? "Pick the end day" : `${dayLabel(fromDate)} to ${dayLabel(toDate)}`,
    },
    rows: goMode === "Date"
      ? [[field("date", "Date", "date", date, setDate), field("time", "Time (UTC)", "time", time, setTime)]]
      : [
          [field("fromDate", "From", "date", fromDate, setFromDate), field("fromTime", "Time (UTC)", "time", fromTime, setFromTime)],
          [field("toDate", "To", "date", toDate, setToDate), field("toTime", "Time (UTC)", "time", toTime, setToTime)],
        ],
    primary: { label: "Go to", onClick: submit },
    cancel: { label: "Cancel" },
    onClose,
    returnFocus: launcher,
  };

  return <RealComponentRenderer system={system as SystemId} type="FormDialog" mode={mode} saltDensity="medium" props={{ model }} />;
}

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
const CHART_HEIGHT = 200;
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
