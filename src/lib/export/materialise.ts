/**
 * materialise - turn the canvas's live, data-bound blocks into static ones.
 *
 * On the canvas a report block does not carry its own data: a chart or grid
 * with a `binding` derives its series / rows on every render from the dataset
 * and the report state, and a filter with a `stateKey` shows whatever value
 * report state holds (useBoundData.ts, ComponentRenderer.tsx).
 *
 * Exported code has no store and no dataset. So every exporter runs this
 * step first: each binding is resolved once, exactly as the canvas resolves
 * it, and written back as plain props (categories / series / seriesData /
 * columns / rows). The live-only props are removed, so the rest of an
 * exporter only ever sees static blocks and nothing about the data layer can
 * reach the generated code.
 */

import { useBuilder } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";
import { BUILDER_TEMPLATES, type BuilderTemplate } from "@/lib/builderTemplates";
import { formatGridValue } from "@/lib/dataGridModel";
import { viewByOf, viewByStateKey } from "@/lib/panelMetrics";
import { GRID_TONES, type GridTone } from "@/lib/dataGridModel";
import { fieldText, fieldTone, isRecordBinding, isRowLookup, lookupRow, resolveRecord, type ResolvedRecord, type RowLookup } from "@/lib/recordPanelModel";
import { CURRENCY_STATE, centerColumn, resolveBinding, type BoundData, type DataBinding, type ReportState } from "@/lib/reportData/binding";
import { sampleDataset } from "@/lib/reportData/registry";
import type { DataRow, ReportDataset } from "@/lib/reportData/types";
import { RECORD_PANEL_BLOCK_TYPE } from "./reportMarkup";
import { formatBarStamp, formatBarTime, formatChange, formatPrice, resolveExecution, splitQuote, type ExecutionView } from "@/lib/executionModel";

/** The part of the builder state the exporters read. */
export interface CanvasSource {
  headerBlocks: Block[];
  sidebarBlocks: Block[];
  blocks: Block[];
  footerBlocks: Block[];
  reportState?: ReportState;
  reportData?: ReportDataset | null;
  activeTemplateId?: string | null;
}

export interface MaterialisedCanvas {
  header: Block[];
  sidebar: Block[];
  body: Block[];
  footer: Block[];
}

/** The dataset the canvas is showing: an uploaded one if there is one, else
 *  the sample dataset of the template on the canvas (as useCanvasDataset). */
export function canvasDataset(source: Pick<CanvasSource, "reportData" | "activeTemplateId">): ReportDataset | null {
  if (source.reportData) return source.reportData;
  const id = source.activeTemplateId;
  const template = id ? (BUILDER_TEMPLATES as Record<string, BuilderTemplate | undefined>)[id] : undefined;
  return sampleDataset(template?.datasetId);
}

function isBinding(v: unknown): v is DataBinding {
  return typeof v === "object" && v !== null && typeof (v as DataBinding).table === "string" && Array.isArray((v as DataBinding).measures);
}

/** Resolve a binding without ever throwing: a binding that cannot be read
 *  (missing table, malformed spec) leaves the block on its own static props. */
function resolveSafely(binding: unknown, dataset: ReportDataset | null, state: ReportState): BoundData | null {
  if (!isBinding(binding) || !dataset) return null;
  try {
    return resolveBinding(binding, dataset, state);
  } catch {
    return null;
  }
}

/** Resolve a Record Panel's selected record without ever throwing. Null when
 *  nothing is selected (the panel then exports its empty state). */
function resolveRecordSafely(binding: unknown, dataset: ReportDataset | null, state: ReportState): ResolvedRecord | null {
  if (!isRecordBinding(binding) || !dataset) return null;
  try {
    return resolveRecord(binding, dataset, state);
  } catch {
    return null;
  }
}

/* ── Report blocks that show ONE row of a table (ReportBlocks.tsx) ──
   An entity header, a metric tile and a verdict card name fields of a row
   chosen by report state (the selected entity) or fixed (a tile per
   category). The row is read here, exactly as the canvas reads it, and the
   block leaves with the text it shows: no lookup, no field names, no state
   keys. reportMarkup.ts draws these static props. */

/** The row a block's lookup names, without ever throwing. Null when the block
 *  has no lookup, the dataset is missing, or no row matches. */
function lookupRowSafely(lookup: RowLookup | null, dataset: ReportDataset | null, state: ReportState): DataRow | null {
  if (!lookup || !dataset) return null;
  try {
    return lookupRow(lookup, dataset, state);
  } catch {
    return null;
  }
}

const text = (v: unknown, fallback = ""): string => (typeof v === "string" && v ? v : fallback);
const toneOr = (v: unknown, fallback: GridTone): GridTone => (GRID_TONES.includes(v as GridTone) ? (v as GridTone) : fallback);
/** The entries of a list prop that name a field of the row. */
function fieldItems(v: unknown): (Record<string, unknown> & { field: string })[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is Record<string, unknown> & { field: string } => Boolean(x) && typeof x === "object" && typeof (x as { field: unknown }).field === "string");
}
const drop = (props: Record<string, unknown>, keys: readonly string[]): void => {
  for (const key of keys) delete props[key];
};

/** EntityHeader: the entity's name, its facts and its count badges, as text. */
function materialiseEntityHeader(props: Record<string, unknown>, source: Record<string, unknown>, row: DataRow | null, lookup: RowLookup | null): void {
  props.title = row && lookup ? String(row[lookup.keyField] ?? "") : text(source.title, "Entity");
  props.facts = fieldItems(source.facts).map((f) => ({ label: text(f.label), value: fieldText(row, f.field) || "-" }));
  props.badges = fieldItems(source.badges).map((b) => ({ label: text(b.label), value: fieldText(row, b.field) || "0", tone: toneOr(b.tone, "neutral") }));
}
/** What the entity is set against, as text ("vs Helios Energy"). */
function materialiseEntitySuffix(props: Record<string, unknown>, source: Record<string, unknown>, dataset: ReportDataset | null, reportState: ReportState): void {
  const lookup = isRowLookup(source.suffixBinding) ? source.suffixBinding : null;
  const other = lookupRowSafely(lookup, dataset, reportState);
  if (other && lookup) props.suffix = `${text(source.suffixPrefix, "vs")} ${String(other[lookup.keyField] ?? "")}`;
  delete props.suffixBinding;
  delete props.suffixPrefix;
}

/** MetricTile: its figure, sub-figures and chips as text, and whether it is
 *  the selected one of a set (a category card). */
function materialiseMetricTile(props: Record<string, unknown>, source: Record<string, unknown>, row: DataRow | null, state: ReportState): void {
  const field = text(source.field);
  const value = field ? fieldText(row, field) || "-" : text(source.value);
  drop(props, ["field", "value", "selected", "selectState", "selectValue", "selectDefault"]);
  if (value) props.value = value;
  props.subs = fieldItems(source.subs).map((s) => ({ label: text(s.label), value: fieldText(row, s.field) || "0", ...(text(s.icon) ? { icon: text(s.icon) } : {}) }));
  props.chips = fieldItems(source.chips).map((c) => {
    const count = fieldText(row, c.field) || "0";
    /* A zero count is drawn neutral, whatever the chip's own tone. */
    return { label: text(c.label), value: count, tone: count === "0" ? "neutral" : toneOr(c.tone, "neutral") };
  });
  const selectState = text(source.selectState);
  if (selectState) props.selected = (state[selectState] ?? text(source.selectDefault)) === text(source.selectValue, text(source.label));
}

/** VerdictCard: the figure, status, caption, progress and stats as text, and
 *  the tone the data gives the card. */
function materialiseVerdictCard(props: Record<string, unknown>, source: Record<string, unknown>, row: DataRow | null): void {
  drop(props, ["heroField", "statusField", "toneField", "captionField", "progress"]);
  props.tone = fieldTone(row, text(source.toneField), "neutral");
  props.hero = fieldText(row, text(source.heroField), { decimals: 1 }) || "-";
  props.status = fieldText(row, text(source.statusField));
  props.caption = source.captionField ? fieldText(row, text(source.captionField)) : "";
  const progress = fieldItems([source.progress])[0];
  if (progress) {
    const pct = row ? Math.max(0, Math.min(100, Number(row[progress.field]) || 0)) : 0;
    props.progress = { label: text(progress.label), pct, text: `${Math.round(pct)}${typeof progress.suffix === "string" ? progress.suffix : "%"}` };
  }
  props.stats = fieldItems(source.stats).map((s) => ({
    label: text(s.label),
    value: fieldText(row, s.field, { decimals: typeof s.decimals === "number" ? s.decimals : 0, suffix: typeof s.suffix === "string" ? s.suffix : undefined }) || "-",
    ...(typeof s.toneField === "string" && s.toneField ? { tone: fieldTone(row, s.toneField) } : {}),
  }));
}

/** Props that only mean something on the live canvas. */
const LIVE_ONLY_PROPS = ["binding", "stateKey", "onValueChange"] as const;

/** Props this step derives from a binding (never read from the block). */
const RESOLVED_PROPS = ["selectedPoint", "record"] as const;

function executionOf(dataset: ReportDataset | null, reportState: ReportState): ExecutionView | null {
  try {
    return dataset ? resolveExecution(dataset, reportState) : null;
  } catch {
    return null;
  }
}

/** The execution chart leaves as a combination chart of its lines: percent
 *  done against the left axis, the prices against the right. (Its fills,
 *  bands and price tags are drawn by the canvas block and have no static
 *  equivalent in the chart helper; the venue panel carries the fills.) */
function materialiseExecutionChart(block: Block, view: ExecutionView | null): Block {
  const height = typeof block.props?.height === "number" ? block.props.height : 640;
  if (!view) return { ...block, type: "HighchartCombination", props: { chartType: "combination", panel: true, height, title: "Execution", categories: [], series: [] } };
  const across = view.times[view.times.length - 1] - view.times[0] > 36 * 60 * 60 * 1000;
  const price = (name: string, data: (number | null)[], dashStyle?: "Dash" | "Dot") => ({ name, type: "line" as const, yAxis: 1 as const, data, ...(dashStyle ? { dashStyle } : {}) });
  return {
    ...block,
    type: "HighchartCombination",
    props: {
      chartType: "combination", panel: true, height,
      title: `${view.pair} execution`,
      subtitle: `${view.interval} · ${view.range} · ${view.order.side} ${view.order.id}, ${view.order.pctDone}% done`,
      categories: view.times.map((t) => (across ? formatBarStamp(t) : formatBarTime(t, false))),
      series: [
        { name: "Percent done", type: "line" as const, data: view.pct },
        price("Bid", view.bid),
        price("Ask", view.ask),
        price("Limit price", view.limit, "Dash"),
        price("Avg market fill", view.avgFill),
      ],
      yAxisFormat: "{value}%",
      valueDecimals: 5,
    },
  };
}

/** The instrument header, as the text it shows. */
function materialiseInstrumentHeader(block: Block, view: ExecutionView | null): Block {
  const note = text(block.props?.note, "Sample data");
  if (!view || !view.last) return { ...block, props: { symbol: text(block.props?.symbol, "Instrument"), note } };
  const { last, order } = view;
  const change = formatChange(last.sessionChangePips, last.sessionChangePct);
  return {
    ...block,
    props: {
      symbol: view.pair, description: view.description, counter: `${order.fills}/${order.fillsTarget}`,
      figures: [["O", formatPrice(last.open)], ["H", formatPrice(last.high)], ["L", formatPrice(last.low)], ["C", formatPrice(last.close)]],
      change: change.text,
      changeTone: change.tone === "down" ? "bad" : "good",
      quote: { base: view.pair.slice(0, 3), sell: splitQuote(last.bid), buy: splitQuote(last.ask) },
      status: `${view.interval} ${view.chartStyle} · ${order.algo} · ${order.pctDone}% done`,
      orders: view.orders.map((o) => ({ id: o.id, side: o.side, status: o.status, active: o.id === order.id })),
      note,
    },
  };
}

export function materialiseBlock(block: Block, dataset: ReportDataset | null, reportState: ReportState): Block {
  if (block.type === "ExecutionChart") return materialiseExecutionChart(block, executionOf(dataset, reportState));
  if (block.type === "InstrumentHeader") return materialiseInstrumentHeader(block, executionOf(dataset, reportState));
  const source = block.props ?? {};
  const props: Record<string, unknown> = { ...source };
  for (const key of LIVE_ONLY_PROPS) delete props[key];
  /* Written below from the binding only: a stray prop of the same name must
     not pass as a resolved value. */
  for (const key of RESOLVED_PROPS) delete props[key];

  /* A report control shows the value held in report state. */
  const stateKey = typeof source.stateKey === "string" && source.stateKey ? source.stateKey : null;
  if (stateKey && reportState[stateKey] !== undefined) props.value = reportState[stateKey];

  /* A context bar's filters: each shows the value held in report state. */
  if (block.type === "ContextBar" && Array.isArray(source.filters)) {
    props.filters = (source.filters as Record<string, unknown>[]).map((f) => {
      const { stateKey: key, ...rest } = f;
      const held = typeof key === "string" ? reportState[key] : undefined;
      return held !== undefined ? { ...rest, value: held } : rest;
    });
  }

  /* A panel's "View by" select shows the current choice, else the first. */
  const viewBy = viewByOf(source);
  if (viewBy.length > 0) props.viewByValue = reportState[viewByStateKey(block.id)] ?? viewBy[0];

  const bound = resolveSafely(source.binding, dataset, reportState);
  if (bound?.view === "series") {
    props.categories = bound.categories;
    props.series = bound.series;
    /* The selected point (the others are dimmed), as the canvas passes it. */
    if (bound.selected) props.selectedPoint = bound.selected;
  } else if (bound?.view === "parts") {
    props.seriesData = bound.seriesData;
    if (bound.selected) props.selectedPoint = bound.selected;
    /* A custom inspector label wins; otherwise show the selected-currency total. */
    if (bound.centerValue !== null && !(typeof source.centerLabel === "string" && source.centerLabel.trim())) {
      props.centerLabel = formatGridValue(centerColumn(bound.centerMoney, reportState[CURRENCY_STATE] ?? dataset?.baseCurrency), bound.centerValue);
    }
  } else if (bound?.view === "grid") {
    props.columns = bound.columns;
    props.rows = bound.rows;
    if (bound.selected) props.selectedRow = bound.selected;
  } else if (bound?.view === "value") {
    /* A gauge bound to one figure. */
    if (bound.value !== null) props.value = bound.value;
  }

  /* A Record Panel shows the record a grid has selected: resolved here, with
     the current report state, into its title and sections. */
  if (block.type === RECORD_PANEL_BLOCK_TYPE) {
    const record = resolveRecordSafely(source.binding, dataset, reportState);
    if (record) props.record = record;
  }

  /* The blocks that show one row of a table: the row is read here. */
  if (block.type === "EntityHeader" || block.type === "MetricTile" || block.type === "VerdictCard") {
    const lookup = isRowLookup(source.binding) ? source.binding : null;
    const row = lookupRowSafely(lookup, dataset, reportState);
    if (block.type === "EntityHeader") { materialiseEntityHeader(props, source, row, lookup); materialiseEntitySuffix(props, source, dataset, reportState); }
    else if (block.type === "MetricTile") materialiseMetricTile(props, source, row, reportState);
    else materialiseVerdictCard(props, source, row);
  }

  const next: Block = { ...block, props };
  if (block.children && block.children.length) next.children = materialiseBlocks(block.children, dataset, reportState);
  return next;
}

export function materialiseBlocks(blocks: Block[], dataset: ReportDataset | null, reportState: ReportState): Block[] {
  return blocks.map((b) => materialiseBlock(b, dataset, reportState));
}

/** The four zones of the canvas, with every block static. */
export function materialiseCanvas(source: CanvasSource = useBuilder.getState()): MaterialisedCanvas {
  const dataset = canvasDataset(source);
  const state = source.reportState ?? {};
  return {
    header: materialiseBlocks(source.headerBlocks ?? [], dataset, state),
    sidebar: materialiseBlocks(source.sidebarBlocks ?? [], dataset, state),
    body: materialiseBlocks(source.blocks ?? [], dataset, state),
    footer: materialiseBlocks(source.footerBlocks ?? [], dataset, state),
  };
}
