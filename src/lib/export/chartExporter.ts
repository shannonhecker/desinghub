/**
 * Chart export bridge — emits RUNNABLE Highcharts code for exported React.
 *
 * The builder renders charts via `SimulatedHighchart.tsx`, which reads
 * `--ds-*` CSS variables off the live DOM with `getComputedStyle`. Exported
 * code has no builder host and no CSS-variable context, so this module ports
 * `chartOptions` + `baseTheme` into a STANDALONE `<ChartBlock>` component:
 *
 *   - per-DS categorical palette is BAKED in as a literal array (the export
 *     can't import the host's `categoricalPalettes.ts`);
 *   - light/dark theme colours are driven by a `mode` prop with neutral
 *     literal values — NO `getComputedStyle`, NO CSS vars;
 *   - the 4 advanced-chart modules (more / solid-gauge / heatmap / treemap)
 *     are registered once at module scope.
 *
 * `chartHelperSource(system)` returns the component definition as a STRING so
 * `reactExporter.ts` can append it to the generated file after the default
 * export. Charts in the canvas then emit `<ChartBlock type="line" ... />`.
 */

import type { Block } from "@/store/useBuilder";
import { CATEGORICAL_PALETTES } from "@/lib/categoricalPalettes";
import type { SystemId } from "@/lib/componentApiRegistry";
import { panelHeightOf } from "@/lib/panelMetrics";
import { GRID_TONES } from "@/lib/dataGridModel";
import { JSX_DIALECT, framedChartHeight, panelLines, panelSpecOf } from "./reportMarkup";

/* ── Chart block types (SimulatedChart + the 12 original Highchart* blocks) ── */
export const CHART_BLOCK_TYPES = new Set<string>([
  "SimulatedChart",
  "HighchartLine",
  "HighchartArea",
  "HighchartColumn",
  "HighchartPie",
  "HighchartScatter",
  "HighchartBar",
  "HighchartDonut",
  "HighchartSpline",
  "HighchartStackedColumn",
  "HighchartGauge",
  "HighchartHeatmap",
  "HighchartTreemap",
]);

/* The three chart blocks the report templates added. Kept as a second set
   because src/lib/__tests__/chartExporter.test.ts pins CHART_BLOCK_TYPES at
   13 entries; isChartBlock / hasCharts read both. (Merge the two and update
   that count when the test can change.) */
export const REPORT_CHART_BLOCK_TYPES = new Set<string>([
  "HighchartStackedBar",
  "HighchartStackedArea",
  "HighchartCombination",
  "HighchartWaterfall",
  "HighchartRadar",
  "HighchartCorridor",
]);

export function isChartBlock(type: string): boolean {
  return CHART_BLOCK_TYPES.has(type) || REPORT_CHART_BLOCK_TYPES.has(type);
}

export function hasCharts(types: string[]): boolean {
  return types.some(isChartBlock);
}

/* ── Map a chart block to its Highcharts chart-type string ──
 *   SimulatedChart has no chartType default → fall back to "line".
 *   Highchart* blocks carry their `chartType` in props. */
function chartTypeOf(block: Block): string {
  const ct = block.props?.chartType;
  if (typeof ct === "string" && ct) return ct;
  if (block.type === "SimulatedChart") return "line";
  return "line";
}

/** Escape a string for safe interpolation into a double-quoted JSX attribute. */
function attr(value: unknown): string {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, "&quot;");
}

/**
 * Emit the `<ChartBlock .../>` element for a chart block.
 * `mode` is supplied by the exporter from builder state; default "light".
 *
 * Example: `<ChartBlock type="line" title="Monthly Revenue" mode="light" />`
 *
 * A chart with `panel: true` is drawn inside a framed panel on the canvas
 * (PanelFrame): the export wraps the element in the same frame - a <section>
 * whose header holds the title and subtitle - and the chart drops its own
 * title and takes the height the frame leaves. The result is then several
 * lines (un-indented; the caller indents).
 */
export function chartBlockJsx(
  block: Block,
  mode: "light" | "dark" = "light",
  /* hideTitle: drop the in-chart title of an unframed chart (a chart drawn
     inside another block's panel, e.g. a record panel's trend). */
  opts: { hideTitle?: boolean } = {},
): string {
  const p = block.props ?? {};
  const type = chartTypeOf(block);
  const title = p.title;
  const value = p.value;
  const framed = p.panel === true;
  const parts = [`type="${attr(type)}"`];
  if (title != null && title !== "") parts.push(`title="${attr(title)}"`);
  if (typeof value === "number") parts.push(`value={${value}}`);
  parts.push(`mode="${mode}"`);
  /* Domain data + per-chart colour overrides. The canvas renders these via
     SimulatedHighchart (categories / series / seriesData / seriesColors); the
     export must carry the same data or an AI-filled "Revenue by plan" chart
     ships as the canned placeholder. Emitted as JSX expression literals. */
  const data = chartDataOf(block);
  if (data.categories) parts.push(`categories={${jsLiteral(data.categories)}}`);
  if (data.series) parts.push(`series={${jsLiteral(data.series)}}`);
  if (data.seriesData) parts.push(`seriesData={${jsLiteral(data.seriesData)}}`);
  if (data.colors) parts.push(`colors={${jsLiteral(data.colors)}}`);
  /* Display settings (mirrors HighchartBlockRenderer's prop reads). Each is
     emitted only when the block sets it, so a chart without them exports
     exactly as before. Strings go out as JS string literals: an axis format
     such as "{value}%" holds braces. */
  const height = framed ? framedChartHeight(block) : p.height != null ? panelHeightOf(p) : undefined;
  if (height !== undefined) parts.push(`height={${height}}`);
  if (framed || opts.hideTitle) parts.push("hideTitle");
  for (const key of ["yAxisFormat", "yAxisTitle", "secondaryAxisFormat", "secondaryAxisTitle", "centerLabel", "valueSuffix"] as const) {
    /* A suffix keeps its own spacing (" tCO2e"): it is appended to a number. */
    const text = key === "valueSuffix" ? suffixLabel(p[key]) : cleanLabel(p[key]);
    if (text !== null) parts.push(`${key}={${jsLiteral(text)}}`);
  }
  if (p.legend === false) parts.push("legend={false}");
  if (isFiniteNumber(p.yAxisMax)) parts.push(`yAxisMax={${p.yAxisMax}}`);
  if (isFiniteNumber(p.valueDecimals)) parts.push(`valueDecimals={${Math.max(0, Math.min(10, Math.round(p.valueDecimals)))}}`);
  /* Point-level settings (mirrors HighchartBlockRenderer): the gauge's scale,
     wrapped category labels, per-point colours and the selected point. */
  const points = chartPointSettingsOf(block);
  if (points.valueMax !== undefined) parts.push(`valueMax={${points.valueMax}}`);
  if (points.labelWrap) parts.push("labelWrap");
  if (points.pointColors) parts.push(`pointColors={${jsLiteral(points.pointColors)}}`);
  if (points.pointColorsByName) parts.push(`pointColorsByName={${jsLiteral(points.pointColorsByName)}}`);
  if (points.selected !== undefined) parts.push(`selected={${jsLiteral(points.selected)}}`);
  /* A labelled value axis (a rating trend) and the corridor's band name. */
  const shapes = chartShapeSettingsOf(block);
  if (shapes.yAxisCategories) parts.push(`yAxisCategories={${jsLiteral(shapes.yAxisCategories)}}`);
  if (shapes.bandName !== undefined) parts.push(`bandName={${jsLiteral(shapes.bandName)}}`);
  const chart = `<ChartBlock ${parts.join(" ")} />`;
  if (!framed) return chart;
  return panelLines(JSX_DIALECT, panelSpecOf(block), [chart]).join("\n");
}

/* ── Domain-data extraction (mirrors HighchartBlockRenderer's prop reads) ──
 *   Every value is validated to the exact shape the exported ChartBlock
 *   accepts so a malformed / hostile prop can't emit broken (or executable)
 *   TSX. Empty arrays are dropped so the export falls back to defaults. */
export interface ChartSeriesData {
  name: string;
  /* null = no value at that category (a gap), which keeps later values
     aligned with their categories. */
  data: (number | null)[];
  /* Combination chart: each series picks its mark, axis and dash. */
  type?: "column" | "line" | "spline" | "area";
  yAxis?: 0 | 1;
  dashStyle?: "Solid" | "Dash" | "ShortDash" | "Dot";
}

export interface ChartBlockData {
  categories?: string[];
  series?: ChartSeriesData[];
  /* isSum: a waterfall step that shows the running total. */
  seriesData?: { name: string; y: number; isSum?: true }[];
  colors?: string[];
}

/** The point-level settings a chart block can carry. */
export interface ChartPointSettings {
  /* Gauge: the top of its scale. */
  valueMax?: number;
  labelWrap?: boolean;
  /* A tone name ("good" | "mid" | "bad" | "neutral" | "accent"), which the
     exported helper resolves against its theme, or a CSS colour. */
  pointColors?: string[];
  pointColorsByName?: Record<string, string>;
  /* Name of the selected point (from the chart's binding; materialise.ts). */
  selected?: string;
}

const MAX_CHART_ITEMS = 200;
const MAX_LABEL_LENGTH = 120;
const SERIES_TYPES = new Set(["column", "line", "spline", "area"]);
const DASH_STYLES = new Set(["Solid", "Dash", "ShortDash", "Dot"]);
const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}
function cleanLabel(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, MAX_LABEL_LENGTH);
}
/** A value suffix: like cleanLabel, but its own spacing is kept. */
function suffixLabel(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.slice(0, MAX_LABEL_LENGTH) : null;
}

const CSS_COLOR_RE = /^(?:[a-zA-Z]{3,30}|(?:rgb|hsl)a?\([0-9\s.,%/-]{1,60}\))$/;
/** A point colour: a tone name, a hex colour, a named colour or an rgb() /
 *  hsl() value. Anything else is dropped (the point keeps its own colour). */
function cleanPointColor(v: unknown): string {
  if (typeof v !== "string") return "";
  const t = v.trim();
  return (GRID_TONES as readonly string[]).includes(t) || HEX_COLOR_RE.test(t) || CSS_COLOR_RE.test(t) ? t : "";
}

export function chartPointSettingsOf(block: Block): ChartPointSettings {
  const props = block.props ?? {};
  const out: ChartPointSettings = {};
  if (isFiniteNumber(props.valueMax) && props.valueMax > 0) out.valueMax = props.valueMax;
  if (props.labelWrap === true) out.labelWrap = true;
  if (Array.isArray(props.pointColors)) {
    /* Position-indexed: holes stay as "" so slot N still maps to point N. */
    const colors = props.pointColors.slice(0, MAX_CHART_ITEMS).map(cleanPointColor);
    if (colors.some(Boolean)) out.pointColors = colors;
  }
  if (props.pointColorsByName && typeof props.pointColorsByName === "object" && !Array.isArray(props.pointColorsByName)) {
    const byName: Record<string, string> = {};
    for (const [rawName, rawColor] of Object.entries(props.pointColorsByName as Record<string, unknown>).slice(0, MAX_CHART_ITEMS)) {
      const name = cleanLabel(rawName);
      const color = cleanPointColor(rawColor);
      if (name !== null && color) byName[name] = color;
    }
    if (Object.keys(byName).length) out.pointColorsByName = byName;
  }
  const selected = cleanLabel(props.selectedPoint);
  if (selected !== null) out.selected = selected;
  return out;
}

/** True when a chart block needs the extended chart helper: the waterfall
 *  type, the score / framed gauge, wrapped labels, per-point colours or a
 *  selected point. A canvas with none of these gets the helper as it was. */
export function usesExtendedChart(block: Block): boolean {
  if (!isChartBlock(block.type)) return false;
  const p = block.props ?? {};
  const type = chartTypeOf(block);
  if (type === "waterfall") return true;
  if (type === "gauge" && (p.panel === true || isFiniteNumber(p.valueDecimals) || suffixLabel(p.valueSuffix) !== null)) return true;
  return Object.keys(chartPointSettingsOf(block)).length > 0;
}

/** What the radar / corridor types and a labelled value axis add to a chart block. */
export interface ChartShapeSettings {
  /* Labels for a value axis whose values are positions on a scale. Position-
     indexed: an unusable entry stays as "" so label N still names value N. */
  yAxisCategories?: string[];
  /* corridor: the name of the band between its two lines. */
  bandName?: string;
}

export function chartShapeSettingsOf(block: Block): ChartShapeSettings {
  const props = block.props ?? {};
  const out: ChartShapeSettings = {};
  if (Array.isArray(props.yAxisCategories)) {
    const labels = props.yAxisCategories.slice(0, MAX_CHART_ITEMS).map((l) => cleanLabel(typeof l === "number" && Number.isFinite(l) ? String(l) : l) ?? "");
    if (labels.some(Boolean)) out.yAxisCategories = labels;
  }
  const band = chartTypeOf(block) === "corridor" ? cleanLabel(props.bandName) : null;
  if (band !== null) out.bandName = band;
  return out;
}

/** True when a chart block needs the radar / corridor part of the chart
 *  helper: one of the two types, or a labelled value axis. A canvas with none
 *  of these gets the helper as it was. */
export function usesShapeChart(block: Block): boolean {
  if (!isChartBlock(block.type)) return false;
  const type = chartTypeOf(block);
  return type === "radar" || type === "corridor" || chartShapeSettingsOf(block).yAxisCategories !== undefined;
}

export function chartDataOf(block: Block): ChartBlockData {
  const props = block.props ?? {};
  const out: ChartBlockData = {};

  if (Array.isArray(props.categories)) {
    const cats = props.categories.slice(0, MAX_CHART_ITEMS).map(cleanLabel).filter((c): c is string => c !== null);
    if (cats.length) out.categories = cats;
  }

  if (Array.isArray(props.series)) {
    const series: ChartSeriesData[] = [];
    for (const s of props.series.slice(0, MAX_CHART_ITEMS)) {
      if (typeof s !== "object" || s === null) continue;
      const r = s as Record<string, unknown>;
      const name = cleanLabel(r.name) ?? "Series";
      if (!Array.isArray(r.data)) continue;
      /* Finite numbers and explicit nulls (gaps) are kept; anything else is dropped. */
      const data = r.data.slice(0, MAX_CHART_ITEMS).filter((v): v is number | null => v === null || isFiniteNumber(v));
      if (!data.some(isFiniteNumber)) continue;
      const entry: ChartSeriesData = { name, data };
      if (typeof r.type === "string" && SERIES_TYPES.has(r.type)) entry.type = r.type as ChartSeriesData["type"];
      if (r.yAxis === 0 || r.yAxis === 1) entry.yAxis = r.yAxis;
      if (typeof r.dashStyle === "string" && DASH_STYLES.has(r.dashStyle)) entry.dashStyle = r.dashStyle as ChartSeriesData["dashStyle"];
      series.push(entry);
    }
    if (series.length) out.series = series;
  }

  if (Array.isArray(props.seriesData)) {
    const waterfall = chartTypeOf(block) === "waterfall";
    const points: { name: string; y: number; isSum?: true }[] = [];
    for (const d of props.seriesData.slice(0, MAX_CHART_ITEMS)) {
      if (typeof d !== "object" || d === null) continue;
      const r = d as Record<string, unknown>;
      const name = cleanLabel(r.name);
      if (name === null || !isFiniteNumber(r.y)) continue;
      /* Only a waterfall reads isSum (its closing bar). */
      points.push(r.isSum === true && waterfall ? { name, y: r.y, isSum: true } : { name, y: r.y });
    }
    if (points.length) out.seriesData = points;
  }

  if (Array.isArray(props.seriesColors)) {
    /* Position-indexed: keep holes as "" so slot N still maps to series N;
       the exported helper falls back to the palette for empty slots. */
    const colors = props.seriesColors
      .slice(0, 12)
      .map((c) => (typeof c === "string" && HEX_COLOR_RE.test(c.trim()) ? c.trim() : ""));
    if (colors.some(Boolean)) out.colors = colors;
  }

  return out;
}

/** Serialise validated chart data as a JS literal for a JSX `{...}` slot.
 *  Inputs are already shape-checked (strings / finite numbers only), so
 *  JSON.stringify yields a valid TS expression. U+2028/2029 are escaped
 *  defensively since JSON allows them raw inside strings. */
function jsLiteral(v: unknown): string {
  return JSON.stringify(v).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

/* ── Imports the exported file needs for Highcharts to run ── */
export function chartImports(): string[] {
  return [
    'import Highcharts from "highcharts";',
    'import HighchartsReact from "highcharts-react-official";',
    /* Highcharts v12: a module import is a side effect that augments the
       Highcharts namespace — there is no factory function to call. */
    'import "highcharts/highcharts-more";',
    'import "highcharts/modules/solid-gauge";',
    'import "highcharts/modules/heatmap";',
    'import "highcharts/modules/treemap";',
  ];
}

/* ═══════════════════════════════════════════════════════════
   Standalone ChartBlock component source (returned as a string)
   ═══════════════════════════════════════════════════════════ */

/* ── Extended helper parts ──
   Spliced into the helper only when the canvas uses them (usesExtendedChart),
   so a canvas without a waterfall, a score gauge, per-point colours or a
   selected point gets the helper exactly as it was. Ports of the same code in
   SimulatedHighchart.tsx (chartOptions "waterfall" / "gauge", applyPointStyling,
   themePointColor). No template literals inside: this is source text. */

const EXT_PROPS = `  /* Gauge: the top of its scale (default 100, shown as a percentage). */
  valueMax?: number;
  /* Wrap long category labels instead of rotating them. */
  labelWrap?: boolean;
  /* One colour per point of the first series. A tone name - "good", "mid",
     "bad", "neutral", "accent" - follows the theme; anything else is a CSS
     colour. "" keeps the point's own colour. */
  pointColors?: string[];
  /* The same, by point name. */
  pointColorsByName?: Record<string, string>;
  /* Name of the selected point; the others are dimmed. */
  selected?: string;
`;

const EXT_WATERFALL_CASE = `    /* Steps that add to or take from a running total, then a sum bar. A part
       flagged isSum shows the running total at that point. */
    case "waterfall": {
      const steps: ChartPoint[] = props.seriesData && props.seriesData.length ? props.seriesData : [
        { name: "Opening", y: 1200 },
        { name: "New", y: 340 },
        { name: "Churn", y: -180 },
        { name: "Expansion", y: 120 },
        { name: "Closing", y: 0, isSum: true },
      ];
      return {
        ...t,
        chart: { ...tc, type: "waterfall" },
        title: { ...tt, text: props.title || "Bridge" },
        xAxis: { ...tx, type: "category", categories: steps.map((s) => s.name) },
        legend: { enabled: false },
        series: [{
          name: props.title || "Value",
          type: "waterfall",
          data: steps.map((s) => (s.isSum ? { name: s.name, isSum: true } : { name: s.name, y: s.y })),
          lineWidth: 1,
          lineColor: v.border,
          dashStyle: "Dot",
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            inside: false,
            style: { fontSize: "11px", fontWeight: "500", color: v.fgSec, textOutline: "none" },
          },
        }],
      };
    }
`;

const EXT_FUNCTIONS = `/* A point colour: a tone name resolved against the theme, or a CSS colour. */
function themePointColor(color: string, v: ReturnType<typeof chartTheme>): string {
  switch (color) {
    case "good": return v.positive;
    case "mid": return v.warning;
    case "bad": return v.negative;
    case "accent": return v.primary;
    case "neutral": return v.fgTer;
    default: return color;
  }
}

/* Opacity of the points that are not the selected one. */
const DIMMED_POINT_OPACITY = 0.28;

/* Per-point colours and selection for the first series: every point gets an
   explicit colour (from pointColors / pointColorsByName, else the palette or
   series colour), dimmed when another point is selected. */
function applyPointStyling(o: any, v: ReturnType<typeof chartTheme>, props: ChartProps, colorByPoint: boolean) {
  const series = o.series && o.series[0];
  if (!series || !Array.isArray(series.data)) return;
  const byIndex = props.pointColors ?? [];
  const byName = props.pointColorsByName ?? {};
  if (!byIndex.some(Boolean) && !props.selected && Object.keys(byName).length === 0) return;
  const palette: string[] = (o.colors ?? []).filter(Boolean);
  const categories: string[] = (o.xAxis && !Array.isArray(o.xAxis) && o.xAxis.categories) || [];
  series.data = series.data.map((point: any, i: number) => {
    const obj = point !== null && typeof point === "object" && !Array.isArray(point) ? { ...point } : { y: point };
    const name = String(obj.name ?? categories[i] ?? "");
    const own = byIndex[i] || byName[name];
    const base = own
      ? themePointColor(own, v)
      : obj.color ?? (colorByPoint ? palette[i % Math.max(1, palette.length)] : series.color ?? palette[0]) ?? v.primary;
    const dimmed = Boolean(props.selected) && name !== props.selected;
    return { ...obj, color: dimmed ? Highcharts.color(base).setOpacity(DIMMED_POINT_OPACITY).get("rgba") : base };
  });
}

/* The gauge's scale and reading. A score gauge names its own scale
   (valueMax: 10) and decimals; with neither it is the percentage dial. In a
   framed panel the dome uses the room the title would have taken. */
function applyGaugeSettings(o: any, v: ReturnType<typeof chartTheme>, props: ChartProps) {
  const max = props.valueMax ?? 100;
  const suffix = props.valueSuffix ?? (props.valueMax === undefined ? "%" : "");
  const number = props.valueDecimals !== undefined ? "{y:." + props.valueDecimals + "f}" : "{y}";
  const framed = Boolean(props.hideTitle);
  o.tooltip = { enabled: false };
  o.pane = {
    ...o.pane,
    center: ["50%", framed ? "80%" : "70%"],
    size: framed ? "125%" : "100%",
    /* The track: a wash of the text colour. */
    background: [{ ...o.pane.background[0], backgroundColor: Highcharts.color(v.fg).setOpacity(0.1).get("rgba") }],
  };
  o.yAxis = { ...o.yAxis, max };
  o.series = o.series.map((s: any) => ({
    ...s,
    dataLabels: {
      ...s.dataLabels,
      format: '<span style="font-size:22px;font-weight:600;color:' + v.fg + '">' + number + suffix + "</span>",
    },
  }));
}

`;

const EXT_GAUGE_CALL = `  if (chartType === "gauge") applyGaugeSettings(o, v, props);
`;

const EXT_SETTINGS = `  if (props.labelWrap && o.xAxis && !Array.isArray(o.xAxis)) {
    const x = { ...o.xAxis };
    x.labels = { ...x.labels, autoRotation: undefined, style: { ...(x.labels && x.labels.style), textOverflow: "none" } };
    o.xAxis = x;
  }
  applyPointStyling(o, v, props, chartType === "pie" || chartType === "donut" || chartType === "waterfall");
`;

/* ── Radar, corridor and the labelled value axis ──
   Spliced into the helper only when the canvas uses them (usesShapeChart).
   Ports of the same code in SimulatedHighchart.tsx (chartOptions "radar" /
   "corridor", and the yAxisCategories step of buildChartOptions). Polar charts
   and the arearange band need highcharts/highcharts-more, which chartImports()
   always loads. No template literals inside: this is source text. */

const SHAPE_PROPS = `  /* Labels for a value axis whose values are positions on a scale (a rating
     trend: 0 = "CCC" ... 6 = "AAA"). */
  yAxisCategories?: string[];
  /* corridor: the name of the band between its two lines. */
  bandName?: string;
`;

const SHAPE_CASES = `    /* A spider chart: one spoke per category, a polygon grid, lines that
       close on themselves. */
    case "radar": {
      const series: ChartSeries[] = props.series && props.series.length ? props.series : [
        { name: "This year", data: [62, 48, 71, 55, 66, 59] },
        { name: "Last year", data: [54, 52, 60, 49, 58, 63], dashStyle: "ShortDash" },
      ];
      return {
        ...t,
        chart: { ...tc, polar: true, type: "line" },
        title: { ...tt, text: props.title || "Capability profile" },
        pane: { size: "78%" },
        xAxis: {
          ...tx,
          categories: cats(["Quality", "Speed", "Cost", "Coverage", "Support", "Reach"]),
          tickmarkPlacement: "on",
          lineWidth: 0,
          gridLineColor: v.border,
        },
        yAxis: { ...ty, gridLineInterpolation: "polygon", lineWidth: 0, min: 0, gridLineColor: v.border },
        tooltip: { ...t.tooltip, shared: true },
        series: series.map((s) => ({ ...s, type: "line", pointPlacement: "on", marker: { enabled: true, radius: 3 } })),
      };
    }
    /* A ceiling (dashed), a path under it, and the room between them as a
       band. Series: [ceiling, path]. */
    case "corridor": {
      const pair: ChartSeries[] = props.series && props.series.length ? props.series : [
        { name: "Budget", data: [40, 36, 32, 28, 24, 20, 16, 12, 8, 4, 0] },
        { name: "Projected", data: [34, 30, 27, 23, 20, 16, 13, 10, 6, 3, 0] },
      ];
      const ceiling: ChartSeries | undefined = pair[0];
      const path: ChartSeries | undefined = pair[1];
      const upper = ceiling ? ceiling.data : [];
      const lower = path ? path.data : [];
      const band = upper.map((u, i) => [lower[i] ?? null, u]);
      const c0: string = t.colors[0] || v.primary;
      const c1: string = t.colors[1] || v.positive;
      return {
        ...t,
        chart: { ...tc, type: "line" },
        title: { ...tt, text: props.title || "Pathway" },
        xAxis: { ...tx, categories: cats(["2030", "2032", "2034", "2036", "2038", "2040", "2042", "2044", "2046", "2048", "2050"]) },
        yAxis: { ...ty, min: 0 },
        tooltip: { ...t.tooltip, shared: true },
        series: [
          { type: "line", name: ceiling ? ceiling.name : "Ceiling", data: upper, dashStyle: "Dash", color: c0, marker: { enabled: false } },
          { type: "arearange", name: props.bandName || "Headroom", data: band, color: c0, fillOpacity: 0.16, lineWidth: 0, marker: { enabled: false }, enableMouseTracking: false },
          { type: "area", name: path ? path.name : "Path", data: lower, color: c1, fillOpacity: 0.14, marker: { enabled: false } },
        ],
      };
    }
`;

const SHAPE_SETTINGS = `  /* A value axis on a scale: its positions are shown as labels, on the axis
     and in the tooltip. */
  if (props.yAxisCategories && props.yAxisCategories.length && o.yAxis && !Array.isArray(o.yAxis)) {
    const labels = props.yAxisCategories;
    o.yAxis = { ...o.yAxis, categories: labels, min: 0, max: labels.length - 1, tickInterval: 1, title: { ...o.yAxis.title, text: undefined } };
    o.tooltip = {
      ...o.tooltip,
      shared: true,
      formatter: function (this: any) {
        const shown: any[] = this.points ?? [this];
        return "<b>" + (this.x ?? this.key ?? "") + "</b><br/>" +
          shown.map((p: any) => p.series.name + ": <b>" + (labels[Math.round(p.y)] ?? p.y) + "</b>").join("<br/>");
      },
    };
  }
`;

/**
 * Paste-ready React component definition for the exported file.
 *
 * Bakes the active DS's 12-colour categorical palette and a neutral
 * light/dark theme. Faithful port of `buildChartOptions` covering all 15 chart
 * types + a default. Renders <HighchartsReact highcharts={Highcharts} ... />.
 *
 * `extended` adds what the newer chart features need (the waterfall type, the
 * score / framed gauge, wrapped labels, per-point colours, the selected
 * point). Without it the helper is exactly the one earlier exports shipped.
 *
 * `shapes` adds the radar and corridor types, the corridor's band name and the
 * labelled value axis, the same way: without it nothing changes.
 */
export function chartHelperSource(system: SystemId, opts: { extended?: boolean; shapes?: boolean } = {}): string {
  const palette = CATEGORICAL_PALETTES[system];
  const paletteLiteral = JSON.stringify(palette);
  const x = opts.extended === true;
  const sh = opts.shapes === true;

  return `/* ── ChartBlock: runnable Highcharts, baked ${system} palette + mode theme ──
   Highcharts modules register via side-effect imports at the top of the exported
   file (HC v12: importing the module augments Highcharts; no factory to call). */

/* Reduced-motion: exported charts honour the OS setting, matching the builder. */
function prefersReducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Baked ${system} categorical palette — first 4 slots are accent / positive /
   warning / negative; remaining slots round out rich charts. */
const CHART_PALETTE = ${paletteLiteral};

/* Neutral light/dark theme tokens. No CSS vars, no computed-style reads —
   exported code carries its own colours so charts render anywhere. */
function chartTheme(mode: "light" | "dark") {
  const dark = mode === "dark";
  return {
    primary: CHART_PALETTE[0],
    bg: dark ? "#101820" : "#FFFFFF",
    fg: dark ? "#E2E4E5" : "#1A1F24",
    fgSec: dark ? "#B0B4B8" : "#5A6168",
    fgTer: dark ? "#808488" : "#8A9197",
    surface: dark ? "#1C2830" : "#F4F6F8",
    border: dark ? "#3C4850" : "#D6DBDF",
    positive: CHART_PALETTE[1],
    warning: CHART_PALETTE[2],
    negative: CHART_PALETTE[3],
  };
}

/* Per-chart colour overrides overlay the palette slot-for-slot; empty slots
   keep the DS palette colour (same rule as the builder canvas). */
function chartColors(overrides?: string[]) {
  return CHART_PALETTE.map((p, i) => (overrides && overrides[i]) || p);
}

function chartBaseTheme(v: ReturnType<typeof chartTheme>, colors: string[]) {
  return {
    colors,
    chart: { backgroundColor: "transparent", style: { fontFamily: "inherit" }, height: 250 },
    title: { style: { color: v.fg, fontSize: "13px", fontWeight: "600" }, align: "left" },
    xAxis: {
      gridLineColor: "transparent",
      lineColor: v.border,
      tickColor: v.border,
      labels: { style: { color: v.fgTer, fontSize: "10px" } },
      title: { style: { color: v.fgSec, fontSize: "10px" } },
    },
    yAxis: {
      gridLineColor: v.border + "30",
      lineColor: "transparent",
      tickColor: "transparent",
      labels: { style: { color: v.fgTer, fontSize: "10px" } },
      title: { style: { color: v.fgSec, fontSize: "10px" } },
    },
    tooltip: {
      backgroundColor: v.surface,
      borderColor: v.border,
      style: { color: v.fg, fontSize: "11px" },
      borderRadius: 6,
    },
    legend: {
      itemStyle: { color: v.fgSec, fontSize: "10px", fontWeight: "500" },
      itemHoverStyle: { color: v.fg },
    },
    plotOptions: { series: { borderWidth: 0, animation: prefersReducedMotion() ? false : { duration: 500 } } },
    credits: { enabled: false },
  };
}

/* One data series. type / yAxis / dashStyle only matter to the combination
   chart, where each series picks its own mark and axis. */
type ChartSeries = {
  name: string;
  data: (number | null)[];
  type?: "column" | "line" | "spline" | "area";
  yAxis?: 0 | 1;
  dashStyle?: "Solid" | "Dash" | "ShortDash" | "Dot";
};
type ChartPoint = { name: string; y: number${x ? "; isSum?: boolean" : ""} };
type ChartProps = {
  title?: string;
  value?: number;
  /* Domain data supplied by the canvas (template / model). When absent the
     chart renders its illustrative default so the export always runs. */
  categories?: string[];
  series?: ChartSeries[];
  seriesData?: ChartPoint[];
  /* Chart height in px (default 250). */
  height?: number;
  /* Drop the in-chart title (a framed panel shows it in its header). */
  hideTitle?: boolean;
  /* Highcharts label format for the value axis, e.g. "{value}%". */
  yAxisFormat?: string;
  yAxisTitle?: string;
  /* Right-hand axis of a combination chart. */
  secondaryAxisFormat?: string;
  secondaryAxisTitle?: string;
  /* Text drawn in the middle of a donut (e.g. a total). */
  centerLabel?: string;
  /* false hides the legend. */
  legend?: boolean;
  /* Upper bound of the value axis (e.g. 100 for shares of a whole). */
  yAxisMax?: number;
  /* Tooltip number format: decimal places and a suffix such as "%". */
  valueDecimals?: number;
  valueSuffix?: string;
${x ? EXT_PROPS : ""}${sh ? SHAPE_PROPS : ""}};

function withType(series: ChartSeries[] | undefined, type: string, fallback: any[]): any[] {
  return series && series.length ? series.map((s) => ({ ...s, type })) : fallback;
}
function points(data: ChartPoint[] | undefined, fallback: ChartPoint[]): ChartPoint[] {
  return data && data.length ? data : fallback;
}

function chartOptionsFor(chartType: string, t: any, v: ReturnType<typeof chartTheme>, props: ChartProps): any {
  const tc = t.chart, tt = t.title, tx = t.xAxis, ty = t.yAxis;
  const cats = (fallback: string[]) => props.categories ?? fallback;
  switch (chartType) {
    case "line":
      return {
        ...t,
        chart: { ...tc, type: "line" },
        title: { ...tt, text: props.title || "Monthly Revenue" },
        xAxis: { ...tx, categories: cats(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]) },
        yAxis: { ...ty, title: { ...ty.title, text: "Revenue ($K)" } },
        series: withType(props.series, "line", [
          { name: "2024", data: [120, 134, 145, 152, 168, 185], type: "line" },
          { name: "2025", data: [140, 155, 162, 178, 195, 210], type: "line" },
        ]),
      };
    case "area":
      return {
        ...t,
        chart: { ...tc, type: "area" },
        title: { ...tt, text: props.title || "User Growth" },
        xAxis: { ...tx, categories: cats(["Q1", "Q2", "Q3", "Q4"]) },
        series: withType(props.series, "area", [
          { name: "Free", data: [5000, 8200, 12400, 18000], type: "area" },
          { name: "Pro", data: [1200, 2400, 4100, 6800], type: "area" },
        ]),
        plotOptions: { ...t.plotOptions, area: { fillOpacity: 0.25 } },
      };
    case "column":
      return {
        ...t,
        chart: { ...tc, type: "column" },
        title: { ...tt, text: props.title || "Sales by Region" },
        xAxis: { ...tx, categories: cats(["NA", "EMEA", "APAC", "LATAM"]) },
        series: withType(props.series, "column", [
          { name: "Q3", data: [420, 380, 290, 180], type: "column" },
          { name: "Q4", data: [480, 410, 340, 210], type: "column" },
        ]),
      };
    case "pie":
      return {
        ...t,
        chart: { ...tc, type: "pie" },
        title: { ...tt, text: props.title || "Market Share" },
        series: [{
          name: "Share", type: "pie", innerSize: 0,
          data: points(props.seriesData, [
            { name: "Product A", y: 45 },
            { name: "Product B", y: 26 },
            { name: "Product C", y: 17 },
            { name: "Other", y: 12 },
          ]),
        }],
        plotOptions: {
          ...t.plotOptions,
          pie: {
            allowPointSelect: true,
            dataLabels: {
              enabled: true,
              format: "{point.name}: {point.percentage:.0f}%",
              style: { fontSize: "10px", color: v.fgSec, textOutline: "none" },
            },
          },
        },
      };
    case "scatter":
      return {
        ...t,
        chart: { ...tc, type: "scatter" },
        title: { ...tt, text: props.title || "Risk vs Return" },
        xAxis: { ...tx, title: { ...tx.title, text: "Risk (%)" } },
        yAxis: { ...ty, title: { ...ty.title, text: "Return (%)" } },
        series: [
          { name: "Equities", type: "scatter", data: [[8, 12], [10, 15], [12, 11], [15, 18], [6, 8], [9, 14]] },
          { name: "Bonds", type: "scatter", data: [[2, 3], [3, 4], [4, 5], [3, 3.5], [2.5, 4.2]] },
        ],
      };
    case "bar":
      return {
        ...t,
        chart: { ...tc, type: "bar" },
        title: { ...tt, text: props.title || "Top Performers" },
        xAxis: { ...tx, categories: cats(["Alice", "Bob", "Carol", "Dan", "Eve"]) },
        series: withType(props.series, "bar", [{ name: "Score", data: [95, 88, 82, 76, 71], type: "bar" }]),
      };
    case "donut":
      return {
        ...t,
        chart: { ...tc, type: "pie" },
        title: { ...tt, text: props.title || "Breakdown" },
        series: [{
          name: "Share", type: "pie", innerSize: "60%",
          data: points(props.seriesData, [
            { name: "Segment A", y: 42 },
            { name: "Segment B", y: 33 },
            { name: "Segment C", y: 25 },
          ]),
        }],
        plotOptions: {
          ...t.plotOptions,
          pie: {
            dataLabels: {
              enabled: true,
              format: "{point.name}: {point.percentage:.0f}%",
              style: { fontSize: "10px", color: v.fgSec, textOutline: "none" },
            },
          },
        },
      };
    case "spline":
      return {
        ...t,
        chart: { ...tc, type: "spline" },
        title: { ...tt, text: props.title || "Temperature Trend" },
        xAxis: { ...tx, categories: cats(["6am", "9am", "12pm", "3pm", "6pm", "9pm"]) },
        series: withType(props.series, "spline", [
          { name: "Today", data: [14, 18, 24, 27, 22, 16], type: "spline" },
          { name: "Yesterday", data: [12, 16, 22, 25, 20, 14], type: "spline" },
        ]),
      };
    case "stacked-column":
      return {
        ...t,
        chart: { ...tc, type: "column" },
        title: { ...tt, text: props.title || "Revenue Breakdown" },
        xAxis: { ...tx, categories: cats(["Q1", "Q2", "Q3", "Q4"]) },
        plotOptions: { ...t.plotOptions, column: { stacking: "normal" } },
        series: withType(props.series, "column", [
          { name: "Services", data: [120, 135, 148, 162], type: "column" },
          { name: "Products", data: [80, 95, 110, 125], type: "column" },
          { name: "Licensing", data: [40, 45, 52, 58], type: "column" },
        ]),
      };
    case "stacked-bar":
      return {
        ...t,
        chart: { ...tc, type: "bar" },
        title: { ...tt, text: props.title || "Exposure by currency" },
        xAxis: { ...tx, categories: cats(["USD", "EUR", "GBP", "JPY"]) },
        /* reversedStacks off so the segments run in legend order, left to right. */
        yAxis: { ...ty, reversedStacks: false },
        plotOptions: { ...t.plotOptions, bar: { stacking: "normal" } },
        series: props.series && props.series.length
          ? props.series.map((s) => ({ name: s.name, data: s.data, type: "bar" }))
          : [
              { name: "Bonds", data: [22, 14, 9, 4], type: "bar" },
              { name: "Equity", data: [31, 12, 11, 6], type: "bar" },
            ],
      };
    case "stacked-area":
      return {
        ...t,
        chart: { ...tc, type: "areaspline" },
        title: { ...tt, text: props.title || "Allocation history" },
        xAxis: { ...tx, categories: cats(["Q1", "Q2", "Q3", "Q4"]) },
        plotOptions: {
          ...t.plotOptions,
          areaspline: { stacking: "normal", fillOpacity: 0.5, lineWidth: 1, marker: { enabled: false } },
        },
        series: props.series && props.series.length
          ? props.series.map((s) => ({ name: s.name, data: s.data, type: "areaspline" }))
          : [
              { name: "Bonds", data: [38, 36, 37, 35], type: "areaspline" },
              { name: "Equity", data: [44, 47, 45, 48], type: "areaspline" },
              { name: "Private assets", data: [18, 17, 18, 17], type: "areaspline" },
            ],
      };
    /* Columns and lines on shared categories; each series chooses its mark
       and, optionally, the right-hand axis. */
    case "combination": {
      const series: ChartSeries[] = props.series && props.series.length ? props.series : [
        { name: "Active", data: [4.1, 4.4, 3.9, 4.8, 5.2, 4.9], type: "column", yAxis: 1 },
        { name: "Portfolio", data: [11.2, 11.9, 11.4, 12.6, 13.1, 12.8], type: "line" },
        { name: "Benchmark", data: [10.4, 10.8, 10.9, 11.7, 12.0, 11.9], type: "line", dashStyle: "ShortDash" },
      ];
      const hasSecondary = series.some((s) => s.yAxis === 1);
      const primaryAxis = {
        ...ty,
        title: { ...ty.title, text: props.yAxisTitle || undefined },
        labels: { ...ty.labels, ...(props.yAxisFormat ? { format: props.yAxisFormat } : {}) },
      };
      const secondaryAxis = {
        ...ty,
        opposite: true,
        gridLineWidth: 0,
        title: { ...ty.title, text: props.secondaryAxisTitle || undefined },
        labels: { ...ty.labels, ...(props.secondaryAxisFormat ? { format: props.secondaryAxisFormat } : {}) },
      };
      return {
        ...t,
        chart: { ...tc },
        title: { ...tt, text: props.title || "Value at risk" },
        xAxis: { ...tx, categories: cats(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]) },
        yAxis: hasSecondary ? [primaryAxis, secondaryAxis] : primaryAxis,
        tooltip: { ...t.tooltip, shared: true },
        plotOptions: {
          ...t.plotOptions,
          line: { marker: { enabled: false } },
          spline: { marker: { enabled: false } },
        },
        series: series.map((s) => ({
          name: s.name,
          data: s.data,
          type: s.type ?? "column",
          yAxis: hasSecondary ? (s.yAxis ?? 0) : 0,
          ...(s.dashStyle ? { dashStyle: s.dashStyle } : {}),
          /* Columns sit behind the lines. */
          zIndex: (s.type ?? "column") === "column" ? 1 : 2,
        })),
      };
    }
    case "gauge": {
      const val = props.value != null ? props.value : 87;
      return {
        ...t,
        chart: { ...tc, type: "solidgauge", height: 250 },
        title: { ...tt, text: props.title || "System Health" },
        pane: {
          center: ["50%", "70%"], size: "100%", startAngle: -90, endAngle: 90,
          background: [{
            backgroundColor: v.primary + "20",
            innerRadius: "60%", outerRadius: "100%",
            shape: "arc", borderWidth: 0,
          }],
        },
        yAxis: {
          min: 0, max: 100, lineWidth: 0, tickWidth: 0,
          minorTickInterval: null,
          labels: { enabled: false },
        },
        series: [{
          name: "Health", data: [val], type: "solidgauge",
          dataLabels: {
            format: '<span style="font-size:22px;font-weight:600;color:' + v.fg + '">{y}%</span>',
            borderWidth: 0, y: -20,
          },
          innerRadius: "60%", radius: "100%",
        }],
      };
    }
${x ? EXT_WATERFALL_CASE : ""}${sh ? SHAPE_CASES : ""}    case "heatmap":
      return {
        ...t,
        chart: { ...tc, type: "heatmap" },
        title: { ...tt, text: props.title || "Correlation Matrix" },
        xAxis: { ...tx, categories: ["A", "B", "C", "D"] },
        yAxis: { ...ty, categories: ["A", "B", "C", "D"], title: undefined, reversed: true },
        colorAxis: {
          min: -1, max: 1,
          stops: [[0, v.negative], [0.5, v.bg], [1, v.primary]],
        },
        series: [{
          name: "Correlation", type: "heatmap", borderWidth: 1,
          data: [
            [0, 0, 1], [0, 1, 0.8], [0, 2, 0.3], [0, 3, -0.2],
            [1, 0, 0.8], [1, 1, 1], [1, 2, 0.5], [1, 3, 0.1],
            [2, 0, 0.3], [2, 1, 0.5], [2, 2, 1], [2, 3, 0.7],
            [3, 0, -0.2], [3, 1, 0.1], [3, 2, 0.7], [3, 3, 1],
          ],
          dataLabels: {
            enabled: true, format: "{point.value:.1f}",
            style: { fontSize: "10px", textOutline: "none", color: v.fg },
          },
        }],
        legend: { enabled: false },
      };
    case "treemap":
      return {
        ...t,
        chart: { ...tc, type: "treemap" },
        title: { ...tt, text: props.title || "Portfolio Treemap" },
        series: [{
          type: "treemap", layoutAlgorithm: "squarified",
          data: [
            { name: "Tech", value: 35, colorValue: 1 },
            { name: "Healthcare", value: 20, colorValue: 2 },
            { name: "Finance", value: 18, colorValue: 3 },
            { name: "Energy", value: 12, colorValue: 4 },
            { name: "Consumer", value: 10, colorValue: 5 },
            { name: "Industrial", value: 5, colorValue: 6 },
          ],
        }],
      };
    default:
      return { ...t, title: { ...tt, text: props.title || "Chart" } };
  }
}

/* Donut centre label: a text kept centred on the ring. Runs on every redraw,
   so it follows a resize; shrinks to fit the hole and hides when too small. */
const CENTER_LABEL_FONT_SIZE = 15;
const CENTER_LABEL_MIN_FONT_SIZE = 9;
const CENTER_LABEL_FILL = 0.78;
function renderCenterLabel(this: any) {
  const chart = this;
  const center = chart.options && chart.options.chart && chart.options.chart.centerLabel;
  const series = chart.series && chart.series[0];
  if (!center || !series || !series.center) {
    chart.centerLabelText = chart.centerLabelText?.destroy();
    return;
  }
  if (!chart.centerLabelText) {
    chart.centerLabelText = chart.renderer.text(center.text, 0, 0).attr({ align: "center", zIndex: 5 }).add();
  }
  chart.centerLabelText.css({ color: center.color, fontSize: CENTER_LABEL_FONT_SIZE + "px", fontWeight: "600" });
  chart.centerLabelText.attr({ text: center.text, visibility: "inherit" });
  const hole = Number(series.center[3]) || 0;
  let box = chart.centerLabelText.getBBox();
  if (hole > 0 && box.width > hole * CENTER_LABEL_FILL) {
    const size = Math.floor((CENTER_LABEL_FONT_SIZE * hole * CENTER_LABEL_FILL) / box.width);
    if (size < CENTER_LABEL_MIN_FONT_SIZE) {
      chart.centerLabelText.attr({ visibility: "hidden" });
      return;
    }
    chart.centerLabelText.css({ fontSize: size + "px" });
    box = chart.centerLabelText.getBBox();
  }
  chart.centerLabelText.attr({ x: chart.plotLeft + series.center[0], y: chart.plotTop + series.center[1] + box.height / 4 });
}

/* Up to this many parts a framed pie's legend is shown whole; beyond it the
   legend pages so it cannot take the ring's space. */
const PIE_LEGEND_FREE_ITEMS = 6;
const PIE_LEGEND_MAX_HEIGHT = 56;

${x ? EXT_FUNCTIONS : ""}/* Options for one chart: the per-type build, then the settings every type
   shares (height, hidden title, legend, tooltip format, axis format, donut
   centre label). Each applies only when its prop is set. */
function chartOptionsWithSettings(chartType: string, t: any, v: ReturnType<typeof chartTheme>, props: ChartProps): any {
  const o = chartOptionsFor(chartType, t, v, props);
${x ? EXT_GAUGE_CALL : ""}  if (props.height) o.chart = { ...o.chart, height: props.height };
  if (props.hideTitle) o.title = { ...o.title, text: undefined };
  if (props.legend === false) o.legend = { ...o.legend, enabled: false };
  if (props.valueDecimals !== undefined || props.valueSuffix) {
    o.tooltip = {
      ...o.tooltip,
      ...(props.valueDecimals !== undefined ? { valueDecimals: props.valueDecimals } : {}),
      ...(props.valueSuffix ? { valueSuffix: props.valueSuffix } : {}),
    };
  }
  /* Value-axis format + title apply to the single-axis types; the combination
     chart builds its own pair of axes. */
  if (o.yAxis && !Array.isArray(o.yAxis) && chartType !== "gauge" && chartType !== "heatmap") {
    const y = { ...o.yAxis };
    if (props.yAxisFormat) y.labels = { ...y.labels, format: props.yAxisFormat };
    if (props.yAxisMax !== undefined) y.max = props.yAxisMax;
    if (props.yAxisTitle !== undefined || props.hideTitle) y.title = { ...y.title, text: props.yAxisTitle || undefined };
    o.yAxis = y;
  }
  /* A framed pie / donut names its parts in the legend, with their share,
     instead of leader-line labels that squeeze the ring in a compact panel. */
  if (props.hideTitle && (chartType === "donut" || chartType === "pie")) {
    const pie = { ...((o.plotOptions && o.plotOptions.pie) || {}), dataLabels: { enabled: false }, showInLegend: true };
    if (chartType === "donut") o.series = o.series.map((s: any) => ({ ...s, innerSize: "68%" }));
    o.plotOptions = { ...o.plotOptions, pie };
    const partCount = o.series && o.series[0] && Array.isArray(o.series[0].data) ? o.series[0].data.length : 0;
    o.legend = {
      ...o.legend,
      ...(partCount > PIE_LEGEND_FREE_ITEMS ? { maxHeight: PIE_LEGEND_MAX_HEIGHT } : {}),
      navigation: { activeColor: v.fg, inactiveColor: v.fgTer, style: { color: v.fgSec }, arrowSize: 9 },
      labelFormatter: function (this: any) {
        return this.percentage === undefined ? this.name : this.name + " " + Math.round(this.percentage) + "%";
      },
    };
  }
${sh ? SHAPE_SETTINGS : ""}${x ? EXT_SETTINGS : ""}  o.chart = {
    ...o.chart,
    centerLabel: props.centerLabel && chartType === "donut" ? { text: props.centerLabel, color: v.fg } : null,
    events: { ...o.chart.events, render: renderCenterLabel },
  };
  return o;
}

function ChartBlock({
  type = "line", title, value, mode = "light", categories, series, seriesData, colors,
  height, hideTitle, yAxisFormat, yAxisTitle, secondaryAxisFormat, secondaryAxisTitle, centerLabel, legend, yAxisMax, valueDecimals, valueSuffix,${x ? "\n  valueMax, labelWrap, pointColors, pointColorsByName, selected," : ""}${sh ? "\n  yAxisCategories, bandName," : ""}
}: ChartProps & { type?: string; mode?: "light" | "dark"; colors?: string[] }) {
  const v = chartTheme(mode);
  const options = chartOptionsWithSettings(type, chartBaseTheme(v, chartColors(colors)), v, {
    title, value, categories, series, seriesData,
    height, hideTitle, yAxisFormat, yAxisTitle, secondaryAxisFormat, secondaryAxisTitle, centerLabel, legend, yAxisMax, valueDecimals, valueSuffix,${x ? "\n    valueMax, labelWrap, pointColors, pointColorsByName, selected," : ""}${sh ? "\n    yAxisCategories, bandName," : ""}
  });
  return (
    <div style={{ width: "100%", minHeight: height ?? 250 }}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
`;
}
