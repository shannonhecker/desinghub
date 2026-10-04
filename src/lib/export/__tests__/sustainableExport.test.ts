import { describe, it, expect, beforeEach } from "vitest";
import ts from "typescript";
import { useBuilder, DEFAULT_ZONE_LAYOUTS } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";
import { applyTemplateToCanvas } from "@/lib/applyTemplate";
import { FINANCE_BRAND, riskAnalytics } from "@/lib/financeTemplates";
import { esgAnalytics, climateAnalytics, screening, screeningChangesTemplate } from "@/lib/sustainableTemplates";
import type { BuilderTemplate } from "@/lib/builderTemplates";
import { sustainableDataset } from "@/lib/reportData/sustainableDataset";
import type { GridColumn } from "@/lib/dataGridModel";
import { exportReact, exportReactFiles } from "../reactExporter";
import { exportHTML } from "../htmlExporter";
import { exportViteBootstrap } from "../viteExporter";
import { chartBlockJsx, chartDataOf, chartHelperSource, chartPointSettingsOf, usesExtendedChart } from "../chartExporter";
import { materialiseCanvas } from "../materialise";
import { JSX_DIALECT, HTML_DIALECT, gaugeValueText, recordPanelLines, tableLines } from "../reportMarkup";
import { REPORT_RICH_CSS, buildStylesCss } from "../stylesCss";

/* ════════════════════════════════════════════════════════════
   Code export of the Sustainable Investment templates (ESG,
   Climate, Screening, Screening Changes): rich grid cells, record
   grids, the waterfall, score gauges, per-point colours and the
   record panel go out as the canvas shows them, with nothing of
   the data layer in the output. Setup follows financeExport.test.ts.
   ════════════════════════════════════════════════════════════ */

const TEMPLATES: [name: string, tpl: BuilderTemplate, sample: string, activePage: string][] = [
  ["ESG Analytics", esgAnalytics, "Global Sustainable Equity", "ESG"],
  ["Climate Analytics", climateAnalytics, "Global Sustainable Equity", "Climate"],
  ["Screening", screening, "Vireo Systems Ord", "Screening"],
  ["Screening Changes", screeningChangesTemplate, "Vireo Systems Ord", "Changes"],
];
const SYSTEMS = ["salt", "m3", "fluent", "carbon", "uoaui"] as const;
const SECURITY = "Vireo Systems Ord";
const SECURITY_STATE = "select:security";

function apply(tpl: BuilderTemplate, ds: (typeof SYSTEMS)[number] = "salt") {
  applyTemplateToCanvas(tpl, ds);
  useBuilder.setState({ mode: "light" as never });
}

/** The component part of a React export (the appended chart helper is fixed source). */
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
/** One panel of an export, from its <section aria-label="title"> to its end. */
function panel(markup: string, title: string): string {
  const start = markup.search(new RegExp(`<section (className|class)="panel" aria-label="${title}"`));
  if (start === -1) throw new Error(`panel ${title} not found`);
  return markup.slice(start, markup.indexOf("</section>", start));
}
const bodyRows = (panelMarkup: string): number => (panelMarkup.slice(panelMarkup.indexOf("<tbody>")).match(/<tr[ >]/g) ?? []).length;
/** The JSON literal of a `name={...}` prop on a <ChartBlock> line. */
function chartProp<T>(line: string, name: string): T {
  const m = line.match(new RegExp(` ${name}=\\{(.*?)\\}(?= [a-zA-Z]+[= ]| />)`));
  if (!m) throw new Error(`prop ${name} not found`);
  return JSON.parse(m[1]) as T;
}
const chartLines = (tsx: string, type: string): string[] => tsx.split("\n").filter((l) => l.includes(`<ChartBlock type="${type}"`));

const LEAKS = ["binding", "stateKey", "[object Object]", "NaN"];

beforeEach(() => {
  useBuilder.setState({
    activeTemplateId: null, reportState: {}, reportData: null, expandedPanel: null,
    zoneLayouts: JSON.parse(JSON.stringify(DEFAULT_ZONE_LAYOUTS)),
  } as never);
});

describe.each(TEMPLATES)("%s: export carries the canvas", (_name, tpl, sample, activePage) => {
  const panelTitles = tpl.body
    .filter((b) => b.type === "DataGrid" || b.type === "RecordPanel" || b.props.panel === true)
    .map((b) => String(b.props.title));

  it("React: brand, page title, sidebar groups and items, panel titles, dataset names", () => {
    apply(tpl);
    const tsx = exportReact();
    expect(tsx).toContain(FINANCE_BRAND);
    expect(tsx).toContain('<h1 className="page-title">Sustainable Investment</h1>');
    expect(tsx).toMatch(/<aside aria-label="Sidebar" className="zone-sidebar"/);
    for (const group of ["Portfolio", "Screening"]) expect(tsx).toContain(`<p className="nav-group">${group}</p>`);
    /* Salt's own navigation item, the active page marked. */
    for (const item of ["ESG", "Climate", "Screening", "Changes"]) {
      expect(tsx, item).toMatch(new RegExp(`<NavigationItem href="#"( active)? orientation="vertical">${item}</NavigationItem>`));
    }
    expect(tsx).toContain(`<NavigationItem href="#" active orientation="vertical">${activePage}</NavigationItem>`);
    expect((tsx.match(/<NavigationItem href="#" active /g) ?? []).length).toBe(1);
    expect(panelTitles.length).toBeGreaterThan(1);
    for (const title of panelTitles) expect(tsx, title).toContain(`<h2 className="panel-title">${jsxChild(title)}</h2>`);
    expect(tsx).toContain(sample);
    expect(tsxSyntaxErrors(tsx)).toEqual([]);
  });

  it("HTML: brand, page title, sidebar groups and items, panel titles, dataset names", () => {
    apply(tpl);
    const body = htmlBody(exportHTML());
    expect(body).toContain(FINANCE_BRAND);
    expect(body).toContain('<h1 class="page-title">Sustainable Investment</h1>');
    expect(body).toContain('<aside aria-label="Sidebar" class="zone-sidebar">');
    for (const group of ["Portfolio", "Screening"]) expect(body).toContain(`<p class="nav-group">${group}</p>`);
    for (const item of ["ESG", "Climate", "Screening", "Changes"]) {
      expect(body, item).toContain(`<button class="nav-item${item === activePage ? " active" : ""}">${item}</button>`);
    }
    for (const title of panelTitles) expect(body, title).toContain(`<h2 class="panel-title">${title.replace(/&/g, "&amp;")}</h2>`);
    expect(body).toContain(sample);
    /* The sidebar is shown: the shell keeps its sidebar track. */
    expect(body).not.toContain('data-sidebar="none"');
  });

  it("Vite: App.tsx carries the same content; styles.css styles the rich markup", () => {
    apply(tpl);
    const script = exportViteBootstrap();
    expect(script).not.toContain("Design Hub export too large");
    const app = fileFromBootstrap(script, "src/App.tsx");
    expect(app).toContain(FINANCE_BRAND);
    expect(app).toContain(sample);
    expect(app).not.toContain("Export too large to inline");
    expect(tsxSyntaxErrors(app)).toEqual([]);
    expect(fileFromBootstrap(script, "src/styles.css")).toContain(REPORT_RICH_CSS.trim());
  });

  it.each(SYSTEMS)("no data-layer leak, in any dialect (%s)", (ds) => {
    apply(tpl, ds);
    /* With a record selected too, where the template has a record panel. */
    for (const select of [false, true]) {
      if (select) useBuilder.getState().setReportState(SECURITY_STATE, SECURITY);
      const tsx = exportReact();
      const html = exportHTML();
      const app = fileFromBootstrap(exportViteBootstrap(), "src/App.tsx");
      for (const leak of LEAKS) {
        expect(tsx, `react: ${leak}`).not.toContain(leak);
        expect(html, `html: ${leak}`).not.toContain(leak);
        expect(app, `vite: ${leak}`).not.toContain(leak);
      }
      expect(reactMarkup(tsx)).not.toContain("undefined");
      expect(reactMarkup(app)).not.toContain("undefined");
      expect(html).not.toContain("undefined");
      expect(tsx).not.toMatch(/useBuilder|reportState|resolve[A-Z]\w*\(|sampleDataset|selectState|sparkField|lucide/);
      expect(tsxSyntaxErrors(tsx)).toEqual([]);
    }
  });
});

/** Text as it appears in JSX children position ("&" needs a string expression). */
function jsxChild(text: string): string {
  return /[<>{}&]/.test(text) ? `{${JSON.stringify(text)}}` : text;
}

describe("ESG Analytics", () => {
  it("heat cells carry a tone marker on the <td>, in both dialects", () => {
    apply(esgAnalytics);
    const tsx = reactMarkup(exportReact());
    expect(tsx).toMatch(/<td className="num cell-heat tone-(good|mid|bad)">\d\.\d\d<\/td>/);
    /* The summary's score columns: every tone the dataset reaches is a known one. */
    const tones = new Set((panel(tsx, "Summary").match(/cell-heat tone-[a-z]+/g) ?? []));
    expect(tones.size).toBeGreaterThan(0);
    for (const t of tones) expect(t).toMatch(/^cell-heat tone-(good|mid|bad)$/);
    expect(htmlBody(exportHTML())).toMatch(/<td class="num cell-heat tone-(good|mid|bad)">\d\.\d\d<\/td>/);
    /* A column without a cell stays plain. */
    expect(tsx).toMatch(/<td className="num">£\d/);
  });

  it("the four gauges export their bound value, scale, decimals and colour", () => {
    apply(esgAnalytics);
    const tsx = exportReact();
    const gauges = chartLines(tsx, "gauge");
    expect(gauges).toHaveLength(4);
    const canvas = materialiseCanvas();
    const esgValue = canvas.body.find((b) => b.id === "tpl-esg-gauge-esg")!.props.value as number;
    expect(typeof esgValue).toBe("number");
    expect(gauges[0]).toContain('title="ESG score"');
    expect(gauges[0]).toContain(`value={${esgValue}}`);
    for (const g of gauges) {
      expect(g).toContain("valueMax={10}");
      expect(g).toContain("valueDecimals={2}");
      expect(g).toContain("hideTitle");
    }
    expect(gauges.map((g) => chartProp<string[]>(g, "pointColors"))).toEqual([["accent"], ["good"], ["accent"], ["mid"]]);
    /* HTML: the reading as text, to 2 decimals, of its scale. */
    const html = htmlBody(exportHTML());
    expect(panel(html, "ESG score")).toContain(`<p class="chart-value">${esgValue.toFixed(2)} of 10</p>`);
    expect((html.match(/<p class="chart-value">\d\.\d\d of 10<\/p>/g) ?? []).length).toBe(4);
    expect(html).not.toContain("No data");
  });

  it("the gauges follow the row selected in the summary", () => {
    apply(esgAnalytics);
    const before = chartLines(exportReact(), "gauge")[0];
    useBuilder.getState().setReportState("select:esg", "Climate Transition Bond");
    const tsx = reactMarkup(exportReact());
    expect(chartLines(tsx, "gauge")[0]).not.toBe(before);
    expect(panel(tsx, "Summary")).toMatch(/<tr className="is-selected"><th scope="row">Climate Transition Bond<\/th>/);
  });

  it("the rating distribution carries per-point colours by name", () => {
    apply(esgAnalytics);
    const tsx = reactMarkup(exportReact());
    const ratings = tsx.split("\n").find((l) => l.includes('title="Rating distribution"'))!;
    expect(chartProp<Record<string, string>>(ratings, "pointColorsByName")).toEqual({ AAA: "good", AA: "good", A: "good", BBB: "mid", BB: "mid", B: "bad", CCC: "bad" });
    expect(ratings).toContain("legend={false}");
  });

  it("ranked grids: the rank in its own cell, the name as the row header", () => {
    apply(esgAnalytics);
    const top = panel(reactMarkup(exportReact()), "Top relative contributors");
    expect(top).toMatch(/<tr><td className="num"><span className="cell-rank">1<\/span><\/td><th scope="row">[^<]+<\/th>/);
    expect(top).toContain('<th scope="col" className="num">#</th>');
  });

  it("the exported helper is the extended one, and parses", () => {
    apply(esgAnalytics);
    const tsx = exportReact();
    for (const piece of ["function applyGaugeSettings", "function applyPointStyling", "function themePointColor", 'case "waterfall":', "props.valueMax", "props.pointColorsByName", "props.selected", "props.labelWrap"]) {
      expect(tsx, piece).toContain(piece);
    }
    expect(tsxSyntaxErrors(tsx)).toEqual([]);
  });
});

describe("Climate Analytics", () => {
  it("a bar cell: track, fill with a percentage width, and the value", () => {
    apply(climateAnalytics);
    const tsx = panel(reactMarkup(exportReact()), "Dimension breakdown");
    const bars = [...tsx.matchAll(/<span className="cell-bar tone-accent"><span className="cell-bar-track" aria-hidden="true"><span className="cell-bar-fill" style=\{\{ width: "([\d.]+)%" \}\}><\/span><\/span><span className="cell-bar-value">([\d.]+)%<\/span><\/span>/g)];
    expect(bars.length).toBeGreaterThan(2);
    /* Scaled to the column: sorted by weight, the first row fills the track. */
    expect(bars[0][1]).toBe("100");
    for (const b of bars) {
      expect(Number(b[1])).toBeGreaterThan(0);
      expect(Number(b[1])).toBeLessThanOrEqual(100);
    }
    /* A bar column is left-aligned, as on the canvas. */
    expect(tsx).toContain('<th scope="col">Weight</th>');
    const html = panel(htmlBody(exportHTML()), "Dimension breakdown");
    expect(html).toMatch(/<span class="cell-bar-fill" style="width: 100%"><\/span>/);
    expect(html).toMatch(/<span class="cell-bar-fill" style="width: \d+(\.\d)?%"><\/span><\/span><span class="cell-bar-value">\d+\.\d%<\/span>/);
  });

  it("the donut centre label is a compact number, not a currency", () => {
    apply(climateAnalytics);
    const donuts = chartLines(exportReact(), "donut");
    expect(donuts).toHaveLength(2);
    for (const d of donuts) {
      const centre = chartProp<string>(d, "centerLabel");
      expect(centre).toMatch(/^\d+(\.\d+)?(k|m|bn)$/);
      expect(centre).not.toMatch(/[£$€]/);
    }
    /* Changing the report currency does not turn it into money. */
    useBuilder.getState().setReportState("currency", "USD");
    for (const d of chartLines(exportReact(), "donut")) expect(chartProp<string>(d, "centerLabel")).not.toMatch(/[£$€]/);
    expect(htmlBody(exportHTML())).toMatch(/<figcaption class="chart-data-total">\d+(\.\d+)?(k|m|bn)<\/figcaption>/);
  });

  it("temperature heat cells invert the scale; wrapped labels and the suffix's spacing carry", () => {
    apply(climateAnalytics);
    const tsx = reactMarkup(exportReact());
    const row = panel(tsx, "Summary").split("\n").find((l) => l.includes('<tr className="is-total">'))!;
    /* Implied °C: 2 to 2.5 is "mid", above "bad", below "good". */
    const m = row.match(/<td className="num cell-heat tone-(good|mid|bad)">(\d\.\d)<\/td>/)!;
    const temperature = Number(m[2]);
    expect(m[1]).toBe(temperature >= 2.5 ? "bad" : temperature >= 2 ? "mid" : "good");
    const emissions = tsx.split("\n").find((l) => l.includes('<ChartBlock type="stacked-column" title="Emissions"'))!;
    expect(emissions).toContain(" labelWrap");
    expect(chartProp<string>(emissions, "valueSuffix")).toBe(" tCO2e");
  });
});

describe("Screening", () => {
  const STEPS = ["Universe", "House", "Non SI", "Top Down", "Bottom Up", "Target Fund"];

  it("React: the waterfall steps in order, closing on a sum", () => {
    apply(screening);
    const tsx = exportReact();
    const [waterfall] = chartLines(tsx, "waterfall");
    const steps = chartProp<{ name: string; y: number; isSum?: boolean }[]>(waterfall, "seriesData");
    expect(steps.map((s) => s.name)).toEqual(STEPS);
    expect(steps.map((s) => Boolean(s.isSum))).toEqual([false, false, false, false, false, true]);
    expect(steps[0].y).toBeGreaterThan(0);
    for (const s of steps.slice(1, 5)) expect(s.y).toBeLessThan(0);
    expect(waterfall).not.toContain(" selected=");
    /* The helper draws the type with the canvas's options. */
    const helper = tsx.slice(tsx.indexOf("/* ── ChartBlock:"));
    const wf = helper.slice(helper.indexOf('case "waterfall":'), helper.indexOf('case "heatmap":'));
    for (const piece of ['type: "waterfall"', "isSum: true", 'dashStyle: "Dot"', "lineColor: v.border", "inside: false", "legend: { enabled: false }"]) expect(wf, piece).toContain(piece);
    expect(helper).toContain('chartType === "waterfall"');
    expect(tsx).toContain('import "highcharts/highcharts-more";');
  });

  it("HTML: the steps with their change and the running total", () => {
    apply(screening);
    const html = panel(htmlBody(exportHTML()), "Screening summary");
    expect(html).toContain('<tr><th scope="col">Step</th><th scope="col" class="num">Change</th><th scope="col" class="num">Running total</th></tr>');
    const rows = [...html.matchAll(/<tr(?: class="is-total")?><th scope="row">([^<]+)<\/th><td class="num(?: is-negative)?">([^<]*)<\/td><td class="num">([^<]+)<\/td><\/tr>/g)];
    expect(rows.map((r) => r[1])).toEqual(STEPS);
    const num = (s: string) => Number(s.replace(/,/g, ""));
    let running = 0;
    for (const r of rows.slice(0, 5)) {
      running += num(r[2]);
      expect(num(r[3])).toBe(running);
    }
    /* The sum row: no change of its own, the total reached. */
    expect(rows[5][2]).toBe("");
    expect(num(rows[5][3])).toBe(running);
    expect(html).toContain('<tr class="is-total"><th scope="row">Target Fund</th>');
  });

  it("selecting a stage filters the universe table and marks the waterfall's point", () => {
    apply(screening);
    const all = bodyRows(panel(reactMarkup(exportReact()), "Universe details"));
    const allHtml = bodyRows(panel(htmlBody(exportHTML()), "Universe details"));
    expect(all).toBeGreaterThan(10);
    expect(allHtml).toBe(all);
    useBuilder.getState().setReportState("select:stage", "House");
    const tsx = exportReact();
    const house = bodyRows(panel(reactMarkup(tsx), "Universe details"));
    expect(house).toBeGreaterThan(0);
    expect(house).toBeLessThan(all);
    expect(bodyRows(panel(htmlBody(exportHTML()), "Universe details"))).toBe(house);
    expect(chartProp<string>(chartLines(tsx, "waterfall")[0], "selected")).toBe("House");
    expect(panel(htmlBody(exportHTML()), "Screening summary")).toContain('<tr class="is-selected"><th scope="row">House</th>');
  });

  it("the universe is a record grid: one row per security, a flag and its code", () => {
    apply(screening);
    const tsx = panel(reactMarkup(exportReact()), "Universe details");
    /* The columns the template's binding names, in order. */
    const columns = (screening.body.find((b) => b.id === "tpl-screening-universe")!.props.binding as { records: { label: string }[] }).records;
    expect(columns.length).toBeGreaterThan(2);
    expect(tsx).toContain(`<tr>${columns.map((c) => `<th scope="col">${c.label}</th>`).join("")}</tr>`);
    expect(tsx).toContain(`<th scope="row">${SECURITY}</th><td><span className="cell-flag"><span aria-hidden="true">🇺🇸</span><span className="cell-flag-code">US</span></span></td>`);
  });

  it("before a security is selected the record panel exports its empty text", () => {
    apply(screening);
    const empty = "Select a security to see its flags, emissions and scores.";
    const tsx = reactMarkup(exportReact());
    const detail = panel(tsx, "Security detail");
    expect(detail).toContain('<h2 className="panel-title">Security detail</h2>');
    expect(detail).toContain(`<p>${empty}</p>`);
    expect(detail).toContain('className="record record-empty"');
    expect(detail).not.toContain("<dl");
    expect(detail).not.toContain("<ChartBlock");
    const html = panel(htmlBody(exportHTML()), "Security detail");
    expect(html).toContain(`<p>${empty}</p>`);
    expect(html).not.toContain("<dl");
  });

  it("after selecting a security the record panel exports its name, pairs, tables and trend", () => {
    apply(screening);
    useBuilder.getState().setReportState(SECURITY_STATE, SECURITY);
    const tsx = exportReact();
    const detail = panel(reactMarkup(tsx), SECURITY);
    expect(detail).toContain(`<h2 className="panel-title">${SECURITY}</h2>`);
    expect(detail).toContain('<span className="panel-subtitle">Security detail</span>');
    /* Pairs: a <dl>, the flag, the toned rating badge, money in the report currency. */
    expect(detail).toContain('<dl className="record-pairs">');
    expect(detail).toContain('<div className="record-pair"><dt>Country of risk</dt><dd><span aria-hidden="true">🇺🇸 </span>US</dd></div>');
    expect(detail).toContain('<div className="record-pair"><dt>Sector</dt><dd>Information Technology</dd></div>');
    expect(detail).toMatch(/<dt>ESG rating<\/dt><dd><span className="cell-badge tone-(good|mid|bad)">[A-C]+<\/span><\/dd>/);
    expect(detail).toMatch(/<dt>Market value<\/dt><dd>£\d+\.\d\dm<\/dd>/);
    /* Tables, with the change arrow and its direction as text. */
    expect((detail.match(/<table className="record-table">/g) ?? []).length).toBe(2);
    expect(detail).toContain('<h3 className="record-heading">Climate (tCO2e)</h3>');
    expect(detail).toContain('<h3 className="record-heading">ESG scores</h3>');
    expect(detail).toContain('<th scope="col">January</th><th scope="col">September</th><th scope="col">Change</th>');
    expect(detail).toMatch(/<tr><th scope="row">Scope 1 emissions<\/th><td>[\d,]+<\/td><td>[\d,]+<\/td><td><span className="record-change tone-(good|bad)"><svg className="cell-arrow"[^>]*><path d="[^"]+" \/><\/svg><span className="visually-hidden">(Up|Down)<\/span><\/span><\/td><\/tr>/);
    for (const row of ["Corporate", "Environmental", "Social", "Governance"]) expect(detail).toContain(`<th scope="row">${row}</th>`);
    /* The trend: a small line chart through the chart helper. */
    const [trend] = chartLines(detail, "line");
    expect(trend).toContain("height={150} hideTitle legend={false}");
    expect(chartProp<string[]>(trend, "categories")).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"]);
    const series = chartProp<{ name: string; data: number[] }[]>(trend, "series");
    expect(series).toHaveLength(1);
    expect(series[0].name).toBe("Scope 1 (tCO2e)");
    expect(series[0].data).toHaveLength(9);
    /* The selected row is marked in the universe grid. */
    expect(panel(reactMarkup(tsx), "Universe details")).toContain(`<tr className="is-selected"><th scope="row">${SECURITY}</th>`);
    /* Uplift in the report currency. */
    useBuilder.getState().setReportState("currency", "USD");
    expect(panel(reactMarkup(exportReact()), SECURITY)).toMatch(/<dt>Market value<\/dt><dd>US\$\d+\.\d\dm<\/dd>/);
  });

  it("HTML: the selected record's pairs, tables and the trend as a table of points", () => {
    apply(screening);
    useBuilder.getState().setReportState(SECURITY_STATE, SECURITY);
    const detail = panel(htmlBody(exportHTML()), SECURITY);
    expect(detail).toContain(`<h2 class="panel-title">${SECURITY}</h2>`);
    expect(detail).toContain('<dl class="record-pairs">');
    expect(detail).toContain("<dt>Ticker</dt><dd>VIRE</dd>");
    expect((detail.match(/<table class="record-table">/g) ?? []).length).toBe(3);
    expect(detail).toContain('<tr><th scope="col">Period</th><th scope="col">Scope 1 (tCO2e)</th></tr>');
    expect((detail.match(/<tr><th scope="row">(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep)<\/th><td>\d+<\/td><\/tr>/g) ?? []).length).toBe(9);
    expect(detail).toMatch(/<span class="visually-hidden">(Up|Down)<\/span>/);
  });
});

describe("Screening Changes", () => {
  it("grouped headers, in both dialects", () => {
    apply(screeningChangesTemplate);
    const tsx = panel(reactMarkup(exportReact()), "Changes");
    expect(tsx).toContain(
      '<tr className="data-table-groups"><td colSpan={3}></td><th scope="colgroup" colSpan={2}>Overall flags</th><td></td><th scope="colgroup" colSpan={2}>Scope 1 emissions</th><th scope="colgroup" colSpan={3}>ESG rating</th><th scope="colgroup" colSpan={2}>E score</th></tr>',
    );
    const html = panel(htmlBody(exportHTML()), "Changes");
    for (const [group, span] of [["Overall flags", 2], ["Scope 1 emissions", 2], ["ESG rating", 3], ["E score", 2]] as const) {
      expect(html).toContain(`<th scope="colgroup" colspan="${span}">${group}</th>`);
    }
  });

  it("every rich cell kind is exported as static markup", () => {
    apply(screeningChangesTemplate);
    for (const [out, cls] of [[panel(reactMarkup(exportReact()), "Changes"), "className"], [panel(htmlBody(exportHTML()), "Changes"), "class"]] as const) {
      /* Sparkline: an inline polyline. */
      expect(out).toMatch(new RegExp(`<svg ${cls}="cell-spark tone-accent" width="56" height="18" viewBox="0 0 56 18" fill="none" stroke="currentColor" aria-hidden="true"><polyline points="[\\d., ]+" /></svg>`));
      /* Badge, toned by rating. */
      expect(out).toMatch(new RegExp(`<span ${cls}="cell-badge tone-(good|mid|bad)">(AAA|AA|A|BBB|BB|B|CCC)</span>`));
      /* Toned text. */
      expect(out).toContain(`<span ${cls}="cell-tonetext tone-good">Upgraded</span>`);
      expect(out).toContain(`<span ${cls}="cell-tonetext tone-bad">Downgraded</span>`);
      expect(out).toContain(`<span ${cls}="cell-tonetext is-neutral">Unchanged</span>`);
      /* Flag emoji + code. */
      expect(out).toMatch(new RegExp(`<span ${cls}="cell-flag"><span aria-hidden="true">\\p{Regional_Indicator}{2}</span><span ${cls}="cell-flag-code">[A-Z]{2}</span></span>`, "u"));
      /* Delta chip: an arrow, a signed number, toned; blank at zero. */
      expect(out).toMatch(new RegExp(`<span ${cls}="cell-chip tone-good"><svg ${cls}="cell-arrow"[^>]*><path d="M12 19V5M5 12l7-7 7 7" /></svg>\\+\\d+</span>`));
      expect(out).toMatch(new RegExp(`<span ${cls}="cell-chip tone-bad"><svg ${cls}="cell-arrow"[^>]*><path d="M12 5v14M19 12l-7 7-7-7" /></svg>-\\d+</span>`));
      expect(out).toContain(`<td ${cls}="num"></td>`);
      /* Controversies: a rise is bad. */
      expect(out).toMatch(new RegExp(`<span ${cls}="cell-chip tone-bad"><svg ${cls}="cell-arrow"[^>]*><path d="M12 19V5M5 12l7-7 7 7" /></svg>\\+\\d+</span>`));
      /* Delta: the sparkline from the other field, the arrow, the direction as text, the magnitude. */
      expect(out).toMatch(new RegExp(`<span ${cls}="cell-delta-wrap"><svg ${cls}="cell-spark tone-neutral"[^>]*><polyline points="[\\d., ]+" /></svg><span ${cls}="cell-delta tone-bad"><svg ${cls}="cell-arrow"[^>]*><path d="M12 19V5M5 12l7-7 7 7" /></svg><span ${cls}="visually-hidden">Up</span>\\d+\\.\\d%</span></span>`));
      expect(out).toMatch(new RegExp(`<span ${cls}="cell-delta tone-good"><svg[^>]*><path d="M12 5v14M19 12l-7 7-7-7" /></svg><span ${cls}="visually-hidden">Down</span>`));
      /* Heat. */
      expect(out).toMatch(new RegExp(`<td ${cls}="num cell-heat tone-(good|mid|bad)">\\d\\.\\d\\d</td>`));
      /* The field a delta's sparkline reads is not a column. */
      expect(out).not.toContain("scope1Trend");
    }
  });

  it("no icon library is imported, and the stylesheet covers every class the cells use", () => {
    apply(screeningChangesTemplate);
    useBuilder.getState().setReportState(SECURITY_STATE, SECURITY);
    const files = exportReactFiles();
    const tsx = files[0].contents;
    expect(tsx).not.toMatch(/lucide|ArrowUp|ArrowDown/);
    const css = files.find((f) => f.path === "styles.css")!.contents;
    const used = new Set([...reactMarkup(tsx).matchAll(/className="([^"]+)"/g)].flatMap((m) => m[1].split(" ")).filter((c) => /^(cell-|tone-|record|visually-hidden|is-neutral|is-flat)/.test(c)));
    expect(used.size).toBeGreaterThan(15);
    for (const c of used) expect(css, c).toContain(`.${c}`);
    /* Tones resolve to the exported status variables. */
    for (const rule of [".tone-good { --tone: var(--success); }", ".tone-mid { --tone: var(--warn); }", ".tone-bad { --tone: var(--error); }", ".tone-accent { --tone: var(--accent); }"]) expect(css).toContain(rule);
    for (const v of ["--success:", "--warn:", "--error:", "--accent:", "--fg-muted:"]) expect(css).toContain(v);
    /* No literal colours in the rich rules. */
    expect(REPORT_RICH_CSS.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g)).toBeNull();
    /* The HTML page carries the same rules. */
    expect(exportHTML()).toContain(".data-table .cell-heat {");
  });

  it("the record panel sits under the grid and follows the selection", () => {
    apply(screeningChangesTemplate);
    expect(panel(reactMarkup(exportReact()), "Security detail")).toContain("Select a security to see its flags, emissions and scores.");
    useBuilder.getState().setReportState(SECURITY_STATE, SECURITY);
    const tsx = reactMarkup(exportReact());
    expect(panel(tsx, SECURITY)).toContain('<dl className="record-pairs">');
    expect(tsx.indexOf(`aria-label="${SECURITY}"`)).toBeGreaterThan(tsx.indexOf('aria-label="Changes"'));
    /* A trend needs the chart runtime even though the canvas has no chart block. */
    const script = exportViteBootstrap();
    expect(JSON.parse(fileFromBootstrap(script, "package.json")).dependencies).toHaveProperty("highcharts");
    expect(fileFromBootstrap(script, "src/App.tsx")).toContain("function ChartBlock(");
    expect(tsxSyntaxErrors(exportReact())).toEqual([]);
  });

  it("with nothing selected the export has no chart runtime at all", () => {
    apply(screeningChangesTemplate);
    const tsx = exportReact();
    expect(tsx).not.toContain("highcharts");
    expect(tsx).not.toContain("ChartBlock");
    expect(JSON.parse(fileFromBootstrap(exportViteBootstrap(), "package.json")).dependencies).not.toHaveProperty("highcharts");
  });
});

describe("injection safety", () => {
  const HOSTILE = '<script>alert(1)</script> {x} "q"';

  /** Upload the sample dataset with one security renamed. */
  function uploadRenamed(tpl: BuilderTemplate) {
    apply(tpl);
    /* A copy: the sample dataset's tables are shared. */
    const uploaded = structuredClone(sustainableDataset());
    const row = uploaded.tables.find((t) => t.id === "securities")!.rows.find((r) => r.security === SECURITY)!;
    row.security = HOSTILE;
    row.country = '"><b>';
    row.rating = "<i>";
    row.ratingMove = "{up}";
    row.sector = "</td>{s}";
    useBuilder.getState().setReportData(uploaded);
    useBuilder.getState().setReportState(SECURITY_STATE, HOSTILE);
  }

  it.each([["Screening", screening], ["Screening Changes", screeningChangesTemplate]] as const)("%s, React: hostile data is emitted as string expressions and the file parses", (_n, tpl) => {
    uploadRenamed(tpl);
    const full = exportReact();
    const tsx = reactMarkup(full);
    expect(tsx).toContain(`<th scope="row">{${JSON.stringify(HOSTILE)}}</th>`);
    expect(tsx).toContain(`<h2 className="panel-title">{${JSON.stringify(HOSTILE)}}</h2>`);
    expect(tsx).toContain('aria-label="&lt;script&gt;alert(1)&lt;/script&gt; {x} &quot;q&quot;"');
    expect(tsx).toContain(`<span className="cell-flag-code">{${JSON.stringify('"><b>')}}</span>`);
    expect(tsx).toContain(`<dd>{${JSON.stringify('"><b>')}}</dd>`);
    expect(tsx).toContain(`<dd><span className="cell-badge tone-bad">{${JSON.stringify("<i>")}}</span></dd>`);
    /* Never raw in children position. */
    expect(tsx).not.toMatch(/>\s*<script>/);
    expect(tsx).not.toContain('<th scope="row"><script>');
    expect(tsxSyntaxErrors(full)).toEqual([]);
  });

  it.each([["Screening", screening], ["Screening Changes", screeningChangesTemplate]] as const)("%s, HTML: hostile data is entity-escaped", (_n, tpl) => {
    uploadRenamed(tpl);
    const body = htmlBody(exportHTML());
    expect(body).not.toContain("<script>");
    expect(body).not.toContain("<b>");
    expect(body).not.toContain("<i>");
    expect(body).toContain('<th scope="row">&lt;script&gt;alert(1)&lt;/script&gt; {x} "q"</th>');
    expect(body).toContain('<h2 class="panel-title">&lt;script&gt;alert(1)&lt;/script&gt; {x} "q"</h2>');
    expect(body).toContain('aria-label="&lt;script&gt;alert(1)&lt;/script&gt; {x} &quot;q&quot;"');
    expect(body).toContain("<dd>&lt;/td&gt;{s}</dd>");
  });

  it("Changes: a hostile badge and toned text are escaped in the grid", () => {
    uploadRenamed(screeningChangesTemplate);
    const tsx = panel(reactMarkup(exportReact()), "Changes");
    expect(tsx).toContain(`<span className="cell-badge tone-bad">{${JSON.stringify("<i>")}}</span>`);
    expect(tsx).toContain(`<span className="cell-tonetext is-neutral">{${JSON.stringify("{up}")}}</span>`);
    const html = panel(htmlBody(exportHTML()), "Changes");
    expect(html).toContain('<span class="cell-badge tone-bad">&lt;i&gt;</span>');
    expect(html).toContain('<span class="cell-tonetext is-neutral">{up}</span>');
  });

  it("a tone, a point colour and a sparkline value cannot carry markup", () => {
    const columns: GridColumn[] = [
      { field: "n", header: "N" },
      { field: "b", header: "B", kind: "number", cell: { type: "bar", tone: 'x" onload="alert(1)' as never } },
      { field: "s", header: "S", cell: { type: "sparkline", tone: "<script>" as never } },
      { field: "t", header: "T", cell: { type: "toneText", tones: { a: '"><script>' as never } } },
    ];
    const rows = [{ n: "r", b: 50, s: '1, 2, "><script>, 3', t: "a" }];
    for (const d of [JSX_DIALECT, HTML_DIALECT]) {
      const out = tableLines(d, columns, rows, { label: "t" }).join("\n");
      expect(out).not.toContain("onload");
      expect(out).not.toContain("<script>");
      expect(out).toContain("cell-bar tone-neutral");
      expect(out).toContain("cell-spark tone-neutral");
      expect(out).toContain('<polyline points="0,16.5 28,9 56,1.5" />');
    }
    expect(tsxSyntaxErrors(`const T = () => (\n${tableLines(JSX_DIALECT, columns, rows, { label: "t" }).join("\n")}\n);`)).toEqual([]);
    const settings = chartPointSettingsOf({
      id: "c", type: "HighchartColumn",
      props: { pointColors: ["good", "#fff", "url(javascript:x)", "rgb(1, 2, 3)", 7], pointColorsByName: { A: "bad", B: "</script>" }, selectedPoint: 'a"b', valueMax: -1, labelWrap: "yes" },
    } as Block);
    expect(settings).toEqual({ pointColors: ["good", "#fff", "", "rgb(1, 2, 3)", ""], pointColorsByName: { A: "bad" }, selected: 'a"b' });
  });
});

describe("chart export of the new settings", () => {
  it("gauge: valueMax, decimals, suffix and the point colour are emitted; the reading as text", () => {
    const block = { id: "g", type: "HighchartGauge", props: { chartType: "gauge", panel: true, title: "Score", value: 6.3363, valueMax: 10, valueDecimals: 2, pointColors: ["accent"] } } as Block;
    const jsx = chartBlockJsx(block, "light");
    expect(jsx).toContain('<ChartBlock type="gauge" title="Score" value={6.3363} mode="light"');
    expect(jsx).toContain('valueDecimals={2} valueMax={10} pointColors={["accent"]} />');
    expect(gaugeValueText(block.props)).toBe("6.34 of 10");
    expect(gaugeValueText({ value: 87 })).toBe("87%");
    expect(gaugeValueText({ value: 4.5, valueMax: 5, valueSuffix: " pts", valueDecimals: 1 })).toBe("4.5 pts of 5");
  });

  it("the selected point comes from the binding only", () => {
    apply(screening);
    /* A stray prop of the same name on the block is not a selection. */
    useBuilder.getState().updateZoneBlockProps("body", "tpl-screening-funnel", { selectedPoint: "Non SI", record: { title: "x", sections: [] } });
    expect(chartLines(exportReact(), "waterfall")[0]).not.toContain(" selected=");
    useBuilder.getState().setReportState("select:stage", "Top Down");
    expect(chartProp<string>(chartLines(exportReact(), "waterfall")[0], "selected")).toBe("Top Down");
  });

  it("isSum is kept for a waterfall only", () => {
    const seriesData = [{ name: "A", y: 1 }, { name: "Sum", y: 0, isSum: true }];
    expect(chartDataOf({ id: "w", type: "HighchartWaterfall", props: { chartType: "waterfall", seriesData } } as Block).seriesData).toEqual([{ name: "A", y: 1 }, { name: "Sum", y: 0, isSum: true }]);
    expect(chartDataOf({ id: "p", type: "HighchartPie", props: { chartType: "pie", seriesData } } as Block).seriesData).toEqual([{ name: "A", y: 1 }, { name: "Sum", y: 0 }]);
  });

  it("the extended helper adds to the base helper and both parse", () => {
    const base = chartHelperSource("salt");
    const extended = chartHelperSource("salt", { extended: true });
    expect(chartHelperSource("salt", { extended: false })).toBe(base);
    for (const piece of ['case "waterfall":', "applyPointStyling", "applyGaugeSettings", "valueMax", "pointColors", "labelWrap"]) {
      expect(base, piece).not.toContain(piece);
      expect(extended, piece).toContain(piece);
    }
    /* Tone names resolve to the theme's status colours. */
    for (const line of ['case "good": return v.positive;', 'case "mid": return v.warning;', 'case "bad": return v.negative;', 'case "accent": return v.primary;']) expect(extended).toContain(line);
    /* Every line of the base helper is still there, in order. */
    let at = 0;
    for (const line of base.split("\n")) {
      if (line.includes("type ChartPoint") || /^ {2,4}height, hideTitle, /.test(line)) continue;
      const i = extended.indexOf(line, at);
      expect(i, line).toBeGreaterThanOrEqual(0);
      at = i;
    }
    expect(tsxSyntaxErrors(`import React from "react";\n${base}`)).toEqual([]);
    expect(tsxSyntaxErrors(`import React from "react";\n${extended}`)).toEqual([]);
  });

  it("which charts need the extended helper", () => {
    const chart = (props: Record<string, unknown>, type = "HighchartColumn") => ({ id: "c", type, props } as Block);
    expect(usesExtendedChart(chart({ chartType: "column", title: "T", legend: false, valueDecimals: 1 }))).toBe(false);
    expect(usesExtendedChart(chart({ chartType: "gauge", value: 40 }, "HighchartGauge"))).toBe(false);
    expect(usesExtendedChart(chart({ chartType: "gauge", valueMax: 10 }, "HighchartGauge"))).toBe(true);
    expect(usesExtendedChart(chart({ chartType: "gauge", panel: true }, "HighchartGauge"))).toBe(true);
    expect(usesExtendedChart(chart({ chartType: "waterfall" }, "HighchartWaterfall"))).toBe(true);
    expect(usesExtendedChart(chart({ chartType: "column", pointColorsByName: { A: "good" } }))).toBe(true);
    expect(usesExtendedChart(chart({ chartType: "column", labelWrap: true }))).toBe(true);
    expect(usesExtendedChart({ id: "b", type: "SimulatedButton", props: { labelWrap: true } } as Block)).toBe(false);
  });
});

describe("record panel emitter", () => {
  const block = (record?: unknown): Block => ({ id: "r", type: "RecordPanel", props: { title: "Detail <x>", height: 300, emptyText: "Pick {one}", ...(record ? { record } : {}) } });

  it("the empty state uses the block's title and text, escaped", () => {
    const jsx = recordPanelLines(JSX_DIALECT, block()).join("\n");
    expect(jsx).toContain(`<h2 className="panel-title">{${JSON.stringify("Detail <x>")}}</h2>`);
    expect(jsx).toContain(`<p>{${JSON.stringify("Pick {one}")}}</p>`);
    expect(jsx).toContain("style={{ height: 300 }}");
    expect(tsxSyntaxErrors(`const R = () => (\n${jsx}\n);`)).toEqual([]);
    const html = recordPanelLines(HTML_DIALECT, block()).join("\n");
    expect(html).toContain("<p>Pick {one}</p>");
    expect(html).toContain('<h2 class="panel-title">Detail &lt;x&gt;</h2>');
  });

  it("a flat change says so in text; a one-point trend is not drawn", () => {
    const record = {
      title: "Rec",
      sections: [
        { type: "table", columns: ["A", "B"], rows: [{ label: "Same", cells: ["1", "1"], change: { direction: "flat", tone: "neutral", magnitude: 0 } }, { label: "Up", cells: ["1", "2"], change: { direction: "up", tone: "good", magnitude: 1 } }] },
        { type: "trend", title: "T", categories: ["1"], points: [4], seriesName: "S" },
      ],
    };
    const html = recordPanelLines(HTML_DIALECT, block(record)).join("\n");
    expect(html).toContain('<span class="record-flat"><span aria-hidden="true">-</span><span class="visually-hidden">No change</span></span>');
    expect(html).toContain('<span class="record-change tone-good">');
    expect((html.match(/<table/g) ?? []).length).toBe(1);
    expect(html).not.toContain(">T</h3>");
  });
});

describe("existing exports are unchanged", () => {
  it("a canvas with none of the new features: no rich rules, the base helper, the same table markup", () => {
    apply(riskAnalytics);
    const files = exportReactFiles();
    const tsx = files[0].contents;
    expect(files[1].contents).toBe(buildStylesCss("salt", "light"));
    expect(files[1].contents).not.toContain(".tone-good");
    expect(tsx.endsWith(`\n${chartHelperSource("salt")}`)).toBe(true);
    expect(tsx).not.toMatch(/cell-|tone-|visually-hidden|applyPointStyling/);
    const html = exportHTML();
    expect(html).not.toContain(".tone-good");
    expect(html).not.toContain("chart-value");
    expect(fileFromBootstrap(exportViteBootstrap(), "src/styles.css")).toBe(`${buildStylesCss("salt", "light")}`.replace(/\n$/, ""));
  });
});
