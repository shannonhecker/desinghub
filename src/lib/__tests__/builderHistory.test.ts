import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { beginHistoryTransaction, pushSnapshot, undo, redo, canUndo, canRedo, initBuilderHistory } from "../builderHistory";

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
    zoneLayouts: {
      body:    { mode: 'row',   gap: 12, wrap: true,  align: 'stretch' },
      header:  { mode: 'row',   gap: 8,  wrap: false, align: 'center' },
      sidebar: { mode: 'stack', gap: 2,                align: 'stretch' },
      footer:  { mode: 'row',   gap: 8,  wrap: false, align: 'center' },
    },
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

  /* Audit finding #4 (2026-05-30): a zone's layout mode (row/grid/stack)
     lived in the store + Firebase snapshot but NOT in the undo history,
     so changing a zone layout then pressing Cmd+Z left the new layout in
     place — silent, un-undoable state. These pin the unified behaviour. */
  it("undo restores a zone layout change (layout-mode edits are undoable)", () => {
    useBuilder.getState().setZoneLayout("body", { mode: "row" });
    pushSnapshot();
    useBuilder.getState().setZoneLayout("body", { mode: "grid" });

    expect(useBuilder.getState().zoneLayouts.body.mode).toBe("grid");

    undo();

    expect(useBuilder.getState().zoneLayouts.body.mode).toBe("row");
  });

  it("redo re-applies a zone layout change after undo", () => {
    useBuilder.getState().setZoneLayout("body", { mode: "row" });
    pushSnapshot();
    useBuilder.getState().setZoneLayout("body", { mode: "grid" });

    undo();
    expect(useBuilder.getState().zoneLayouts.body.mode).toBe("row");
    redo();
    expect(useBuilder.getState().zoneLayouts.body.mode).toBe("grid");
  });

  /* Real-world path: the inspector (ComponentLibrary) calls setZoneLayout
     directly with NO explicit pushSnapshot, so undoability relies on the
     subscription auto-capture gate including zoneLayouts. Without the gate
     entry, a layout-only edit is filtered out as "nothing changed" and no
     snapshot is taken — undo would be a no-op. */
  it("undo restores zoneLayouts via subscription auto-capture (no explicit pushSnapshot)", () => {
    useBuilder.getState().setZoneLayout("body", { mode: "grid" });
    expect(useBuilder.getState().zoneLayouts.body.mode).toBe("grid");

    undo();

    expect(useBuilder.getState().zoneLayouts.body.mode).toBe("row");
  });

  /* Multi-page Phase 2 (2026-06-07): undo/redo must be page-aware. A page
     switch changes activePageId + blocks; undoing it has to restore BOTH the
     active page id and that page's body. CanvasSnapshot captures pages (raw
     ref, for change detection) + activePageId; apply() reconciles the active
     page's body from the snapshot's blocks so the restored state stays
     consistent (blocks === pages[active].body). */
  const mpCard = (id: string) => ({ id, type: "SimulatedCard", props: { title: id } });
  function anchorMultiPage() {
    teardown?.();
    useBuilder.setState({
      blocks: [mpCard("a1")],
      sidebarBlocks: [],
      pages: [
        { id: "A", name: "Page A", body: [mpCard("a1")] },
        { id: "B", name: "Page B", body: [] },
      ],
      activePageId: "A",
    } as never);
    teardown = initBuilderHistory();
  }

  it("undo restores the prior active page AND its body after a page switch", () => {
    anchorMultiPage();
    pushSnapshot(); // capture page A active with [a1]
    useBuilder.getState().openNavPage("B", "Page B"); // switch to empty B
    useBuilder.getState().setBlocks([mpCard("b1")]);   // author B

    expect(useBuilder.getState().activePageId).toBe("B");
    expect(useBuilder.getState().blocks).toEqual([mpCard("b1")]);

    undo();

    expect(useBuilder.getState().activePageId).toBe("A"); // active page restored
    expect(useBuilder.getState().blocks).toEqual([mpCard("a1")]); // its body restored, consistent
  });

  it("redo re-applies a page switch after undo", () => {
    anchorMultiPage();
    pushSnapshot();
    useBuilder.getState().openNavPage("B", "Page B");

    undo();
    expect(useBuilder.getState().activePageId).toBe("A");
    redo();
    expect(useBuilder.getState().activePageId).toBe("B");
  });

  /* Review finding (2026-06-07): apply() must reconcile the active page's
     bodyLayout too, not just its body. snap() captures pages by raw ref, so the
     active page's stored bodyLayout lags the live zoneLayouts.body; restoring
     only body left pages[active].bodyLayout stale → a later page round-trip
     reloaded the stale layout (same class as the audit-#4 zoneLayouts gap). */
  it("undo reconciles the active page's bodyLayout to the restored zoneLayouts (no internal desync)", () => {
    anchorMultiPage();
    useBuilder.getState().setZoneLayout("body", { mode: "grid" });
    pushSnapshot();
    useBuilder.getState().setZoneLayout("body", { mode: "stack" });

    undo();

    const s = useBuilder.getState();
    expect(s.zoneLayouts.body.mode).toBe("grid");
    const activePage = s.pages.find((p) => p.id === s.activePageId);
    expect(activePage?.bodyLayout?.mode).toBe("grid"); // reconciled, not stale/undefined
  });
});


describe('gesture history', () => {
  beforeEach(resetAll);
  const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

  it('records a multi-frame gesture as one undo step, and redoes the final state', async () => {
    const finish = beginHistoryTransaction();
    useBuilder.setState({ density: 'high' });
    await frame();
    useBuilder.setState({ density: 'low' });
    await frame();
    finish();
    finish(); // pointer-up plus lost-capture/unmount is harmless
    expect(undo()).toBe(true);
    expect(useBuilder.getState().density).toBe('medium');
    expect(canUndo()).toBe(false);
    expect(redo()).toBe(true);
    expect(useBuilder.getState().density).toBe('low');
  });

  it('does not add an undo step when the pointer never moved', () => {
    const finish = beginHistoryTransaction();
    finish();
    expect(canUndo()).toBe(false);
  });

  it('keeps an earlier pending change separate from the gesture', async () => {
    useBuilder.setState({ density: 'high' });
    const finish = beginHistoryTransaction();
    useBuilder.setState({ density: 'low' });
    await frame();
    finish();
    undo();
    expect(useBuilder.getState().density).toBe('high');
    undo();
    expect(useBuilder.getState().density).toBe('medium');
  });
});

/* 5 Oct: a focused inspector field holds a history transaction for its
   whole focus. An explicit pushSnapshot (an AI result landing meanwhile)
   closes that transaction first, so the field's older "before" never lands
   on top of the newer entry when the field blurs. */
describe("pushSnapshot finishes an open gesture first", () => {
  it("keeps history in order: field edit, then the pushed state", () => {
    teardown?.();
    useBuilder.setState({ blocks: [{ id: "f1", type: "SimulatedCard", props: { title: "one" } }], sidebarBlocks: [] } as never);
    teardown = initBuilderHistory();
    const end = beginHistoryTransaction();
    useBuilder.getState().updateBlockProps("f1", { title: "two" });
    pushSnapshot();
    useBuilder.getState().updateBlockProps("f1", { title: "three" });
    end();
    undo();
    expect((useBuilder.getState().blocks[0].props as { title: string }).title).toBe("two");
    undo();
    expect((useBuilder.getState().blocks[0].props as { title: string }).title).toBe("one");
  });
});
