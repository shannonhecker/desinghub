import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";

/* Characterization tests for moveBlockUp / moveBlockDown — the reorder logic the
   new Up/Down arrow-nudge keybinding (useBuilderShortcuts) dispatches to. These
   lock the swap behaviour so the keyboard reorder has a tested foundation. */
const blk = (id: string): Block => ({ id, type: "SimulatedButton", props: {} } as Block);
const ids = () => useBuilder.getState().headerBlocks.map((b) => b.id);

describe("useBuilder — moveBlockUp / moveBlockDown reorder (powers Up/Down nudge)", () => {
  beforeEach(() => {
    useBuilder.setState({ headerBlocks: [blk("a"), blk("b"), blk("c")] });
  });

  it("moveBlockUp swaps a block with its predecessor", () => {
    useBuilder.getState().moveBlockUp("header", "b");
    expect(ids()).toEqual(["b", "a", "c"]);
  });

  it("moveBlockUp is a no-op at the top of the zone", () => {
    useBuilder.getState().moveBlockUp("header", "a");
    expect(ids()).toEqual(["a", "b", "c"]);
  });

  it("moveBlockDown swaps a block with its successor", () => {
    useBuilder.getState().moveBlockDown("header", "b");
    expect(ids()).toEqual(["a", "c", "b"]);
  });

  it("moveBlockDown is a no-op at the bottom of the zone", () => {
    useBuilder.getState().moveBlockDown("header", "c");
    expect(ids()).toEqual(["a", "b", "c"]);
  });

  it("a missing block id leaves the order unchanged", () => {
    useBuilder.getState().moveBlockUp("header", "zzz");
    useBuilder.getState().moveBlockDown("header", "zzz");
    expect(ids()).toEqual(["a", "b", "c"]);
  });
});
