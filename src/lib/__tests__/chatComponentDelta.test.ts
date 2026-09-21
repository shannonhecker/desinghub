import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { applyChatComponentDelta } from "../chatComponentDelta";
import type { Block } from "@/store/useBuilder";

/* Zone defaults used when addBlockFromLibrary resolves `preferZone =
   "body"`. Keep minimal — only the fields the helper reads/writes. */
function resetStore(overrides: Partial<ReturnType<typeof useBuilder.getState>> = {}) {
  useBuilder.setState({
    blocks: [],
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    selectedComponents: [],
    selectedBlockId: null,
    selectedBlockZone: null,
    ...overrides,
  });
}

describe("applyChatComponentDelta", () => {
  beforeEach(() => resetStore());

  it("empty delta is a no-op", () => {
    applyChatComponentDelta(["buttons"], ["buttons"]);
    expect(useBuilder.getState().blocks).toHaveLength(0);
  });

  it("single-id add → adds one body block of the mapped type", () => {
    /* Every wizard id now maps to a single block (generic multi-block
       expansions were removed so content is domain-driven, not templated). */
    applyChatComponentDelta([], ["tabs"]);
    const blocks = useBuilder.getState().blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("SimulatedTabs");
  });

  it("wizard id 'progress' adds a SINGLE SimulatedStatCard (no generic Revenue/Users/Growth expansion)", () => {
    applyChatComponentDelta([], ["progress"]);
    const blocks = useBuilder.getState().blocks;
    /* Generic 3-card expansion removed — the model supplies domain-specific
       labels/values via per-block props instead of a hardcoded template. */
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("SimulatedStatCard");
    expect(blocks[0].props.label).toBeUndefined();
  });

  it("unknown id is skipped silently — no dispatches, no throw", () => {
    applyChatComponentDelta([], ["definitely-not-a-real-id"]);
    expect(useBuilder.getState().blocks).toHaveLength(0);
  });

  it("removal drops every block whose type matches the mapped id", () => {
    /* Two SimulatedButtons + one SimulatedCard pre-existing in body */
    resetStore({
      blocks: [
        { id: "a", type: "SimulatedButton", props: {} },
        { id: "b", type: "SimulatedButton", props: {} },
        { id: "c", type: "SimulatedCard", props: {} },
      ] as Block[],
    });
    applyChatComponentDelta(["buttons", "cards"], ["cards"]);
    const blocks = useBuilder.getState().blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("SimulatedCard");
  });

  it("multi-block removal drops every type defined in the group", () => {
    resetStore({
      blocks: [
        { id: "a", type: "SimulatedStatCard", props: { label: "Revenue" } },
        { id: "b", type: "SimulatedStatCard", props: { label: "Users" } },
        { id: "c", type: "SimulatedStatCard", props: { label: "Growth" } },
      ] as Block[],
    });
    applyChatComponentDelta(["progress"], []);
    expect(useBuilder.getState().blocks).toHaveLength(0);
  });

  it("combined add + remove: adds first, then removes from post-add state", () => {
    resetStore({
      blocks: [{ id: "a", type: "SimulatedButton", props: {} }] as Block[],
    });
    /* old=[buttons], new=[cards] → "cards" adds ONE SimulatedCard
       (expansions removed); removal drops the single SimulatedButton.
       Result: 1 card, 0 buttons. */
    applyChatComponentDelta(["buttons"], ["cards"]);
    const blocks = useBuilder.getState().blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks.every((b) => b.type === "SimulatedCard")).toBe(true);
    expect(blocks.some((b) => b.type === "SimulatedButton")).toBe(false);
  });

  it("header/sidebar/footer zones are untouched even when types match", () => {
    /* A button sitting in the header should survive "remove buttons"
       from chat, because the helper operates on the body zone only. */
    resetStore({
      blocks: [{ id: "body-btn", type: "SimulatedButton", props: {} }] as Block[],
      headerBlocks: [{ id: "hdr-btn", type: "SimulatedButton", props: {} }] as Block[],
    });
    applyChatComponentDelta(["buttons"], []);
    expect(useBuilder.getState().blocks).toHaveLength(0);
    expect(useBuilder.getState().headerBlocks).toHaveLength(1);
    expect(useBuilder.getState().headerBlocks[0].id).toBe("hdr-btn");
  });

  it("alsoRemoveIds removes blocks of the mapped types even when selectedComponents is empty", () => {
    /* The bug scenario: user dragged a Card from the palette, then
       chats "remove cards". selectedComponents was never populated,
       so the delta is empty — alsoRemoveIds must drive removal. */
    resetStore({
      blocks: [{ id: "dragged-card", type: "SimulatedCard", props: {} }] as Block[],
    });
    applyChatComponentDelta([], [], { alsoRemoveIds: ["cards"] });
    expect(useBuilder.getState().blocks).toHaveLength(0);
  });

  it("clearBody wipes every body block regardless of state", () => {
    resetStore({
      blocks: [
        { id: "a", type: "SimulatedButton", props: {} },
        { id: "b", type: "SimulatedCard", props: {} },
        { id: "c", type: "SimulatedTabs", props: {} },
      ] as Block[],
      headerBlocks: [{ id: "hdr", type: "SimulatedButton", props: {} }] as Block[],
      selectedComponents: ["tabs"],
    });
    applyChatComponentDelta(["tabs"], [], { clearBody: true });
    expect(useBuilder.getState().blocks).toHaveLength(0);
    /* Header (and other non-body zones) must survive. */
    expect(useBuilder.getState().headerBlocks).toHaveLength(1);
  });

  it("alsoRemoveIds unions with delta-derived removals", () => {
    /* Delta says drop "cards"; alsoRemoveIds adds "buttons" on top.
       Both types should be stripped from the body zone. */
    resetStore({
      blocks: [
        { id: "c1", type: "SimulatedCard", props: {} },
        { id: "b1", type: "SimulatedButton", props: {} },
      ] as Block[],
    });
    applyChatComponentDelta(["cards"], [], { alsoRemoveIds: ["buttons"] });
    expect(useBuilder.getState().blocks).toHaveLength(0);
  });

  /* Phase 3a (N4 Tool-Use Cards): every block landing via the chat
     delta is stamped `source: 'chat'`. Removal predicate stays
     type-only per Q2 — provenance is metadata, not a filter. */
  it("Phase 3a: single-id chat add stamps source='chat'", () => {
    applyChatComponentDelta([], ["tabs"]);
    const blocks = useBuilder.getState().blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].source).toBe("chat");
  });

  it("Phase 3a: wizard 'progress' add stamps the block with source='chat'", () => {
    applyChatComponentDelta([], ["progress"]);
    const blocks = useBuilder.getState().blocks;
    expect(blocks).toHaveLength(1);
    expect(blocks[0].source).toBe("chat");
  });

  /* Any-zone chat adds: `zone` threads the target zone through adds,
     removals, and clears so "add a card to the sidebar" lands in the
     sidebar array instead of silently defaulting to body. */
  describe("zone option", () => {
    it("zone='header' adds the mapped block to headerBlocks, body untouched", () => {
      applyChatComponentDelta([], ["cards"], { zone: "header" });
      expect(useBuilder.getState().blocks).toHaveLength(0);
      expect(useBuilder.getState().headerBlocks).toHaveLength(1);
      expect(useBuilder.getState().headerBlocks[0].type).toBe("SimulatedCard");
    });

    it("zone='sidebar' removal scans sidebarBlocks and leaves body alone", () => {
      resetStore({
        blocks: [{ id: "body-btn", type: "SimulatedButton", props: {} }] as Block[],
        sidebarBlocks: [
          { id: "sb-1", type: "SimulatedButton", props: {} },
          { id: "sb-2", type: "SimulatedButton", props: {} },
        ] as Block[],
      });
      applyChatComponentDelta([], [], { alsoRemoveIds: ["buttons"], zone: "sidebar" });
      expect(useBuilder.getState().sidebarBlocks).toHaveLength(0);
      expect(useBuilder.getState().blocks).toHaveLength(1);
    });

    it("zone='header' clear wipes headerBlocks only", () => {
      resetStore({
        blocks: [{ id: "body-1", type: "SimulatedCard", props: {} }] as Block[],
        headerBlocks: [
          { id: "hdr-1", type: "SimulatedButton", props: {} },
          { id: "hdr-2", type: "SimulatedBadge", props: {} },
        ] as Block[],
      });
      applyChatComponentDelta([], [], { clearBody: true, zone: "header" });
      expect(useBuilder.getState().headerBlocks).toHaveLength(0);
      expect(useBuilder.getState().blocks).toHaveLength(1);
    });

    it("omitted zone keeps the body default", () => {
      applyChatComponentDelta([], ["cards"], {});
      expect(useBuilder.getState().blocks).toHaveLength(1);
      expect(useBuilder.getState().headerBlocks).toHaveLength(0);
    });
  });

  /* Removal honesty: the caller needs to know whether an explicit
     removal actually touched the canvas, so a miss (type lives in a
     different zone) can be reported honestly instead of as success. */
  describe("removedCount result", () => {
    it("reports 0 when the mentioned type is not in the target zone", () => {
      resetStore({
        sidebarBlocks: [{ id: "t1", type: "SimulatedDataTable", props: {} }] as Block[],
      });
      const res = applyChatComponentDelta(["table"], [], {});
      expect(res.removedCount).toBe(0);
      expect(useBuilder.getState().sidebarBlocks).toHaveLength(1);
    });

    it("reports the number of blocks actually removed", () => {
      resetStore({
        blocks: [
          { id: "a", type: "SimulatedButton", props: {} },
          { id: "b", type: "SimulatedButton", props: {} },
        ] as Block[],
      });
      const res = applyChatComponentDelta(["buttons"], []);
      expect(res.removedCount).toBe(2);
    });

    it("counts blocks wiped by a clear", () => {
      resetStore({
        blocks: [
          { id: "a", type: "SimulatedButton", props: {} },
          { id: "b", type: "SimulatedCard", props: {} },
        ] as Block[],
      });
      const res = applyChatComponentDelta([], [], { clearBody: true });
      expect(res.removedCount).toBe(2);
    });

    it("reports 0 on the empty-delta early return", () => {
      const res = applyChatComponentDelta(["buttons"], ["buttons"]);
      expect(res.removedCount).toBe(0);
    });
  });

  /* Chat adds must not hijack the chat scope: addBlockFromLibrary
     auto-selects the block it adds (inspector jump for palette clicks),
     but a selected block routes the NEXT chat message to the
     selected-block path — offline it then bails with "Editing the
     selected block needs AI", breaking repeated adds. */
  it("chat adds do not steal the selection scope", () => {
    applyChatComponentDelta([], ["table"]);
    expect(useBuilder.getState().blocks).toHaveLength(1);
    expect(useBuilder.getState().selectedBlockId).toBeNull();
  });

  it("a pre-existing selection survives a chat add", () => {
    resetStore({
      blocks: [{ id: "keep-me", type: "SimulatedCard", props: {} }] as Block[],
      selectedBlockId: "keep-me",
      selectedBlockZone: "body",
    });
    applyChatComponentDelta([], ["buttons"]);
    expect(useBuilder.getState().selectedBlockId).toBe("keep-me");
    expect(useBuilder.getState().selectedBlockZone).toBe("body");
  });

  /* Duplicate adds: alsoAddIds forces an add even when the id is already
     in the wizard state (and thus invisible to the oldIds -> newIds
     delta). Kills the false-success bug where "add a data table" with one
     present reported Added but changed nothing. */
  describe("alsoAddIds option", () => {
    it("adds a duplicate even when the id is present in both old and new ids", () => {
      resetStore({
        blocks: [{ id: "t1", type: "SimulatedDataTable", props: {} }] as Block[],
      });
      applyChatComponentDelta(["table"], ["table"], { alsoAddIds: ["table"] });
      const blocks = useBuilder.getState().blocks;
      expect(blocks).toHaveLength(2);
      expect(blocks.every((b) => b.type === "SimulatedDataTable")).toBe(true);
    });

    it("bypasses the empty-delta early return", () => {
      applyChatComponentDelta(["buttons"], ["buttons"], { alsoAddIds: ["buttons"] });
      expect(useBuilder.getState().blocks).toHaveLength(1);
      expect(useBuilder.getState().blocks[0].type).toBe("SimulatedButton");
    });

    it("combines with zone so the duplicate lands in the target zone", () => {
      resetStore({
        blocks: [{ id: "t1", type: "SimulatedDataTable", props: {} }] as Block[],
      });
      applyChatComponentDelta(["table"], ["table"], { alsoAddIds: ["table"], zone: "sidebar" });
      expect(useBuilder.getState().blocks).toHaveLength(1);
      expect(useBuilder.getState().sidebarBlocks).toHaveLength(1);
      expect(useBuilder.getState().sidebarBlocks[0].type).toBe("SimulatedDataTable");
    });

    it("stamps alsoAddIds blocks with source='chat'", () => {
      applyChatComponentDelta(["table"], ["table"], { alsoAddIds: ["table"] });
      expect(useBuilder.getState().blocks[0].source).toBe("chat");
    });

    it("does not double-add an id that is in both the delta and alsoAddIds", () => {
      applyChatComponentDelta([], ["table"], { alsoAddIds: ["table"] });
      expect(useBuilder.getState().blocks).toHaveLength(1);
    });
  });
});
