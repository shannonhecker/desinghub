import { describe, it, expect, beforeEach } from "vitest";
import ts from "typescript";
import { useBuilder, DEFAULT_ZONE_LAYOUTS } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";
import { applyTemplateToCanvas } from "@/lib/applyTemplate";
import { riskAnalytics, performanceAnalytics, FINANCE_BRAND } from "@/lib/financeTemplates";
import type { BuilderTemplate } from "@/lib/builderTemplates";
import { financeDataset } from "@/lib/reportData/financeDataset";
import { exportReact, exportReactFiles } from "../reactExporter";
import { exportHTML } from "../htmlExporter";
import { exportViteBootstrap } from "../viteExporter";
import { chartBlockJsx, chartDataOf, chartHelperSource, isChartBlock } from "../chartExporter";
import { materialiseBlock, materialiseCanvas } from "../materialise";
import { JSX_DIALECT, HTML_DIALECT, dropdownLines, tableLines } from "../reportMarkup";
import { REPORT_CSS, buildStylesCss } from "../stylesCss";

/* ════════════════════════════════════════════════════════════
   Code export of the finance report templates (Risk Analytics,
   Performance Analytics): data-bound grids and charts go out with
   the data the canvas shows, inside their framed panels, under the
   application chrome, with nothing of the data layer in the output.
   ════════════════════════════════════════════════════════════ */

const TEMPLATES: [name: string, tpl: BuilderTemplate][] = [
  ["Risk Analytics", riskAnalytics],
  ["Performance Analytics", performanceAnalytics],
];
const SYSTEMS = ["salt", "m3", "fluent", "carbon", "uoaui"] as const;

function apply(tpl: BuilderTemplate, ds: (typeof SYSTEMS)[number] = "salt") {
  applyTemplateToCanvas(tpl, ds);
  useBuilder.setState({ mode: "light" as never });
}

/** The component part of a React export (the appended chart helper is fixed
 *  source, not canvas content). */
function reactMarkup(tsx: string): string {
  const i = tsx.indexOf("/* ── ChartBlock:");
  return i === -1 ? tsx : tsx.slice(0, i);
}
/** The <body> of an HTML export (the <head> holds the stylesheet). */
function htmlBody(html: string): string {
  return html.slice(html.indexOf("<body>"));
}
function fileFromBootstrap(script: string, path: string): string {
  const start = script.indexOf(`cat > "${path}" <<'`);
  if (start === -1) throw new Error(`file ${path} not found in bootstrap`);
  const delimMatch = script.slice(start).match(/<<'([^']+)'\n/)!;
  const afterHeader = start + (delimMatch.index ?? 0) + delimMatch[0].length;
  const end = script.indexOf(`\n${delimMatch[1]}\n`, afterHeader);
  return script.slice(afterHeader, end === -1 ? undefined : end);
}
/** Syntax errors in a generated .tsx file (empty = it parses). */
function tsxSyntaxErrors(source: string): string[] {
  const out = ts.transpileModule(source, {
    reportDiagnostics: true,
    fileName: "App.tsx",
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return (out.diagnostics ?? []).map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
}
/** Every `series={[...]}` literal on a <ChartBlock type="X" …> element. */
function chartSeries(tsx: string, type: string): { name: string; data: (number | null)[]; type?: string; yAxis?: number }[][] {
  const out = [];
  const re = new RegExp(`<ChartBlock type="${type}"[^\\n]*? series=\\{(\\[.*?\\])\\} `, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(tsx))) out.push(JSON.parse(m[1]));
  return out;
}

const LEAKS = ["binding", "stateKey", "[object Object]", "NaN"];

beforeEach(() => {
  /* applyTemplateToCanvas keeps report state when the same template is
     re-applied; start every test from a clean canvas. */
  useBuilder.setState({
    activeTemplateId: null, reportState: {}, reportData: null, expandedPanel: null,
    zoneLayouts: JSON.parse(JSON.stringify(DEFAULT_ZONE_LAYOUTS)),
  } as never);
});

describe.each(TEMPLATES)("%s: export carries the canvas", (_name, tpl) => {
  const panelTitles = tpl.body.filter((b) => b.type === "DataGrid" || b.props.panel === true).map((b) => String(b.props.title));
  const pageTitle = String(tpl.header.find((b) => b.type === "ContextBar")!.props.title);

  it("React: brand, nav links, page title, panel titles, names and formatted figures", () => {
    apply(tpl);
    const tsx = exportReact();
    expect(tsx).toContain(FINANCE_BRAND);
    for (const link of ["Manager", "Solutions", "Apps", "Resources"]) expect(tsx).toContain(`>${link}</a>`);
    expect(tsx).toMatch(/<a className="topnav-link" href="#" aria-current="page"[^>]*>Manager<\/a>/);
    expect(tsx).toContain(`<h1 className="page-title">${pageTitle}</h1>`);
    expect(panelTitles.length).toBeGreaterThan(3);
    for (const title of panelTitles) expect(tsx, title).toContain(`<h2 className="panel-title">${title}</h2>`);
    expect(tsx).toContain("Global Multi-Asset Growth");
    expect(tsx).toContain("Sterling Corporate Bond");
    expect(tsx).toContain(">£3.55bn</td>");
    expect(tsxSyntaxErrors(tsx)).toEqual([]);
  });

  it("HTML: brand, nav links, page title, panel titles, names and formatted figures", () => {
    apply(tpl);
    const body = htmlBody(exportHTML());
    expect(body).toContain(FINANCE_BRAND);
    for (const link of ["Manager", "Solutions", "Apps", "Resources"]) expect(body).toContain(`>${link}</a>`);
    expect(body).toMatch(/<a class="topnav-link" href="#" aria-current="page"[^>]*>Manager<\/a>/);
    expect(body).toContain(`<h1 class="page-title">${pageTitle}</h1>`);
    for (const title of panelTitles) expect(body, title).toContain(`<h2 class="panel-title">${title}</h2>`);
    expect(body).toContain("Global Multi-Asset Growth");
    expect(body).toContain(">£3.55bn</td>");
  });

  it("Vite: App.tsx carries the same content and styles.css styles it", () => {
    apply(tpl);
    const script = exportViteBootstrap();
    expect(script.startsWith("#!/bin/sh")).toBe(true);
    expect(script).not.toContain("Design Hub export too large");
    const app = fileFromBootstrap(script, "src/App.tsx");
    expect(app).toContain(FINANCE_BRAND);
    expect(app).toContain(">£3.55bn</td>");
    expect(app).not.toContain("Export too large to inline");
    expect(tsxSyntaxErrors(app)).toEqual([]);
    const css = fileFromBootstrap(script, "src/styles.css");
    for (const cls of ["panel", "panel-header", "panel-title", "data-table", "table-scroll", "topnav", "tabstrip", "page-title", "nav-group"]) {
      expect(css, cls).toMatch(new RegExp(`\\.${cls}\\b`));
    }
    expect(JSON.parse(fileFromBootstrap(script, "package.json")).dependencies).toHaveProperty("highcharts");
  });

  it.each(SYSTEMS)("no data-layer leak, in any dialect (%s)", (ds) => {
    apply(tpl, ds);
    const tsx = exportReact();
    const html = exportHTML();
    const app = fileFromBootstrap(exportViteBootstrap(), "src/App.tsx");
    for (const leak of LEAKS) {
      expect(tsx, `react: ${leak}`).not.toContain(leak);
      expect(html, `html: ${leak}`).not.toContain(leak);
      expect(app, `vite: ${leak}`).not.toContain(leak);
    }
    /* The appended chart helper is fixed source that legitimately uses the
       `undefined` keyword; the canvas content must not. */
    expect(reactMarkup(tsx)).not.toContain("undefined");
    expect(reactMarkup(app)).not.toContain("undefined");
    expect(html).not.toContain("undefined");
    expect(tsx).not.toMatch(/useBuilder|reportState|resolve[A-Z]\w*\(|sampleDataset/);
    expect(tsxSyntaxErrors(tsx)).toEqual([]);
  });

  it("changing the report currency changes the exported figures", () => {
    apply(tpl);
    const before = exportReact();
    expect(before).not.toMatch(/US\$/);
    useBuilder.getState().setReportState("currency", "USD");
    const tsx = exportReact();
    const html = htmlBody(exportHTML());
    expect(tsx).not.toContain(">£3.55bn</td>");
    expect(tsx).toMatch(/<tr className="is-total"><th scope="row">[^<]+<\/th><td className="num">US\$\d+\.\d\dbn<\/td>/);
    expect(html).toMatch(/<tr class="is-total"><th scope="row">[^<]+<\/th><td class="num">US\$\d+\.\d\dbn<\/td>/);
    /* The filter itself shows the chosen currency. */
    expect(tsx).toMatch(/<select id="tpl-\w+-context-filter-\d" className="dropdown-inline" defaultValue="USD">/);
    expect(html).toContain('<option value="USD" selected>USD</option>');
    expect(html).not.toContain('<option value="GBP" selected>');
  });

  it("hidden zones (sidebar, footer) are not exported", () => {
    apply(tpl);
    const tsx = reactMarkup(exportReact());
    const body = htmlBody(exportHTML());
    for (const out of [tsx, body]) {
      expect(out).not.toMatch(/<aside/);
      expect(out).not.toMatch(/<footer/);
      expect(out).not.toContain("zone-sidebar");
      expect(out).not.toContain("zone-footer");
      expect(out).toContain('data-sidebar="none"');
    }
  });

  it("the header zone carries its tone and runs flush; the bars carry their own tone", () => {
    apply(tpl);
    expect(reactMarkup(exportReact())).toMatch(/<header className="zone-header"[^>]* data-tone="dark" data-flush="true">/);
    expect(reactMarkup(exportReact())).toMatch(/<main id="main-content" className="zone-body"/);
    const body = htmlBody(exportHTML());
    expect(body).toContain('<header class="zone-header" data-tone="dark" data-flush="true">');
    expect(body).toContain('<div class="topnav" data-tone="dark">');
    expect(body).toMatch(/<nav class="tabstrip" data-tone="dark" aria-label="Workspaces">/);
    expect(body).toMatch(/<a class="tabstrip-tab" href="#" aria-current="page">(Risk|Performance)<\/a>/);
  });
});

describe("data grid export", () => {
  it("is a semantic table: grouped header, numeric alignment, total and negative flags, scroll region", () => {
    apply(performanceAnalytics);
    const tsx = reactMarkup(exportReact());
    expect(tsx).toMatch(/<div className="table-scroll" role="region" aria-label="Performance results" tabIndex=\{0\}>/);
    expect(tsx).toContain('<table className="data-table">');
    expect(tsx).toContain('<tr className="data-table-groups"><td colSpan={3}></td><th scope="colgroup" colSpan={3}>1 Month</th>');
    expect(tsx).toContain('<th scope="col" className="num">Market value</th>');
    expect(tsx).toContain('<tr className="is-total"><th scope="row">Total</th>');
    expect(tsx).toMatch(/<td className="num is-negative">-\d+\.\d\d%<\/td>/);
    expect(tsx).not.toMatch(/ag-grid|AgGrid/i);
    const html = htmlBody(exportHTML());
    expect(html).toContain('<th scope="colgroup" colspan="3">1 Month</th>');
    expect(html).toMatch(/<td class="num is-negative">-\d+\.\d\d%<\/td>/);
  });

  it("sits in the framed panel: section > header (title, subtitle) > body", () => {
    apply(riskAnalytics);
    const tsx = reactMarkup(exportReact());
    expect(tsx).toMatch(
      /<section className="panel" aria-label="Risk summary" style=\{\{ height: 572 \}\}>\s*<header className="panel-header">\s*<div className="panel-heading">\s*<h2 className="panel-title">Risk summary<\/h2>\s*<span className="panel-subtitle">as of Dec 2024<\/span>/,
    );
  });

  it("escapes cell and header text", () => {
    const columns = [{ field: "n", header: "<b>Name</b>" }, { field: "v", header: "V", kind: "number" as const, signed: true }];
    const rows = [{ n: "{x} & <script>alert(1)</script>", v: -1 }];
    const jsx = tableLines(JSX_DIALECT, columns, rows, { label: 'a "q" <l>' }).join("\n");
    expect(jsx).toContain(`<th scope="col">{${JSON.stringify("<b>Name</b>")}}</th>`);
    expect(jsx).toContain(`<th scope="row">{${JSON.stringify("{x} & <script>alert(1)</script>")}}</th>`);
    expect(jsx).toContain('aria-label="a &quot;q&quot; &lt;l&gt;"');
    expect(tsxSyntaxErrors(`const T = () => (\n${jsx}\n);`)).toEqual([]);
    const html = tableLines(HTML_DIALECT, columns, rows, { label: "t" }).join("\n");
    expect(html).toContain("{x} &amp; &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>");
  });
});

describe("chart export", () => {
  it("Performance: a combination chart and a stacked area chart, each with more than one series", () => {
    apply(performanceAnalytics);
    const tsx = exportReact();
    const combination = chartSeries(tsx, "combination");
    const area = chartSeries(tsx, "stacked-area");
    expect(combination).toHaveLength(1);
    expect(area).toHaveLength(1);
    expect(combination[0].length).toBeGreaterThan(1);
    expect(area[0].length).toBeGreaterThan(1);
    /* Per-series marks survive: columns and a line. */
    expect(combination[0].map((s) => s.type)).toEqual(["column", "column", "line"]);
    expect(tsx).toMatch(/<ChartBlock type="donut"[^\n]* seriesData=\{\[\{"name":"Equity"[^\n]* centerLabel=\{"£3\.55bn"\}/);
  });

  it("Risk: the combination chart keeps its second axis, formats and height; stacked bars keep their gaps", () => {
    apply(riskAnalytics);
    const tsx = exportReact();
    const [series] = chartSeries(tsx, "combination");
    expect(series.map((s) => [s.type, s.yAxis])).toEqual([["column", 1], ["line", undefined], ["line", undefined]]);
    expect(tsx).toMatch(/<ChartBlock type="combination"[^\n]* height=\{332\} hideTitle yAxisFormat=\{"\{value\}%"\} secondaryAxisFormat=\{"\{value\}%"\}/);
    const bars = chartSeries(tsx, "stacked-bar");
    expect(bars).toHaveLength(2);
    /* A null (no holding in that category) is kept so later values stay aligned. */
    for (const chart of bars) for (const s of chart) expect(s.data).toHaveLength(chart[0].data.length);
    expect(bars.flat().some((s) => s.data.includes(null))).toBe(true);
    /* Framed: the chart sits in its panel. */
    expect(tsx).toMatch(/<section className="panel" aria-label="Value at risk" style=\{\{ height: 400 \}\}>[\s\S]*?<div className="panel-body">\s*<ChartBlock type="combination"/);
  });

  it("the chart helper handles every chart type the canvas has, and the shared settings", () => {
    const helper = chartHelperSource("salt");
    for (const type of ["line", "area", "column", "pie", "scatter", "bar", "donut", "spline", "stacked-column", "stacked-bar", "stacked-area", "combination", "gauge", "heatmap", "treemap"]) {
      expect(helper, type).toContain(`case "${type}":`);
    }
    for (const prop of ["height", "hideTitle", "yAxisFormat", "secondaryAxisFormat", "centerLabel", "legend", "yAxisMax", "valueDecimals", "valueSuffix"]) {
      expect(helper, prop).toMatch(new RegExp(`props\\.${prop}\\b`));
    }
    for (const type of ["HighchartCombination", "HighchartStackedBar", "HighchartStackedArea"]) expect(isChartBlock(type)).toBe(true);
    expect(tsxSyntaxErrors(`import React from "react";\n${helper}`)).toEqual([]);
  });

  it("an unframed chart with none of the new props exports exactly as before", () => {
    const block = { id: "c", type: "HighchartLine", props: { chartType: "line", title: "Revenue" } } as Block;
    expect(chartBlockJsx(block, "light")).toBe('<ChartBlock type="line" title="Revenue" mode="light" />');
  });

  it("legend off, axis max and donut centre label are emitted; series styles are validated", () => {
    const jsx = chartBlockJsx(
      { id: "c", type: "HighchartDonut", props: { chartType: "donut", legend: false, yAxisMax: 100, centerLabel: 'a"b{c}', height: 300 } } as Block,
      "dark",
    );
    expect(jsx).toContain("legend={false}");
    expect(jsx).toContain("yAxisMax={100}");
    expect(jsx).toContain("height={300}");
    expect(jsx).toContain(`centerLabel={${JSON.stringify('a"b{c}')}}`);
    const data = chartDataOf({
      id: "c", type: "HighchartCombination",
      props: { series: [{ name: "A", data: [1, null, "x", 3], type: "evil", yAxis: 7, dashStyle: "Dot" }, { name: "B", data: [null, null] }] },
    } as Block);
    expect(data.series).toEqual([{ name: "A", data: [1, null, 3], dashStyle: "Dot" }]);
  });
});

describe("dropdown export", () => {
  const block = { id: "dd 1", type: "SimulatedDropdown", props: { label: "Currency", value: "EUR", optionsCsv: "GBP, USD, EUR" } } as Block;

  it("the plain React dropdown renders its label, options and chosen value", () => {
    const jsx = dropdownLines(JSX_DIALECT, block, "field-dd-1").join("\n");
    expect(jsx).toContain('<label htmlFor="field-dd-1">Currency</label>');
    expect(jsx).toContain('<select id="field-dd-1" className="dropdown" defaultValue="EUR">');
    for (const o of ["GBP", "USD", "EUR"]) expect(jsx).toContain(`<option value="${o}">${o}</option>`);
    expect(tsxSyntaxErrors(`const D = () => (\n${jsx}\n);`)).toEqual([]);
  });

  it("the HTML dropdown renders its label, options and chosen value", () => {
    useBuilder.setState({ designSystem: "salt" as never, headerBlocks: [], sidebarBlocks: [], footerBlocks: [], blocks: [block], zoneLayouts: {} as never });
    const body = htmlBody(exportHTML());
    expect(body).toContain('<label for="field-dd-1">Currency</label>');
    expect(body).toContain('<option value="GBP">GBP</option>');
    expect(body).toContain('<option value="EUR" selected>EUR</option>');
  });

  it("with nothing chosen, the placeholder leads", () => {
    const empty = { id: "e", type: "SimulatedDropdown", props: { optionsCsv: "A, B", placeholder: "Pick <one>" } } as Block;
    const html = dropdownLines(HTML_DIALECT, empty, "field-e").join("\n");
    expect(html).toContain('<option value="" selected>Pick &lt;one&gt;</option>');
    expect(html).toContain('aria-label="Pick &lt;one&gt;"');
  });

  it("a report filter exports the current report-state value", () => {
    const filter = { id: "f", type: "SimulatedDropdown", props: { label: "Fee type", value: "Net", optionsCsv: "Net, Gross", stateKey: "feeType" } } as Block;
    const live = materialiseBlock(filter, null, { feeType: "Gross" });
    expect(live.props.value).toBe("Gross");
    expect(live.props).not.toHaveProperty("stateKey");
    expect(materialiseBlock(filter, null, {}).props.value).toBe("Net");
  });
});

describe("materialise", () => {
  it("resolves every bound block to static props and drops the live-only ones", () => {
    apply(performanceAnalytics);
    const canvas = materialiseCanvas();
    const all = [...canvas.header, ...canvas.sidebar, ...canvas.body, ...canvas.footer];
    for (const b of all) {
      expect(b.props).not.toHaveProperty("binding");
      expect(b.props).not.toHaveProperty("stateKey");
    }
    const grid = canvas.body.find((b) => b.id === "tpl-perf-results")!;
    expect(Array.isArray(grid.props.columns) && Array.isArray(grid.props.rows)).toBe(true);
    const trend = canvas.body.find((b) => b.id === "tpl-perf-trend")!;
    expect((trend.props.series as unknown[]).length).toBe(3);
    /* The store's own blocks are untouched. */
    expect(useBuilder.getState().blocks.find((b) => b.id === "tpl-perf-results")!.props).toHaveProperty("binding");
  });

  it("follows report state exactly as the canvas does (benchmark None drops the benchmark series)", () => {
    apply(performanceAnalytics);
    useBuilder.getState().setReportState("benchmark", "None");
    const trend = materialiseCanvas().body.find((b) => b.id === "tpl-perf-trend")!;
    expect((trend.props.series as { name: string }[]).map((s) => s.name)).toEqual(["Fund"]);
  });

  it("uses an uploaded dataset when there is one", () => {
    apply(riskAnalytics);
    const rowsOf = () => (materialiseCanvas().body.find((b) => b.id === "tpl-risk-summary")!.props.rows as unknown[]).length;
    const sampleRows = rowsOf();
    expect(sampleRows).toBeGreaterThan(2);
    /* Upload a dataset holding one fund only: the exported grid follows it
       (the total row plus that fund). */
    const uploaded = financeDataset();
    const holdings = uploaded.tables.find((t) => t.id === "holdings")!;
    const firstFund = holdings.rows[0].fund;
    holdings.rows = holdings.rows.filter((r) => r.fund === firstFund);
    useBuilder.getState().setReportData(uploaded);
    const groups = (materialiseCanvas().body.find((b) => b.id === "tpl-risk-summary")!.props.rows as { _indent?: number }[]).filter((r) => !r._indent);
    expect(groups).toHaveLength(2);
    expect(rowsOf()).toBeLessThan(sampleRows);
    expect(reactMarkup(exportReact())).not.toContain("Sterling Corporate Bond");
  });

  it("a binding that cannot be resolved leaves the block on its static props, without throwing", () => {
    const missingTable = { id: "m", type: "HighchartColumn", props: { chartType: "column", categories: ["A"], series: [{ name: "S", data: [1] }], binding: { table: "nope", view: "series", measures: [], display: [] } } } as Block;
    const broken = { id: "b", type: "DataGrid", props: { title: "T", columns: [{ field: "a", header: "A" }], rows: [{ a: "x" }], binding: { table: "holdings", view: "grid", measures: [null], display: null } } } as unknown as Block;
    apply(riskAnalytics);
    useBuilder.setState({ blocks: [missingTable, broken] });
    const canvas = materialiseCanvas();
    expect(canvas.body[0].props.series).toEqual([{ name: "S", data: [1] }]);
    expect(canvas.body[1].props.rows).toEqual([{ a: "x" }]);
    expect(() => exportReact()).not.toThrow();
    expect(() => exportHTML()).not.toThrow();
    expect(exportReact()).not.toContain("binding");
    expect(htmlBody(exportHTML())).toContain('<th scope="row">x</th>');
  });
});

describe("injection safety", () => {
  const PAYLOAD = "<script>alert(1)</script>";
  function poison() {
    apply(riskAnalytics);
    const s = useBuilder.getState();
    s.updateZoneBlockProps("header", "tpl-risk-topnav", { brand: PAYLOAD, linksCsv: "{a}, <b>" });
    s.updateZoneBlockProps("header", "tpl-risk-tabs", { tabsCsv: 'Home, R"}isk', label: 'W"<x>' });
    s.updateZoneBlockProps("header", "tpl-risk-context", { title: "{title}" });
    s.updateZoneBlockProps("body", "tpl-risk-summary", { title: PAYLOAD, subtitle: "{sub}" });
    s.updateZoneBlockProps("body", "tpl-risk-var", { title: `"{${PAYLOAD}}`, subtitle: "</section>" });
  }

  it("React: hostile text is emitted as string expressions and the file still parses", () => {
    poison();
    const tsx = reactMarkup(exportReact());
    expect(tsx).toContain(`<span className="topnav-name">{${JSON.stringify(PAYLOAD)}}</span>`);
    expect(tsx).toContain(`<h1 className="page-title">{${JSON.stringify("{title}")}}</h1>`);
    expect(tsx).toContain(`<h2 className="panel-title">{${JSON.stringify(PAYLOAD)}}</h2>`);
    expect(tsx).toContain(`<span className="panel-subtitle">{${JSON.stringify("</section>")}}</span>`);
    expect(tsx).toContain('aria-label="W&quot;&lt;x&gt;"');
    /* Never a raw tag in children position. */
    expect(tsx).not.toMatch(/>\s*<script>/);
    expect(tsxSyntaxErrors(exportReact())).toEqual([]);
  });

  it("HTML: hostile text is entity-escaped", () => {
    poison();
    const body = htmlBody(exportHTML());
    expect(body).not.toContain("<script>");
    expect(body).toContain('<span class="topnav-name">&lt;script&gt;alert(1)&lt;/script&gt;</span>');
    expect(body).toContain('<h2 class="panel-title">&lt;script&gt;alert(1)&lt;/script&gt;</h2>');
    expect(body).toContain('aria-label="W&quot;&lt;x&gt;"');
    expect(body).toContain('<span class="panel-subtitle">&lt;/section&gt;</span>');
  });

  it("a tone is an attribute value, so only the five known tones pass", () => {
    apply(riskAnalytics);
    useBuilder.getState().updateZoneBlockProps("header", "tpl-risk-topnav", { tone: 'x" onload="alert(1)' });
    useBuilder.getState().setZoneLayout("header", { tone: 'y"><script>' as never });
    const body = htmlBody(exportHTML());
    expect(body).not.toContain("onload");
    expect(body).toContain('<div class="topnav" data-tone="dark">');
    expect(body).toContain('<header class="zone-header" data-flush="true">');
  });
});

describe("zones", () => {
  function chromeCanvas(sidebar: Record<string, unknown>) {
    useBuilder.setState({
      designSystem: "salt" as never,
      mode: "light" as never,
      headerBlocks: [{ id: "h", type: "AppBrand", props: { label: "Acme" } }],
      sidebarBlocks: [{ id: "g", type: "NavGroup", props: { label: "Reports" } }, { id: "n", type: "NavItem", props: { label: "Home", icon: "home" } }],
      blocks: [{ id: "t", type: "PageTitle", props: { text: "Overview", caption: "Today" } }],
      footerBlocks: [{ id: "f", type: "FooterText", props: { label: "Acme", version: "1.0" } }],
      zoneLayouts: {
        header: { mode: "row", tone: "accent" },
        sidebar: { mode: "stack", ...sidebar },
        footer: { mode: "row", tone: "inverse", flush: true },
        body: { mode: "grid", columns: 12 },
      } as never,
    });
  }

  it("tone, flush and side are exported on the zone landmarks", () => {
    chromeCanvas({ tone: "surface", side: "right" });
    const body = htmlBody(exportHTML());
    expect(body).toContain('<header class="zone-header" data-tone="accent">');
    expect(body).toContain('<aside aria-label="Sidebar" class="zone-sidebar" data-tone="surface" data-side="right">');
    expect(body).toContain('<footer class="zone-footer" data-tone="inverse" data-flush="true">');
    expect(body).toContain('<p class="nav-group">Reports</p>');
    expect(body).toContain('<p class="page-caption">Today</p>');
    const tsx = reactMarkup(exportReact());
    expect(tsx).toMatch(/<header className="zone-header"[^>]* data-tone="accent">/);
    expect(tsx).toMatch(/<aside aria-label="Sidebar" className="zone-sidebar"[^>]* data-tone="surface" data-side="right">/);
    expect(tsx).toContain('<p className="nav-group">Reports</p>');
  });

  it("a right-hand sidebar follows the body and takes the right track", () => {
    chromeCanvas({ side: "right" });
    for (const out of [htmlBody(exportHTML()), reactMarkup(exportReact())]) {
      expect(out).toContain('data-sidebar="right"');
      expect(out.indexOf("zone-sidebar")).toBeGreaterThan(out.indexOf("zone-body"));
      expect(out.indexOf("zone-footer")).toBeGreaterThan(out.indexOf("zone-sidebar"));
    }
    chromeCanvas({ tone: "dark" });
    const left = htmlBody(exportHTML());
    expect(left).not.toContain("data-sidebar");
    expect(left.indexOf("zone-sidebar")).toBeLessThan(left.indexOf("zone-body"));
  });

  it("a canvas with no chrome features keeps the shell root and zones as they were", () => {
    useBuilder.setState({
      designSystem: "salt" as never,
      headerBlocks: [], sidebarBlocks: [], footerBlocks: [],
      blocks: [{ id: "a", type: "SimulatedButton", props: { label: "Go" } }],
      zoneLayouts: { body: { mode: "grid", columns: 12, gap: 12 } } as never,
    });
    const tsx = exportReact();
    expect(tsx).toContain('<div className="dashboard-layout" data-mode="light" data-density="medium">');
    expect(tsx).not.toContain("data-layout");
    expect(htmlBody(exportHTML())).toContain('<main id="main-content" class="zone-body">');
  });
});

describe("styles", () => {
  it("styles every class and attribute the report markup emits", () => {
    for (const sel of [
      ".panel", ".panel-header", ".panel-heading", ".panel-title", ".panel-subtitle", ".panel-viewby", ".panel-body",
      ".table-scroll", ".data-table", ".data-table-groups", ".data-table .num", ".data-table .is-negative", ".data-table .is-total", ".data-table .is-selected",
      ".topnav", ".topnav-brand", ".topnav-mark", ".topnav-links", ".topnav-link", ".topnav-account", ".tabstrip", ".tabstrip-tab", ".tabstrip-add",
      ".nav-group", ".page-title", ".page-caption", ".dropdown",
      '[data-tone="surface"]', '[data-tone="transparent"]', '[data-tone="inverse"]', '[data-tone="dark"]', '[data-tone="accent"]',
      ".zone-header[data-flush]", '.dashboard-layout[data-sidebar="none"]', '.dashboard-layout[data-sidebar="right"]', '[aria-current="page"]',
    ]) {
      expect(REPORT_CSS, sel).toContain(sel);
    }
  });

  it("uses token variables: the only literal colours are the dark-chrome properties, defined once", () => {
    const literals = REPORT_CSS.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g) ?? [];
    expect(literals).toHaveLength(5);
    const root = REPORT_CSS.slice(REPORT_CSS.indexOf(":root {"), REPORT_CSS.indexOf("}", REPORT_CSS.indexOf(":root {")));
    for (const l of literals) expect(root).toContain(l);
    expect((REPORT_CSS.match(/--chrome-dark:/g) ?? []).length).toBe(1);
  });

  it("ships in the React stylesheet, the Vite stylesheet and the HTML page", () => {
    apply(riskAnalytics, "carbon");
    expect(buildStylesCss("carbon", "light")).toContain(REPORT_CSS);
    expect(exportReactFiles().find((f) => f.path === "styles.css")!.contents).toContain(".data-table");
    const html = exportHTML();
    const style = html.slice(html.indexOf("<style>"), html.indexOf("</style>"));
    expect(style).toContain(".data-table .is-negative { color: var(--error); }");
    expect(style).toMatch(/--error:/);
  });
});

describe("responsive spans (HTML)", () => {
  it("a block's tablet / phone spans go out as custom properties the breakpoints read", () => {
    apply(performanceAnalytics);
    const html = exportHTML();
    expect(htmlBody(html)).toContain('<div class="grid-item" data-span-tablet data-span-phone style="grid-column: span 4; --span-tablet: 6; --span-phone: 12">');
    /* A block with no narrow spans is unchanged. */
    expect(htmlBody(html)).toContain('<div class="grid-item" style="grid-column: span 12">');
    expect(html).toMatch(/\.grid-item\[data-span-tablet\] \{ grid-column: span var\(--span-tablet\) !important; \}/);
    expect(html).toMatch(/\.grid-item\[data-span-phone\] \{ grid-column: span var\(--span-phone\) !important; \}/);
  });
});
