import { describe, it, expect } from "vitest";
import { buildCanvasManifest, summarizeBlock, MANIFEST_MAX_BLOCKS } from "../canvasManifest";
import { cleanHistoryForAPI } from "../cleanMessageHistory";
import type { Block, ZoneId, ZoneLayout } from "@/store/useBuilder";

const zoneLayouts: Record<ZoneId, ZoneLayout> = {
  body: { mode: "grid", columns: 4 },
  header: { mode: "row" },
  sidebar: { mode: "stack" },
  footer: { mode: "row" },
};

const b = (id: string, type: string, props: Record<string, unknown> = {}, extra: Partial<Block> = {}): Block => ({ id, type, props, ...extra });

describe("canvasManifest", () => {
  it("lists every zone in order with real ids, types, a label and the width", () => {
    const m = buildCanvasManifest({
      zoneLayouts,
      headerBlocks: [b("h1", "AppBrand", { label: "Acme" })],
      sidebarBlocks: [b("s1", "NavItem", { label: "Home", active: true })],
      blocks: [
        b("t1", "SimulatedTitle", { text: "Sales" }),
        b("k1", "SimulatedStatCard", { label: "MRR", value: "$48k" }, { layout: { width: "25%" } }),
        b("tb", "SimulatedDataTable", { title: "Orders", rows: [{}, {}, {}] }, { layout: { width: "fill" } }),
      ],
      footerBlocks: [],
    });
    expect(m.split("\n")).toEqual([
      "zones: header=row sidebar=stack body=grid/4 footer=row",
      'header: h1 AppBrand "Acme"',
      'sidebar: s1 NavItem "Home" active',
      'body: t1 SimulatedTitle "Sales" | k1 SimulatedStatCard "MRR" w=25% | tb SimulatedDataTable "Orders" 3 rows w=fill',
      "footer: (empty)",
    ]);
  });

  it("summaries never carry newlines and clip long labels", () => {
    const s = summarizeBlock(b("x", "SimulatedCard", { title: "Line one\nline two and a very long title that keeps going" }));
    expect(s).not.toMatch(/\n/);
    expect(s).toMatch(/^x SimulatedCard "Line one line two and a ver…"$/);
  });

  it("LayoutGroup children are listed with their ids so nested blocks are addressable", () => {
    const m = buildCanvasManifest({
      zoneLayouts,
      headerBlocks: [], sidebarBlocks: [], footerBlocks: [],
      blocks: [b("g1", "LayoutGroup", {}, { children: [b("c1", "SimulatedButton", { label: "Save" }), b("c2", "SimulatedButton", { label: "Cancel" })] })],
    });
    expect(m).toContain("body: g1 LayoutGroup [c1 SimulatedButton, c2 SimulatedButton]");
  });

  it("multi-page canvases list the pages and mark the active one", () => {
    const m = buildCanvasManifest({
      zoneLayouts, headerBlocks: [], sidebarBlocks: [], footerBlocks: [], blocks: [],
      pages: [{ id: "p1", name: "Home", body: [] }, { id: "p2", name: "Settings", body: [] }],
      activePageId: "p2",
    });
    expect(m).toContain('pages: p1 "Home", p2 "Settings" (active)');
  });

  it("is bounded: past the block cap it says how many were left out, and the char cap truncates cleanly", () => {
    const many = Array.from({ length: MANIFEST_MAX_BLOCKS + 5 }, (_, i) => b(`b${i}`, "SimulatedCard", { title: `Card ${i}` }));
    const m = buildCanvasManifest({ zoneLayouts, headerBlocks: [], sidebarBlocks: [], footerBlocks: [], blocks: many });
    expect(m).toContain("... +5 more blocks not listed");
    expect(m).toContain(`b${MANIFEST_MAX_BLOCKS - 1} SimulatedCard`);
    expect(m).not.toContain(`b${MANIFEST_MAX_BLOCKS} SimulatedCard`);

    const small = buildCanvasManifest({ zoneLayouts, headerBlocks: [], sidebarBlocks: [], footerBlocks: [], blocks: many }, { maxChars: 300 });
    expect(small.length).toBeLessThanOrEqual(300);
    expect(small).toMatch(/\.\.\. \(manifest truncated\)$/);
  });

  it("the prefix stripper still removes a [Current state: ...] block that carries the manifest", () => {
    const manifest = buildCanvasManifest({
      zoneLayouts, headerBlocks: [], sidebarBlocks: [], footerBlocks: [],
      blocks: [b("g1", "LayoutGroup", {}, { children: [b("c1", "SimulatedButton", { label: "Save [x]" })] })],
    });
    const content = `[Current state: design_system=salt, mode=dark\ncanvas=\n${manifest}]\n\nmove the table up`;
    const [cleaned] = cleanHistoryForAPI([{ id: "u1", role: "user", content, timestamp: 1 }]);
    expect(cleaned.content).toBe("move the table up");
  });
});
