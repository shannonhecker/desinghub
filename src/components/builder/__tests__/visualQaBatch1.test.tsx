/* ════════════════════════════════════════════════════════════
   Visual QA batch 1 (owner-reported) — behavioural pins.

   1. Hero scrollbar leak: .chat-scroll must clip the x-axis
      (overflow-y:auto alone computes overflow-x:auto, painting a
      stray horizontal scrollbar thumb above the composer).
   2. Stat-card bar inset: Salt preview LinearProgress pinned to
      the card's content width.
   3. Grid insertion slots must not consume column tracks
      (template scope-bar / KPI rows collapsed at every width).
   4. Form-control defaults: checkbox + toggle blocks hug content
      instead of stretching full width.
   5. Inspector quick-win order: component properties first;
      Auto layout collapsed + container-only controls hidden for
      leaf blocks.

   No RTL in the repo — react-dom/client + act(), matching
   toolUseEventCard.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { act } from "react";
import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DndContext } from "@dnd-kit/core";

import { defaultLayoutForType } from "@/lib/blockLayoutDefaults";
import { computeItemStyle } from "@/lib/layoutResolver";
import { useBuilder, type Block } from "@/store/useBuilder";
import { ZoneDropContainer } from "../ZoneDropContainer";
import { ComponentLibrary } from "../ComponentLibrary";

/* jsdom lacks ResizeObserver / matchMedia; Salt + MUI inspector field
   controls (DsInspectorControls) need both at mount. */
class RO {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as Record<string, unknown>).ResizeObserver ??= RO;
(globalThis as { matchMedia?: unknown }).matchMedia ??= (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
  dispatchEvent() { return false; },
});

const css = readFileSync(
  join(process.cwd(), "src", "components", "builder", "builder.css"),
  "utf8",
);

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function render(node: React.ReactElement): HTMLElement {
  container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(node);
  });
  return container;
}

afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
  container?.remove();
  container = null;
  sessionStorage.clear();
});

/* ── 1. Hero scrollbar leak (CSS pin) ── */
describe("bug 1: chat hero horizontal scrollbar leak", () => {
  it(".chat-scroll clips the x axis", () => {
    /* Match the scroll-container rule (the one with overflow-y), not the
       earlier scroll-padding one-liner. */
    const rules = css.match(/\.chat-scroll \{[^}]+\}/g) ?? [];
    const rule = rules.find((r) => /overflow-y:\s*auto/.test(r)) ?? "";
    expect(rule).toMatch(/overflow-y:\s*auto/);
    expect(rule).toMatch(/overflow-x:\s*hidden/);
  });

  it("starter chips are contained to the card width", () => {
    const rule = css.match(/\.prompt-bubble \{[^}]+\}/)?.[0] ?? "";
    expect(rule).toMatch(/max-width:\s*100%/);
  });

  it("docked hero rhythm: chips block and setup links get breathing room", () => {
    expect(css).toMatch(/\.hero-greeting \.hero-starter-chips \{ margin-top: 12px; \}/);
    expect(css).toMatch(/\.hero-greeting \.hero-setup-links \{ margin-top: 16px; \}/);
  });
});

/* ── 3. Grid insertion slots ── */
describe("bug 3: insertion slots must not consume grid tracks", () => {
  const blocks: Block[] = [
    { id: "a", type: "SimulatedTitle", props: {} },
    { id: "b", type: "SimulatedDropdown", props: {} },
    { id: "c", type: "SimulatedButton", props: {} },
  ];
  const children = blocks.map((b) => <div key={b.id} data-testid={b.id} />);

  it("grid zones render only the trailing append slot", () => {
    const c = render(
      <DndContext>
        <ZoneDropContainer zoneId="body" blocks={blocks} zoneLayout={{ mode: "grid", columns: 12, gap: 12 }}>
          {children}
        </ZoneDropContainer>
      </DndContext>,
    );
    const slots = c.querySelectorAll(".insertion-slot");
    expect(slots.length).toBe(1);
    expect(slots[0].getAttribute("data-index")).toBe("3");
    /* The append slot must be the LAST child so the full-row CSS span
       (.zone-grid > .insertion-slot-horizontal) never displaces blocks. */
    const zone = c.querySelector(".zone-grid")!;
    expect(zone.lastElementChild!.classList.contains("insertion-slot")).toBe(true);
  });

  it("row zones keep the interleaved per-index slots", () => {
    const c = render(
      <DndContext>
        <ZoneDropContainer zoneId="body" blocks={blocks} zoneLayout={{ mode: "row", gap: 12 }}>
          {children}
        </ZoneDropContainer>
      </DndContext>,
    );
    expect(c.querySelectorAll(".insertion-slot").length).toBe(4);
  });

  it("grid append slot spans the full row via CSS", () => {
    expect(css).toMatch(/\.zone-grid > \.insertion-slot-horizontal \{\s*grid-column: 1 \/ -1;/);
  });

  it("narrow grid bodies re-span canonical widths via container query", () => {
    expect(css).toMatch(/@container zone-body-grid \(max-width: 640px\)/);
    expect(css).toMatch(/grid-column: span 3;"\] \{ grid-column: span 6 !important; \}/);
    expect(css).toMatch(/grid-column: span 6;"\] \{ grid-column: span 12 !important; \}/);
  });
});

/* ── 4. Form-control defaults ── */
describe("bug 4: checkbox/toggle blocks default to content-hug", () => {
  it("defines hug defaults for selection controls only", () => {
    for (const t of ["SimulatedCheckbox", "SimulatedSwitch", "SimulatedToggleButton"]) {
      expect(defaultLayoutForType(t)).toEqual({ width: "auto", align: "start" });
    }
    expect(defaultLayoutForType("SimulatedButton")).toBeUndefined();
    expect(defaultLayoutForType("SimulatedTextInput")).toBeUndefined();
    expect(defaultLayoutForType("SimulatedCard")).toBeUndefined();
  });

  it("addBlockFromLibrary stamps the hug layout onto new checkbox blocks", () => {
    useBuilder.getState().addBlockFromLibrary("SimulatedCheckbox", { label: "x" }, "body");
    const s = useBuilder.getState();
    const blk = s.blocks[s.blocks.length - 1];
    expect(blk.type).toBe("SimulatedCheckbox");
    expect(blk.layout).toEqual({ width: "auto", align: "start" });
  });

  it("addBlockFromLibrary leaves other types unsized (container-driven)", () => {
    useBuilder.getState().addBlockFromLibrary("SimulatedTextInput", { label: "x" }, "body");
    const s = useBuilder.getState();
    const blk = s.blocks[s.blocks.length - 1];
    expect(blk.layout).toBeUndefined();
  });

  it("width:auto hugs in a row container (flex none)", () => {
    const blk: Block = { id: "x", type: "SimulatedCheckbox", props: {}, layout: { width: "auto", align: "start" } };
    const style = computeItemStyle(blk, { mode: "row", gap: 12 });
    expect(style.flex).toBe("0 0 auto");
    expect(style.width).toBe("auto");
  });

  it("width:auto hugs in a grid container (pinned to track start)", () => {
    const blk: Block = { id: "x", type: "SimulatedCheckbox", props: {}, layout: { width: "auto" } };
    const style = computeItemStyle(blk, { mode: "grid", columns: 12, gap: 12 });
    expect(style.justifySelf).toBe("start");
    expect(style.gridColumn).toBeUndefined();
  });
});

/* ── 5. Inspector quick-win order + leaf disclosure ── */
describe("bug 5: inspector order and leaf/container disclosure", () => {
  const checkbox: Block = { id: "cb1", type: "SimulatedCheckbox", props: { label: "Accept" } };
  const group: Block = { id: "g1", type: "LayoutGroup", props: { direction: "stack" }, children: [] };

  beforeEach(() => {
    sessionStorage.clear();
  });

  function seed(block: Block) {
    act(() => {
      useBuilder.setState({
        blocks: [block],
        headerBlocks: [],
        sidebarBlocks: [],
        footerBlocks: [],
        selectedBlockId: block.id,
        selectedBlockZone: "body",
      });
    });
  }

  function sectionTitles(c: HTMLElement): string[] {
    return [...c.querySelectorAll(".inspector-section-title-text")].map(
      (n) => n.textContent ?? "",
    );
  }

  it("component properties render FIRST, Size and Auto layout after", () => {
    seed(checkbox);
    const c = render(<ComponentLibrary />);
    const titles = sectionTitles(c);
    expect(titles[0]).toBe("Checkbox Properties");
    expect(titles.indexOf("Size")).toBeGreaterThan(0);
    expect(titles.indexOf("Auto layout")).toBeGreaterThan(titles.indexOf("Size"));
  });

  it("Auto layout is collapsed by default for LEAF blocks", () => {
    seed(checkbox);
    const c = render(<ComponentLibrary />);
    const head = [...c.querySelectorAll(".inspector-section-head")].find(
      (h) => h.textContent?.includes("Auto layout"),
    )!;
    expect(head.getAttribute("aria-expanded")).toBe("false");
    /* Collapsed → its body (Direction / Distribute) is not rendered. */
    expect(c.textContent).not.toContain("Distribute");
  });

  it("Auto layout opens by default for container blocks and keeps Distribute", () => {
    seed(group);
    const c = render(<ComponentLibrary />);
    const head = [...c.querySelectorAll(".inspector-section-head")].find(
      (h) => h.textContent?.includes("Auto layout"),
    )!;
    expect(head.getAttribute("aria-expanded")).toBe("true");
    expect(c.textContent).toContain("Distribute");
  });

  it("container-only Columns control is hidden for leaf blocks in grid zones", () => {
    act(() => {
      useBuilder.setState({
        zoneLayouts: { ...useBuilder.getState().zoneLayouts, body: { mode: "grid", columns: 12, gap: 12 } },
      });
    });
    seed(checkbox);
    const c = render(<ComponentLibrary />);
    /* Expand the (leaf-collapsed) Auto layout section. */
    const head = [...c.querySelectorAll(".inspector-section-head")].find(
      (h) => h.textContent?.includes("Auto layout"),
    )! as HTMLButtonElement;
    act(() => head.click());
    expect(c.textContent).toContain("Direction");
    expect(c.textContent).not.toContain("Columns");
    expect(c.textContent).not.toContain("Distribute");
  });
});
