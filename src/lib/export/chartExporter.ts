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
import { CATEGORICAL_PALETTES, getPalette } from "@/lib/categoricalPalettes";
import type { SystemId } from "@/lib/componentApiRegistry";

/* ── Chart block types (SimulatedChart + the 12 Highchart* blocks) ── */
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

export function isChartBlock(type: string): boolean {
  return CHART_BLOCK_TYPES.has(type);
}

export function hasCharts(types: string[]): boolean {
  return types.some((t) => CHART_BLOCK_TYPES.has(t));
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
 */
export function chartBlockJsx(block: Block, mode: "light" | "dark" = "light"): string {
  const type = chartTypeOf(block);
  const title = block.props?.title;
  const value = block.props?.value;
  const parts = [`type="${attr(type)}"`];
  if (title != null && title !== "") parts.push(`title="${attr(title)}"`);
  if (typeof value === "number") parts.push(`value={${value}}`);
  parts.push(`mode="${mode}"`);
  return `<ChartBlock ${parts.join(" ")} />`;
}

/* ── Imports the exported file needs for Highcharts to run ── */
export function chartImports(): string[] {
  return [
    'import Highcharts from "highcharts";',
    'import HighchartsReact from "highcharts-react-official";',
    'import HighchartsMore from "highcharts/highcharts-more";',
    'import SolidGauge from "highcharts/modules/solid-gauge";',
    'import Heatmap from "highcharts/modules/heatmap";',
    'import Treemap from "highcharts/modules/treemap";',
  ];
}

/* ═══════════════════════════════════════════════════════════
   Standalone ChartBlock component source (returned as a string)
   ═══════════════════════════════════════════════════════════ */

/**
 * Paste-ready React component definition for the exported file.
 *
 * Bakes the active DS's 12-colour categorical palette and a neutral
 * light/dark theme. Faithful port of `chartOptions` covering all 12 chart
 * types + a default. Renders <HighchartsReact highcharts={Highcharts} ... />.
 */
export function chartHelperSource(system: SystemId): string {
  const palette = (CATEGORICAL_PALETTES as Record<string, string[]>)[system] ?? getPalette(system);
  const paletteLiteral = JSON.stringify(palette);

  return `/* ── ChartBlock: runnable Highcharts, baked ${system} palette + mode theme ── */
let __chartModulesReady = false;
function ensureChartModules() {
  if (__chartModulesReady || typeof window === "undefined") return;
  __chartModulesReady = true;
  [HighchartsMore, SolidGauge, Heatmap, Treemap].forEach((m) => {
    const init = typeof m === "function" ? m : (m && m.default);
    if (typeof init === "function") init(Highcharts);
  });
}

/* Baked ${system} categorical palette — first 4 slots are accent / positive /
   warning / negative; remaining slots round out rich charts. */
const CHART_PALETTE = ${paletteLiteral};

/* Neutral light/dark theme tokens. No CSS vars, no computed-style reads —
   exported code carries its own colours so charts render anywhere. */
function chartTheme(mode) {
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

function chartBaseTheme(v) {
  return {
    colors: CHART_PALETTE,
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
    plotOptions: { series: { borderWidth: 0 } },
    credits: { enabled: false },
  };
}

function chartOptionsFor(chartType, t, v, props) {
  const tc = t.chart, tt = t.title, tx = t.xAxis, ty = t.yAxis;
  switch (chartType) {
    case "line":
      return {
        ...t,
        chart: { ...tc, type: "line" },
        title: { ...tt, text: props.title || "Monthly Revenue" },
        xAxis: { ...tx, categories: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] },
        yAxis: { ...ty, title: { ...ty.title, text: "Revenue ($K)" } },
        series: [
          { name: "2024", data: [120, 134, 145, 152, 168, 185], type: "line" },
          { name: "2025", data: [140, 155, 162, 178, 195, 210], type: "line" },
        ],
      };
    case "area":
      return {
        ...t,
        chart: { ...tc, type: "area" },
        title: { ...tt, text: props.title || "User Growth" },
        xAxis: { ...tx, categories: ["Q1", "Q2", "Q3", "Q4"] },
        series: [
          { name: "Free", data: [5000, 8200, 12400, 18000], type: "area" },
          { name: "Pro", data: [1200, 2400, 4100, 6800], type: "area" },
        ],
        plotOptions: { ...t.plotOptions, area: { fillOpacity: 0.25 } },
      };
    case "column":
      return {
        ...t,
        chart: { ...tc, type: "column" },
        title: { ...tt, text: props.title || "Sales by Region" },
        xAxis: { ...tx, categories: ["NA", "EMEA", "APAC", "LATAM"] },
        series: [
          { name: "Q3", data: [420, 380, 290, 180], type: "column" },
          { name: "Q4", data: [480, 410, 340, 210], type: "column" },
        ],
      };
    case "pie":
      return {
        ...t,
        chart: { ...tc, type: "pie" },
        title: { ...tt, text: props.title || "Market Share" },
        series: [{
          name: "Share", type: "pie",
          data: [
            { name: "Product A", y: 45 },
            { name: "Product B", y: 26 },
            { name: "Product C", y: 17 },
            { name: "Other", y: 12 },
          ],
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
        xAxis: { ...tx, categories: ["Alice", "Bob", "Carol", "Dan", "Eve"] },
        series: [{ name: "Score", data: [95, 88, 82, 76, 71], type: "bar" }],
      };
    case "donut":
      return {
        ...t,
        chart: { ...tc, type: "pie" },
        title: { ...tt, text: props.title || "Breakdown" },
        series: [{
          name: "Share", type: "pie", innerSize: "60%",
          data: [
            { name: "Segment A", y: 42 },
            { name: "Segment B", y: 33 },
            { name: "Segment C", y: 25 },
          ],
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
        xAxis: { ...tx, categories: ["6am", "9am", "12pm", "3pm", "6pm", "9pm"] },
        series: [
          { name: "Today", data: [14, 18, 24, 27, 22, 16], type: "spline" },
          { name: "Yesterday", data: [12, 16, 22, 25, 20, 14], type: "spline" },
        ],
      };
    case "stacked-column":
      return {
        ...t,
        chart: { ...tc, type: "column" },
        title: { ...tt, text: props.title || "Revenue Breakdown" },
        xAxis: { ...tx, categories: ["Q1", "Q2", "Q3", "Q4"] },
        plotOptions: { ...t.plotOptions, column: { stacking: "normal" } },
        series: [
          { name: "Services", data: [120, 135, 148, 162], type: "column" },
          { name: "Products", data: [80, 95, 110, 125], type: "column" },
          { name: "Licensing", data: [40, 45, 52, 58], type: "column" },
        ],
      };
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
    case "heatmap":
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

function ChartBlock({ type = "line", title, value, mode = "light" }) {
  ensureChartModules();
  const v = chartTheme(mode);
  const options = chartOptionsFor(type, chartBaseTheme(v), v, { title, value });
  return (
    <div style={{ width: "100%", minHeight: 250 }}>
      <HighchartsReact highcharts={Highcharts} options={options} />
    </div>
  );
}
`;
}
