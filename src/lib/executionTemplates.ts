/**
 * executionTemplates - FX Execution: one algo order worked through a
 * session.
 *
 * The page is an instrument header, one large chart with its own tool rail
 * and range presets, and a column of three panels beside it (the order's
 * statistics, a passive / aggressive gauge, the venues). Choosing an order,
 * an interval, a chart type, a range or a venue is report state: every block
 * re-reads from the same tables, and the chat can make the same choices.
 *
 * Design note: docs/superpowers/specs/2026-10-06-finance-templates-slice-4-design.md
 */

import type { Block } from "@/store/useBuilder";
import type { BuilderTemplate } from "./builderTemplates";
import { BODY_LAYOUT } from "./financeTemplates";
import { EXECUTION_CHART_STYLES, EXECUTION_INTERVALS, EXECUTION_KEYS, EXECUTION_RANGES } from "./executionModel";
import type { RecordBinding } from "./recordPanelModel";
import type { BindingFilter, DataBinding } from "./reportData/binding";
import { EXECUTION_DATASET_ID, EXECUTION_ORDERS } from "./reportData/executionDataset";

const ORDER = EXECUTION_ORDERS[0];
const forOrder: BindingFilter = { field: "order", state: EXECUTION_KEYS.order, fallback: ORDER };

/* The column beside the chart, top to bottom; the chart spans all three. */
const STATS_HEIGHT = 284;
const GAUGE_HEIGHT = 220;
const VENUES_HEIGHT = 316;
const CHART_HEIGHT = STATS_HEIGHT + GAUGE_HEIGHT + VENUES_HEIGHT + 2 * (BODY_LAYOUT.gap ?? 24);
const SIDE = { width: "3fr", spanTablet: 6, spanPhone: 12 } as const;

const stats: RecordBinding = {
  table: "orders", keyField: "order", state: EXECUTION_KEYS.order, fallback: ORDER,
  sections: [{
    type: "pairs",
    layout: "rows",
    zebra: true,
    items: [
      { label: "Duration", field: "duration" },
      { label: "Amount done", field: "amountDone", kind: "number", decimals: 0, prefix: "EUR " },
      { label: "Number of clips", field: "clips", kind: "number", decimals: 0 },
      { label: "Number of fills", field: "fills", kind: "number", decimals: 0 },
      { label: "Passive %", field: "passivePct", kind: "number", decimals: 2, suffix: " %" },
      { label: "Aggressive %", field: "aggressivePct", kind: "number", decimals: 2, suffix: " %" },
      { label: "Slippage vs arrival", field: "slippageArrival", kind: "number", decimals: 2, suffix: " pips", as: "signed" },
      { label: "Avg fill vs TWAP", field: "fillVsTwap", kind: "number", decimals: 2, suffix: " pips", as: "signed" },
    ],
  }],
};

const passive: DataBinding = {
  table: "orders", view: "value",
  measures: [{ field: "passivePct", agg: "avg" }],
  display: [{ key: "passivePct", label: "Passive" }],
  filters: [forOrder],
};

const venues: DataBinding = {
  table: "fills", view: "parts", groupBy: "venue",
  measures: [{ field: "volume", agg: "sum" }],
  display: [{ key: "volume", label: "Volume (m)" }],
  sort: { by: "volume", dir: "desc" },
  filters: [forOrder],
  /* A slice is a venue: selecting one highlights its fills on the chart. */
  selectState: EXECUTION_KEYS.venue,
  /* Expanded: the venue table (share, spread capture, markout). */
  expanded: {
    table: {
      table: "fills", view: "grid", groupBy: "venue", groupHeader: "Venue",
      measures: [{ field: "volume", agg: "sum" }, { field: "price", agg: "count" }, { field: "slippage", agg: "avg" }, { field: "markout", agg: "avg" }],
      computed: [{ as: "share", op: "shareOfTotal", of: ["volume"] }],
      display: [
        { key: "volume", label: "Volume (m)", kind: "number", decimals: 1, width: 110 },
        { key: "share", label: "Share", kind: "percent", decimals: 1, width: 96 },
        { key: "price", label: "Fills", kind: "number", decimals: 0, width: 84 },
        { key: "slippage", label: "Capture (pips)", kind: "number", decimals: 2, width: 120, signed: true },
        { key: "markout", label: "Markout (pips)", kind: "number", decimals: 2, width: 120, signed: true },
      ],
      sort: { by: "volume", dir: "desc" },
      total: "All venues",
      filters: [forOrder],
    },
  },
};

export const fxExecution: BuilderTemplate = {
  id: "fx-execution",
  label: "FX Execution",
  desc: "One algo order through a session: fills by venue, statistics and a venue breakdown",
  icon: "candlestick_chart",
  category: "finance",
  uniformStructure: true,
  datasetId: EXECUTION_DATASET_ID,
  interfaceType: "dashboard",
  selectedComponents: ["table"],
  zoneLayouts: {
    body: BODY_LAYOUT,
    header: { mode: "stack", gap: 0, flush: true, tone: "surface" },
    sidebar: { mode: "stack", gap: 4, align: "stretch", visible: false },
    footer: { mode: "row", gap: 8, wrap: false, align: "center", visible: false },
  },
  /* `filters` lists a block's controls as data (label, state key, choices),
     the way a context bar does: it is how the chat and the canvas summary
     know what can be set. The blocks draw the controls themselves. */
  header: [{
    id: "tpl-fx-instrument", type: "InstrumentHeader",
    props: {
      symbol: "EURUSD", note: "Sample data",
      filters: [
        { label: "Order", stateKey: EXECUTION_KEYS.order, value: ORDER, options: [...EXECUTION_ORDERS] },
        /* The sample feed: live while presenting unless switched off. */
        { label: "Live feed", stateKey: EXECUTION_KEYS.live, value: "On", options: ["On", "Off"], phrases: { Off: ["pause the feed", "stop the feed"], On: ["resume the feed", "play the feed"] } },
      ],
    },
  }] as Block[],
  sidebar: [],
  footer: [],
  body: [
    {
      id: "tpl-fx-chart", type: "ExecutionChart",
      props: {
        height: CHART_HEIGHT,
        filters: [
          { label: "Interval", stateKey: EXECUTION_KEYS.interval, value: "1m", options: Object.keys(EXECUTION_INTERVALS) },
          { label: "Chart type", stateKey: EXECUTION_KEYS.chart, value: "Line", options: [...EXECUTION_CHART_STYLES] },
          { label: "Range", stateKey: EXECUTION_KEYS.range, value: "1D", options: [...EXECUTION_RANGES] },
        ],
      },
      layout: { width: "9fr", rowSpan: 3, spanTablet: 12, spanPhone: 12 },
    },
    {
      id: "tpl-fx-stats", type: "RecordPanel",
      props: { title: "Order", height: STATS_HEIGHT, clearable: false, binding: stats },
      layout: SIDE,
    },
    {
      id: "tpl-fx-passive", type: "HighchartGauge",
      props: { chartType: "gauge", panel: true, height: GAUGE_HEIGHT, title: "Passive / aggressive", valueMax: 100, valueDecimals: 2, valueSuffix: "%", gaugeSweep: 220, gaugeCaption: "% passive", pointColors: ["mid"], binding: passive },
      layout: SIDE,
    },
    {
      id: "tpl-fx-venues", type: "HighchartDonut",
      props: { chartType: "donut", panel: true, height: VENUES_HEIGHT, title: "Venue analysis", valueDecimals: 1, valueSuffix: "m", binding: venues },
      layout: { ...SIDE, spanTablet: 12 },
    },
  ],
  aiResponse:
    "Built **FX Execution**: one order worked through a session. The chart shows the market, the order's limit price, its fills by venue and percent done; its rail sets the **interval**, the **chart type** and the **overlays**, and the chips under it set the **range**. Pick the other **order** in the header, or a **venue** in the donut to highlight its fills. While presenting, a **sample feed** adds a bar a second; pause or reset it in the header. Ask me to change the interval, switch to candlesticks, or try another design system.",
};
