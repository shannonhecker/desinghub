/* ════════════════════════════════════════════════════════════
   Phase E2, Hover-inspector verification tests
   2026-05-29 builder UX cleanup PR.

   Pins the structural + behavioural decisions made in E2 so a
   future refactor cannot silently regress them. Mix of:
     - Runtime tests on the useInspectorPin Zustand store
       (defaults, setHover/pin/unpin/clear semantics).
     - Source-pinning tests on HoverInspector.tsx, SortableBlock.tsx,
       BuilderApp.tsx, and builder.css to assert the hover delay,
       reduce-motion handling, hover vs. pin token usage, sidebar
       gate, Esc/click-outside unpin wiring, and the shared
       isEditableTarget input guard.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { useInspectorPin } from "@/store/useInspectorPin";

const builderDir = join(process.cwd(), "src", "components", "builder");
const storeDir = join(process.cwd(), "src", "store");

const hoverInspectorSrc = readFileSync(join(builderDir, "HoverInspector.tsx"), "utf8");
const sortableBlockSrc = readFileSync(join(builderDir, "SortableBlock.tsx"), "utf8");
const builderAppSrc = readFileSync(join(builderDir, "BuilderApp.tsx"), "utf8");
const builderCss = readFileSync(join(builderDir, "builder.css"), "utf8");
const inspectorStoreSrc = readFileSync(join(storeDir, "useInspectorPin.ts"), "utf8");

function resetStore() {
  useInspectorPin.setState({ hoveredBlockId: null, pinnedBlockId: null });
}

describe("useInspectorPin store", () => {
  beforeEach(resetStore);

  it("defaults to {hoveredBlockId: null, pinnedBlockId: null}", () => {
    const s = useInspectorPin.getState();
    expect(s.hoveredBlockId).toBeNull();
    expect(s.pinnedBlockId).toBeNull();
  });

  it("setHover('a') sets only hoveredBlockId", () => {
    useInspectorPin.getState().setHover("a");
    const s = useInspectorPin.getState();
    expect(s.hoveredBlockId).toBe("a");
    expect(s.pinnedBlockId).toBeNull();
  });

  it("pin('a') sets both hovered and pinned to 'a' so inspector reads as active", () => {
    useInspectorPin.getState().pin("a");
    const s = useInspectorPin.getState();
    expect(s.hoveredBlockId).toBe("a");
    expect(s.pinnedBlockId).toBe("a");
  });

  it("setHover('a') -> pin('a') -> setHover('b') keeps pinnedBlockId 'a' and updates hover to 'b'", () => {
    const api = useInspectorPin.getState();
    api.setHover("a");
    api.pin("a");
    api.setHover("b");
    const s = useInspectorPin.getState();
    expect(s.pinnedBlockId).toBe("a");
    expect(s.hoveredBlockId).toBe("b");
  });

  it("unpin() clears pinnedBlockId, keeps hoveredBlockId", () => {
    const api = useInspectorPin.getState();
    api.setHover("a");
    api.pin("a");
    api.unpin();
    const s = useInspectorPin.getState();
    expect(s.pinnedBlockId).toBeNull();
    expect(s.hoveredBlockId).toBe("a");
  });

  it("clear() resets both hovered and pinned", () => {
    const api = useInspectorPin.getState();
    api.setHover("a");
    api.pin("a");
    api.clear();
    const s = useInspectorPin.getState();
    expect(s.hoveredBlockId).toBeNull();
    expect(s.pinnedBlockId).toBeNull();
  });

  it("exposes the documented action surface", () => {
    expect(inspectorStoreSrc).toMatch(/setHover:\s*\(id:\s*string\s*\|\s*null\)\s*=>\s*void/);
    expect(inspectorStoreSrc).toMatch(/pin:\s*\(id:\s*string\)\s*=>\s*void/);
    expect(inspectorStoreSrc).toMatch(/unpin:\s*\(\)\s*=>\s*void/);
    expect(inspectorStoreSrc).toMatch(/clear:\s*\(\)\s*=>\s*void/);
  });
});

describe("HoverInspector source — hover delay, reduce-motion, sidebar gate", () => {
  it("declares the 80ms hover-reveal delay (HOVER_DELAY_MS constant)", () => {
    expect(hoverInspectorSrc).toMatch(/HOVER_DELAY_MS\s*=\s*80/);
  });

  it("reads useInspectorPin for hovered + pinned state", () => {
    expect(hoverInspectorSrc).toContain('from "@/store/useInspectorPin"');
    expect(hoverInspectorSrc).toMatch(/useInspectorPin\(\(s\)\s*=>\s*s\.hoveredBlockId\)/);
    expect(hoverInspectorSrc).toMatch(/useInspectorPin\(\(s\)\s*=>\s*s\.pinnedBlockId\)/);
  });

  it("handles prefers-reduced-motion (matchMedia listener)", () => {
    expect(hoverInspectorSrc).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(hoverInspectorSrc).toMatch(/matchMedia/);
  });

  it("bails out (returns null) when zone === 'sidebar'", () => {
    expect(hoverInspectorSrc).toMatch(/zone\s*===\s*"sidebar"[\s\S]*return null/);
  });

  it("bails out (returns null) when usePreviewMode.mode === 'preview'", () => {
    expect(hoverInspectorSrc).toContain('from "@/store/usePreviewMode"');
    expect(hoverInspectorSrc).toMatch(/mode\s*===\s*"preview"[\s\S]*return null/);
  });

  it("emits distinct wrapper classes for hover vs pin states", () => {
    expect(hoverInspectorSrc).toMatch(/is-pinned/);
    expect(hoverInspectorSrc).toMatch(/is-hovered/);
  });

  it("renders 4 corner badges only when pinned", () => {
    expect(hoverInspectorSrc).toMatch(/hover-inspector-corner--tl/);
    expect(hoverInspectorSrc).toMatch(/hover-inspector-corner--tr/);
    expect(hoverInspectorSrc).toMatch(/hover-inspector-corner--bl/);
    expect(hoverInspectorSrc).toMatch(/hover-inspector-corner--br/);
  });
});

describe("SortableBlock wires pointer + click into useInspectorPin", () => {
  it("imports HoverInspector and useInspectorPin", () => {
    expect(sortableBlockSrc).toContain('from "./HoverInspector"');
    expect(sortableBlockSrc).toContain('from "@/store/useInspectorPin"');
  });

  it("attaches onPointerEnter / onPointerLeave handlers on the block root", () => {
    expect(sortableBlockSrc).toMatch(/onPointerEnter=\{handlePointerEnter\}/);
    expect(sortableBlockSrc).toMatch(/onPointerLeave=\{handlePointerLeave\}/);
  });

  it("attaches an onClick handler that pins via useInspectorPin", () => {
    expect(sortableBlockSrc).toMatch(/onClick=\{handleClick\}/);
    expect(sortableBlockSrc).toMatch(/pinInspector\(id\)/);
  });

  it("pointer handlers bail out on sidebar zone (mirrors HoverInspector internal gate)", () => {
    expect(sortableBlockSrc).toMatch(/handlePointerEnter[\s\S]*?zone === "sidebar"[\s\S]*?return/);
    expect(sortableBlockSrc).toMatch(/handlePointerLeave[\s\S]*?zone === "sidebar"[\s\S]*?return/);
    expect(sortableBlockSrc).toMatch(/handleClick[\s\S]*?zone === "sidebar"[\s\S]*?return/);
  });

  it("forwards the dnd-kit drag activator into HoverInspector via dragHandleRef + dragListeners", () => {
    expect(sortableBlockSrc).toMatch(/dragHandleRef=\{setActivatorNodeRef\}/);
    expect(sortableBlockSrc).toMatch(/dragListeners=/);
  });
});

describe("BuilderApp wires Esc + click-outside to useInspectorPin.unpin", () => {
  it("imports useInspectorPin", () => {
    expect(builderAppSrc).toContain('from "@/store/useInspectorPin"');
  });

  it("Esc handler calls useInspectorPin.getState().unpin() when a pin exists", () => {
    expect(builderAppSrc).toMatch(/useInspectorPin\.getState\(\)/);
    expect(builderAppSrc).toMatch(/pinnedBlockId\s*!=\s*null/);
    expect(builderAppSrc).toMatch(/\.unpin\(\)/);
  });

  it("Esc handler reuses isEditableTarget so it doesn't steal keystrokes from inputs", () => {
    expect(builderAppSrc).toMatch(
      /import\s*\{[^}]*\bisEditableTarget\b[^}]*\}\s*from\s*["']@\/lib\/useBuilderShortcuts["']/,
    );
    expect(builderAppSrc).toMatch(/isEditableTarget\s*\(\s*t\s*\)/);
  });

  it("click-outside (pointerdown not inside [data-block-id]) unpins", () => {
    expect(builderAppSrc).toMatch(/pointerdown/);
    expect(builderAppSrc).toMatch(/closest\("\[data-block-id\]"\)/);
  });
});

describe("builder.css ships hover-inspector visual rules", () => {
  it("references --bc-border for the hover-state outline", () => {
    const match = builderCss.match(
      /\.hover-inspector\.is-hovered\s+\.hover-inspector-outline\s*\{([\s\S]*?)\n\}/,
    );
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/var\(--bc-border\)/);
    expect(match![1]).toMatch(/dashed/);
    expect(match![1]).toMatch(/1px/);
  });

  it("references --builder-selection-color for the pinned-state outline", () => {
    const match = builderCss.match(
      /\.hover-inspector\.is-pinned\s+\.hover-inspector-outline\s*\{([\s\S]*?)\n\}/,
    );
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(/var\(--builder-selection-color\)/);
    expect(match![1]).toMatch(/solid/);
  });

  it("declares 4 corner badge selectors (tl/tr/bl/br) with sharp ≤6px size", () => {
    expect(builderCss).toMatch(/\.hover-inspector-corner--tl/);
    expect(builderCss).toMatch(/\.hover-inspector-corner--tr/);
    expect(builderCss).toMatch(/\.hover-inspector-corner--bl/);
    expect(builderCss).toMatch(/\.hover-inspector-corner--br/);
    const corner = builderCss.match(/\.hover-inspector-corner\s*\{([\s\S]*?)\n\}/);
    expect(corner).not.toBeNull();
    expect(corner![1]).toMatch(/width:\s*6px/);
    expect(corner![1]).toMatch(/height:\s*6px/);
  });

  it("hover-inspector entrance transition honours prefers-reduced-motion", () => {
    expect(builderCss).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.hover-inspector\s*\{[\s\S]*?animation:\s*none/,
    );
  });

  it("preview-mode chrome gate suppresses .hover-inspector entirely", () => {
    expect(builderCss).toMatch(
      /\[data-builder-mode="preview"\][^{]*\.hover-inspector[\s\S]*?display:\s*none/,
    );
  });

  it("sidebar zone belt-and-braces gate suppresses .hover-inspector", () => {
    expect(builderCss).toMatch(
      /\.canvas-block\[data-zone="sidebar"\][^{]*\.hover-inspector[\s\S]*?display:\s*none/,
    );
  });
});
