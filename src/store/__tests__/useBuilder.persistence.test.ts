import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder, flushActiveBody, isMultiPage } from "../useBuilder";
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

describe("flushActiveBody — persistence helper", () => {
  beforeEach(() => {
    reset([card("c1")], [nav("nav-overview", "Overview", true), nav("nav-events", "Events")]);
  });

  it("seeds a single-page canvas and syncs the live `blocks` into the active page body", () => {
    const { pages, activePageId } = flushActiveBody(useBuilder.getState());
    expect(activePageId).toBe("nav-overview");
    expect(pages).toHaveLength(1);
    expect(pages[0].body).toEqual([card("c1")]);
  });

  it("captures the active page's IN-PROGRESS body (not the stale pages copy) and preserves other pages", () => {
    useBuilder.getState().openNavPage("nav-events", "Events"); // overview body saved, events empty + active
    useBuilder.getState().setBlocks([card("e1"), card("e2")]); // edit events; pages[events].body is now STALE
    const { pages, activePageId } = flushActiveBody(useBuilder.getState());
    expect(activePageId).toBe("nav-events");
    expect(pages.find((p) => p.id === "nav-events")?.body).toEqual([card("e1"), card("e2")]); // live edits flushed
    expect(pages.find((p) => p.id === "nav-overview")?.body).toEqual([card("c1")]); // untouched page preserved
  });
});

describe("isMultiPage — persistence predicate", () => {
  beforeEach(() => {
    reset([card("c1")], [nav("nav-overview", "Overview", true), nav("nav-events", "Events")]);
  });

  it("is false for a single-page canvas (stays byte-identical to legacy schema)", () => {
    const { pages } = flushActiveBody(useBuilder.getState());
    expect(isMultiPage(pages)).toBe(false);
  });

  it("is true once the user has split into a second page", () => {
    useBuilder.getState().openNavPage("nav-events", "Events");
    const { pages } = flushActiveBody(useBuilder.getState());
    expect(isMultiPage(pages)).toBe(true);
  });
});
