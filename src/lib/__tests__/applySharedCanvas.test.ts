import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { applySharedCanvas } from "../applySharedCanvas";
import { initBuilderHistory, undo } from "../builderHistory";
import type { SharedCanvas } from "../shareState";

const oldBlock = { id: "old", type: "PageTitle", props: { text: "Keep my work" } };
const incoming: SharedCanvas = {
  v: 1, designSystem: "m3", mode: "light", density: "low", canvasSpacing: "tight",
  deviceMode: "mobile", themeKey: null, activeTemplateId: null,
  headerBlocks: [], sidebarBlocks: [], footerBlocks: [],
  blocks: [{ id: "new", type: "PageTitle", props: { text: "Shared canvas" } }],
};

beforeEach(() => useBuilder.setState({
  ...useBuilder.getInitialState(),
  blocks: [], headerBlocks: [], sidebarBlocks: [], footerBlocks: [], pages: [], activePageId: null, currentSessionId: null,
  designSystem: "salt", mode: "dark", density: "medium", deviceMode: "desktop", canvasSpacing: "comfortable", activeTemplateId: "risk-analytics",
}));

describe("shared canvas replacement", () => {
  it.each(["blocks", "headerBlocks", "sidebarBlocks", "footerBlocks"] as const)("refusal preserves all state when %s is occupied", (zone) => {
    useBuilder.setState({ [zone]: [oldBlock] });
    const before = useBuilder.getState();
    const confirm = vi.fn(() => false);
    expect(applySharedCanvas(incoming, confirm)).toBe(false);
    expect(confirm).toHaveBeenCalledOnce();
    expect(useBuilder.getState()).toBe(before);
  });

  it("also protects content on an inactive page", () => {
    useBuilder.setState({ pages: [{ id: "saved", name: "Saved", body: [oldBlock] }] });
    const before = useBuilder.getState();
    expect(applySharedCanvas(incoming, () => false)).toBe(false);
    expect(useBuilder.getState()).toBe(before);
  });

  it("does not treat the untouched starter scaffold as an existing project", () => {
    useBuilder.setState(useBuilder.getInitialState(), true);
    const confirm = vi.fn(() => false);
    expect(applySharedCanvas(incoming, confirm)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it("protects a saved project even if its content matches the starter scaffold", () => {
    useBuilder.setState(useBuilder.getInitialState(), true);
    useBuilder.setState({ currentSessionId: "saved-project" });
    expect(applySharedCanvas(incoming, () => false)).toBe(false);
  });

  it("loads an empty canvas without prompting", () => {
    const confirm = vi.fn(() => false);
    expect(applySharedCanvas(incoming, confirm)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
    expect(useBuilder.getState().blocks).toEqual(incoming.blocks);
    expect(useBuilder.getState().designSystem).toBe("m3");
  });

  it("accepted single-page replacement clears the old pages, template and selection", () => {
    useBuilder.setState({ blocks: [oldBlock], pages: [{ id: "old", name: "Old", body: [oldBlock] }], activePageId: "old", selectedBlockId: "old" });
    expect(applySharedCanvas(incoming, () => true)).toBe(true);
    expect(useBuilder.getState()).toMatchObject({ blocks: incoming.blocks, pages: [], activePageId: null, activeTemplateId: null, selectedBlockId: null });
  });

  it("clears saved layout, dataset, filters and color overrides on acceptance, preserving them for Undo", () => {
    const initial = useBuilder.getInitialState();
    const reportData = { id: "private", label: "Uploaded figures", baseCurrency: "GBP", tables: [] };
    useBuilder.setState({ blocks: [oldBlock], reportData, reportState: { account: "private" },
      colorOverrides: { accent: "#ff0000" }, hasOverrides: true,
      zoneLayouts: { ...initial.zoneLayouts, header: { ...initial.zoneLayouts.header, visible: false }, body: { mode: "stack", gap: 80 } },
    });
    const before = useBuilder.getState();
    const dispose = initBuilderHistory();
    try {
      applySharedCanvas(incoming, () => true);
      expect(useBuilder.getState()).toMatchObject({ zoneLayouts: initial.zoneLayouts, reportData: null, reportState: {}, colorOverrides: {}, hasOverrides: false });
      expect(undo()).toBe(true);
      expect(useBuilder.getState()).toMatchObject({ zoneLayouts: before.zoneLayouts, reportData, reportState: before.reportState, colorOverrides: before.colorOverrides, hasOverrides: true });
    } finally { dispose(); }
  });

  it("restores the previous canvas, pages and theme with Undo after acceptance", () => {
    useBuilder.setState({ blocks: [oldBlock], pages: [{ id: "old", name: "Old", body: [oldBlock] }], activePageId: "old" });
    const before = useBuilder.getState();
    const dispose = initBuilderHistory();
    try {
      applySharedCanvas(incoming, () => true);
      expect(undo()).toBe(true);
      expect(useBuilder.getState()).toMatchObject({
        blocks: before.blocks, pages: before.pages, activePageId: before.activePageId,
        designSystem: before.designSystem, mode: before.mode, density: before.density, themeKey: before.themeKey,
        deviceMode: before.deviceMode, canvasSpacing: before.canvasSpacing,
      });
    } finally { dispose(); }
  });

  it("applies the device and explicit shared theme after deriving the mode default", () => {
    applySharedCanvas({ ...incoming, designSystem: "carbon", mode: "dark", themeKey: "g90" }, () => true);
    expect(useBuilder.getState()).toMatchObject({ deviceMode: "mobile", designSystem: "carbon", mode: "dark", themeKey: "g90" });
  });

  it("keeps the mode's default theme for legacy links without a theme", () => {
    const store = useBuilder.getState();
    store.setDesignSystem(incoming.designSystem);
    store.setMode(incoming.mode);
    const expectedTheme = useBuilder.getState().themeKey;
    useBuilder.setState({ themeKey: "g90" });
    applySharedCanvas(incoming, () => true);
    expect(useBuilder.getState().themeKey).toBe(expectedTheme);
  });
});
