import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { pushSnapshot, undo, redo, canUndo, canRedo, initBuilderHistory } from "../builderHistory";

let teardown: (() => void) | null = null;

function resetAll() {
  useBuilder.setState({
    blocks: [],
    headerBlocks: [],
    sidebarBlocks: [],
    footerBlocks: [],
    selectedComponents: [],
    activeTemplateId: null,
    designSystem: "salt",
    mode: "dark",
    density: "medium",
    themeKey: "jpm-dark",
    colorOverrides: {},
    hasOverrides: false,
  });
  if (teardown) teardown();
  teardown = initBuilderHistory();
}

describe("builderHistory", () => {
  beforeEach(resetAll);

  it("starts with no undo/redo available", () => {
    expect(canUndo()).toBe(false);
    expect(canRedo()).toBe(false);
  });

  it("pushSnapshot + density change + undo restores density", () => {
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

  it("new pushSnapshot after undo clears redo stack", () => {
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

  /* Unified lib/ undo behaviour differs from the deprecated store/ stack:
     a state change without an explicit pushSnapshot is still undo-able,
     because the subscription auto-captures via RAF. undo() flushes any
     pending capture synchronously before popping, so even a sync state
     change → sync undo() round-trip restores the prior state. This is
     the correct Cmd+Z semantics for arbitrary UI mutations. */
  it("undo restores prior state even without explicit pushSnapshot (subscription auto-capture)", () => {
    useBuilder.setState({ density: "high" });
    undo();
    expect(useBuilder.getState().density).toBe("medium");
  });

  it("redo with no future is a no-op", () => {
    useBuilder.setState({ density: "high" });
    redo();
    expect(useBuilder.getState().density).toBe("high");
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

  /* Regression: pre-unification, an AI turn that switched designSystem
     pushed to the (deprecated) store/useBuilderHistory stack while Cmd+Z
     popped from lib/ — the lib/ snapshot didn't even carry `designSystem`,
     so the user saw blocks revert but the DS stayed on the new one.
     This test pins the unified behaviour: a single pushSnapshot() before
     mutating DS + blocks together, followed by one undo(), restores BOTH. */
  it("undo restores designSystem AND blocks after a combined AI turn", () => {
    pushSnapshot();
    useBuilder.setState({
      designSystem: "fluent",
      blocks: [{ id: "ai-1", type: "SimulatedCard", props: {} }],
    });

    expect(useBuilder.getState().designSystem).toBe("fluent");
    expect(useBuilder.getState().blocks).toHaveLength(1);

    undo();

    expect(useBuilder.getState().designSystem).toBe("salt");
    expect(useBuilder.getState().blocks).toHaveLength(0);
  });

  it("undo restores colorOverrides + hasOverrides", () => {
    pushSnapshot();
    useBuilder.setState({
      colorOverrides: { "--salt-palette-accent": "#FF00AA" },
      hasOverrides: true,
    });

    expect(useBuilder.getState().hasOverrides).toBe(true);

    undo();

    expect(useBuilder.getState().colorOverrides).toEqual({});
    expect(useBuilder.getState().hasOverrides).toBe(false);
  });
});
