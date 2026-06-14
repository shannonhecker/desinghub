/* ════════════════════════════════════════════════════════════
   AnatomyDiagram — UI-Kit "Specs ‣ Anatomy" primitive (M3 pilot).
   ════════════════════════════════════════════════════════════
   Renders a component schematic on a dotted-grid stage with numbered
   callout badges, a part legend, and dp measurement annotations —
   mirroring m3.material.io's component-anatomy section. The diagram is
   data-driven (parts + measures) and colour-free (skins from theme `t`)
   so the SAME primitive renders per-DS once each DS supplies its data.

   No RTL in the repo — uses react-dom/client + act() directly, matching
   codePanel.test.tsx / dsPreviewStylesHooks.test.tsx.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { AnatomyDiagram } from "../AnatomyDiagram";
import { COMPONENT_ANATOMY } from "@/data/ui-kit-meta";

/* Minimal theme stand-in — AnatomyDiagram reads only colour/type slots. */
const fakeTheme = {
  fg: "#111111",
  bg: "#ffffff",
  accent: "#6750A4",
  accentText: "#ffffff",
  border: "#cccccc",
  fg2: "#555555",
  fg3: "#888888",
  font: "system-ui",
} as never;

const anatomy = {
  parts: [
    { n: 1, label: "Container", x: 50, y: 50 },
    { n: 2, label: "Label text", x: 50, y: 50 },
    { n: 3, label: "State layer", x: 32, y: 50 },
  ],
  measures: [
    { label: "Height", value: "40dp" },
    { label: "Padding", value: "24dp" },
    { label: "Corner", value: "Full" },
  ],
};

/* Mirrors the real badge meta: 2 off-specimen parts + count-badge measures.
   None of the dp values contain the digit 3, so the count label "3" can
   only come from the schematic itself. */
const badgeAnatomy = {
  parts: [
    { n: 1, label: "Container", x: 50, y: -55 },
    { n: 2, label: "Label text", x: 50, y: 155 },
  ],
  measures: [
    { label: "Height", value: "16dp" },
    { label: "Corner", value: "8dp" },
    { label: "Padding", value: "4dp" },
  ],
} as typeof anatomy;

let root: Root | null = null;
afterEach(() => {
  if (root) {
    const r = root;
    act(() => r.unmount());
    root = null;
  }
});

function renderDiagram(a: typeof anatomy): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(<AnatomyDiagram anatomy={a} t={fakeTheme} specimen="Label" />);
  });
  return container;
}

function renderDiagramFor(componentId: string, a: typeof anatomy): HTMLElement {
  const container = document.createElement("div");
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container);
    root.render(
      <AnatomyDiagram anatomy={a} t={fakeTheme} specimen="Label" componentId={componentId} />,
    );
  });
  return container;
}

describe("AnatomyDiagram", () => {
  it("renders one numbered callout badge per part", () => {
    const c = renderDiagram(anatomy);
    expect(c.querySelectorAll(".dh-anatomy-callout").length).toBe(anatomy.parts.length);
  });

  it("renders a legend entry naming each part", () => {
    const c = renderDiagram(anatomy);
    expect(c.querySelectorAll(".dh-anatomy-legend li").length).toBe(anatomy.parts.length);
    expect(c.textContent).toContain("Container");
    expect(c.textContent).toContain("State layer");
  });

  it("annotates each measurement value", () => {
    const c = renderDiagram(anatomy);
    expect(c.textContent).toContain("40dp");
    expect(c.textContent).toContain("24dp");
    expect(c.textContent).toContain("Full");
  });

  it("renders nothing extra when there are no parts (graceful empty)", () => {
    const c = renderDiagram({ parts: [], measures: [] });
    expect(c.querySelectorAll(".dh-anatomy-callout").length).toBe(0);
  });

  it("renders a chip schematic with leading + trailing icons for chip", () => {
    const c = renderDiagramFor("chip", anatomy);
    expect(c.querySelectorAll(".dh-anatomy-spec .material-symbols-outlined").length).toBe(2);
    expect(c.textContent).toContain("Label");
  });

  it("renders an icon-free count schematic labelled 3 for badge", () => {
    const c = renderDiagramFor("badge", badgeAnatomy);
    expect(c.querySelectorAll(".material-symbols-outlined").length).toBe(0);
    expect(c.textContent).toContain("3");
  });

  it("draws a leader tick for each callout anchored outside the schematic", () => {
    /* Chip-style data: callouts pushed off the specimen (y<0 above, y>100
       below) so small schematics aren't buried under their own badges. */
    const offset = {
      parts: [
        { n: 1, label: "Container", x: 50, y: -55 },
        { n: 2, label: "Label text", x: 50, y: 155 },
        { n: 3, label: "Leading icon (optional)", x: 16, y: 155 },
        { n: 4, label: "Trailing icon (optional)", x: 84, y: 155 },
      ],
      measures: [],
    };
    const c = renderDiagramFor("chip", offset as typeof anatomy);
    expect(c.querySelectorAll(".dh-anatomy-tick").length).toBe(4);
    expect(c.querySelectorAll(".dh-anatomy-callout").length).toBe(4);
  });

  it("renders no leader ticks when all callouts are in-bounds (button unchanged)", () => {
    const c = renderDiagram(anatomy);
    expect(c.querySelectorAll(".dh-anatomy-tick").length).toBe(0);
  });

  it("keeps the icon-free button schematic when componentId is absent", () => {
    const c = renderDiagram(anatomy);
    expect(c.querySelectorAll(".material-symbols-outlined").length).toBe(0);
  });

  it("renders the real Salt Button anatomy as an icon-free pill with its measures", () => {
    const salt = COMPONENT_ANATOMY.button?.salt;
    expect(salt).toBeDefined();
    const c = renderDiagramFor("button", salt as typeof anatomy);
    /* Button schematic is icon-free (no leading/trailing glyphs). */
    expect(c.querySelectorAll(".material-symbols-outlined").length).toBe(0);
    /* One callout + legend entry per Salt part. */
    expect(c.querySelectorAll(".dh-anatomy-callout").length).toBe(salt!.parts.length);
    /* Salt's MD-density measures are annotated. */
    expect(c.textContent).toContain("36dp");
    expect(c.textContent).toContain("Focus ring");
  });
});
