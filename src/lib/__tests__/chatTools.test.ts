import { describe, it, expect } from "vitest";
import { CANVAS_TOOLS, CANVAS_TOOL_NAMES, toolUseToAction } from "../chatTools";
import { parseAIResponse } from "../parseAIResponse";
import { VALID_TEMPLATE_IDS, TEMPLATE_SUMMARIES } from "../templateIds";
import { BUILDER_TEMPLATES } from "../builderTemplates";
import { SYSTEM_PROMPT } from "../chatSystem";
import { ZONE_TONES } from "@/store/useBuilder";

/* The parser's allow-list is private; derive it by feeding one fence per name. */
function parserKnows(name: string): boolean {
  return parseAIResponse("```json\n" + JSON.stringify({ action: name, value: 1 }) + "\n```").actions.length === 1;
}

describe("chatTools — tool definitions", () => {
  it("declares one tool per builder action, and nothing the client cannot apply", () => {
    expect(CANVAS_TOOLS).toHaveLength(16);
    for (const name of CANVAS_TOOL_NAMES) expect(parserKnows(name), name).toBe(true);
    for (const name of ["setDesignSystem", "setMode", "setDensity", "setThemeKey", "setInterfaceType", "setComponents", "setColorOverride", "addBlock", "removeBlock", "moveBlock", "updateBlockProps", "updateBlockLayout", "setZoneLayout", "applyTemplate", "setReportFilter", "clearCanvas"]) {
      expect(CANVAS_TOOL_NAMES).toContain(name);
    }
  });

  it("every tool has a description and an object schema with required + additionalProperties:false", () => {
    for (const t of CANVAS_TOOLS) {
      expect(t.description, t.name).toBeTruthy();
      expect(t.input_schema.type).toBe("object");
      expect(Array.isArray(t.input_schema.required), t.name).toBe(true);
      expect(t.input_schema.additionalProperties, t.name).toBe(false);
    }
  });

  it("enumerates the closed value sets so the model cannot pick an unknown DS, mode, density or zone", () => {
    const schema = (name: string) => CANVAS_TOOLS.find((t) => t.name === name)!.input_schema.properties as Record<string, { enum?: unknown[] }>;
    expect(schema("setDesignSystem").value.enum).toEqual(["salt", "m3", "fluent", "carbon", "uoaui"]);
    expect(schema("setMode").value.enum).toEqual(["light", "dark"]);
    expect(schema("setDensity").value.enum).toEqual(["high", "medium", "low", "touch"]);
    expect(schema("moveBlock").toZone.enum).toEqual(["body", "header", "sidebar", "footer"]);
  });

  it("block props stay an open object (per-type props are documented in the prompt, not enumerated)", () => {
    const props = (CANVAS_TOOLS.find((t) => t.name === "addBlock")!.input_schema.properties as Record<string, { additionalProperties?: boolean }>).props;
    expect(props.additionalProperties).toBe(true);
  });

  it("the tool list is deterministic (part of the cached prompt prefix)", () => {
    expect(JSON.stringify(CANVAS_TOOLS)).toBe(JSON.stringify(CANVAS_TOOLS));
    expect(CANVAS_TOOL_NAMES[0]).toBe("setDesignSystem");
    expect(CANVAS_TOOL_NAMES[CANVAS_TOOL_NAMES.length - 1]).toBe("clearCanvas");
  });
});

describe("chatTools — toolUseToAction", () => {
  it("scalar tools unwrap `value`; object tools pass the input through; clearCanvas maps zone", () => {
    expect(toolUseToAction("setMode", { value: "dark" })).toEqual({ action: "setMode", value: "dark" });
    expect(toolUseToAction("setComponents", { value: ["cards"] })).toEqual({ action: "setComponents", value: ["cards"] });
    expect(toolUseToAction("addBlock", { type: "SimulatedCard", zone: "body", props: { title: "A" } })).toEqual({
      action: "addBlock",
      value: { type: "SimulatedCard", zone: "body", props: { title: "A" } },
    });
    expect(toolUseToAction("moveBlock", { blockId: "b1", toZone: "header", toIndex: 0 })).toEqual({
      action: "moveBlock",
      value: { blockId: "b1", toZone: "header", toIndex: 0 },
    });
    expect(toolUseToAction("clearCanvas", { zone: "sidebar" })).toEqual({ action: "clearCanvas", value: "sidebar" });
    expect(toolUseToAction("clearCanvas", {})).toEqual({ action: "clearCanvas", value: "body" });
  });

  it("unknown tool names and non-object inputs are handled without throwing", () => {
    expect(toolUseToAction("deployToProd", { value: 1 })).toBeNull();
    expect(toolUseToAction("setMode", "dark")).toEqual({ action: "setMode", value: undefined });
    expect(toolUseToAction("removeBlock", null)).toEqual({ action: "removeBlock", value: {} });
  });
});

describe("chatTools - templates, report filters and chrome", () => {
  const props = (name: string) => CANVAS_TOOLS.find((t) => t.name === name)!.input_schema.properties as Record<string, { enum?: unknown[]; properties?: Record<string, { enum?: unknown[]; type?: string }> }>;

  it("applyTemplate only accepts a known template id", () => {
    expect(props("applyTemplate").templateId.enum).toEqual([...VALID_TEMPLATE_IDS]);
    expect(toolUseToAction("applyTemplate", { templateId: "risk-analytics" })).toEqual({ action: "applyTemplate", value: { templateId: "risk-analytics" } });
  });

  it("every template has a summary for the model, and the finance ones are in it", () => {
    for (const id of VALID_TEMPLATE_IDS) {
      expect(TEMPLATE_SUMMARIES[id], id).toBeTruthy();
      expect(TEMPLATE_SUMMARIES[id].startsWith(BUILDER_TEMPLATES[id].label), id).toBe(true);
      expect(SYSTEM_PROMPT).toContain(`\`${id}\``);
    }
  });

  it("setReportFilter carries a key and a value", () => {
    expect(toolUseToAction("setReportFilter", { key: "currency", value: "USD" })).toEqual({ action: "setReportFilter", value: { key: "currency", value: "USD" } });
  });

  it("setZoneLayout can show or hide a zone, set its tone, flush bars and the sidebar side", () => {
    const layout = props("setZoneLayout").layout.properties!;
    expect(layout.visible.type).toBe("boolean");
    expect(layout.flush.type).toBe("boolean");
    expect(layout.tone.enum).toEqual([...ZONE_TONES]);
    expect(layout.side.enum).toEqual(["left", "right"]);
  });

  it("the prompt names the new blocks", () => {
    for (const type of ["TopNav", "TabStrip", "NavGroup", "PageTitle", "DataGrid", "HighchartCombination", "HighchartStackedBar", "HighchartStackedArea"]) {
      expect(SYSTEM_PROMPT, type).toContain(type);
    }
  });
});
