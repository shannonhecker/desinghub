/* Blocks from a run of addBlock calls land top to bottom in the order the
   model emitted them. The tool schema says an omitted index appends; the
   store's addBlockToZone prepends when no index is given, which built an
   image-to-UI screen upside down. */
import { describe, it, expect, beforeEach } from "vitest";
import { useBuilder } from "@/store/useBuilder";
import { applyAIActions } from "../applyAIActions";

const add = (title: string, extra: Record<string, unknown> = {}) => ({
  action: "addBlock",
  value: { type: "SimulatedCard", props: { title }, ...extra },
});
const titles = () => useBuilder.getState().blocks.map((b) => b.props.title);

beforeEach(() => {
  useBuilder.setState({ blocks: [], headerBlocks: [], sidebarBlocks: [], footerBlocks: [] });
});

describe("applyAIActions: addBlock order", () => {
  it("appends a multi-add sequence in emission order", () => {
    applyAIActions([add("Page"), add("Configuration"), add("Report defaults"), add("Base currency")] as never);
    expect(titles()).toEqual(["Page", "Configuration", "Report defaults", "Base currency"]);
  });

  it("appends after blocks already on the canvas", () => {
    applyAIActions([add("Existing")] as never);
    applyAIActions([add("A"), add("B")] as never);
    expect(titles()).toEqual(["Existing", "A", "B"]);
  });

  it("keeps order across separate applies (one call per continuation step)", () => {
    for (const t of ["Page", "Configuration", "Report defaults"]) applyAIActions([add(t)] as never);
    expect(titles()).toEqual(["Page", "Configuration", "Report defaults"]);
  });

  it("still honours an explicit index", () => {
    applyAIActions([add("A"), add("C"), add("B", { index: 1 }), add("Top", { index: 0 })] as never);
    expect(titles()).toEqual(["Top", "A", "B", "C"]);
  });

  it("appends to the zone named, in order", () => {
    applyAIActions([
      { action: "addBlock", value: { type: "SimulatedCard", zone: "header", props: { title: "H1" } } },
      { action: "addBlock", value: { type: "SimulatedCard", zone: "header", props: { title: "H2" } } },
    ] as never);
    expect(useBuilder.getState().headerBlocks.map((b) => b.props.title)).toEqual(["H1", "H2"]);
  });
});
