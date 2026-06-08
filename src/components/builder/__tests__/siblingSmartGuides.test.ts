/* ════════════════════════════════════════════════════════════
   Sibling smart-guides (P7) — wiring + chrome contract.
   ════════════════════════════════════════════════════════════
   The builder canvas can't render in jsdom (dnd-kit + portals +
   getBoundingClientRect), so — following scrubNumberField.test.ts —
   we assert the source-level contract: the resize handle samples
   sibling rects, drives the snap decision through the pure
   computeSiblingSnap core, renders a guide per aligned reference,
   and the guide is a token-coloured chrome layer that is hidden in
   preview mode (no leakage into rendered output / exports).
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), "src", "components", "builder");
const sb = readFileSync(join(dir, "SortableBlock.tsx"), "utf8");
const css = readFileSync(join(dir, "builder.css"), "utf8");
const tokens = readFileSync(join(dir, "chrome-tokens.css"), "utf8");

describe("SortableBlock wires sibling smart-guides", () => {
  it("drives the snap decision through the pure computeSiblingSnap core", () => {
    expect(sb).toMatch(/import\s*\{[^}]*computeSiblingSnap[^}]*\}\s*from\s*["']@\/lib\/siblingSnap["']/);
    expect(sb).toMatch(/computeSiblingSnap\(/);
  });

  it("samples sibling rects from the same zone at pointer-down", () => {
    // Mirrors MarqueeLayer: query data-block-id within the zone container.
    expect(sb).toMatch(/querySelectorAll/);
    expect(sb).toMatch(/data-block-id/);
  });

  it("renders one guide per aligned reference (array, not a single line)", () => {
    expect(sb).toMatch(/bc-sibling-guide/);
    // The guides come back as an array → must be mapped, not rendered once.
    expect(sb).toMatch(/siblingGuides/);
    expect(sb).toMatch(/\.map\(/);
  });

  it("is pointer-only: keyboard arrow-resize must NOT invoke sibling snap", () => {
    // computeSiblingSnap is layered in the pointer move path, never inside
    // applyWidth (which handleKeyDown reuses). Guard: the call sits after a
    // pointer reference, and applyWidth itself stays free of it.
    const applyWidthBody = sb.slice(
      sb.indexOf("const applyWidth = useCallback"),
      sb.indexOf("const resolveWidthToPx = useCallback"),
    );
    expect(applyWidthBody).not.toMatch(/computeSiblingSnap/);
  });
});

describe("Sibling guide chrome is token-coloured and preview-hidden", () => {
  it("defines a distinct sibling-guide token (not the blue accent guide)", () => {
    expect(tokens).toMatch(/--bc-guide-sibling\s*:/);
  });

  it("colours the guide via the token — no raw hex in the rule", () => {
    expect(css).toMatch(/\.bc-sibling-guide\b/);
    expect(css).toMatch(/background:\s*var\(--bc-guide-sibling\)/);
  });

  it("hides the guide in preview mode (no leakage into rendered output)", () => {
    expect(css).toMatch(/\[data-builder-mode="preview"\]\s*\.bc-sibling-guide/);
  });
});
