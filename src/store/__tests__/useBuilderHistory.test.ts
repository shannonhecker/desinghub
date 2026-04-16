import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder } from "../useBuilder";
import { pushSnapshot, undo, redo, canUndo, canRedo, clearHistory } from "../useBuilderHistory";

function resetAll() {
  useBuilder.setState({
    blocks: [],
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    designSystem: "salt",
    mode: "dark",
    density: "medium",
    themeKey: "jpm-dark",
    colorOverrides: {},
    hasOverrides: false,
  });
  clearHistory();
}

describe("useBuilderHistory", () => {
  beforeEach(resetAll);

  it("starts with no undo/redo available", () => {
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
  });

  it("undo restores previous state", () => {
    pushSnapshot();
    useBuilder.setState({ density: "high" });

    expect(useBuilder.getState().density).toBe("high");
    undo();
    expect(useBuilder.getState().density).toBe("medium");
  });

  it("redo restores undone state", () => {
    pushSnapshot();
    useBuilder.setState({ density: "high" });

    undo();
    expect(useBuilder.getState().density).toBe("medium");
    redo();
    expect(useBuilder.getState().density).toBe("high");
  });

  it("canUndo/canRedo reflect stack state", () => {
    expect(canUndo()).toBe(false);
    pushSnapshot();
    useBuilder.setState({ density: "high" });
    expect(canUndo()).toBe(true);
    expect(canRedo()).toBe(false);

    undo();
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(true);
  });

  it("new action after undo clears redo stack", () => {
    pushSnapshot();
    useBuilder.setState({ density: "high" });
    undo();
    expect(canRedo()).toBe(true);

    pushSnapshot();
    useBuilder.setState({ density: "low" });
    expect(canRedo()).toBe(false);
  });

  it("supports multiple undo steps", () => {
    pushSnapshot();
    useBuilder.setState({ density: "high" });

    pushSnapshot();
    useBuilder.setState({ density: "low" });

    pushSnapshot();
    useBuilder.setState({ density: "touch" });

    expect(useBuilder.getState().density).toBe("touch");
    undo();
    expect(useBuilder.getState().density).toBe("low");
    undo();
    expect(useBuilder.getState().density).toBe("high");
    undo();
    expect(useBuilder.getState().density).toBe("medium");
  });

  it("undo with no history is a no-op", () => {
    useBuilder.setState({ density: "high" });
    undo();
    expect(useBuilder.getState().density).toBe("high");
  });

  it("redo with no future is a no-op", () => {
    useBuilder.setState({ density: "high" });
    redo();
    expect(useBuilder.getState().density).toBe("high");
  });

  it("clearHistory resets stacks", () => {
    pushSnapshot();
    useBuilder.setState({ density: "high" });
    expect(canUndo()).toBe(true);

    clearHistory();
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
  });

  it("tracks block changes through undo", () => {
    pushSnapshot();
    useBuilder.setState({ blocks: [{ id: "b1", type: "SimulatedCard", props: { title: "A" } }] });

    pushSnapshot();
    useBuilder.setState({ blocks: [
      { id: "b1", type: "SimulatedCard", props: { title: "A" } },
      { id: "b2", type: "SimulatedButton", props: { label: "B" } },
    ] });

    expect(useBuilder.getState().blocks).toHaveLength(2);
    undo();
    expect(useBuilder.getState().blocks).toHaveLength(1);
    undo();
    expect(useBuilder.getState().blocks).toHaveLength(0);
  });
});
