import { describe, it, expect, beforeEach } from "vitest";
import { buildProjectSnapshot, createdAtForUpsert, pagesRestoreFromSnapshot } from "../firebase";
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
  } as never);
}

describe("buildProjectSnapshot — lazy-additive multi-page persistence", () => {
  beforeEach(() => {
    reset([card("c1")], [nav("nav-overview", "Overview", true), nav("nav-events", "Events")]);
  });

  it("single-page canvas: snapshot is byte-identical to legacy (no pages/activePageId keys)", () => {
    const snap = buildProjectSnapshot(useBuilder.getState());
    expect(snap.blocks).toEqual([card("c1")]);
    expect("pages" in snap).toBe(false);
    expect("activePageId" in snap).toBe(false);
  });

  it("multi-page canvas: snapshot gains pages (with flushed active body) + activePageId; blocks mirrors active body", () => {
    useBuilder.getState().openNavPage("nav-events", "Events");
    useBuilder.getState().setBlocks([card("e1")]); // edit Events; pages[events].body is stale until flush
    const snap = buildProjectSnapshot(useBuilder.getState());
    expect(snap.activePageId).toBe("nav-events");
    expect(snap.pages).toHaveLength(2);
    expect(snap.pages?.find((p) => p.id === "nav-events")?.body).toEqual([card("e1")]); // flushed, not stale
    expect(snap.pages?.find((p) => p.id === "nav-overview")?.body).toEqual([card("c1")]);
    expect(snap.blocks).toEqual([card("e1")]); // legacy blocks field mirrors the active page body
  });
});

describe("pagesRestoreFromSnapshot — load-side guard", () => {
  it("legacy snapshot without pages → null (single-page stays lazy, store untouched)", () => {
    expect(pagesRestoreFromSnapshot({ blocks: [card("c1")] })).toBeNull();
    expect(pagesRestoreFromSnapshot({ blocks: [card("c1")], pages: [] })).toBeNull();
  });

  it("multi-page snapshot → restores pages + activePageId", () => {
    const restore = pagesRestoreFromSnapshot({
      blocks: [card("e1")],
      activePageId: "nav-events",
      pages: [
        { id: "nav-overview", name: "Overview", body: [card("c1")] },
        { id: "nav-events", name: "Events", body: [card("e1")] },
      ],
    });
    expect(restore?.activePageId).toBe("nav-events");
    expect(restore?.pages).toHaveLength(2);
  });

  it("stale activePageId not present in pages → falls back to the first page", () => {
    const restore = pagesRestoreFromSnapshot({
      blocks: [],
      activePageId: "ghost-page",
      pages: [{ id: "nav-overview", name: "Overview", body: [card("c1")] }],
    });
    expect(restore?.activePageId).toBe("nav-overview");
  });
});

describe("createdAtForUpsert — first save of a new session", () => {
  const stored = { exists: () => true, data: () => ({ createdAt: "stored" }) };
  const missing = { exists: () => false, data: () => undefined };

  it("keeps the stored createdAt when the doc exists", async () => {
    expect(await createdAtForUpsert(async () => stored, "now")).toBe("stored");
  });

  it("stamps now when the doc does not exist", async () => {
    expect(await createdAtForUpsert(async () => missing, "now")).toBe("now");
  });

  /* The rules refuse a read of a missing doc (resource is null) instead of
     answering "not found"; that must not fail the save. */
  it("treats a permission-denied read as a missing doc", async () => {
    const denied = Object.assign(new Error("Missing or insufficient permissions."), { code: "permission-denied" });
    expect(await createdAtForUpsert(async () => { throw denied; }, "now")).toBe("now");
  });

  it("rethrows any other read failure", async () => {
    const offline = Object.assign(new Error("offline"), { code: "unavailable" });
    await expect(createdAtForUpsert(async () => { throw offline; }, "now")).rejects.toThrow("offline");
  });
});
