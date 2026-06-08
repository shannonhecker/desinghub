/* ════════════════════════════════════════════════════════════
   htmlExporter — LayoutGroup children must survive export.
   ════════════════════════════════════════════════════════════
   Same export-trap bug as the React target: blockToHTML had no
   case "LayoutGroup", so a group exported as an empty div with a
   bare LayoutGroup comment and dropped every child. Reachable today
   with a single-level group.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { exportHTML } from "../export/htmlExporter";

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

describe("htmlExporter — LayoutGroup exports its children (empty-div regression)", () => {
  it("a one-level group renders its child, not an empty placeholder", () => {
    setBody("salt", [
      {
        id: "g1",
        type: "LayoutGroup",
        props: { direction: "row", gap: 12 },
        children: [{ id: "c1", type: "SimulatedTitle", props: { text: "HtmlKid", level: 3 } }],
      },
    ]);
    const html = exportHTML();
    expect(html).toContain("HtmlKid");
    expect(html).not.toContain("<!-- LayoutGroup -->");
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
            children: [{ id: "c1", type: "SimulatedBadge", props: { label: "DeepHtml", status: "positive" } }],
          },
        ],
      },
    ]);
    const html = exportHTML();
    expect(html).toContain("DeepHtml");
  });

  it("the group container carries flex layout from its props", () => {
    setBody("salt", [
      {
        id: "g1",
        type: "LayoutGroup",
        props: { direction: "row", gap: 16 },
        children: [{ id: "c1", type: "SimulatedTitle", props: { text: "Row", level: 3 } }],
      },
    ]);
    const html = exportHTML();
    expect(html).toMatch(/display:\s*flex/);
    expect(html).toMatch(/flex-direction:\s*row/);
  });
});
