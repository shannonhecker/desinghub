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
import { CURRENCY_STATE, resolveBinding, type BoundData, type DataBinding, type ReportState } from "@/lib/reportData/binding";
import { sampleDataset } from "@/lib/reportData/registry";
import type { ReportDataset } from "@/lib/reportData/types";

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

/** Props that only mean something on the live canvas. */
const LIVE_ONLY_PROPS = ["binding", "stateKey", "onValueChange"] as const;

export function materialiseBlock(block: Block, dataset: ReportDataset | null, reportState: ReportState): Block {
  const source = block.props ?? {};
  const props: Record<string, unknown> = { ...source };
  for (const key of LIVE_ONLY_PROPS) delete props[key];

  /* A report control shows the value held in report state. */
  const stateKey = typeof source.stateKey === "string" && source.stateKey ? source.stateKey : null;
  if (stateKey && reportState[stateKey] !== undefined) props.value = reportState[stateKey];

  /* A panel's "View by" select shows the current choice, else the first. */
  const viewBy = viewByOf(source);
  if (viewBy.length > 0) props.viewByValue = reportState[viewByStateKey(block.id)] ?? viewBy[0];

  const bound = resolveSafely(source.binding, dataset, reportState);
  if (bound?.view === "series") {
    props.categories = bound.categories;
    props.series = bound.series;
  } else if (bound?.view === "parts") {
    props.seriesData = bound.seriesData;
    /* The donut's centre label is the total, in the selected currency. */
    if (bound.centerValue !== null) {
      props.centerLabel = formatGridValue(
        { field: "", header: "", kind: "currency", compact: true, currency: reportState[CURRENCY_STATE] ?? dataset?.baseCurrency },
        bound.centerValue,
      );
    }
  } else if (bound?.view === "grid") {
    props.columns = bound.columns;
    props.rows = bound.rows;
    if (bound.selected) props.selectedRow = bound.selected;
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
