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
