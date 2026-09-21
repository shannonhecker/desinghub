import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import type { Block } from "@/store/useBuilder";
import { buildCanvasExportJson, canvasJsonFilename, copyShareLink } from "../canvasHandoff";

const nav = (id: string, label: string, active = false): Block =>
  ({ id, type: "NavItem", props: { label, icon: "home", active } });
const card = (id: string, title = id): Block => ({ id, type: "SimulatedCard", props: { title } });

function reset(blocks: Block[], sidebar: Block[]) {
  useBuilder.setState({
    blocks,
    sidebarBlocks: sidebar,
    headerBlocks: [card("h1")],
    footerBlocks: [card("f1")],
    pages: [],
    activePageId: null,
    previewKey: 0,
    messages: [{ id: "m1", role: "user", content: "secret chat", timestamp: 0 }],
  } as never);
}

describe("buildCanvasExportJson — one payload for every Download JSON surface", () => {
  beforeEach(() => {
    reset([card("c1")], [nav("nav-overview", "Overview", true), nav("nav-events", "Events")]);
  });

  it("includes every zone + layouts, and never the chat transcript", () => {
    const json = buildCanvasExportJson(useBuilder.getState(), new Date("2026-01-01T00:00:00Z"));
    expect(json.blocks).toEqual([card("c1")]);
    expect(json.headerBlocks).toEqual([card("h1")]);
    expect(json.sidebarBlocks).toHaveLength(2);
    expect(json.footerBlocks).toEqual([card("f1")]);
    expect(json.zoneLayouts).toBe(useBuilder.getState().zoneLayouts);
    expect(json.generatedAt).toBe("2026-01-01T00:00:00.000Z");
    expect("messages" in json).toBe(false);
    expect("pages" in json).toBe(false);
  });

  it("multi-page canvases carry pages (flushed) + activePageId; blocks mirrors the active page", () => {
    useBuilder.getState().openNavPage("nav-events", "Events");
    useBuilder.getState().setBlocks([card("e1")]);
    const json = buildCanvasExportJson(useBuilder.getState());
    expect(json.activePageId).toBe("nav-events");
    expect(json.pages).toHaveLength(2);
    expect(json.pages?.find((p) => p.id === "nav-events")?.body).toEqual([card("e1")]);
    expect(json.blocks).toEqual([card("e1")]);
  });

  it("filename encodes interface type + DS", () => {
    expect(canvasJsonFilename({ interfaceType: "dashboard", designSystem: "carbon" })).toBe(
      "dashboard-carbon-canvas.json",
    );
  });
});

describe("copyShareLink — shared by the Export menu and the Present bar", () => {
  const realClipboard = navigator.clipboard;
  beforeEach(() => {
    reset([card("c1")], [nav("nav-overview", "Overview", true)]);
  });
  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", { value: realClipboard, configurable: true });
  });

  it("copies a /preview/share/<hash> URL and reports copied", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    expect(await copyShareLink()).toBe("copied");
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toMatch(/\/preview\/share\/[A-Za-z0-9_~$+-]+$/);
  });

  it("reports error when the clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
      configurable: true,
    });
    expect(await copyShareLink()).toBe("error");
  });

  it("reports too-long for a canvas that overflows the URL budget (and never touches the clipboard)", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    /* Incompressible labels so LZ can't squeeze the payload under the cap. */
    const noise = () => Array.from({ length: 600 }, () => String.fromCharCode(33 + Math.floor(Math.random() * 90))).join("");
    useBuilder.getState().setBlocks(Array.from({ length: 40 }, (_, i) => card(`b${i}`, noise())));
    expect(await copyShareLink()).toBe("too-long");
    expect(writeText).not.toHaveBeenCalled();
  });
});
