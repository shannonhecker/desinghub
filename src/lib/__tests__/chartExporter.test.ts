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

describe("chartExporter — chartBlockJsx carries the canvas's domain data", () => {
  it("emits categories + series for axis charts (what the canvas renders is what exports)", () => {
    const jsx = chartBlockJsx(
      block("HighchartColumn", {
        chartType: "column",
        title: "Revenue by plan",
        categories: ["Free", "Pro", "Enterprise"],
        series: [{ name: "2025", data: [31, 46, 23] }],
      }),
      "light",
    );
    expect(jsx).toContain('categories={["Free","Pro","Enterprise"]}');
    expect(jsx).toContain('series={[{"name":"2025","data":[31,46,23]}]}');
  });

  it("emits seriesData for pie / donut charts", () => {
    const jsx = chartBlockJsx(
      block("HighchartDonut", { chartType: "donut", seriesData: [{ name: "Direct", y: 38 }, { name: "Organic", y: 62 }] }),
    );
    expect(jsx).toContain('seriesData={[{"name":"Direct","y":38},{"name":"Organic","y":62}]}');
  });

  it("emits position-indexed colour overrides, keeping holes so slot N still maps to series N", () => {
    const jsx = chartBlockJsx(block("HighchartLine", { chartType: "line", seriesColors: ["", "#FF0000"] }));
    expect(jsx).toContain('colors={["","#FF0000"]}');
  });

  it("omits the data attributes when the block has none (defaults render in the export)", () => {
    const jsx = chartBlockJsx(block("HighchartLine", { chartType: "line" }));
    expect(jsx).toBe('<ChartBlock type="line" mode="light" />');
  });

  it("drops malformed data instead of emitting broken TSX", () => {
    const jsx = chartBlockJsx(
      block("HighchartBar", {
        chartType: "bar",
        categories: ["ok", 42, null, ""],
        series: [{ name: "A", data: [1, "2", NaN, 3] }, { name: "no data" }, "junk"],
        seriesData: [{ name: "x", y: "1" }, { name: "y", y: 2 }],
        seriesColors: ["red", "#12345", "#ABCDEF", "javascript:alert(1)"],
      }),
    );
    expect(jsx).toContain('categories={["ok"]}');
    expect(jsx).toContain('series={[{"name":"A","data":[1,3]}]}');
    expect(jsx).toContain('seriesData={[{"name":"y","y":2}]}');
    expect(jsx).toContain('colors={["","","#ABCDEF",""]}');
    expect(jsx).not.toContain("javascript:");
  });

  it("escapes strings that could break out of the JSX expression", () => {
    const jsx = chartBlockJsx(
      block("HighchartLine", { chartType: "line", categories: ['a"b', "c</script>", "d\u2028e"] }),
    );
    expect(jsx).toContain('categories={["a\\"b","c</script>","d\\u2028e"]}');
    expect(jsx).not.toContain("\u2028");
  });
});

describe("chartExporter — chartHelperSource honours the data props", () => {
  it("ChartBlock accepts categories / series / seriesData / colors and threads them into the options", () => {
    const src = chartHelperSource("salt");
    expect(src).toContain("categories, series, seriesData, colors");
    expect(src).toContain("props.categories ??");
    expect(src).toContain('withType(props.series, "line"');
    expect(src).toContain('withType(props.series, "column"');
    expect(src).toContain("points(props.seriesData,");
    expect(src).toContain("chartColors(colors)");
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
