import { describe, it, expect } from "vitest";
import { fxExecution } from "../executionTemplates";
import { BUILDER_TEMPLATES, TEMPLATE_ORDER, VALID_TEMPLATE_IDS, hasUniformStructure, templateCategory } from "../builderTemplates";
import { TEMPLATE_SUMMARIES } from "../templateIds";
import { resolveBinding, type DataBinding } from "../reportData/binding";
import { executionDataset, EXECUTION_ORDERS } from "../reportData/executionDataset";
import { isRecordBinding, resolveRecord } from "../recordPanelModel";
import { EXECUTION_KEYS } from "../executionModel";
import { collectReportControls, parseReportFilterCommand, parseTemplateCommand } from "../reportCommand";
import { GROUP_FIELD } from "../reportData/shape";

const dataset = executionDataset();
const block = (id: string) => fxExecution.body.find((b) => b.id === id)!;
const binding = (id: string) => block(id).props.binding as DataBinding;

describe("FX Execution - registration and structure", () => {
  it("is registered, categorised and pins its structure", () => {
    expect(VALID_TEMPLATE_IDS).toContain("fx-execution");
    expect(TEMPLATE_ORDER).toContain("fx-execution");
    expect(BUILDER_TEMPLATES["fx-execution"]).toBe(fxExecution);
    expect(templateCategory("fx-execution")).toBe("finance");
    expect(hasUniformStructure("fx-execution")).toBe(true);
    expect(TEMPLATE_SUMMARIES["fx-execution"]).toMatch(/FX Execution/);
    expect(fxExecution.datasetId).toBe("execution");
  });

  it("an instrument header; a chart spanning the three panels beside it; no sidebar or footer", () => {
    expect(fxExecution.header.map((b) => b.type)).toEqual(["InstrumentHeader"]);
    expect(fxExecution.sidebar).toEqual([]);
    expect(fxExecution.zoneLayouts?.sidebar?.visible).toBe(false);
    expect(fxExecution.zoneLayouts?.footer?.visible).toBe(false);
    expect(fxExecution.body.map((b) => [b.type, b.layout?.width])).toEqual([["ExecutionChart", "9fr"], ["RecordPanel", "3fr"], ["HighchartGauge", "3fr"], ["HighchartDonut", "3fr"]]);
    const [chart, ...side] = fxExecution.body;
    expect(chart.layout?.rowSpan).toBe(3);
    /* The chart is exactly as tall as the column beside it. */
    const gap = Number(fxExecution.zoneLayouts?.body?.gap);
    expect(chart.props.height).toBe(side.reduce((h, b) => h + Number(b.props.height), 0) + gap * (side.length - 1));
    /* Every block folds to a full row on a phone. */
    for (const b of fxExecution.body) expect(b.layout?.spanPhone).toBe(12);
  });
});

describe("FX Execution - the panels read the selected order", () => {
  const other = { [EXECUTION_KEYS.order]: EXECUTION_ORDERS[1] };

  it("statistics: eight pairs, banded, the pip figures signed and toned", () => {
    const b = block("tpl-fx-stats").props.binding;
    expect(isRecordBinding(b)).toBe(true);
    const record = resolveRecord(b as never, dataset, {})!;
    expect(record.title).toBe(EXECUTION_ORDERS[0]);
    const section = record.sections[0];
    if (section.type !== "pairs") throw new Error();
    expect(section).toMatchObject({ layout: "rows", zebra: true });
    expect(section.items.map((i) => i.label)).toEqual(["Duration", "Amount done", "Number of clips", "Number of fills", "Passive %", "Aggressive %", "Slippage vs arrival", "Avg fill vs TWAP"]);
    expect(section.items[1].text).toMatch(/^EUR [\d,]+$/);
    expect(section.items[4].text).toMatch(/^\d+\.\d\d %$/);
    for (const item of section.items.slice(6)) { expect(item.text).toMatch(/^[+-]\d+\.\d\d pips$/); expect(item.signed).toBe(item.text.startsWith("+") ? "good" : "bad"); }
    expect(resolveRecord(b as never, dataset, other)!.title).toBe(EXECUTION_ORDERS[1]);
  });

  it("gauge: the order's passive share", () => {
    const value = (state = {}) => { const d = resolveBinding(binding("tpl-fx-passive"), dataset, state)!; if (d.view !== "value") throw new Error(); return d.value; };
    const row = dataset.tables[0].rows;
    expect(value()).toBeCloseTo(Number(row[0].passivePct), 2);
    expect(value(other)).toBeCloseTo(Number(row[1].passivePct), 2);
    expect(block("tpl-fx-passive").props).toMatchObject({ gaugeSweep: 220, valueMax: 100 });
  });

  it("venues: slices largest first, selectable; expanded, a table that adds up", () => {
    const parts = resolveBinding(binding("tpl-fx-venues"), dataset, {})!;
    if (parts.view !== "parts") throw new Error();
    const sizes = parts.seriesData.map((p) => p.y);
    expect([...sizes].sort((a, b) => b - a)).toEqual(sizes);
    expect(parts.selectState).toBe(EXECUTION_KEYS.venue);
    const expanded = resolveBinding(binding("tpl-fx-venues"), dataset, {}, { expanded: true })!;
    if (expanded.view !== "parts") throw new Error();
    const rows = expanded.detail!.rows;
    expect(rows[0]).toMatchObject({ [GROUP_FIELD]: "All venues", share: 100 });
    expect(rows.slice(1).map((r) => r[GROUP_FIELD])).toEqual(parts.seriesData.map((p) => p.name));
    expect(rows.slice(1).reduce((n, r) => n + Number(r.price), 0)).toBe(rows[0].price);
  });
});

describe("FX Execution - from chat", () => {
  const controls = collectReportControls([...fxExecution.header, ...fxExecution.body]);

  it("the template is named, and its controls can be set in words", () => {
    expect(parseTemplateCommand("use the fx execution template")?.templateId).toBe("fx-execution");
    expect(controls.map((c) => c.label)).toEqual(["Order", "Live feed", "Interval", "Chart type", "Range"]);
    expect(parseReportFilterCommand("switch to candlestick", controls)?.changes).toEqual([{ key: EXECUTION_KEYS.chart, value: "Candlestick", label: "Chart type", kind: "filter" }]);
    expect(parseReportFilterCommand("set the interval to 5m", controls)?.changes).toEqual([{ key: EXECUTION_KEYS.interval, value: "5m", label: "Interval", kind: "filter" }]);
    expect(parseReportFilterCommand("show the 3M range", controls)?.changes).toEqual([{ key: EXECUTION_KEYS.range, value: "3M", label: "Range", kind: "filter" }]);
  });

  it("the sample feed is report state the chat can switch off and on", () => {
    const live = controls.find((c) => c.key === EXECUTION_KEYS.live)!;
    expect(live).toMatchObject({ label: "Live feed", current: "On", choices: ["On", "Off"] });
    expect(parseReportFilterCommand("turn the live feed off", controls)?.changes).toEqual([{ key: EXECUTION_KEYS.live, value: "Off", label: "Live feed", kind: "filter" }]);
    const off = collectReportControls([...fxExecution.header, ...fxExecution.body], { [EXECUTION_KEYS.live]: "Off" });
    expect(parseReportFilterCommand("set the live feed to on", off)?.changes).toEqual([{ key: EXECUTION_KEYS.live, value: "On", label: "Live feed", kind: "filter" }]);
  });
});

describe("row span", () => {
  it("the resolver publishes it as a custom property in a grid zone, within bounds", async () => {
    const { computeItemStyle } = await import("../layoutResolver");
    const style = (rowSpan: number) => computeItemStyle({ id: "x", type: "ExecutionChart", props: {}, layout: { width: "9fr", rowSpan } }, { mode: "grid", columns: 12 }) as Record<string, unknown>;
    expect(style(3)).toMatchObject({ gridColumn: "span 9", "--row-span": 3 });
    expect(style(1)["--row-span"]).toBeUndefined();
    expect(style(40)["--row-span"]).toBeUndefined();
    /* The template's chart carries it. */
    expect((computeItemStyle(fxExecution.body[0], fxExecution.zoneLayouts!.body!) as Record<string, unknown>)["--row-span"]).toBe(3);
  });
});
