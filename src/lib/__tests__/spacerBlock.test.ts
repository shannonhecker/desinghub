import { describe, it, expect } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { exportReact } from "../export/reactExporter";
import { defaultLayoutForType } from "../blockLayoutDefaults";

/**
 * Placement P2 — Spacer block. A Spacer is a flow GUTTER, never a positioning
 * device. The moat (responsive multi-DS export) requires it to emit as a sized
 * flex/grid child with NO per-element coordinates. These tests pin that contract.
 */

function setCanvas(blocks: Array<{ id: string; type: string; props: Record<string, unknown> }>) {
  useBuilder.setState({
    designSystem: "salt" as never,
    mode: "light" as never,
    density: "medium",
    headerBlocks: [],
    sidebarBlocks: [],
    blocks: blocks as never,
    footerBlocks: [],
  });
}

describe("Spacer block — layout default", () => {
  it("hugs content (width:auto) so a dropped Spacer never stretches full-row", () => {
    expect(defaultLayoutForType("Spacer")).toEqual({ width: "auto", align: "start" });
  });
});

describe("Spacer block — export is a sized flow div, never positioned", () => {
  it("horizontal Spacer exports as an aria-hidden div with a width token + flexShrink:0", () => {
    setCanvas([{ id: "s1", type: "Spacer", props: { size: 32, axis: "h" } }]);
    const code = exportReact();
    expect(code).toContain('width: "32px"');
    expect(code).toContain('flexShrink: 0');
    expect(code).toContain('aria-hidden="true"');
  });

  it("vertical Spacer exports with a height token (axis switches the dimension)", () => {
    setCanvas([{ id: "s1", type: "Spacer", props: { size: 40, axis: "v" } }]);
    const code = exportReact();
    expect(code).toContain('height: "40px"');
    expect(code).not.toContain('width: "40px"');
  });

  it("defaults to 24px when size is missing", () => {
    setCanvas([{ id: "s1", type: "Spacer", props: { axis: "h" } }]);
    expect(exportReact()).toContain('width: "24px"');
  });

  it("MOAT GUARD: the Spacer line carries no absolute positioning / coordinates", () => {
    setCanvas([{ id: "s1", type: "Spacer", props: { size: 16, axis: "h" } }]);
    const spacerLine = exportReact()
      .split("\n")
      .find((l) => l.includes('aria-hidden="true"') && l.includes("flexShrink"));
    expect(spacerLine).toBeTruthy();
    expect(spacerLine).not.toMatch(/position|left:|top:|transform|translate|absolute/);
  });
});
