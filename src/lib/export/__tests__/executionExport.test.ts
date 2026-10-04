import { describe, it, expect, beforeEach } from "vitest";
import ts from "typescript";
import { useBuilder, DEFAULT_ZONE_LAYOUTS } from "@/store/useBuilder";
import { applyTemplateToCanvas } from "@/lib/applyTemplate";
import { fxExecution } from "@/lib/executionTemplates";
import { EXECUTION_KEYS } from "@/lib/executionModel";
import { EXECUTION_ORDERS } from "@/lib/reportData/executionDataset";
import { exportReact } from "../reactExporter";
import { exportHTML } from "../htmlExporter";
import { materialiseCanvas } from "../materialise";

/* ════════════════════════════════════════════════════════════
   Code export of FX Execution: the instrument header as text, the
   execution chart as a combination chart of its lines, the three
   panels beside it, and nothing of the data layer in the output.
   ════════════════════════════════════════════════════════════ */

const SYSTEMS = ["salt", "m3", "fluent", "carbon", "uoaui"] as const;
const LIVE_NAMES = /useBuilder|reportState|resolve[A-Z]\w*\(|sampleDataset|selectState|stateKey|binding|fxOrder|fxInterval|\[object Object\]|NaN|undefined/;

function apply(ds: (typeof SYSTEMS)[number] = "salt") {
  applyTemplateToCanvas(fxExecution, ds);
  useBuilder.setState({ mode: "light" as never });
}
const reactMarkup = (tsx: string): string => { const i = tsx.indexOf("/* ── ChartBlock:"); return i === -1 ? tsx : tsx.slice(0, i); };
const htmlBody = (html: string): string => html.slice(html.indexOf("<body>"));
function tsxSyntaxErrors(source: string): string[] {
  const out = ts.transpileModule(source, { reportDiagnostics: true, fileName: "App.tsx", compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
  return (out.diagnostics ?? []).map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
}

beforeEach(() => {
  useBuilder.setState({ activeTemplateId: null, reportState: {}, reportData: null, expandedPanel: null, zoneLayouts: JSON.parse(JSON.stringify(DEFAULT_ZONE_LAYOUTS)) } as never);
});

describe("FX Execution: materialise", () => {
  it("the header leaves as text; the chart as a combination chart of its lines", () => {
    apply();
    const canvas = materialiseCanvas();
    const header = canvas.header[0];
    expect(header.type).toBe("InstrumentHeader");
    expect(header.props).toMatchObject({ symbol: "EURUSD", counter: "13/270", status: "1m Line · Percentile · 64% done", note: "Sample data" });
    expect((header.props.figures as string[][]).map((f) => f[0])).toEqual(["O", "H", "L", "C"]);
    expect((header.props.orders as { id: string; active: boolean }[]).map((o) => [o.id, o.active])).toEqual([[EXECUTION_ORDERS[0], true], [EXECUTION_ORDERS[1], false]]);
    expect(header.props).not.toHaveProperty("filters");

    const chart = canvas.body[0];
    expect(chart.type).toBe("HighchartCombination");
    expect(chart.props).toMatchObject({ chartType: "combination", panel: true, title: "EURUSD execution", height: fxExecution.body[0].props.height });
    const series = chart.props.series as { name: string; yAxis?: number; data: unknown[] }[];
    expect(series.map((s) => [s.name, s.yAxis ?? 0])).toEqual([["Percent done", 0], ["Bid", 1], ["Ask", 1], ["Limit price", 1], ["Avg market fill", 1]]);
    expect((chart.props.categories as string[]).length).toBe(150);
    expect(series.every((s) => s.data.length === 150)).toBe(true);
    expect(chart.props).not.toHaveProperty("filters");
    /* The layout is the block's own. */
    expect(chart.layout).toEqual(fxExecution.body[0].layout);
  });

  it("the export follows the report's state: the other order, a wider interval", () => {
    apply();
    const s = useBuilder.getState();
    s.setReportState(EXECUTION_KEYS.order, EXECUTION_ORDERS[1]);
    s.setReportState(EXECUTION_KEYS.interval, "5m");
    const canvas = materialiseCanvas();
    expect(canvas.header[0].props.status).toBe("5m Line · Percentile · 100% done");
    expect((canvas.body[0].props.categories as string[]).length).toBeLessThan(40);
    expect(String(canvas.body[0].props.subtitle)).toContain(`SELL ${EXECUTION_ORDERS[1]}`);
    expect((canvas.body[1].props.record as { title: string }).title).toBe(EXECUTION_ORDERS[1]);
  });
});

describe.each(SYSTEMS)("FX Execution: export in %s", (ds) => {
  it("React parses, HTML carries the same content, and nothing live leaks", () => {
    apply(ds);
    const tsx = exportReact();
    const html = exportHTML();
    expect(tsxSyntaxErrors(tsx)).toEqual([]);
    for (const [out, cls] of [[reactMarkup(tsx), "className"], [htmlBody(html), "class"]] as const) {
      expect(out).toContain(`<h1 ${cls}="instrument-symbol">EURUSD</h1>`);
      expect(out).toContain("<dt>O</dt>");
      expect(out).toMatch(/<li aria-current="true"><strong>BUY<\/strong> FO-0002LQD <span>Working<\/span><\/li>/);
      expect(out).toContain("Passive / aggressive");
      expect(out).toContain("Venue analysis");
      expect(out).toContain("Slippage vs arrival");
      expect(out).toMatch(/[+-]\d\.\d\d pips/);
      expect(out).not.toMatch(LIVE_NAMES);
      /* Every block is drawn: no placeholder for an unknown type. */
      expect(out).not.toMatch(/\{\/\* [A-Z]\w+ \*\/\}<\/div>|<!-- [A-Z]\w+ --><\/div>/);
    }
    expect(reactMarkup(tsx)).toMatch(/<ChartBlock type="combination"[^\n]*title=\{?"EURUSD execution"/);
    expect(html).toContain(".instrument-symbol");
    expect(htmlBody(html)).not.toMatch(/onclick|<script/i);
  });
});
