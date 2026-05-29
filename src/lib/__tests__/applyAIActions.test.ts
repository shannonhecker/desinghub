import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { applyAIActions } from "../applyAIActions";
import type { AIAction } from "../parseAIResponse";
import { subscribeToolUse, TOOL_USE_EVENT_NAME, type ToolUseEvent } from "../toolUseEvents";

function resetStore() {
  useBuilder.setState({
    designSystem: "salt",
    mode: "dark",
    density: "medium",
    themeKey: "jpm-dark",
    interfaceType: "dashboard",
    selectedComponents: ["buttons"],
    blocks: [],
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    colorOverrides: {},
    hasOverrides: false,
  });
}

describe("applyAIActions", () => {
  beforeEach(resetStore);

  it("setDesignSystem changes design system", () => {
    applyAIActions([{ action: "setDesignSystem", value: "m3" }]);
    expect(useBuilder.getState().designSystem).toBe("m3");
  });

  it("rejects invalid design system", () => {
    applyAIActions([{ action: "setDesignSystem", value: "invalid" }]);
    expect(useBuilder.getState().designSystem).toBe("salt");
  });

  it("setMode changes mode", () => {
    applyAIActions([{ action: "setMode", value: "light" }]);
    expect(useBuilder.getState().mode).toBe("light");
  });

  it("setDensity changes density", () => {
    applyAIActions([{ action: "setDensity", value: "high" }]);
    expect(useBuilder.getState().density).toBe("high");
  });

  it("setComponents updates selected components", () => {
    applyAIActions([{ action: "setComponents", value: ["cards", "tabs"] }]);
    expect(useBuilder.getState().selectedComponents).toEqual(["cards", "tabs"]);
  });

  it("setInterfaceType changes interface type", () => {
    applyAIActions([{ action: "setInterfaceType", value: "form" }]);
    expect(useBuilder.getState().interfaceType).toBe("form");
  });

  it("setThemeKey sets theme key", () => {
    applyAIActions([{ action: "setThemeKey", value: "jpm-light" }]);
    expect(useBuilder.getState().themeKey).toBe("jpm-light");
  });

  it("addBlock adds a block to the body zone", () => {
    applyAIActions([{ action: "addBlock", value: { type: "SimulatedCard", zone: "body", props: { title: "Test" } } }]);
    const blocks = useBuilder.getState().blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("SimulatedCard");
    expect(blocks[0].props.title).toBe("Test");
  });

  it("addBlock adds to header zone", () => {
    applyAIActions([{ action: "addBlock", value: { type: "AppBrand", zone: "header", props: { label: "My App" } } }]);
    expect(useBuilder.getState().headerBlocks.length).toBeGreaterThanOrEqual(1);
  });

  it("removeBlock removes a block by ID", () => {
    // First add a block
    applyAIActions([{ action: "addBlock", value: { type: "SimulatedButton", zone: "body" } }]);
    const blockId = useBuilder.getState().blocks[0].id;
    applyAIActions([{ action: "removeBlock", value: { blockId } }]);
    expect(useBuilder.getState().blocks).toHaveLength(0);
  });

  it("updateBlockProps updates props on an existing block", () => {
    applyAIActions([{ action: "addBlock", value: { type: "SimulatedButton", zone: "body" } }]);
    const blockId = useBuilder.getState().blocks[0].id;
    applyAIActions([{ action: "updateBlockProps", value: { blockId, props: { label: "Updated" } } }]);
    expect(useBuilder.getState().blocks[0].props.label).toBe("Updated");
  });

  it("clearCanvas empties the body zone", () => {
    applyAIActions([
      { action: "addBlock", value: { type: "SimulatedCard", zone: "body" } },
      { action: "addBlock", value: { type: "SimulatedButton", zone: "body" } },
    ]);
    expect(useBuilder.getState().blocks.length).toBeGreaterThanOrEqual(1);
    applyAIActions([{ action: "clearCanvas", value: "body" }]);
    expect(useBuilder.getState().blocks).toHaveLength(0);
  });

  it("setColorOverride applies a color override", () => {
    applyAIActions([{ action: "setColorOverride", value: { key: "accent", color: "#ff0000" } }]);
    expect(useBuilder.getState().colorOverrides.accent).toBe("#ff0000");
  });

  it("handles multiple actions in sequence", () => {
    applyAIActions([
      { action: "setDesignSystem", value: "fluent" },
      { action: "setMode", value: "light" },
      { action: "addBlock", value: { type: "SimulatedTitle", zone: "body", props: { text: "Hello" } } },
    ]);
    const state = useBuilder.getState();
    expect(state.designSystem).toBe("fluent");
    expect(state.mode).toBe("light");
    expect(state.blocks).toHaveLength(1);
  });

  it("ignores actions with missing required fields", () => {
    applyAIActions([
      { action: "addBlock", value: {} },
      { action: "removeBlock", value: {} },
      { action: "updateBlockProps", value: { blockId: "nonexistent" } },
    ]);
    // Should not throw, state unchanged
    expect(useBuilder.getState().blocks).toHaveLength(0);
  });

  /* ── Phase 3a (N4): block provenance + tool-use events ── */

  it("Phase 3a: addBlock stamps the new block with source='ai-action'", () => {
    applyAIActions([
      { action: "addBlock", value: { type: "SimulatedCard", zone: "body" } },
    ]);
    const blocks = useBuilder.getState().blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].source).toBe("ai-action");
  });

  it("Phase 3a: emits a builder:tool-use event per parsed action with messageId", async () => {
    const events: ToolUseEvent[] = [];
    const unsubscribe = subscribeToolUse((e) => events.push(e));
    try {
      applyAIActions(
        [
          { action: "setDesignSystem", value: "m3" },
          { action: "addBlock", value: { type: "SimulatedCard", zone: "body" } },
        ],
        "msg-abc",
      );
    } finally {
      unsubscribe();
    }
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      action: "setDesignSystem",
      value: "m3",
      messageId: "msg-abc",
    });
    expect(events[1]).toMatchObject({
      action: "addBlock",
      messageId: "msg-abc",
      zone: "body",
    });
    expect(typeof events[1].blockId).toBe("string");
    expect(events[1].blockId).toMatch(/^ai-/);
  });

  it("Phase 3a: event name is the documented constant", () => {
    expect(TOOL_USE_EVENT_NAME).toBe("builder:tool-use");
  });

  it("Phase 3a: events fire even without a messageId (callers without context)", () => {
    const events: ToolUseEvent[] = [];
    const unsubscribe = subscribeToolUse((e) => events.push(e));
    try {
      applyAIActions([{ action: "setMode", value: "light" }]);
    } finally {
      unsubscribe();
    }
    expect(events).toHaveLength(1);
    expect(events[0].messageId).toBeUndefined();
    expect(events[0].action).toBe("setMode");
  });
});
