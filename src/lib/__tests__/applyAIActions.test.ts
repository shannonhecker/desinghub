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

  /* Audit finding #2 (2026-05-30): when the AI removes or clears the block
     that is currently selected, the selection (selectedBlockId/Ids/Zone)
     dangled — pointing at a block that no longer exists. Mirrors the manual
     delete reconcile in PreviewCanvas (`if (selectedBlockId === id) …`). */
  it("clears the selection when the AI removes the selected block", () => {
    useBuilder.setState({
      blocks: [{ id: "b1", type: "SimulatedCard", props: {} }],
      selectedBlockId: "b1",
      selectedBlockIds: ["b1"],
      selectedBlockZone: "body",
    });

    applyAIActions([{ action: "removeBlock", value: { blockId: "b1" } }]);

    const s = useBuilder.getState();
    expect(s.blocks.find((b) => b.id === "b1")).toBeUndefined();
    expect(s.selectedBlockId).toBeNull();
    expect(s.selectedBlockIds).toEqual([]);
    expect(s.selectedBlockZone).toBeNull();
  });

  it("keeps the selection when the AI removes a DIFFERENT block", () => {
    useBuilder.setState({
      blocks: [
        { id: "b1", type: "SimulatedCard", props: {} },
        { id: "b2", type: "SimulatedButton", props: {} },
      ],
      selectedBlockId: "b1",
      selectedBlockIds: ["b1"],
      selectedBlockZone: "body",
    });

    applyAIActions([{ action: "removeBlock", value: { blockId: "b2" } }]);

    expect(useBuilder.getState().selectedBlockId).toBe("b1");
  });

  /* Regression guard: removeBlock scans only TOP-LEVEL zone arrays, but a
     block inside a LayoutGroup is independently selectable yet lives in
     group.children (not a top-level array). If the AI removeBlock id isn't
     found at top level, nothing is removed — so a still-valid selection
     (e.g. a group-child) must NOT be cleared. The reconcile is gated on an
     actual removal, not on id-equality alone. */
  it("keeps the selection when removeBlock removes nothing (e.g. a group-child id)", () => {
    useBuilder.setState({
      blocks: [{ id: "g1", type: "LayoutGroup", props: {} }],
      selectedBlockId: "c1", // a child inside g1 — selectable, not a top-level block
      selectedBlockIds: ["c1"],
      selectedBlockZone: "body",
    });

    applyAIActions([{ action: "removeBlock", value: { blockId: "c1" } }]);

    expect(useBuilder.getState().selectedBlockId).toBe("c1");
  });

  it("clears a body selection when the AI clears the canvas", () => {
    useBuilder.setState({
      blocks: [{ id: "b1", type: "SimulatedCard", props: {} }],
      selectedBlockId: "b1",
      selectedBlockIds: ["b1"],
      selectedBlockZone: "body",
    });

    applyAIActions([{ action: "clearCanvas", value: "body" }]);

    const s = useBuilder.getState();
    expect(s.blocks).toEqual([]);
    expect(s.selectedBlockId).toBeNull();
    expect(s.selectedBlockZone).toBeNull();
  });

  it("keeps a body selection when the AI clears a DIFFERENT zone", () => {
    useBuilder.setState({
      blocks: [{ id: "b1", type: "SimulatedCard", props: {} }],
      headerBlocks: [{ id: "h1", type: "SimulatedButton", props: {} }],
      selectedBlockId: "b1",
      selectedBlockIds: ["b1"],
      selectedBlockZone: "body",
    });

    applyAIActions([{ action: "clearCanvas", value: "header" }]);

    expect(useBuilder.getState().selectedBlockId).toBe("b1");
  });
});
