/* ════════════════════════════════════════════════════════════
   reactExporter — LayoutGroup children must survive export.
   ════════════════════════════════════════════════════════════
   Regression guard for the export-trap bug: blockToJSX had no
   case "LayoutGroup", so every group fell through to the default
   branch and exported as an empty layoutgroup div carrying only a
   bare LayoutGroup placeholder comment, with ALL its children
   dropped — even at a single level the user can already build
   today. Edit showed the group + children; the exported React
   showed an empty div.

   These run the real exporter against the store (no jsdom — exportReact
   reads state and returns a string), mirroring reactExporter.test.ts.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { exportReact } from "../export/reactExporter";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setBody(designSystem: string, blocks: any[]) {
  useBuilder.setState({
    designSystem: designSystem as never,
    mode: "light" as never,
    density: "medium",
    headerBlocks: [],
    sidebarBlocks: [],
    blocks: blocks as never,
    footerBlocks: [],
  });
}

describe("reactExporter — LayoutGroup exports its children (empty-div regression)", () => {
  it("a one-level group renders its child, not an empty placeholder", () => {
    setBody("salt", [
      {
        id: "g1",
        type: "LayoutGroup",
        props: { direction: "row", gap: 12 },
        children: [{ id: "c1", type: "SimulatedTitle", props: { text: "KidContent", level: 3 } }],
      },
    ]);
    const code = exportReact();
    expect(code).toContain("KidContent");
    expect(code).not.toMatch(/\{\/\* LayoutGroup \*\/\}/);
  });

  it("nested groups export recursively — a grandchild survives", () => {
    setBody("salt", [
      {
        id: "g1",
        type: "LayoutGroup",
        props: { direction: "stack", gap: 8 },
        children: [
          {
            id: "g2",
            type: "LayoutGroup",
            props: { direction: "row", gap: 4 },
            children: [{ id: "c1", type: "SimulatedBadge", props: { label: "DeepBadge", status: "positive" } }],
          },
        ],
      },
    ]);
    const code = exportReact();
    expect(code).toContain("DeepBadge");
  });

  it("the group container carries real flex/grid layout from its props (export == canvas)", () => {
    setBody("salt", [
      {
        id: "g1",
        type: "LayoutGroup",
        props: { direction: "row", gap: 16 },
        children: [{ id: "c1", type: "SimulatedTitle", props: { text: "Row", level: 3 } }],
      },
    ]);
    const code = exportReact();
    // computeGroupStyle(direction:row) → display:flex; flexDirection:row.
    expect(code).toMatch(/display:\s*["']flex["']/);
    expect(code).toMatch(/flexDirection:\s*["']row["']/);
  });

  it("an empty group still exports as a self-closing styled div (no dropped children to mourn)", () => {
    setBody("salt", [{ id: "g1", type: "LayoutGroup", props: { direction: "stack" }, children: [] }]);
    const code = exportReact();
    expect(code).toContain("layout-group");
    expect(code).not.toMatch(/\{\/\* LayoutGroup \*\/\}/);
  });
});
