/* ════════════════════════════════════════════════════════════
   shareState — Phase 2: multi-page share links (v:1 | v:2).
   ════════════════════════════════════════════════════════════
   Lazy-additive (owner decision 2026-06-07): a single-page canvas
   still encodes as v:1 (byte-identical to today); only a genuinely
   multi-page canvas encodes as v:2 with pages + activePageId. v:1
   links stay evergreen. Pins: build picks the right version, v:2
   round-trips, v:1 single-page still decodes, and a stale activePageId
   in a v:2 link falls back to the first page rather than crashing.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach } from "vitest";
import { encodeShareState, decodeShareState, buildSharedCanvas } from "@/lib/shareState";
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

describe("buildSharedCanvas — lazy v:1 / v:2", () => {
  beforeEach(() => {
    reset([card("c1")], [nav("nav-overview", "Overview", true), nav("nav-events", "Events")]);
  });

  it("single-page canvas builds a v:1 payload (no pages) — byte-identical to legacy", () => {
    const sc = buildSharedCanvas(useBuilder.getState());
    expect(sc.v).toBe(1);
    expect("pages" in sc).toBe(false);
    expect(sc.blocks).toEqual([card("c1")]);
  });

  it("v:1 payload serializes byte-identically to the legacy key order (stable hash)", () => {
    /* The lazy-additive guarantee: a single-page canvas must encode to the SAME
       hash as before Phase 2. JSON.stringify preserves insertion order, so the
       v:1 return must keep the legacy key order (blocks BEFORE footerBlocks). */
    const s = useBuilder.getState();
    const legacy = {
      v: 1,
      designSystem: s.designSystem, mode: s.mode, density: s.density, canvasSpacing: s.canvasSpacing,
      deviceMode: s.deviceMode, themeKey: s.themeKey, activeTemplateId: s.activeTemplateId,
      headerBlocks: s.headerBlocks, sidebarBlocks: s.sidebarBlocks,
      blocks: s.blocks, footerBlocks: s.footerBlocks,
    };
    const sc = buildSharedCanvas(s);
    expect(JSON.stringify(sc)).toBe(JSON.stringify(legacy));
    expect(encodeShareState(sc)).toBe(encodeShareState(legacy as never));
  });

  it("multi-page canvas builds a v:2 payload with flushed pages + activePageId", () => {
    useBuilder.getState().openNavPage("nav-events", "Events");
    useBuilder.getState().setBlocks([card("e1")]); // edit events; pages copy is stale until flush
    const sc = buildSharedCanvas(useBuilder.getState());
    expect(sc.v).toBe(2);
    expect(sc.activePageId).toBe("nav-events");
    expect(sc.pages).toHaveLength(2);
    expect(sc.pages?.find((p) => p.id === "nav-events")?.body).toEqual([card("e1")]); // flushed
    expect(sc.blocks).toEqual([card("e1")]); // active body mirrored for v:1 readers
  });
});

describe("shareState round-trips", () => {
  beforeEach(() => {
    reset([card("c1")], [nav("nav-overview", "Overview", true), nav("nav-events", "Events")]);
  });

  it("v:2 link round-trips pages + activePageId", () => {
    useBuilder.getState().openNavPage("nav-events", "Events");
    useBuilder.getState().setBlocks([card("e1")]);
    const back = decodeShareState(encodeShareState(buildSharedCanvas(useBuilder.getState())));
    expect(back).not.toBeNull();
    expect(back!.v).toBe(2);
    expect(back!.activePageId).toBe("nav-events");
    expect(back!.pages).toHaveLength(2);
    expect(back!.pages?.find((p) => p.id === "nav-overview")?.body).toEqual([card("c1")]);
  });

  it("v:1 single-page link still decodes (no pages, blocks intact)", () => {
    const back = decodeShareState(encodeShareState(buildSharedCanvas(useBuilder.getState())));
    expect(back).not.toBeNull();
    expect(back!.v).toBe(1);
    expect(back!.pages).toBeUndefined();
    expect(back!.blocks).toEqual([card("c1")]);
  });

  it("v:2 link with a stale activePageId falls back to the first page (no crash)", () => {
    const forged = encodeShareState({
      v: 2,
      designSystem: "salt",
      mode: "dark",
      density: "medium",
      canvasSpacing: "tight",
      deviceMode: "desktop",
      themeKey: null,
      activeTemplateId: null,
      headerBlocks: [],
      sidebarBlocks: [],
      blocks: [],
      footerBlocks: [],
      pages: [{ id: "nav-overview", name: "Overview", body: [card("c1")] }],
      activePageId: "ghost-page",
    });
    const back = decodeShareState(forged);
    expect(back).not.toBeNull();
    expect(back!.activePageId).toBe("nav-overview");
  });
});
