import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder } from "../useBuilder";
import type { Block } from "../useBuilder";

const nav = (id: string, label: string, active = false): Block =>
  ({ id, type: "NavItem", props: { label, icon: "home", active } });
const card = (id: string): Block => ({ id, type: "SimulatedCard", props: { title: id } });

function reset(blocks: Block[], sidebar: Block[]) {
  useBuilder.setState({
    blocks,
    sidebarBlocks: sidebar,
    headerBlocks: [],
    footerBlocks: [],
    pages: [],
    activePageId: null,
    previewKey: 0,
  } as never);
}

describe("useBuilder — multi-page pages (Phase 1)", () => {
  beforeEach(() => {
    reset([card("c1")], [nav("nav-overview", "Overview", true), nav("nav-events", "Events")]);
  });

  it("openNavPage to a NEW nav seeds the current canvas as the active nav's page and switches to a fresh empty page", () => {
    useBuilder.getState().openNavPage("nav-events", "Events");
    const s = useBuilder.getState();
    expect(s.activePageId).toBe("nav-events");
    expect(s.blocks).toEqual([]); // the new page starts empty for authoring
    const overview = s.pages.find((p) => p.id === "nav-overview");
    expect(overview?.body).toEqual([card("c1")]); // original canvas saved under the active nav's page
  });

  it("switching back to the original nav restores its body", () => {
    useBuilder.getState().openNavPage("nav-events", "Events");
    useBuilder.getState().openNavPage("nav-overview", "Overview");
    expect(useBuilder.getState().blocks).toEqual([card("c1")]);
  });

  it("per-page body edits persist across a switch away and back", () => {
    useBuilder.getState().openNavPage("nav-events", "Events");
    useBuilder.getState().setBlocks([card("e1")]); // author the Events page
    useBuilder.getState().openNavPage("nav-overview", "Overview");
    expect(useBuilder.getState().blocks).toEqual([card("c1")]);
    useBuilder.getState().openNavPage("nav-events", "Events");
    expect(useBuilder.getState().blocks).toEqual([card("e1")]); // Events edits preserved
  });

  it("opening the already-active page is a no-op (does not wipe the body)", () => {
    useBuilder.getState().openNavPage("nav-overview", "Overview"); // active after seed
    expect(useBuilder.getState().blocks).toEqual([card("c1")]);
  });

  it("setActivePage bumps previewKey so the canvas re-renders on a page switch", () => {
    const before = useBuilder.getState().previewKey;
    useBuilder.getState().openNavPage("nav-events", "Events");
    expect(useBuilder.getState().previewKey).toBeGreaterThan(before);
  });
});
