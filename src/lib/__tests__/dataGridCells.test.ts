/* Rich grid cells are described as data (GridCell). These are the pure
   rules behind them; the canvas and the export both read them. */
import { describe, it, expect } from "vitest";
import {
  SCORE_THRESHOLDS,
  barShare,
  cellOf,
  columnMax,
  deltaView,
  dotIsBlank,
  flagEmoji,
  heatTone,
  sparkPoints,
  sparkPolyline,
  toneColor,
  valueTone,
  RATING_TONES,
} from "../dataGridModel";

describe("heat cell", () => {
  it("buckets a 0-10 score by default: good from 7, mid from 4, else bad", () => {
    const cell = { type: "heat" as const };
    expect([9.1, 7, 6.99, 4, 3.9, 0].map((v) => heatTone(cell, v))).toEqual(["good", "good", "mid", "mid", "bad", "bad"]);
    expect(SCORE_THRESHOLDS).toHaveLength(3);
  });
  it("takes its own thresholds, in order, and is blank for a blank value", () => {
    const cell = { type: "heat" as const, thresholds: [{ min: 50, tone: "bad" as const }, { tone: "good" as const }] };
    expect(heatTone(cell, 80)).toBe("bad");
    expect(heatTone(cell, 10)).toBe("good");
    expect(heatTone(cell, null)).toBeNull();
    expect(heatTone(cell, "n/a")).toBeNull();
  });
});

describe("bar cell", () => {
  it("is a share of a fixed maximum (100 by default), capped at full", () => {
    expect(barShare({ type: "bar" }, 25)).toBe(0.25);
    expect(barShare({ type: "bar", max: 50 }, 25)).toBe(0.5);
    expect(barShare({ type: "bar" }, 140)).toBe(1);
    expect(barShare({ type: "bar" }, -3)).toBe(0);
  });
  it("or a share of the column's largest value, totals left out", () => {
    const rows = [{ g: "Total", w: 100, _bold: true }, { g: "A", w: 40 }, { g: "B", w: 10 }];
    const max = columnMax(rows, "w");
    expect(max).toBe(40);
    expect(barShare({ type: "bar", scale: "columnMax" }, 40, max)).toBe(1);
    expect(barShare({ type: "bar", scale: "columnMax" }, 10, max)).toBe(0.25);
    expect(barShare({ type: "bar", scale: "columnMax" }, 10, 0)).toBe(0);
  });
});

describe("delta", () => {
  it("a rise is good by default, bad when upIsGood is false, and zero is flat", () => {
    expect(deltaView(3)).toEqual({ direction: "up", tone: "good", magnitude: 3 });
    expect(deltaView(-2)).toEqual({ direction: "down", tone: "bad", magnitude: 2 });
    expect(deltaView(4.5, false)).toEqual({ direction: "up", tone: "bad", magnitude: 4.5 });
    expect(deltaView(-4.5, false)).toEqual({ direction: "down", tone: "good", magnitude: 4.5 });
    expect(deltaView(0)).toEqual({ direction: "flat", tone: "neutral", magnitude: 0 });
    expect(deltaView("")).toBeNull();
  });
});

describe("badge and toned text", () => {
  it("map a value to a tone, with a fallback", () => {
    expect(valueTone(RATING_TONES, "AA")).toBe("good");
    expect(valueTone(RATING_TONES, "BBB")).toBe("mid");
    expect(valueTone(RATING_TONES, "CCC", "bad")).toBe("bad");
    expect(valueTone({ Upgraded: "good", Downgraded: "bad" }, "Unchanged")).toBe("neutral");
    expect(valueTone({ x: "purple" as never }, "x")).toBe("neutral");
  });
});

describe("sparkline", () => {
  it("reads points from a list or an array and ignores what is not a number", () => {
    expect(sparkPoints("3, 4, 2,6")).toEqual([3, 4, 2, 6]);
    expect(sparkPoints([1, 2, 3])).toEqual([1, 2, 3]);
    expect(sparkPoints("1; x; 2")).toEqual([1, 2]);
    expect(sparkPoints("")).toEqual([]);
    expect(sparkPoints(null)).toEqual([]);
  });
  it("draws left to right, highest value at the top, inside the padding", () => {
    expect(sparkPolyline([0, 10], 60, 18, 1.5)).toBe("0,16.5 60,1.5");
    expect(sparkPolyline([5, 5, 5], 60, 18)).toBe("0,16.5 30,16.5 60,16.5");
    expect(sparkPolyline([1], 60, 18)).toBe("");
  });
});

describe("flag, tones and unknown cells", () => {
  it("builds a flag from a two-letter code only", () => {
    expect(flagEmoji("GB")).toBe("🇬🇧");
    expect(flagEmoji("us")).toBe("🇺🇸");
    expect(flagEmoji("GBR")).toBe("");
    expect(flagEmoji(null)).toBe("");
  });
  it("resolves each tone to a design-system token", () => {
    expect(toneColor("good")).toBe("var(--ds-status-positive)");
    expect(toneColor("mid")).toBe("var(--ds-status-warning)");
    expect(toneColor("bad")).toBe("var(--ds-status-negative)");
    expect(toneColor("accent")).toBe("var(--ds-primary)");
    expect(toneColor("neutral")).toBe("var(--ds-fg-tertiary)");
  });
  it("ignores a cell description it does not understand", () => {
    expect(cellOf({ field: "a", header: "A", cell: { type: "hologram" } as never })).toBeNull();
    expect(cellOf({ field: "a", header: "A" })).toBeNull();
    expect(cellOf({ field: "a", header: "A", cell: { type: "heat" } })).toEqual({ type: "heat" });
  });
});

describe("dot and chip cells", () => {
  it("a dot is blank for nothing, and for zero when zeros are hidden", () => {
    expect(dotIsBlank({ type: "dot", hideZero: true }, 0)).toBe(true);
    expect(dotIsBlank({ type: "dot" }, 0)).toBe(false);
    expect(dotIsBlank({ type: "dot" }, "")).toBe(true);
    expect(dotIsBlank({ type: "dot", hideZero: true }, 3)).toBe(false);
  });
  it("are understood as cells", () => {
    expect(cellOf({ field: "a", header: "A", cell: { type: "dot", tone: "bad" } })?.type).toBe("dot");
    expect(cellOf({ field: "a", header: "A", cell: { type: "chip", variant: "solid", tones: { 1: "good" } } })?.type).toBe("chip");
    expect(valueTone({ Met: "good", "Not Met": "bad" }, "Not Met")).toBe("bad");
  });
});
