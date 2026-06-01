import { describe, it, expect } from "vitest";
import {
  CHART_BLOCK_TYPES,
  isChartBlock,
  hasCharts,
  chartBlockJsx,
  chartImports,
  chartHelperSource,
} from "../export/chartExporter";
import type { Block } from "@/store/useBuilder";
import { CATEGORICAL_PALETTES } from "@/lib/categoricalPalettes";

function block(type: string, props: Record<string, unknown> = {}): Block {
  return { id: "x", type, props };
}

describe("chartExporter — isChartBlock / CHART_BLOCK_TYPES", () => {
  it("recognises SimulatedChart + all 12 Highchart* types", () => {
    expect(isChartBlock("SimulatedChart")).toBe(true);
    for (const t of [
      "HighchartLine", "HighchartArea", "HighchartColumn", "HighchartPie",
      "HighchartScatter", "HighchartBar", "HighchartDonut", "HighchartSpline",
      "HighchartStackedColumn", "HighchartGauge", "HighchartHeatmap", "HighchartTreemap",
    ]) {
      expect(isChartBlock(t)).toBe(true);
    }
    expect(CHART_BLOCK_TYPES.size).toBe(13);
  });

  it("rejects non-chart block types", () => {
    expect(isChartBlock("SimulatedButton")).toBe(false);
    expect(isChartBlock("Alert")).toBe(false);
    expect(isChartBlock("")).toBe(false);
  });
});

describe("chartExporter — hasCharts", () => {
  it("true when any chart type is present", () => {
    expect(hasCharts(["SimulatedButton", "HighchartPie"])).toBe(true);
    expect(hasCharts(["SimulatedChart"])).toBe(true);
  });
  it("false when no chart types are present", () => {
    expect(hasCharts(["SimulatedButton", "Alert"])).toBe(false);
    expect(hasCharts([])).toBe(false);
  });
});

describe("chartExporter — chartBlockJsx mapping", () => {
  it("maps a Highchart* block to its chartType + title + mode", () => {
    const jsx = chartBlockJsx(block("HighchartColumn", { chartType: "column", title: "Sales by Region" }), "light");
    expect(jsx).toBe('<ChartBlock type="column" title="Sales by Region" mode="light" />');
  });

  it("maps SimulatedChart (no chartType) to line", () => {
    const jsx = chartBlockJsx(block("SimulatedChart", { title: "Trend" }), "dark");
    expect(jsx).toBe('<ChartBlock type="line" title="Trend" mode="dark" />');
  });

  it("emits a numeric value attribute for gauges", () => {
    const jsx = chartBlockJsx(block("HighchartGauge", { chartType: "gauge", title: "System Health", value: 87 }), "light");
    expect(jsx).toContain('type="gauge"');
    expect(jsx).toContain("value={87}");
  });

  it("omits the title attribute when absent and defaults mode to light", () => {
    const jsx = chartBlockJsx(block("HighchartPie", { chartType: "pie" }));
    expect(jsx).toBe('<ChartBlock type="pie" mode="light" />');
  });

  it("escapes double quotes in the title", () => {
    const jsx = chartBlockJsx(block("HighchartLine", { chartType: "line", title: 'A "quoted" title' }), "light");
    expect(jsx).toContain("&quot;quoted&quot;");
    expect(jsx).not.toContain('title="A "quoted"');
  });
});

describe("chartExporter — chartImports content", () => {
  it("includes highcharts, react wrapper, and the 4 advanced modules", () => {
    const imports = chartImports();
    expect(imports).toContain('import Highcharts from "highcharts";');
    expect(imports).toContain('import HighchartsReact from "highcharts-react-official";');
    expect(imports.some((i) => i.includes("highcharts/highcharts-more"))).toBe(true);
    expect(imports.some((i) => i.includes("highcharts/modules/solid-gauge"))).toBe(true);
    expect(imports.some((i) => i.includes("highcharts/modules/heatmap"))).toBe(true);
    expect(imports.some((i) => i.includes("highcharts/modules/treemap"))).toBe(true);
  });
});

describe("chartExporter — chartHelperSource", () => {
  it("returns a standalone ChartBlock definition that renders HighchartsReact", () => {
    const src = chartHelperSource("salt");
    expect(src).toContain("function ChartBlock");
    expect(src).toContain("HighchartsReact highcharts={Highcharts} options={options}");
    /* HC v12: modules register via side-effect import — the old factory-call
       ceremony is removed. The helper is typed so the scaffold's strict tsc -b
       passes, and honours prefers-reduced-motion (a11y parity with the builder). */
    expect(src).not.toContain("ensureChartModules");
    expect(src).toContain("prefersReducedMotion");
    expect(src).toContain(': "light" | "dark"');
  });

  it("bakes the per-DS palette literally (no host import)", () => {
    const src = chartHelperSource("m3");
    expect(src).toContain(CATEGORICAL_PALETTES.m3[0]); // M3 primary purple #6750A4
    expect(src).not.toContain("getComputedStyle");
    expect(src).not.toContain("getPalette(");
  });

  it("covers all 12 chart-type cases + a default", () => {
    const src = chartHelperSource("fluent");
    for (const t of [
      '"line"', '"area"', '"column"', '"pie"', '"scatter"', '"bar"',
      '"donut"', '"spline"', '"stacked-column"', '"gauge"', '"heatmap"', '"treemap"',
    ]) {
      expect(src).toContain("case " + t + ":");
    }
    expect(src).toContain("default:");
  });
});
