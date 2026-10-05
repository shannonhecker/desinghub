import { describe, it, expect, beforeEach } from "vitest";
import ts from "typescript";
import { useBuilder, DEFAULT_ZONE_LAYOUTS } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";
import { applyTemplateToCanvas } from "@/lib/applyTemplate";
import { FINANCE_BRAND, riskAnalytics } from "@/lib/financeTemplates";
import { screeningChangesTemplate } from "@/lib/sustainableTemplates";
import { issuerClimate, issuerInvolvement, issuerControversies, entityComparison, governanceScorecard, analyticsHome } from "@/lib/issuerTemplates";
import type { BuilderTemplate } from "@/lib/builderTemplates";
import { issuerDataset } from "@/lib/reportData/issuerDataset";
import { viewByStateKey } from "@/lib/panelMetrics";
import type { GridColumn, GridRow } from "@/lib/dataGridModel";
import { exportReact, exportReactFiles } from "../reactExporter";
import { exportHTML } from "../htmlExporter";
import { exportViteBootstrap } from "../viteExporter";
import { chartBlockJsx, chartHelperSource, chartShapeSettingsOf, usesShapeChart } from "../chartExporter";
import { materialiseBlock, materialiseCanvas } from "../materialise";
import {
  JSX_DIALECT, HTML_DIALECT, TILE_ICON_NODES, chartDataLines, entityHeaderLines, heroSearchLines, launcherCardLines, metricTileLines,
  recordPanelLines, tableLines, usesReportBlocks, verdictCardLines,
} from "../reportMarkup";
import { REPORT_BLOCKS_CSS, REPORT_RICH_CSS, buildStylesCss } from "../stylesCss";

/* ════════════════════════════════════════════════════════════
   Code export of the issuer templates (Issuer Climate, Business
   Involvement, Controversies, Entity Comparison, Governance
   Scorecard, Analytics Home): the report card blocks, dot / chip
   cells, heading rows, the radar and corridor charts and the
   labelled value axis go out as the canvas shows them, with nothing
   of the data layer in the output. Setup follows
   sustainableExport.test.ts.
   ════════════════════════════════════════════════════════════ */

const SI_TEMPLATES: [name: string, tpl: BuilderTemplate, activePage: string][] = [
  ["Issuer Climate", issuerClimate, "Climate"],
  ["Issuer Business Involvement", issuerInvolvement, "Business involvement"],
  ["Issuer Controversies", issuerControversies, "Controversies"],
  ["Entity Comparison", entityComparison, "Entity comparison"],
  ["Governance Scorecard", governanceScorecard, "Corporate governance"],
];
const ALL_TEMPLATES: [name: string, tpl: BuilderTemplate][] = [...SI_TEMPLATES.map(([n, t]) => [n, t] as [string, BuilderTemplate]), ["Analytics Home", analyticsHome]];
const SYSTEMS = ["salt", "m3", "fluent", "carbon", "uoaui"] as const;
const GROUPS = ["Portfolio", "Issuer report", "Screening", "Scorecard"];
/* The section's nine pages, in order (two are named "Climate"). */
const PAGES = ["ESG", "Climate", "Climate", "Business involvement", "Controversies", "Entity comparison", "Screening", "Changes", "Corporate governance"];
const ENTITY = "Avocado Inc";
const OTHER = "Helios Energy";

function apply(tpl: BuilderTemplate, ds: (typeof SYSTEMS)[number] = "salt") {
  /* The canvas as it is inside the connected workspace: sibling reports in
     the sidebar and the workspace tabs (a standalone card drops those links). */
  applyTemplateToCanvas(tpl, ds, { linked: true });
  useBuilder.setState({ mode: "light" as never });
}
const setState = (key: string, value: string) => useBuilder.getState().setReportState(key, value);

/** The component part of a React export (the appended chart helper is fixed source). */
function reactMarkup(tsx: string): string {
  const i = tsx.indexOf("/* ── ChartBlock:");
  return i === -1 ? tsx : tsx.slice(0, i);
}
const helperOf = (tsx: string): string => tsx.slice(tsx.indexOf("/* ── ChartBlock:"));
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
const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** One panel of an export, from its <section aria-label="title"> to its end. */
function panel(markup: string, title: string): string {
  const start = markup.search(new RegExp(`<section (className|class)="panel" aria-label="${escapeRe(title)}"`));
  if (start === -1) throw new Error(`panel ${title} not found`);
  return markup.slice(start, markup.indexOf("</section>", start));
}
/** A stretch of markup from an opening tag to its closing tag. */
function between(markup: string, open: string, close: string, from = 0): string {
  const start = markup.indexOf(open, from);
  if (start === -1) throw new Error(`${open} not found`);
  return markup.slice(start, markup.indexOf(close, start) + close.length);
}
/** Home's bare table (no panel around it). */
const dashboardsTable = (markup: string): string => between(markup, 'aria-label="Dashboards"', "</table>");
const bodyRows = (panelMarkup: string): string[] => panelMarkup.slice(panelMarkup.indexOf("<tbody>")).split("\n").filter((l) => /<tr[ >]/.test(l));
/** The JSON literal of a `name={...}` prop on a <ChartBlock> line. */
function chartProp<T>(line: string, name: string): T {
  const m = line.match(new RegExp(` ${name}=\\{(.*?)\\}(?= [a-zA-Z]+[= ]| />)`));
  if (!m) throw new Error(`prop ${name} not found`);
  return JSON.parse(m[1]) as T;
}
const chartLines = (tsx: string, type: string): string[] => tsx.split("\n").filter((l) => l.includes(`<ChartBlock type="${type}"`));
/** Text as it appears in JSX children position ("&" needs a string expression). */
function jsxChild(text: string): string {
  return /[<>{}&]/.test(text) ? `{${JSON.stringify(text)}}` : text;
}
/** JSX with its string expressions ({"..."}), array literals (a dropdown's
 *  chosen value) and chart data literals taken out: what is left is what the
 *  parser reads as markup. */
const jsxAsMarkup = (jsx: string): string =>
  jsx.split("\n").filter((l) => !l.includes("<ChartBlock ")).join("\n").replace(/=\{\[.*?\]\}/g, "").replace(/\{"(?:[^"\\]|\\.)*"\}/g, "");
const htmlChild = (text: string): string => text.replace(/&/g, "&amp;");
const entityRow = (name: string) => issuerDataset().tables.find((t) => t.id === "entities")!.rows.find((r) => r.name === name)!;
/** The titles of a template's framed panels (read from the template, never pinned). */
const panelTitles = (tpl: BuilderTemplate): string[] =>
  tpl.body.filter((b) => b.type === "DataGrid" || b.props.panel === true).map((b) => String(b.props.title));
const titleOf = (tpl: BuilderTemplate, id: string): string => String(tpl.body.find((b) => b.id === id)!.props.title);

const LEAKS = ["binding", "stateKey", "[object Object]", "NaN"];
/* Names of the data layer and of the canvas's live props. */
const LIVE_NAMES = /useBuilder|reportState|resolve[A-Z]\w*\(|sampleDataset|selectState|selectValue|selectDefault|heroField|statusField|toneField|captionField|keyField|showWhen|groupRows|templateId|lucide/;

beforeEach(() => {
  useBuilder.setState({
    activeTemplateId: null, reportState: {}, reportData: null, expandedPanel: null,
    zoneLayouts: JSON.parse(JSON.stringify(DEFAULT_ZONE_LAYOUTS)),
  } as never);
});

describe.each(SI_TEMPLATES)("%s: export carries the canvas", (_name, tpl, activePage) => {
  const titles = panelTitles(tpl);

  it("React: brand, page title, sidebar groups and items, panel titles, the entity", () => {
    apply(tpl);
    const tsx = exportReact();
    expect(tsx).toContain(FINANCE_BRAND);
    expect(tsx).toContain('<h1 className="page-title">Sustainable Investment</h1>');
    expect(tsx).toMatch(/<aside aria-label="Sidebar" className="zone-sidebar"/);
    const sidebar = between(tsx, "<aside", "</aside>");
    expect([...sidebar.matchAll(/<p className="nav-group">([^<]+)<\/p>/g)].map((m) => m[1])).toEqual(GROUPS);
    /* Salt's own navigation item: nine pages, the active one marked. */
    const items = [...sidebar.matchAll(/<NavigationItem href="#"( active)? orientation="vertical">([^<]+)<\/NavigationItem>/g)];
    expect(items.map((m) => m[2])).toEqual(PAGES);
    const active = items.filter((m) => m[1]);
    expect(active).toHaveLength(1);
    expect(active[0][2]).toBe(activePage);
    /* "Climate" is two pages: the active one sits under its own group. */
    const activeAt = sidebar.indexOf('<NavigationItem href="#" active ');
    const groupBefore = [...sidebar.slice(0, activeAt).matchAll(/<p className="nav-group">([^<]+)<\/p>/g)].pop()![1];
    expect(groupBefore).toBe(tpl === governanceScorecard ? "Scorecard" : "Issuer report");
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) expect(tsx, title).toContain(`<h2 className="panel-title">${jsxChild(title)}</h2>`);
    expect(tsx).toContain(ENTITY);
    expect(tsxSyntaxErrors(tsx)).toEqual([]);
  });

  it("HTML: brand, page title, sidebar groups and items, panel titles, the entity", () => {
    apply(tpl);
    const body = htmlBody(exportHTML());
    expect(body).toContain(FINANCE_BRAND);
    expect(body).toContain('<h1 class="page-title">Sustainable Investment</h1>');
    const sidebar = between(body, '<aside aria-label="Sidebar" class="zone-sidebar">', "</aside>");
    expect([...sidebar.matchAll(/<p class="nav-group">([^<]+)<\/p>/g)].map((m) => m[1])).toEqual(GROUPS);
    const items = [...sidebar.matchAll(/<button class="nav-item( active)?">([^<]+)<\/button>/g)];
    expect(items.map((m) => m[2])).toEqual(PAGES);
    expect(items.filter((m) => m[1]).map((m) => m[2])).toEqual([activePage]);
    for (const title of titles) expect(body, title).toContain(`<h2 class="panel-title">${htmlChild(title)}</h2>`);
    expect(body).toContain(ENTITY);
    expect(body).not.toContain('data-sidebar="none"');
    expect(body).not.toContain("No data");
  });
});

describe("Analytics Home: export carries the canvas", () => {
  it("React and HTML: brand, its own sidebar, the hero, the cards and the table", () => {
    apply(analyticsHome);
    const tsx = exportReact();
    expect(tsx).toContain(FINANCE_BRAND);
    for (const [i, item] of ["Dashboards", "Configuration", "Approvals", "Reports"].entries()) {
      expect(tsx).toContain(`<NavigationItem href="#"${i === 0 ? " active" : ""} orientation="vertical">${item}</NavigationItem>`);
    }
    /* The list sits straight on the page: a table, no panel around it. */
    expect(tsx).not.toContain('<h2 className="panel-title">Dashboards</h2>');
    expect(tsx).toContain('<div className="table-scroll" role="region" aria-label="Dashboards"');
    expect(tsx).toContain("Sustainable Investment Portfolio Report");
    /* No chart on the page: no chart runtime. */
    expect(tsx).not.toContain("highcharts");
    expect(tsxSyntaxErrors(tsx)).toEqual([]);
    const body = htmlBody(exportHTML());
    expect(body).toContain(FINANCE_BRAND);
    expect([...body.matchAll(/<button class="nav-item( active)?">([^<]+)<\/button>/g)].map((m) => `${m[2]}${m[1] ?? ""}`)).toEqual(["Dashboards active", "Configuration", "Approvals", "Reports"]);
    expect(body).toContain('<div class="table-scroll" role="region" aria-label="Dashboards"');
  });
});

describe.each(ALL_TEMPLATES)("%s: every dialect, every design system", (_name, tpl) => {
  it("Vite: App.tsx carries the same content; styles.css styles the blocks", () => {
    apply(tpl);
    const script = exportViteBootstrap();
    expect(script).not.toContain("Design Hub export too large");
    const app = fileFromBootstrap(script, "src/App.tsx");
    expect(app).toContain(FINANCE_BRAND);
    expect(app).not.toContain("Export too large to inline");
    expect(app).toBe(exportReact());
    expect(tsxSyntaxErrors(app)).toEqual([]);
    const css = fileFromBootstrap(script, "src/styles.css");
    expect(css).toContain(REPORT_RICH_CSS.trim());
    /* Every issuer page draws a card block (at the least its entity header). */
    expect(css.includes(REPORT_BLOCKS_CSS.trim())).toBe(true);
    /* Highcharts is a dependency exactly when the page draws a chart. */
    const deps = JSON.parse(fileFromBootstrap(script, "package.json")).dependencies;
    expect("highcharts" in deps).toBe(app.includes("<ChartBlock"));
    expect(deps).not.toHaveProperty("lucide-react");
  });

  it.each(SYSTEMS)("no data-layer leak, in any dialect (%s)", (ds) => {
    apply(tpl, ds);
    /* As applied, then with another entity, comparator, category and views chosen. */
    for (const changed of [false, true]) {
      if (changed) {
        setState("entity", OTHER);
        setState("comparator", "Meridian Banc");
        setState("select:category", "Product & Service Mix");
        setState("homeClass", "Company");
        for (const b of tpl.body) {
          const viewBy = b.props.viewBy as string[] | undefined;
          if (viewBy?.length) setState(viewByStateKey(b.id), viewBy[viewBy.length - 1]);
        }
      }
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
      expect(tsx).not.toMatch(LIVE_NAMES);
      expect(html).not.toMatch(LIVE_NAMES);
      /* Static: nothing in the component answers a click. */
      expect(reactMarkup(tsx)).not.toMatch(/onClick|onChange|useState/);
      expect(htmlBody(html)).not.toMatch(/onclick|<script/i);
      expect(tsxSyntaxErrors(tsx)).toEqual([]);
      /* Every block of the body is drawn: no placeholder for an unknown type. */
      expect(reactMarkup(tsx)).not.toMatch(/\{\/\* [A-Z]\w+ \*\/\}<\/div>/);
      expect(htmlBody(html)).not.toMatch(/<!-- [A-Z]\w+ --><\/div>/);
    }
  });

  it("the stylesheet covers every class the markup uses, with no literal colours", () => {
    apply(tpl);
    const files = exportReactFiles();
    const css = files.find((f) => f.path === "styles.css")!.contents;
    const used = new Set(
      [...reactMarkup(files[0].contents).matchAll(/className="([^"]+)"/g)]
        .flatMap((m) => m[1].split(" "))
        .filter((c) => /^(cell-|tone-|entity|tile|verdict|launcher|hero|record|visually-hidden|is-)/.test(c)),
    );
    expect(used.size).toBeGreaterThan(5);
    for (const c of used) expect(css, c).toContain(`.${c}`);
    expect(REPORT_BLOCKS_CSS.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g)).toBeNull();
    /* The HTML page carries the same rules. */
    expect(exportHTML().includes(REPORT_BLOCKS_CSS.trim().split("\n")[1])).toBe(true);
  });
});

describe("Issuer Climate", () => {
  const FACTS: [string, string][] = [["GICS sector", "Information Technology"], ["Region", "North America"], ["ISIN", "US0378331005"], ["As of", "Dec 2024"]];
  const PATHWAY = titleOf(issuerClimate, "tpl-ic-pathway");

  it("the header: the entity's name as a heading and its facts as a <dl>", () => {
    apply(issuerClimate);
    const tsx = between(reactMarkup(exportReact()), '<div className="entity"', "</dl>");
    expect(tsx).toContain('<div className="entity" style={{ height: 84 }}>');
    expect(tsx).toContain(`<h2 className="entity-title">${ENTITY}</h2>`);
    expect(tsx).toContain('<dl className="entity-facts">');
    expect([...tsx.matchAll(/<div><dt>([^<]+)<\/dt><dd>([^<]+)<\/dd><\/div>/g)].map((m) => [m[1], m[2]])).toEqual(FACTS);
    expect(tsx).not.toContain("cell-tag");
    const html = between(htmlBody(exportHTML()), '<div class="entity"', "</dl>");
    expect(html).toContain('<div class="entity" style="height: 84px">');
    expect(html).toContain(`<h2 class="entity-title">${ENTITY}</h2>`);
    expect([...html.matchAll(/<div><dt>([^<]+)<\/dt><dd>([^<]+)<\/dd><\/div>/g)].map((m) => [m[1], m[2]])).toEqual(FACTS);
  });

  it("the verdict card: chip, figure, unit, status, caption, labelled bar, stats, footnote, toned by the data", () => {
    apply(issuerClimate);
    const row = entityRow(ENTITY);
    const pct = Number(row.pathPct);
    expect(pct).toBeGreaterThan(0);
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      const card = between(out, `<section ${cls}="verdict `, "</section>");
      expect(card).toContain(`<section ${cls}="verdict tone-good" aria-label="Portfolio alignment"`);
      expect(card).toContain(`<h2 ${cls}="verdict-title">Portfolio alignment</h2>`);
      expect(card).toContain(`<span ${cls}="verdict-chip"><span ${cls}="cell-dot-mark" aria-hidden="true"></span>Net zero 2050</span>`);
      expect(card).toContain(`<span ${cls}="verdict-figure">1.6</span><span ${cls}="verdict-unit">°C</span> <span ${cls}="verdict-status">Aligned</span>`);
      expect(card).toContain(`<p ${cls}="verdict-caption">On a credible net-zero pathway</p>`);
      expect(card).toContain(`<span>2030 path vs budget</span> <span>${pct}% of ceiling</span>`);
      expect(card).toContain(`role="img" aria-label="2030 path vs budget: ${pct}% of ceiling"`);
      expect(card).toContain(cls === "class" ? `<span class="cell-bar-fill" style="width: ${pct}%"></span>` : `<span className="cell-bar-fill" style={{ width: "${pct}%" }}></span>`);
      expect(card).toContain(`<div><dt>Budget undershoot</dt><dd ${cls}="is-toned tone-good">${Number(row.undershoot).toFixed(1)} Mt</dd></div>`);
      expect(card).toContain("<div><dt>ESG rating</dt><dd>AA</dd></div>");
      expect(card).toContain(`<p ${cls}="verdict-footnote">Implied warming against the industry pathway.</p>`);
    }
  });

  it("the corridor: its two series, the band name, and three series in the exported helper", () => {
    apply(issuerClimate);
    const tsx = exportReact();
    const [corridor] = chartLines(tsx, "corridor");
    const series = chartProp<{ name: string; data: number[] }[]>(corridor, "series");
    expect(series.map((s) => s.name)).toEqual(["Net zero 2050 alignment", "Projected emissions"]);
    expect(chartProp<string[]>(corridor, "categories")).toHaveLength(11);
    expect(series[0].data).toHaveLength(11);
    expect(series[0].data[0]).toBe(40);
    expect(chartProp<string>(corridor, "bandName")).toBe("Carbon budget undershoot");
    expect(corridor).toContain("hideTitle");
    /* The helper draws the ceiling (dashed), the band and the path, as the canvas does. */
    const helper = helperOf(tsx);
    const drawn = helper.slice(helper.indexOf('case "corridor":'), helper.indexOf('case "heatmap":'));
    expect((drawn.match(/\{ type: "(line|arearange|area)", name: /g) ?? [])).toEqual(['{ type: "line", name: ', '{ type: "arearange", name: ', '{ type: "area", name: ']);
    for (const piece of ['dashStyle: "Dash"', 'props.bandName || "Headroom"', "fillOpacity: 0.16", "enableMouseTracking: false", "fillOpacity: 0.14", "yAxis: { ...ty, min: 0 }", "shared: true"]) expect(drawn, piece).toContain(piece);
    /* arearange lives in highcharts-more, which the export loads. */
    expect(tsx).toContain('import "highcharts/highcharts-more";');
    /* HTML: the two series and the band between them, per year. */
    const html = panel(htmlBody(exportHTML()), PATHWAY);
    expect(html).toContain('<th scope="col" class="num">Net zero 2050 alignment</th><th scope="col" class="num">Projected emissions</th><th scope="col" class="num">Carbon budget undershoot</th>');
    const rows = bodyRows(html);
    expect(rows).toHaveLength(11);
    const first = rows[0].match(/<th scope="row">2030<\/th><td class="num">([\d.]+)<\/td><td class="num">([\d.]+)<\/td><td class="num">([\d.]+)<\/td>/)!;
    expect(Number(first[1]) - Number(first[2])).toBeCloseTo(Number(first[3]), 2);
    expect(Number(first[3])).toBe(Number(entityRow(ENTITY).undershoot));
  });

  it("choosing another entity changes the header, the verdict and the chart data", () => {
    apply(issuerClimate);
    const before = chartLines(exportReact(), "corridor")[0];
    const summaryBefore = chartLines(exportReact(), "column")[0];
    setState("entity", OTHER);
    const tsx = reactMarkup(exportReact());
    expect(tsx).toContain(`<h2 className="entity-title">${OTHER}</h2>`);
    expect(tsx).toContain("<div><dt>GICS sector</dt><dd>Energy</dd></div>");
    expect(tsx).toContain("<div><dt>ISIN</dt><dd>FR0000120271</dd></div>");
    const card = between(tsx, '<section className="verdict ', "</section>");
    expect(card).toContain('<section className="verdict tone-bad"');
    expect(card).toContain('<span className="verdict-figure">2.9</span>');
    expect(card).toContain('<span className="verdict-status">Misaligned</span>');
    expect(card).toContain("Off a credible net-zero pathway");
    expect(card).toContain(`style={{ width: "${entityRow(OTHER).pathPct}%" }}`);
    expect(card).toMatch(/<dt>Budget undershoot<\/dt><dd className="is-toned tone-bad">-\d+\.\d Mt<\/dd>/);
    expect(card).toContain("<dt>ESG rating</dt><dd>BB</dd>");
    const after = chartLines(tsx, "corridor")[0];
    expect(after).not.toBe(before);
    const [ceiling, path] = chartProp<{ name: string; data: number[] }[]>(after, "series");
    expect(ceiling.data).toEqual(chartProp<{ data: number[] }[]>(before, "series")[0].data);
    expect(path.data).not.toEqual(chartProp<{ data: number[] }[]>(before, "series")[1].data);
    expect(chartLines(tsx, "column")[0]).not.toBe(summaryBefore);
    expect(chartProp<{ name: string }[]>(chartLines(tsx, "column")[0], "series")[0].name).toBe(OTHER);
    /* HTML follows too; a path over its ceiling is a negative band. */
    const body = htmlBody(exportHTML());
    expect(body).toContain(`<h2 class="entity-title">${OTHER}</h2>`);
    expect(body).toContain('<span class="verdict-status">Misaligned</span>');
    expect(panel(body, PATHWAY)).toMatch(/<td class="num is-negative">-\d/);
  });

  it("a panel's View by changes the benchmark; a peer grid's changes the metric it ranks by", () => {
    apply(issuerClimate);
    const names = () => chartProp<{ name: string }[]>(chartLines(exportReact(), "column")[0], "series").map((s) => s.name);
    expect(names()).toEqual([ENTITY, "GICS industry average"]);
    setState(viewByStateKey("tpl-ic-summary"), "Region");
    expect(names()).toEqual([ENTITY, "Region average"]);
    const peers = titleOf(issuerClimate, "tpl-ic-industry-peers");
    expect(panel(reactMarkup(exportReact()), peers)).toContain('<th scope="col" className="num">Intensity (EVIC)</th>');
    setState(viewByStateKey("tpl-ic-industry-peers"), "Total emissions");
    const grid = panel(reactMarkup(exportReact()), peers);
    expect(grid).toContain('<th scope="col" className="num">Total emissions</th>');
    expect(grid).not.toContain("Intensity (EVIC)</th>");
    const totals = bodyRows(grid).map((r) => Number(r.match(/<td className="num">(\d+)<\/td><\/tr>/)![1]));
    expect(totals).toEqual([...totals].sort((a, b) => a - b));
    expect(totals).toHaveLength(5);
  });
});

describe("Issuer Business Involvement", () => {
  const TILES: [label: string, field: string][] = [
    ["Health and wellness", "involvementHealth"], ["Entertainment", "involvementEntertainment"], ["Weapons & defence", "involvementWeapons"],
    ["Fossil fuels and energy", "involvementEnergy"], ["Business practices", "involvementPractices"],
  ];

  it("five tiles: label, icon and figure, not selectable", () => {
    apply(issuerInvolvement);
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      const tiles = [...out.matchAll(new RegExp(`<div ${cls}="tile"[^>]*>[\\s\\S]*?<span ${cls}="tile-label">([^<]+|\\{"[^"]+"\\})</span>[\\s\\S]*?(<svg ${cls}="tile-icon" width="34" height="34"[^>]*>.*?</svg>)\\s*<span ${cls}="tile-value( is-muted)?">([^<]+)</span>`, "g"))];
      expect(tiles).toHaveLength(5);
      tiles.forEach((m, i) => {
        const [label, field] = TILES[i];
        expect(m[1]).toBe(cls === "class" ? htmlChild(label) : jsxChild(label));
        const figure = String(entityRow(ENTITY)[field]);
        expect(m[4]).toBe(figure);
        expect(Boolean(m[3])).toBe(figure === "0");
        expect(m[2]).toContain('aria-hidden="true"');
      });
      /* Five different icons. */
      expect(new Set(tiles.map((m) => m[2])).size).toBe(5);
      expect(out).not.toContain("aria-pressed");
      expect(out).not.toContain("tile-selectable");
    }
    expect(reactMarkup(exportReact())).toContain('<div className="tile" style={{ height: 112 }}>');
  });

  it("the detail grid: heading rows with counts, indented leaves, the tie dot", () => {
    apply(issuerInvolvement);
    const title = titleOf(issuerInvolvement, "tpl-ib-details");
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      const grid = panel(out, title);
      const amp = cls === "class" ? htmlChild : jsxChild;
      const rows = bodyRows(grid);
      expect(rows).toHaveLength(11);
      const headings = rows.filter((r) => r.includes(`<tr ${cls}="is-heading">`));
      /* The heading: its label as the row header, the count of ties, nothing else. */
      expect(headings.map((r) => r.trim())).toEqual(
        ["Entertainment & Lifestyle", "Fossil Fuels & Energy", "Weapons & Defence"].map((g) => `<tr ${cls}="is-heading"><th scope="row">${amp(g)}</th><td ${cls}="num">1</td><td></td><td ${cls}="num"></td></tr>`),
      );
      expect(grid).not.toContain("is-total");
      const leaves = rows.filter((r) => !r.includes("is-heading"));
      for (const leaf of leaves) expect(leaf).toContain('<th scope="row" data-indent="1">');
      /* "Yes" is a filled, strong, bad dot; "No" a hollow neutral ring. */
      const dot = (extra: string, tone: string, text: string) => `<span ${cls}="cell-dot ${extra} tone-${tone}"><span ${cls}="cell-dot-mark" aria-hidden="true"></span>${text}</span>`;
      expect(grid).toContain(`<th scope="row" data-indent="1">Alcohol</th><td ${cls}="num"></td><td>${dot("is-strong", "bad", "Yes")}</td><td ${cls}="num">1.44%</td>`);
      expect(grid).toContain(`<th scope="row" data-indent="1">Gambling</th><td ${cls}="num"></td><td>${dot("is-hollow", "neutral", "No")}</td><td ${cls}="num"></td>`);
      expect(leaves.filter((r) => r.includes("is-hollow"))).toHaveLength(5);
      expect(leaves.filter((r) => r.includes("is-strong"))).toHaveLength(3);
    }
    /* Another entity: other counts on the headings. */
    setState("entity", OTHER);
    const grid = panel(htmlBody(exportHTML()), title);
    expect(grid).toContain('<tr class="is-heading"><th scope="row">Entertainment &amp; Lifestyle</th><td class="num">3</td>');
  });

  it("the radar: two series on eight spokes, the canvas options in the helper", () => {
    apply(issuerInvolvement);
    const tsx = exportReact();
    const [radar] = chartLines(tsx, "radar");
    expect(radar).toContain(`title="${titleOf(issuerInvolvement, "tpl-ib-radar")}"`);
    const series = chartProp<{ name: string; data: number[] }[]>(radar, "series");
    expect(series.map((s) => s.name)).toEqual([ENTITY, "GICS industry peers"]);
    expect(chartProp<string[]>(radar, "categories")).toHaveLength(8);
    for (const s of series) expect(s.data).toHaveLength(8);
    expect(chartProp<string>(radar, "yAxisFormat")).toBe("{value}%");
    expect(chartProp<string>(radar, "valueSuffix")).toBe("%");
    const helper = helperOf(tsx);
    const drawn = helper.slice(helper.indexOf('case "radar":'), helper.indexOf('case "corridor":'));
    for (const piece of ['chart: { ...tc, polar: true, type: "line" }', 'pane: { size: "78%" }', 'tickmarkPlacement: "on"', 'gridLineInterpolation: "polygon"', 'pointPlacement: "on"', "marker: { enabled: true, radius: 3 }", "shared: true"]) expect(drawn, piece).toContain(piece);
    expect(tsx).toContain('import "highcharts/highcharts-more";');
    /* The View by changes the peers. */
    setState(viewByStateKey("tpl-ib-radar"), "Market cap");
    expect(chartProp<{ name: string }[]>(chartLines(exportReact(), "radar")[0], "series").map((s) => s.name)).toEqual([ENTITY, "Market cap peers"]);
    /* HTML: the two series as a table, one row per spoke. */
    const html = panel(htmlBody(exportHTML()), titleOf(issuerInvolvement, "tpl-ib-radar"));
    expect(html).toContain(`<th scope="col" class="num">${ENTITY}</th><th scope="col" class="num">Market cap peers</th>`);
    expect(bodyRows(html)).toHaveLength(8);
    expect(html).toMatch(/<th scope="row">Alcohol<\/th><td class="num">1\.44%<\/td>/);
  });
});

describe("Issuer Controversies", () => {
  it("the Social tile: its figure and three sub-figures, each with its icon", () => {
    apply(issuerControversies);
    const row = entityRow(ENTITY);
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      const at = out.indexOf(`<span ${cls}="tile-label">Social</span>`);
      const tile = out.slice(at, out.indexOf("</div>", at));
      expect(tile).toContain(`<span ${cls}="tile-value">${row.controversySoc}</span>`);
      const subs = [...tile.matchAll(new RegExp(`<span ${cls}="tile-sub"><span ${cls}="tile-sub-label">([^<]+|\\{"[^"]+"\\})</span><span ${cls}="tile-sub-main"><svg ${cls}="tile-sub-icon" width="22" height="22"[^>]*>.*?</svg><span ${cls}="tile-sub-value">(\\d+)</span></span></span>`, "g"))];
      expect(subs.map((m) => [m[1], m[2]])).toEqual([
        ["Human rights", String(row.humanRights)],
        [cls === "class" ? "Labour &amp; supply chain" : '{"Labour & supply chain"}', String(row.labourRights)],
        ["Customers", String(row.customers)],
      ]);
      /* The other two tiles have none. */
      expect((out.match(new RegExp(`${cls}="tile-subs"`, "g")) ?? [])).toHaveLength(1);
      expect((out.match(new RegExp(`<div ${cls}="tile"`, "g")) ?? [])).toHaveLength(3);
    }
  });

  it("severity dots: toned by column, blank at zero; headings carry the sums", () => {
    apply(issuerControversies);
    const title = titleOf(issuerControversies, "tpl-ico-grid");
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      const grid = panel(out, title);
      const dot = (tone: string, n: number) => `<td ${cls}="num"><span ${cls}="cell-dot tone-${tone}"><span ${cls}="cell-dot-mark" aria-hidden="true"></span>${n}</span></td>`;
      const blank = `<td ${cls}="num"></td>`;
      /* Zero everywhere: the total is written, the three dots are not. */
      expect(grid).toContain(`<tr><th scope="row" data-indent="1">Energy</th><td ${cls}="num">0</td>${blank}${blank}${blank}</tr>`);
      expect(grid).toContain(`<tr><th scope="row" data-indent="1">Biodiversity</th><td ${cls}="num">1</td>${dot("neutral", 1)}${blank}${blank}</tr>`);
      expect(grid).toContain(`<tr ${cls}="is-heading"><th scope="row">Social</th><td ${cls}="num">7</td>${dot("neutral", 6)}${dot("mid", 1)}${blank}</tr>`);
      /* Governance has no categories: a heading only. */
      expect(grid).toContain(`<tr ${cls}="is-heading"><th scope="row">Governance</th><td ${cls}="num">1</td>${dot("neutral", 1)}${blank}${blank}</tr>`);
      expect(bodyRows(grid)).toHaveLength(11);
      expect(grid).not.toMatch(/cell-dot-mark[^/]*<\/span>0</);
      expect(grid).not.toContain("is-hollow");
    }
    setState("entity", OTHER);
    expect(panel(htmlBody(exportHTML()), title)).toMatch(/<span class="cell-dot tone-bad"><span class="cell-dot-mark" aria-hidden="true"><\/span>\d<\/span>/);
  });
});

describe("Entity Comparison", () => {
  const RATING = titleOf(entityComparison, "tpl-ec-rating");

  it("both summary panels: the record as the title, no subtitle, its pairs", () => {
    apply(entityComparison);
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      for (const [name, ticker, sector, flag, country, rating, tone] of [[ENTITY, "AVCD", "Information Technology", "🇺🇸", "US", "AA", "good"], [OTHER, "HLEN", "Energy", "🇫🇷", "FR", "BB", "mid"]] as const) {
        const card = panel(out, name);
        expect(card).toContain(`<h2 ${cls}="panel-title">${name}</h2>`);
        /* clearable: false: the record is the only title. */
        expect(card).not.toContain("panel-subtitle");
        expect(card).toContain(`<dl ${cls}="record-pairs is-rows">`);
        expect(card).toContain(`<dt>ESG rating</dt><dd><span ${cls}="cell-badge tone-${tone}">${rating}</span></dd>`);
        expect(card).toContain(`<dt>Ticker</dt><dd>${ticker}</dd>`);
        expect(card).toContain(`<dt>GICS sector</dt><dd>${sector}</dd>`);
        expect(card).toContain(`<dt>Country of risk</dt><dd><span aria-hidden="true">${flag} </span>${country}</dd>`);
        expect(card).toContain(`<dt>Alignment</dt><dd>${entityRow(name).alignmentLabel}</dd>`);
        expect(card).not.toContain("record-empty");
        expect((card.match(new RegExp(`<div ${cls}="record-pair">`, "g")) ?? [])).toHaveLength(8);
      }
      expect(out).not.toContain(">Entity</span>");
      expect(out).not.toContain("Select a row");
    }
  });

  it("the rating trend prints the scale's labels: on the axis, in the tooltip, and in the HTML table", () => {
    apply(entityComparison);
    const tsx = exportReact();
    const trend = tsx.split("\n").find((l) => l.includes(`<ChartBlock type="line" title="${RATING}"`))!;
    expect(chartProp<string[]>(trend, "yAxisCategories")).toEqual(["CCC", "B", "BB", "BBB", "A", "AA", "AAA"]);
    expect(chartProp<string[]>(trend, "categories")).toEqual(["Q1 23", "Q2 23", "Q3 23", "Q4 23", "Q1 24"]);
    expect(chartProp<{ name: string; data: number[] }[]>(trend, "series")).toEqual([{ name: ENTITY, data: [4, 4, 5, 5, 5] }, { name: OTHER, data: [3, 2, 2, 2, 2] }]);
    /* Only this chart carries the prop. */
    expect((reactMarkup(tsx).match(/ yAxisCategories=/g) ?? [])).toHaveLength(1);
    const helper = helperOf(tsx);
    for (const piece of ["categories: labels, min: 0, max: labels.length - 1, tickInterval: 1", "labels[Math.round(p.y)] ?? p.y", "props.yAxisCategories"]) expect(helper, piece).toContain(piece);
    /* HTML: the labels, not the positions. */
    const html = panel(htmlBody(exportHTML()), RATING);
    expect(html).toContain(`<tr><th scope="col"></th><th scope="col">${ENTITY}</th><th scope="col">${OTHER}</th></tr>`);
    expect(bodyRows(html).map((r) => r.trim())).toEqual([
      '<tr><th scope="row">Q1 23</th><td>A</td><td>BBB</td></tr>',
      '<tr><th scope="row">Q2 23</th><td>A</td><td>BB</td></tr>',
      '<tr><th scope="row">Q3 23</th><td>AA</td><td>BB</td></tr>',
      '<tr><th scope="row">Q4 23</th><td>AA</td><td>BB</td></tr>',
      '<tr><th scope="row">Q1 24</th><td>AA</td><td>BB</td></tr>',
    ]);
  });

  it("changing the comparator changes the second panel and every chart's second series", () => {
    apply(entityComparison);
    setState("comparator", "Northwind Pharma");
    const tsx = reactMarkup(exportReact());
    expect(() => panel(tsx, OTHER)).toThrow();
    const card = panel(tsx, "Northwind Pharma");
    expect(card).toContain("<dt>Ticker</dt><dd>NWPH</dd>");
    expect(card).toContain('<span className="cell-badge tone-good">AAA</span>');
    /* The first panel stays. */
    expect(panel(tsx, ENTITY)).toContain("<dt>Ticker</dt><dd>AVCD</dd>");
    const charts = tsx.split("\n").filter((l) => l.includes("<ChartBlock "));
    expect(charts).toHaveLength(6);
    for (const chart of charts) {
      const text = chart.includes(' series=') ? chart : "";
      expect(text, chart.slice(0, 80)).toContain("Northwind Pharma");
      expect(text).not.toContain(OTHER);
    }
    expect(chartProp<{ name: string }[]>(chartLines(tsx, "radar")[0], "series").map((s) => s.name)).toEqual([ENTITY, "Northwind Pharma"]);
    /* Changing the entity changes the first. */
    setState("entity", "Meridian Banc");
    const html = htmlBody(exportHTML());
    expect(panel(html, "Meridian Banc")).toContain("<dt>Ticker</dt><dd>MBNC</dd>");
    expect(panel(html, "Northwind Pharma")).toContain("<dt>Ticker</dt><dd>NWPH</dd>");
  });
});

describe("Governance Scorecard", () => {
  const CATEGORIES = ["Corporate Governance", "Controversies", "Operational Risks", "Product & Service Mix"];
  const POSITIVE = titleOf(governanceScorecard, "tpl-sc-positive");
  const NEGATIVE = titleOf(governanceScorecard, "tpl-sc-negative");
  const categoryRow = (name: string) => issuerDataset().tables.find((t) => t.id === "categories")!.rows.find((r) => r.category === name)!;

  /** The four category tiles of an export: label, pressed, chips. */
  function tiles(out: string, cls: "className" | "class") {
    return [...out.matchAll(new RegExp(`<button type="button" ${cls}="tile tile-selectable( is-selected)?" aria-pressed="(true|false)"[^>]*>([\\s\\S]*?)</button>`, "g"))].map((m) => ({
      selected: Boolean(m[1]),
      pressed: m[2],
      label: m[3].match(new RegExp(`<span ${cls}="tile-label">(.*?)</span>`))![1],
      chips: [...m[3].matchAll(new RegExp(`<span ${cls}="cell-tag is-solid tone-(\\w+)"><span ${cls}="visually-hidden">([^<]+)</span>(\\d+)</span>`, "g"))].map((c) => [c[1], c[2], c[3]]),
      inner: m[3],
    }));
  }

  it("the header's count badges, and four category tiles with chips, the default one selected", () => {
    apply(governanceScorecard);
    const row = entityRow(ENTITY);
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      const header = between(out, `<div ${cls}="entity"`, "</dl>");
      expect(header).toContain(`<span ${cls}="cell-tag is-solid tone-good"><span ${cls}="visually-hidden">Positive flags: </span>${row.positiveFlags}</span>`);
      expect(header).toContain(`<span ${cls}="cell-tag is-solid tone-bad"><span ${cls}="visually-hidden">Negative flags: </span>${row.negativeFlags}</span>`);
      expect(header).toContain("<div><dt>Ticker</dt><dd>AVCD</dd></div>");
      const found = tiles(out, cls);
      expect(found.map((t) => t.label)).toEqual(CATEGORIES.map((c) => (cls === "class" ? htmlChild(c) : jsxChild(c))));
      expect(found.map((t) => t.selected)).toEqual([true, false, false, false]);
      expect(found.map((t) => t.pressed)).toEqual(["true", "false", "false", "false"]);
      found.forEach((t, i) => {
        const counts = categoryRow(CATEGORIES[i]);
        /* A zero count is drawn neutral. */
        expect(t.chips).toEqual([
          [counts.positive === 0 ? "neutral" : "good", "Positive indicators met: ", String(counts.positive)],
          [counts.negative === 0 ? "neutral" : "bad", "Negative indicators raised: ", String(counts.negative)],
        ]);
        /* No figure and no icon of its own; a button holds phrasing content only. */
        expect(t.inner).not.toContain("tile-value");
        expect(t.inner).not.toMatch(/<(div|p|h\d)\b/);
      });
    }
  });

  it("selecting a category changes both indicator tables and the selected tile", () => {
    apply(governanceScorecard);
    const before = reactMarkup(exportReact());
    expect(bodyRows(panel(before, POSITIVE))).toHaveLength(6);
    expect(bodyRows(panel(before, NEGATIVE))).toHaveLength(6);
    expect(panel(before, POSITIVE)).toContain('<th scope="row">Independent board majority</th>');
    setState("select:category", "Product & Service Mix");
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      expect(tiles(out, cls).map((t) => t.selected)).toEqual([false, false, false, true]);
      expect(tiles(out, cls).map((t) => t.pressed)).toEqual(["false", "false", "false", "true"]);
      const positive = panel(out, POSITIVE);
      expect(bodyRows(positive)).toHaveLength(9);
      expect(positive).toContain('<th scope="row">Revenue from clean technology</th>');
      expect(positive).not.toContain("Independent board majority");
      /* The category has no negative indicators: an empty table body. */
      const negative = panel(out, NEGATIVE);
      expect(bodyRows(negative)).toHaveLength(0);
      expect(negative).not.toContain("Dual-class share structure");
      expect(negative).toContain(`<th scope="col">Indicator</th>`);
    }
  });

  it("chip cells: a solid counter toned by value, a tinted status; View by swaps the column", () => {
    apply(governanceScorecard);
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      const positive = panel(out, POSITIVE);
      expect(positive).toContain(`<tr><th scope="col">Indicator</th><th scope="col" ${cls}="num">Flags</th></tr>`);
      expect(positive).toContain(`<th scope="row">Independent board majority</th><td ${cls}="num"><span ${cls}="cell-tag is-solid tone-good">1</span></td>`);
      expect(positive).toContain(`<th scope="row">Annual director elections</th><td ${cls}="num"><span ${cls}="cell-tag is-solid tone-neutral">0</span></td>`);
      /* The negative grid opens on Value: plain text. */
      const negative = panel(out, NEGATIVE);
      expect(negative).toContain('<tr><th scope="col">Indicator</th><th scope="col">Value</th></tr>');
      expect(negative).toContain('<th scope="row">Auditor tenure above 20 years</th><td>24</td>');
      expect(negative).not.toContain("cell-tag");
    }
    setState(viewByStateKey("tpl-sc-positive"), "Status");
    setState(viewByStateKey("tpl-sc-negative"), "Flags");
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      const positive = panel(out, POSITIVE);
      expect(positive).toContain('<tr><th scope="col">Indicator</th><th scope="col">Status</th></tr>');
      expect(positive).not.toContain(">Flags</th>");
      expect(positive).not.toContain(">Value</th>");
      expect(positive).toContain(`<th scope="row">Independent board majority</th><td><span ${cls}="cell-tag tone-good">Met</span></td>`);
      expect(positive).toContain(`<th scope="row">Annual director elections</th><td><span ${cls}="cell-tag tone-bad">Not Met</span></td>`);
      expect(positive).toContain(`<span ${cls}="cell-tag tone-neutral">Below Target</span>`);
      expect(positive).not.toContain("is-solid");
      /* The select shows the choice. */
      expect(positive).toContain(cls === "class" ? '<option value="Status" selected>Status</option>' : 'aria-label="View by" defaultValue="Status"');
      expect(panel(out, NEGATIVE)).toContain(`<th scope="row">Dual-class share structure</th><td ${cls}="num"><span ${cls}="cell-tag is-solid tone-bad">1</span></td>`);
    }
  });

  it("the reference grid follows the entity and its View by", () => {
    apply(governanceScorecard);
    const title = titleOf(governanceScorecard, "tpl-sc-reference");
    const all = panel(htmlBody(exportHTML()), title);
    expect(bodyRows(all)).toHaveLength(12);
    expect(all).toContain('<th scope="row">Legal name</th><td>Avocado Technologies Inc</td>');
    setState(viewByStateKey("tpl-sc-reference"), "Classification");
    setState("entity", OTHER);
    const some = panel(htmlBody(exportHTML()), title);
    expect(bodyRows(some)).toHaveLength(6);
    expect(some).toContain('<th scope="row">GICS sector</th><td>Energy</td>');
    expect(some).not.toContain("Legal name");
  });
});

describe("Analytics Home", () => {
  const CARDS: [title: string, tag: string, tone: string][] = [["SI Portfolio Report", "Holdings", "accent"], ["SI Issuer Report", "Company", "mid"], ["Performance", "Holdings", "accent"], ["Risk", "Holdings", "accent"]];

  it("the hero: heading, subtitle and a search field with its button", () => {
    apply(analyticsHome);
    const tsx = between(reactMarkup(exportReact()), '<div className="hero hero-reference"', "</button>");
    expect(tsx).toContain('<div className="hero hero-reference" style={{ height: 168 }}>');
    expect(tsx).toContain('<h1 className="hero-title">Analytics Dashboard</h1>');
    expect(tsx).toContain('<p className="hero-subtitle">Search for a comprehensive range of reports and performance.</p>');
    expect(tsx).toContain('<div className="hero-search" role="search">');
    expect(tsx).toContain('<input type="search" className="hero-input" placeholder="Search by entity, sector or ticker" aria-label="Search by entity, sector or ticker" />');
    expect(tsx).toContain('<button type="button" className="hero-button">Search</button>');
    expect(tsx).toMatch(/<svg className="hero-icon" width="16" height="16"[^>]*aria-hidden="true">/);
    const html = between(htmlBody(exportHTML()), '<div class="hero hero-reference"', "</button>");
    expect(html).toContain('<h1 class="hero-title">Analytics Dashboard</h1>');
    expect(html).toContain('<input type="search" class="hero-input" placeholder="Search by entity, sector or ticker" aria-label="Search by entity, sector or ticker" />');
    expect(html).toContain('<button type="button" class="hero-button">Search</button>');
  });

  it("four launcher cards: title, tag, the reference thumbnail, description and the action as a link", () => {
    apply(analyticsHome);
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      const cards = [...out.matchAll(new RegExp(`<article ${cls}="launcher tone-(\\w+)"[^>]*>([\\s\\S]*?)</article>`, "g"))];
      expect(cards).toHaveLength(4);
      cards.forEach((m, i) => {
        const [title, tag, tone] = CARDS[i];
        const description = String(analyticsHome.body.find((b) => b.id === `tpl-home-launcher-${i}`)!.props.description);
        expect(m[1]).toBe(tone);
        expect(m[2]).toContain(`<h2 ${cls}="launcher-title">${title}</h2>`);
        expect(m[2]).toContain(`<span ${cls}="cell-tag tone-${tone}">${tag}</span>`);
        /* The original thumbnail travels with the export as an embedded image. */
        expect(m[2]).toContain(`<div ${cls}="launcher-thumb" aria-hidden="true"><img src="data:image/svg+xml,`);
        expect(m[2]).toContain(`<p ${cls}="launcher-desc">${description}</p>`);
        expect(m[2]).toMatch(new RegExp(`<a ${cls}="launcher-open" href="#" aria-label="Open report: ${title}">Open report<svg ${cls}="launcher-arrow"[^>]*aria-hidden="true">.*?</svg></a>`));
        expect((m[2].match(/<svg/g) ?? [])).toHaveLength(1);
      });
    }
  });

  it("the dashboards table, and the Class filter leaves two rows", () => {
    apply(analyticsHome);
    for (const [out, cls] of [[reactMarkup(exportReact()), "className"], [htmlBody(exportHTML()), "class"]] as const) {
      const grid = dashboardsTable(out);
      expect(grid).toContain('<tr><th scope="col">Name</th><th scope="col">Class</th><th scope="col">Theme</th><th scope="col">Description</th></tr>');
      expect(bodyRows(grid)).toHaveLength(6);
      expect(grid).toContain('<tr><th scope="row">Sustainable Investment Portfolio Report</th><td>Holdings</td><td>Sustainable Investment</td><td>ESG, climate and screening views of a portfolio.</td></tr>');
      expect(cls).toBeTruthy();
    }
    setState("homeClass", "Company");
    for (const out of [reactMarkup(exportReact()), htmlBody(exportHTML())]) {
      const rows = bodyRows(dashboardsTable(out));
      expect(rows.map((r) => r.match(/<th scope="row">([^<]+)<\/th>/)![1])).toEqual(["Sustainable Investment Issuer Report", "Governance Scorecard"]);
    }
    /* The filter shows the choice. */
    expect(htmlBody(exportHTML())).toContain('<option value="Company" selected>Company</option>');
    setState("homeTheme", "Other");
    expect(bodyRows(dashboardsTable(htmlBody(exportHTML())))).toHaveLength(1);
  });
});

describe("materialise: the blocks leave with what they show", () => {
  const props = (tpl: BuilderTemplate, id: string) => materialiseCanvas().body.find((b) => b.id === id)!.props;

  it("the row lookup is resolved to static props, and the live props are gone", () => {
    apply(issuerClimate);
    expect(props(issuerClimate, "tpl-ic-header")).toEqual({
      height: 84, card: true, title: ENTITY, badges: [],
      facts: [{ label: "GICS sector", value: "Information Technology" }, { label: "Region", value: "North America" }, { label: "ISIN", value: "US0378331005" }, { label: "As of", value: "Dec 2024" }],
    });
    const verdict = props(issuerClimate, "tpl-ic-verdict");
    expect(verdict).toMatchObject({ tone: "good", hero: "1.6", status: "Aligned", caption: "On a credible net-zero pathway", heroUnit: "°C", chip: "Net zero 2050" });
    expect(verdict.progress).toEqual({ label: "2030 path vs budget", pct: entityRow(ENTITY).pathPct, text: `${entityRow(ENTITY).pathPct}% of ceiling` });
    expect(verdict.stats).toEqual([{ label: "Budget undershoot", value: "16.3 Mt", tone: "good" }, { label: "ESG rating", value: "AA" }]);
    for (const key of ["binding", "heroField", "statusField", "toneField", "captionField"]) expect(verdict).not.toHaveProperty(key);
    apply(governanceScorecard);
    const tile = props(governanceScorecard, "tpl-sc-category-0");
    expect(tile).toEqual({ label: "Corporate Governance", height: 96, selected: true, subs: [], chips: [{ label: "Positive indicators met", value: "4", tone: "good" }, { label: "Negative indicators raised", value: "3", tone: "bad" }] });
    expect(props(governanceScorecard, "tpl-sc-category-1").selected).toBe(false);
  });

  it("an entity the dataset does not have: the blocks fall back, nothing throws", () => {
    apply(issuerClimate);
    setState("entity", "Nobody Corp");
    const tsx = reactMarkup(exportReact());
    expect(tsx).toContain('<h2 className="entity-title">Entity</h2>');
    expect(tsx).toContain("<div><dt>ISIN</dt><dd>-</dd></div>");
    const card = between(tsx, '<section className="verdict ', "</section>");
    expect(card).toContain('<section className="verdict tone-neutral"');
    expect(card).toContain('<span className="verdict-figure">-</span>');
    expect(card).toContain('style={{ width: "0%" }}');
    expect(tsx).not.toMatch(/undefined|NaN/);
    expect(tsxSyntaxErrors(exportReact())).toEqual([]);
  });

  it("a stray resolved prop on the block is not taken as the resolved value", () => {
    const tile = materialiseBlock({ id: "t", type: "MetricTile", props: { label: "L", selected: true, value: "9" } } as Block, issuerDataset(), {});
    expect(tile.props).toEqual({ label: "L", value: "9", subs: [], chips: [] });
    const html = metricTileLines(HTML_DIALECT, tile).join("\n");
    expect(html).toContain('<div class="tile">');
    expect(html).toContain('<span class="tile-value">9</span>');
    /* Malformed list props are dropped. */
    const header = materialiseBlock({ id: "h", type: "EntityHeader", props: { title: "T", facts: "x", badges: [null, 3, { label: "no field" }] } } as Block, null, {});
    expect(header.props).toEqual({ title: "T", facts: [], badges: [] });
  });
});

describe("injection safety", () => {
  const HOSTILE = '<script>alert(1)</script> {x} "q"';

  /** Upload the sample dataset with one entity renamed and hostile facts. */
  function uploadRenamed(tpl: BuilderTemplate) {
    apply(tpl);
    /* A copy: the sample dataset's tables are shared. */
    const uploaded = structuredClone(issuerDataset());
    const row = uploaded.tables.find((t) => t.id === "entities")!.rows.find((r) => r.name === ENTITY)!;
    Object.assign(row, { name: HOSTILE, sector: "</dd>{s}", ticker: '"><b>', isin: "<i>", alignmentStatus: "<b>{st}</b>", alignmentCaption: '"><img src=x onerror=alert(1)>', alignmentTone: 'x" onload="alert(1)', rating: "<u>" });
    /* Every place the name is written: the rows' key, and the series / category it labels in a chart. */
    for (const t of uploaded.tables) for (const r of t.rows) for (const key of ["entity", "series", "category"]) if (r[key] === ENTITY) r[key] = HOSTILE;
    const indicator = uploaded.tables.find((t) => t.id === "indicators")!.rows[0];
    Object.assign(indicator, { indicator: "<em>{i}</em>", status: "<s>{ok}</s>" });
    useBuilder.getState().setReportData(uploaded);
    setState("entity", HOSTILE);
  }

  it.each([["Issuer Climate", issuerClimate], ["Governance Scorecard", governanceScorecard], ["Entity Comparison", entityComparison], ["Issuer Business Involvement", issuerInvolvement]] as const)("%s, React: hostile data is emitted as string expressions and the file parses", (_n, tpl) => {
    uploadRenamed(tpl);
    const full = exportReact();
    const tsx = reactMarkup(full);
    if (tpl !== entityComparison) expect(tsx).toContain(`<h2 className="entity-title">{${JSON.stringify(HOSTILE)}}</h2>`);
    else expect(tsx).toContain(`<h2 className="panel-title">{${JSON.stringify(HOSTILE)}}</h2>`);
    /* Never raw in children position, never an unescaped quote in an attribute. */
    expect(tsx).not.toMatch(/>\s*<script>/);
    const markup = jsxAsMarkup(tsx);
    expect(markup).not.toMatch(/<(script|b|i|u|s|em|img)[ >]/);
    expect(markup).not.toMatch(/onload=|onerror=/);
    expect(tsxSyntaxErrors(full)).toEqual([]);
  });

  it("Issuer Climate: the facts, the verdict's text and the tone are escaped", () => {
    uploadRenamed(issuerClimate);
    const tsx = reactMarkup(exportReact());
    expect(tsx).toContain(`<div><dt>GICS sector</dt><dd>{${JSON.stringify("</dd>{s}")}}</dd></div>`);
    expect(tsx).toContain(`<div><dt>ISIN</dt><dd>{${JSON.stringify("<i>")}}</dd></div>`);
    expect(tsx).toContain(`<span className="verdict-status">{${JSON.stringify("<b>{st}</b>")}}</span>`);
    expect(tsx).toContain(`<p className="verdict-caption">{${JSON.stringify('"><img src=x onerror=alert(1)>')}}</p>`);
    /* A tone the data invents is not a class name. */
    expect(tsx).toContain('<section className="verdict tone-neutral" aria-label="Portfolio alignment"');
    expect(tsx).toContain(`<dt>ESG rating</dt><dd>{${JSON.stringify("<u>")}}</dd>`);
    /* The chart data is a JSON literal. */
    expect(chartProp<{ name: string }[]>(chartLines(tsx, "column")[0], "series")[0].name).toBe(HOSTILE);
    const body = htmlBody(exportHTML());
    expect(body).toContain('<h2 class="entity-title">&lt;script&gt;alert(1)&lt;/script&gt; {x} "q"</h2>');
    expect(body).toContain("<div><dt>GICS sector</dt><dd>&lt;/dd&gt;{s}</dd></div>");
    expect(body).toContain('<span class="verdict-status">&lt;b&gt;{st}&lt;/b&gt;</span>');
    expect(body).toContain('<p class="verdict-caption">"&gt;&lt;img src=x onerror=alert(1)&gt;</p>');
    expect(body).toContain('<section class="verdict tone-neutral"');
    expect(body).not.toMatch(/<script>|<img|<b>|<i>|<u>|onload=/);
  });

  it("Scorecard: a hostile indicator and status chip are escaped in the grid", () => {
    uploadRenamed(governanceScorecard);
    setState(viewByStateKey("tpl-sc-positive"), "Status");
    const title = titleOf(governanceScorecard, "tpl-sc-positive");
    const tsx = panel(reactMarkup(exportReact()), title);
    expect(tsx).toContain(`<th scope="row">{${JSON.stringify("<em>{i}</em>")}}</th><td><span className="cell-tag tone-neutral">{${JSON.stringify("<s>{ok}</s>")}}</span></td>`);
    const html = panel(htmlBody(exportHTML()), title);
    expect(html).toContain('<th scope="row">&lt;em&gt;{i}&lt;/em&gt;</th><td><span class="cell-tag tone-neutral">&lt;s&gt;{ok}&lt;/s&gt;</span></td>');
    expect(htmlBody(exportHTML())).not.toMatch(/<script>|<em>|<s>|<b>/);
  });

  it("Entity Comparison, HTML: a hostile record title, pair and chart series name are escaped", () => {
    uploadRenamed(entityComparison);
    const body = htmlBody(exportHTML());
    expect(body).toContain('<h2 class="panel-title">&lt;script&gt;alert(1)&lt;/script&gt; {x} "q"</h2>');
    expect(body).toContain('aria-label="&lt;script&gt;alert(1)&lt;/script&gt; {x} &quot;q&quot;"');
    expect(body).toContain('<dt>Ticker</dt><dd>"&gt;&lt;b&gt;</dd>');
    expect(body).toContain('<th scope="col">&lt;script&gt;alert(1)&lt;/script&gt; {x} "q"</th>');
    expect(body).not.toMatch(/<script>|<b>|<u>/);
  });

  it("block props typed in the builder cannot carry markup or a class name", () => {
    const hostile = { title: HOSTILE, tag: "<b>", tagTone: 'x" onload="1', accent: "<i>", description: "{d}</p>", actionLabel: '"><a>', height: "12px; color: red", templateId: "<x>" };
    for (const d of [JSX_DIALECT, HTML_DIALECT]) {
      const lines = (out: string[]): string => (d === JSX_DIALECT ? jsxAsMarkup(out.join("\n")) : out.join("\n"));
      const card = lines(launcherCardLines(d, { id: "l", type: "LauncherCard", props: hostile } as Block));
      expect(card).not.toMatch(/<b>|<i>|<a>|<x>|onload|color: red/);
      expect(card).toContain("launcher tone-accent");
      expect(card).toContain("cell-tag tone-accent");
      expect(card).toContain('aria-label="&quot;&gt;&lt;a&gt;: &lt;script&gt;alert(1)&lt;/script&gt; {x} &quot;q&quot;"');
      const hero = lines(heroSearchLines(d, { id: "h", type: "HeroSearch", props: { title: "<h1>{t}", subtitle: "</p>", placeholder: '" autofocus onfocus="x', buttonLabel: "<b>" } } as Block));
      expect(hero).toContain('placeholder="&quot; autofocus onfocus=&quot;x"');
      expect(hero).not.toMatch(/<b>|<h1>\{t\}|<\/p><\/p>/);
      const tile = lines(metricTileLines(d, { id: "t", type: "MetricTile", props: { label: "<b>", icon: "constructor", value: "{v}", selected: "yes", chips: [{ label: "<i>", value: "<u>", tone: '"><s>' }], subs: [{ label: "{s}", value: "<q>", icon: "__proto__" }] } } as Block));
      expect(tile).not.toMatch(/<b>|<i>|<u>|<s>|<q>|<svg|aria-pressed/);
      expect(tile).toContain("cell-tag is-solid tone-neutral");
      const verdict = lines(verdictCardLines(d, { id: "v", type: "VerdictCard", props: { title: '"><b>', tone: "<i>", hero: "<u>", status: "{s}", progress: { label: '"x"', pct: "<b>", text: "<em>" }, stats: [{ label: "<s>", value: "{v}", tone: 'a"b' }] } } as Block));
      expect(verdict).not.toMatch(/<b>|<i>|<u>|<s>|<em>/);
      expect(verdict).toContain("verdict tone-neutral");
      expect(verdict).toContain("is-toned tone-neutral");
      expect(verdict).toMatch(/width: "?0%/);
      const header = lines(entityHeaderLines(d, { id: "e", type: "EntityHeader", props: { title: "<b>", eyebrow: "{e}", suffix: "</span>", facts: [{ label: "<dt>", value: "</dd>" }], badges: [{ label: "<i>", value: "<u>", tone: "<s>" }] } } as Block));
      expect(header).not.toMatch(/<b>|<i>|<u>|<s>|<dt><dt>/);
      /* With the string expressions taken out, what is left still parses. */
      if (d === JSX_DIALECT) {
        for (const jsx of [card, hero, tile, verdict, header]) expect(tsxSyntaxErrors(`const T = () => (\n${jsx}\n);`)).toEqual([]);
      }
    }
  });

  it("a dot's tone and a chip's tone cannot carry markup; chart labels are validated", () => {
    const columns: GridColumn[] = [
      { field: "n", header: "N" },
      { field: "d", header: "D", cell: { type: "dot", tone: 'x" onload="alert(1)' as never, hollow: ["<b>"] } },
      { field: "c", header: "C", cell: { type: "chip", variant: "solid", tones: { a: '"><script>' as never }, fallback: "<i>" as never } },
    ];
    const rows: GridRow[] = [{ n: "<h>", d: "<b>", c: "a", _heading: true }, { n: "r", d: "ok", c: "<u>", _indent: 99 }];
    for (const d of [JSX_DIALECT, HTML_DIALECT]) {
      const full = tableLines(d, columns, rows, { label: "t" }).join("\n");
      const out = d === JSX_DIALECT ? jsxAsMarkup(full) : full;
      expect(out).not.toMatch(/onload|<script>|<b>|<u>|<h>|<i>/);
      expect(out).toContain("cell-dot is-hollow tone-neutral");
      expect(out).toContain("cell-tag is-solid tone-neutral");
      expect(out).toContain('data-indent="3"');
    }
    expect(tsxSyntaxErrors(`const T = () => (\n${tableLines(JSX_DIALECT, columns, rows, { label: "t" }).join("\n")}\n);`)).toEqual([]);
    const chart = { id: "c", type: "HighchartCorridor", props: { chartType: "corridor", bandName: '"} onClick={alert(1)} x={"', yAxisCategories: ["A", { toString: () => "x" }, '</script>"', 3, null] } } as Block;
    expect(chartShapeSettingsOf(chart)).toEqual({ bandName: '"} onClick={alert(1)} x={"', yAxisCategories: ["A", "", '</script>"', "3", ""] });
    const jsx = chartBlockJsx(chart, "light");
    expect(jsx).toContain(`bandName={${JSON.stringify('"} onClick={alert(1)} x={"')}}`);
    expect(tsxSyntaxErrors(`const T = () => (\n${jsx}\n);`)).toEqual([]);
    const html = chartDataLines(HTML_DIALECT, { ...chart, props: { ...chart.props, bandName: "<b>", yAxisCategories: undefined, categories: ["<x>"], series: [{ name: "<i>", data: [2] }, { name: "P", data: [1] }] } }).join("\n");
    expect(html).not.toMatch(/<b>|<i>|<x>/);
    expect(html).toContain('<th scope="col" class="num">&lt;b&gt;</th>');
  });
});

describe("chart export of the radar, the corridor and the labelled axis", () => {
  const chart = (props: Record<string, unknown>, type = "HighchartLine") => ({ id: "c", type, props } as Block);

  it("which charts need the shapes part of the helper", () => {
    expect(usesShapeChart(chart({ chartType: "line", title: "T" }))).toBe(false);
    expect(usesShapeChart(chart({ chartType: "line", yAxisCategories: [] }))).toBe(false);
    expect(usesShapeChart(chart({ chartType: "line", bandName: "B" }))).toBe(false);
    expect(usesShapeChart(chart({ chartType: "line", yAxisCategories: ["Low", "High"] }))).toBe(true);
    expect(usesShapeChart(chart({ chartType: "radar" }, "HighchartRadar"))).toBe(true);
    expect(usesShapeChart(chart({ chartType: "corridor" }, "HighchartCorridor"))).toBe(true);
    expect(usesShapeChart({ id: "b", type: "SimulatedButton", props: { chartType: "radar" } } as Block)).toBe(false);
    /* The band name belongs to the corridor only. */
    expect(chartBlockJsx(chart({ chartType: "line", bandName: "B" }))).not.toContain("bandName");
    expect(chartBlockJsx(chart({ chartType: "corridor", bandName: "B" }, "HighchartCorridor"))).toContain(' bandName={"B"} />');
    expect(chartBlockJsx(chart({ chartType: "line", yAxisCategories: ["Low", "High"] }))).toContain(' yAxisCategories={["Low","High"]} />');
  });

  it("the shapes part adds to the helper, in either combination, and every variant parses", () => {
    const base = chartHelperSource("salt");
    const extended = chartHelperSource("salt", { extended: true });
    const shapes = chartHelperSource("salt", { shapes: true });
    const both = chartHelperSource("salt", { extended: true, shapes: true });
    expect(chartHelperSource("salt", { shapes: false })).toBe(base);
    expect(chartHelperSource("salt", { extended: true, shapes: false })).toBe(extended);
    for (const piece of ['case "radar":', 'case "corridor":', "arearange", "polar: true", "yAxisCategories", "bandName"]) {
      expect(base, piece).not.toContain(piece);
      expect(extended, piece).not.toContain(piece);
      expect(shapes, piece).toContain(piece);
      expect(both, piece).toContain(piece);
    }
    expect(shapes).not.toContain("applyPointStyling");
    /* Every line of the helper it builds on is still there, in order. */
    for (const [from, to] of [[base, shapes], [extended, both]]) {
      let at = 0;
      for (const line of from.split("\n")) {
        const i = to.indexOf(line, at);
        expect(i, line).toBeGreaterThanOrEqual(0);
        at = i;
      }
    }
    for (const source of [shapes, both]) expect(tsxSyntaxErrors(`import React from "react";\n${source}`)).toEqual([]);
    /* The props reach the options. */
    expect(both).toMatch(/valueMax, labelWrap, pointColors, pointColorsByName, selected,\n {2}yAxisCategories, bandName,\n\}: ChartProps/);
    expect(both).toMatch(/selected,\n {4}yAxisCategories, bandName,\n {2}\}\);/);
  });

  it("HTML: a corridor without a band name, and a scale value with no label", () => {
    const corridor = chartDataLines(HTML_DIALECT, chart({ chartType: "corridor", categories: ["a", "b"], series: [{ name: "Ceiling", data: [10, null] }, { name: "Path", data: [12.5, 3] }] }, "HighchartCorridor")).join("\n");
    expect(corridor).toContain('<th scope="col" class="num">Headroom</th>');
    expect(corridor).toContain('<tr><th scope="row">a</th><td class="num">10.00</td><td class="num">12.50</td><td class="num is-negative">-2.50</td></tr>');
    expect(corridor).toContain('<tr><th scope="row">b</th><td class="num"></td><td class="num">3.00</td><td class="num"></td></tr>');
    const scale = chartDataLines(HTML_DIALECT, chart({ chartType: "line", categories: ["a", "b", "c"], yAxisCategories: ["Low", "High"], series: [{ name: "S", data: [0, 1.2, 7] }] })).join("\n");
    expect(scale).toContain('<tr><th scope="row">a</th><td>Low</td></tr>');
    expect(scale).toContain('<tr><th scope="row">b</th><td>High</td></tr>');
    expect(scale).toContain('<tr><th scope="row">c</th><td>7</td></tr>');
  });
});

describe("the emitters on their own", () => {
  it("every icon a tile can name is drawn inline, from fixed shapes", () => {
    expect(Object.keys(TILE_ICON_NODES).sort()).toEqual(["customers", "energy", "entertainment", "environment", "governance", "health", "labour", "practices", "rights", "social", "weapons"]);
    for (const [name, nodes] of Object.entries(TILE_ICON_NODES)) {
      const jsx = metricTileLines(JSX_DIALECT, { id: "t", type: "MetricTile", props: { label: "L", icon: name, value: "1" } } as Block).join("\n");
      expect((jsx.match(/<(path|circle|rect) /g) ?? []), name).toHaveLength(nodes.length);
      /* Attributes that are the same in JSX and HTML: no stroke-width and the like. */
      expect(jsx).not.toMatch(/<svg[^>]*-[a-z]+=(?!"true")/);
      expect(jsx.replace(/aria-hidden/g, "")).not.toMatch(/<(svg|path|circle|rect)[^>]* [a-z]+-[a-z]+=/);
      expect(tsxSyntaxErrors(`const T = () => (\n${jsx}\n);`)).toEqual([]);
    }
    /* An unknown icon is left out. */
    expect(metricTileLines(HTML_DIALECT, { id: "t", type: "MetricTile", props: { label: "L", icon: "rocket", value: "1" } } as Block).join("\n")).not.toContain("<svg");
  });

  it("a record panel that can be cleared keeps its subtitle; one that cannot has none", () => {
    const record = { title: "Rec", sections: [{ type: "pairs", items: [{ label: "A", text: "1" }] }] };
    const block = (extra: Record<string, unknown>): Block => ({ id: "r", type: "RecordPanel", props: { title: "Entity", height: 300, record, ...extra } });
    expect(recordPanelLines(HTML_DIALECT, block({})).join("\n")).toContain('<span class="panel-subtitle">Entity</span>');
    const fixed = recordPanelLines(HTML_DIALECT, block({ clearable: false })).join("\n");
    expect(fixed).toContain('<h2 class="panel-title">Rec</h2>');
    expect(fixed).not.toContain("panel-subtitle");
  });

  it("which canvases need the block rules", () => {
    const grid = (columns: GridColumn[], rows: GridRow[]): Block => ({ id: "g", type: "DataGrid", props: { columns, rows } });
    expect(usesReportBlocks([grid([{ field: "a", header: "A", cell: { type: "heat" } }], [{ a: 1, _bold: true, _indent: 1 }])])).toBe(false);
    expect(usesReportBlocks([grid([{ field: "a", header: "A", cell: { type: "dot" } }], [])])).toBe(true);
    expect(usesReportBlocks([grid([{ header: "G", children: [{ field: "a", header: "A", cell: { type: "chip" } }] }], [])])).toBe(true);
    expect(usesReportBlocks([grid([{ field: "a", header: "A" }], [{ a: "x", _heading: true }])])).toBe(true);
    expect(usesReportBlocks([{ id: "l", type: "LayoutGroup", props: {}, children: [{ id: "h", type: "HeroSearch", props: {} }] }])).toBe(true);
    expect(usesReportBlocks([{ id: "b", type: "SimulatedButton", props: {} }])).toBe(false);
  });
});

describe("existing exports are unchanged", () => {
  it("a canvas with none of the new features: no block rules, the helper as it was", () => {
    apply(riskAnalytics);
    const files = exportReactFiles();
    expect(files[1].contents).toBe(buildStylesCss("salt", "light"));
    expect(files[0].contents.endsWith(`\n${chartHelperSource("salt")}`)).toBe(true);
    expect(files[0].contents).not.toMatch(/entity|tile|verdict|launcher|hero|cell-dot|cell-tag|is-heading|yAxisCategories|bandName|case "radar"/);
    const html = exportHTML();
    expect(html).not.toMatch(/\.cell-dot|\.tile|\.verdict|\.launcher|\.hero|\.tone-good/);
  });

  it("a canvas with rich cells but none of the new blocks: the rich rules only, the extended helper only", () => {
    apply(screeningChangesTemplate);
    useBuilder.getState().setReportState("select:security", "Vireo Systems Ord");
    const files = exportReactFiles();
    expect(files[1].contents).toBe(buildStylesCss("salt", "light", { rich: true }));
    expect(files[1].contents.endsWith(REPORT_RICH_CSS)).toBe(true);
    expect(files[1].contents).not.toContain(".cell-dot");
    expect(files[0].contents).not.toMatch(/case "radar"|case "corridor"|yAxisCategories/);
    expect(exportHTML()).not.toMatch(/\.cell-dot|\.tile-label|\.verdict/);
  });

  it("the block rules come after the rich rules, which they build on", () => {
    expect(buildStylesCss("salt", "light", { blocks: true })).toBe(`${buildStylesCss("salt", "light", { rich: true })}${REPORT_BLOCKS_CSS}`);
    expect(buildStylesCss("salt", "light", { rich: true, blocks: true })).toBe(buildStylesCss("salt", "light", { blocks: true }));
    expect(buildStylesCss("salt", "light", { rich: false, blocks: false })).toBe(buildStylesCss("salt", "light"));
  });
});
