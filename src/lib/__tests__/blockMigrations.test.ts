import { describe, it, expect } from "vitest";
import { migrateColSpanToWidth, migrateBlocks } from "../blockMigrations";
import type { Block } from "@/store/useBuilder";

const blk = (props: Record<string, unknown>, extra: Partial<Block> = {}): Block =>
  ({ id: "b", type: "SimulatedStatCard", props, ...extra } as Block);

describe("migrateColSpanToWidth", () => {
  it("converts colSpan 1|2|3 to the canonical width and drops the prop", () => {
    const one = migrateColSpanToWidth(blk({ colSpan: 1, label: "x" }));
    expect(one.layout?.width).toBe("33.333%");
    expect("colSpan" in one.props).toBe(false);
    expect(one.props.label).toBe("x"); // other props preserved

    expect(migrateColSpanToWidth(blk({ colSpan: 2 })).layout?.width).toBe("66.666%");
    expect(migrateColSpanToWidth(blk({ colSpan: 3 })).layout?.width).toBe("fill");
  });

  it("keeps an explicit layout.width and still drops colSpan (width wins)", () => {
    const b = migrateColSpanToWidth(blk({ colSpan: 1 }, { layout: { width: "50%" } }));
    expect(b.layout?.width).toBe("50%");
    expect("colSpan" in b.props).toBe(false);
  });

  it("defaults an out-of-range / undefined colSpan to fill", () => {
    expect(migrateColSpanToWidth(blk({ colSpan: 9 })).layout?.width).toBe("fill");
  });

  it("leaves a block with no colSpan untouched", () => {
    const b = migrateColSpanToWidth(blk({ label: "x" }, { layout: { width: "fill" } }));
    expect(b.layout?.width).toBe("fill");
    expect(b.props).toEqual({ label: "x" });
  });

  it("recurses into LayoutGroup children", () => {
    const group = blk({ colSpan: 2, direction: "row" }, {
      type: "LayoutGroup",
      children: [blk({ colSpan: 1 }), blk({ colSpan: 3 })],
    });
    const out = migrateColSpanToWidth(group);
    expect(out.layout?.width).toBe("66.666%");
    expect(out.children?.[0].layout?.width).toBe("33.333%");
    expect(out.children?.[1].layout?.width).toBe("fill");
    expect(out.children?.every((c) => !("colSpan" in c.props))).toBe(true);
  });

  it("is pure — does not mutate the input block", () => {
    const input = blk({ colSpan: 1 });
    migrateColSpanToWidth(input);
    expect(input.props).toEqual({ colSpan: 1 });
    expect(input.layout).toBeUndefined();
  });
});

describe("migrateBlocks", () => {
  it("maps a zone array", () => {
    const out = migrateBlocks([blk({ colSpan: 1 }), blk({ colSpan: 2 })]);
    expect(out.map((b) => b.layout?.width)).toEqual(["33.333%", "66.666%"]);
  });
});

/* P3-3 column-start hygiene: layout.gridCol is a canonical-12 LINE. On load it
   is normalized to a positive integer in [1, 12]; garbage drops to auto-place. */
describe("migrateBlocks — gridCol hygiene (P3-3)", () => {
  const pinned = (gridCol: unknown) => blk({}, { layout: { gridCol: gridCol as never } });
  const out1 = (gridCol: unknown) => migrateBlocks([pinned(gridCol)])[0];
  const hasGridCol = (b: Block) => "gridCol" in (b.layout ?? {});

  it("keeps a valid canonical-12 start", () => {
    expect(out1(7).layout?.gridCol).toBe(7);
    expect(out1(1).layout?.gridCol).toBe(1);
    expect(out1(12).layout?.gridCol).toBe(12);
  });

  it("floors a fractional start and coerces a stringified number (forged payload)", () => {
    expect(out1(7.8).layout?.gridCol).toBe(7);
    expect(out1("9").layout?.gridCol).toBe(9);
  });

  it("clamps an out-of-canonical start to 12", () => {
    expect(out1(1_000_000).layout?.gridCol).toBe(12);
  });

  it("drops a non-positive / non-finite / non-numeric start (auto-place)", () => {
    expect(hasGridCol(out1(0))).toBe(false);
    expect(hasGridCol(out1(-5))).toBe(false);
    expect(hasGridCol(out1(NaN))).toBe(false);
    expect(hasGridCol(out1("abc"))).toBe(false);
  });

  it("preserves other layout fields and leaves an un-pinned block untouched", () => {
    const b = migrateBlocks([blk({}, { layout: { width: "6fr" } })])[0];
    expect(b.layout?.width).toBe("6fr");
    expect(hasGridCol(b)).toBe(false);
    // a pinned block keeps its width too
    const p = migrateBlocks([blk({}, { layout: { width: "6fr", gridCol: 7 } })])[0];
    expect(p.layout?.width).toBe("6fr");
    expect(p.layout?.gridCol).toBe(7);
  });

  it("recurses into LayoutGroup children and is idempotent", () => {
    const group = blk({ direction: "row" }, { type: "LayoutGroup", children: [pinned(7.8), pinned(0)] });
    const once = migrateBlocks([group])[0];
    expect(once.children?.[0].layout?.gridCol).toBe(7);
    expect(hasGridCol(once.children![1])).toBe(false);
    const twice = migrateBlocks([once])[0];
    expect(twice.children?.[0].layout?.gridCol).toBe(7);
  });

  it("is pure — does not mutate the input", () => {
    const input = pinned(7.8);
    migrateBlocks([input]);
    expect((input.layout as Record<string, unknown>).gridCol).toBe(7.8);
  });
});
