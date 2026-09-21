import { describe, it, expect, beforeEach } from "vitest";
import { buildLocalSessionSnapshot, restoreLocalSession } from "../localSession";
import { useBuilder } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";

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
    currentSessionId: "sess-1",
    sessionTitle: "Test",
  } as never);
}

describe("buildLocalSessionSnapshot — local-first multi-page persistence", () => {
  beforeEach(() => {
    reset([card("c1")], [nav("nav-overview", "Overview", true), nav("nav-events", "Events")]);
  });

  it("single-page canvas: snapshot stays byte-identical to legacy (no pages/activePageId keys)", () => {
    const snap = buildLocalSessionSnapshot(useBuilder.getState());
    expect(snap.blocks).toEqual([card("c1")]);
    expect("pages" in snap).toBe(false);
    expect("activePageId" in snap).toBe(false);
  });

  it("multi-page canvas: snapshot carries pages (flushed active body) + activePageId", () => {
    useBuilder.getState().openNavPage("nav-events", "Events");
    useBuilder.getState().setBlocks([card("e1")]); // pages[events].body is stale until flush
    const snap = buildLocalSessionSnapshot(useBuilder.getState());
    expect(snap.activePageId).toBe("nav-events");
    expect(snap.pages).toHaveLength(2);
    expect(snap.pages?.find((p) => p.id === "nav-events")?.body).toEqual([card("e1")]);
    expect(snap.pages?.find((p) => p.id === "nav-overview")?.body).toEqual([card("c1")]);
    expect(snap.blocks).toEqual([card("e1")]);
  });
});

describe("restoreLocalSession — round trip", () => {
  beforeEach(() => {
    reset([card("c1")], [nav("nav-overview", "Overview", true), nav("nav-events", "Events")]);
  });

  it("a multi-page session survives save → new session → restore (the bug: extra pages were dropped)", () => {
    useBuilder.getState().openNavPage("nav-events", "Events");
    useBuilder.getState().setBlocks([card("e1"), card("e2")]);
    const snapshot = buildLocalSessionSnapshot(useBuilder.getState());

    useBuilder.getState().startNewSession(); // wipes pages/blocks
    expect(useBuilder.getState().pages).toEqual([]);

    const ok = restoreLocalSession({ id: "sess-1", name: "Test", updatedAt: 123, snapshot });
    expect(ok).toBe(true);
    const s = useBuilder.getState();
    expect(s.pages).toHaveLength(2);
    expect(s.activePageId).toBe("nav-events");
    expect(s.blocks).toEqual([card("e1"), card("e2")]); // live mirror == active page body
    expect(s.pages.find((p) => p.id === "nav-overview")?.body).toEqual([card("c1")]);
    expect(s.currentSessionId).toBe("sess-1");
    expect(s.lastSavedAt).toBe(123);
    expect(s.saveState).toBe("saved");
  });

  it("a legacy single-page snapshot resets pages so a prior multi-page session can't leak in", () => {
    useBuilder.getState().openNavPage("nav-events", "Events");
    expect(useBuilder.getState().pages.length).toBeGreaterThan(1);

    const ok = restoreLocalSession({
      id: "sess-2",
      name: "Legacy",
      updatedAt: 1,
      snapshot: {
        messages: [],
        blocks: [card("legacy")],
        designSystem: "salt",
        mode: "dark",
        density: "medium",
        interfaceType: "dashboard",
        selectedComponents: [],
        colorOverrides: {},
      },
    });
    expect(ok).toBe(true);
    const s = useBuilder.getState();
    expect(s.pages).toEqual([]);
    expect(s.activePageId).toBeNull();
    expect(s.blocks).toEqual([card("legacy")]);
  });

  it("a malformed snapshot never crashes the builder: surfaces saveError, leaves the canvas alone", () => {
    const before = useBuilder.getState().blocks;
    const ok = restoreLocalSession({
      id: "bad",
      name: "Bad",
      updatedAt: 1,
      // `pages` is not an array → pagesRestoreFromSnapshot throws inside the guarded restore
      snapshot: { blocks: [], pages: { nope: true } } as never,
    });
    expect(ok).toBe(false);
    const s = useBuilder.getState();
    expect(s.blocks).toBe(before);
    expect(s.saveState).toBe("error");
    expect(s.saveError).toMatch(/older version/);
  });
});
