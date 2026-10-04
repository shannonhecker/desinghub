/* The chatbot's template actions: apply a template, change a report control,
   and restyle the chrome zones. */
import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder, DEFAULT_ZONE_LAYOUTS } from "@/store/useBuilder";
import { applyAIActions } from "../applyAIActions";
import { viewByStateKey, viewByOf } from "../panelMetrics";

beforeEach(() => {
  useBuilder.setState({
    designSystem: "carbon",
    mode: "dark",
    blocks: [],
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    zoneLayouts: { ...DEFAULT_ZONE_LAYOUTS },
    reportState: {},
    activeTemplateId: null,
    selectedBlockId: null,
    selectedBlockIds: [],
    selectedBlockZone: null,
  } as never);
});

const state = () => useBuilder.getState();

describe("applyTemplate", () => {
  it("puts the template on the canvas in the current design system", () => {
    const report = applyAIActions([{ action: "applyTemplate", value: { templateId: "risk-analytics" } }]);
    expect(report).toEqual({ applied: 1, skipped: [] });
    expect(state().activeTemplateId).toBe("risk-analytics");
    expect(state().designSystem).toBe("carbon");
    expect(state().blocks.length).toBeGreaterThan(4);
    expect(state().headerBlocks.map((b) => b.type)).toEqual(["TopNav", "TabStrip"]);
  });

  it("follows a design system switch earlier in the same turn", () => {
    applyAIActions([
      { action: "setDesignSystem", value: "m3" },
      { action: "applyTemplate", value: { templateId: "performance-analytics" } },
    ]);
    expect(state().designSystem).toBe("m3");
    expect(state().activeTemplateId).toBe("performance-analytics");
  });

  it("skips an unknown template and says so", () => {
    const report = applyAIActions([{ action: "applyTemplate", value: { templateId: "nope" } }]);
    expect(report.applied).toBe(0);
    expect(report.skipped[0].reason).toMatch(/unknown template "nope"/);
    expect(state().blocks).toEqual([]);
  });
});

describe("setReportFilter", () => {
  beforeEach(() => {
    applyAIActions([{ action: "applyTemplate", value: { templateId: "performance-analytics" } }]);
  });

  it("sets a filter to one of its choices, whatever the letter case", () => {
    const report = applyAIActions([{ action: "setReportFilter", value: { key: "currency", value: "usd" } }]);
    expect(report.applied).toBe(1);
    expect(state().reportState.currency).toBe("USD");
  });

  it("sets a panel's View by", () => {
    const panel = state().blocks.find((b) => viewByOf(b.props as Record<string, unknown>).length > 1)!;
    const choice = viewByOf(panel.props as Record<string, unknown>)[1];
    applyAIActions([{ action: "setReportFilter", value: { key: viewByStateKey(panel.id), value: choice } }]);
    expect(state().reportState[viewByStateKey(panel.id)]).toBe(choice);
  });

  it("refuses a value that is not a choice, and lists the choices", () => {
    const report = applyAIActions([{ action: "setReportFilter", value: { key: "currency", value: "Doubloons" } }]);
    expect(report.applied).toBe(0);
    expect(report.skipped[0].reason).toMatch(/not a choice for currency \(.*USD/);
    expect(state().reportState.currency).toBeUndefined();
  });

  it("refuses a key no control on the canvas has", () => {
    const report = applyAIActions([{ action: "setReportFilter", value: { key: "weather", value: "Sunny" } }]);
    expect(report.skipped[0].reason).toMatch(/no report control has the key "weather"/);
  });
});

describe("setZoneLayout on chrome zones", () => {
  it("hides a zone, sets a tone, flush bars and the sidebar side", () => {
    const report = applyAIActions([
      { action: "setZoneLayout", value: { zone: "footer", layout: { visible: false } } },
      { action: "setZoneLayout", value: { zone: "header", layout: { tone: "accent", flush: true } } },
      { action: "setZoneLayout", value: { zone: "sidebar", layout: { side: "right" } } },
    ]);
    expect(report.applied).toBe(3);
    expect(state().zoneLayouts.footer.visible).toBe(false);
    expect(state().zoneLayouts.header).toMatchObject({ tone: "accent", flush: true, mode: "row" });
    expect(state().zoneLayouts.sidebar.side).toBe("right");
  });
});
