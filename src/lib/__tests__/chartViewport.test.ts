import { describe, it, expect } from "vitest";
import {
  backToLive, boxSpans, clampTime, followFeed, FULL_VIEW, goToPlan, goToSpan, wheelTarget, isAwayFromLive, isFullView, keyAction,
  panPrice, panTime, parseGoTo, scalePrice, scaleTime, wheelFactor, ZOOM_STEP, zoomPrice, zoomTime,
  type PriceLimits, type TimeBounds,
} from "../chartViewport";
import { executionRangeStart, rangeCovering } from "../executionModel";
import { HOUR, MINUTE } from "../reportData/executionDataset";

/* 150 one-minute bars; the axis runs from -0.5 to the walk-in end (157.5). */
const TIME: TimeBounds = { min: -0.5, max: 157.5, minSpan: 5 };
const PRICE: PriceLimits = { minSpan: 0.0001, maxSpan: 0.05 };
const close = (a: number, b: number, digits = 9) => expect(a).toBeCloseTo(b, digits);
/** Where a value sits across a span (0 left / bottom, 1 right / top). */
const share = (s: { min: number; max: number }, v: number) => (v - s.min) / (s.max - s.min);

describe("zoomTime: centred on the pointer", () => {
  it("keeps the bar under the pointer at the same place on screen", () => {
    const from = { min: -0.5, max: 157.5 };
    const anchor = 40;
    const z = zoomTime(from, anchor, 1 / ZOOM_STEP, TIME)!;
    close(share(z, anchor), share(from, anchor));
    close(z.max - z.min, (from.max - from.min) / ZOOM_STEP);
  });

  it("zooming in then out by the same factor returns to the full view (auto)", () => {
    const z = zoomTime(null, 100, 1 / ZOOM_STEP, TIME);
    expect(z).not.toBeNull();
    expect(zoomTime(z, 100, ZOOM_STEP, TIME)).toBeNull();
  });

  it("never narrower than the minimum span, never wider than the data", () => {
    let z = zoomTime(null, 80, 1 / ZOOM_STEP, TIME);
    for (let i = 0; i < 40; i++) z = zoomTime(z, 80, 1 / ZOOM_STEP, TIME);
    close(z!.max - z!.min, TIME.minSpan);
    expect(z!.min).toBeLessThanOrEqual(80);
    expect(z!.max).toBeGreaterThanOrEqual(80);
    expect(zoomTime({ min: 10, max: 50 }, 30, 100, TIME)).toBeNull();
  });

  it("near an edge the span stays inside the data (it slides, it does not shrink)", () => {
    const z = zoomTime({ min: -0.5, max: 39.5 }, 39.5, 1.5, TIME)!;
    close(z.max - z.min, 60);
    close(z.min, TIME.min);
    close(z.max, 59.5);
  });
});

describe("zoomPrice: centred on the pointer", () => {
  it("keeps the price under the pointer where it was", () => {
    const from = { min: 1.36, max: 1.38 };
    const z = zoomPrice(from, 1.375, 0.5, PRICE);
    close(share(z, 1.375), share(from, 1.375));
    close(z.max - z.min, 0.01);
  });
  it("is limited to a span between one pip and the widest allowed", () => {
    expect(zoomPrice({ min: 1.37, max: 1.3702 }, 1.3701, 0.01, PRICE).max - zoomPrice({ min: 1.37, max: 1.3702 }, 1.3701, 0.01, PRICE).min).toBeCloseTo(PRICE.minSpan, 9);
    const wide = zoomPrice({ min: 1.3, max: 1.34 }, 1.32, 10, PRICE);
    close(wide.max - wide.min, PRICE.maxSpan);
  });
});

describe("pan", () => {
  it("time pans by a delta and stops at either end without changing its span", () => {
    const s = { min: 50, max: 80 };
    expect(panTime(s, 10, TIME)).toEqual({ min: 60, max: 90 });
    const left = panTime(s, -500, TIME);
    close(left.min, TIME.min);
    close(left.max - left.min, 30);
    const right = panTime(s, 500, TIME);
    close(right.max, TIME.max);
  });
  it("price pans freely (a manual scale can go past the data)", () => {
    expect(panPrice({ min: 1.36, max: 1.37 }, 0.002)).toEqual({ min: 1.362, max: 1.372 });
  });
});

describe("axis scaling (drag on an axis)", () => {
  it("the price axis scales around its centre", () => {
    const s = scalePrice({ min: 1.36, max: 1.38 }, 2, PRICE);
    close((s.min + s.max) / 2, 1.37);
    close(s.max - s.min, 0.04);
  });
  it("the time axis stretches from its right edge", () => {
    const s = scaleTime({ min: 100, max: 150 }, 0.5, TIME)!;
    close(s.max, 150);
    close(s.min, 125);
    /* Stretched past the data on the left: the full view. */
    expect(scaleTime({ min: 100, max: 157.5 }, 10, TIME)).toBeNull();
  });
});

describe("box zoom", () => {
  it("zooms both axes to the rectangle, in either drag direction", () => {
    const a = boxSpans({ x: 40, y: 1.372 }, { x: 20, y: 1.368 }, TIME, PRICE)!;
    expect(a.x).toEqual({ min: 20, max: 40 });
    expect(a.y).toEqual({ min: 1.368, max: 1.372 });
  });
  it("a rectangle thinner than the minimum span grows to it around its centre", () => {
    const a = boxSpans({ x: 30, y: 1.37 }, { x: 31, y: 1.37005 }, TIME, PRICE)!;
    close(a.x!.max - a.x!.min, TIME.minSpan);
    close((a.x!.max + a.x!.min) / 2, 30.5);
    close(a.y!.max - a.y!.min, PRICE.minSpan);
  });
});

describe("reset", () => {
  it("is the full view on both axes, following the feed", () => {
    expect(FULL_VIEW).toEqual({ x: null, y: null });
    expect(isFullView(FULL_VIEW)).toBe(true);
    expect(isFullView({ x: { min: 1, max: 9 }, y: null })).toBe(false);
  });
  it("clampTime keeps a span inside new bounds, and gives the full view when it covers them", () => {
    expect(clampTime({ min: 140, max: 170 }, TIME)).toEqual({ min: 127.5, max: 157.5 });
    expect(clampTime({ min: -10, max: 200 }, TIME)).toBeNull();
  });
});

describe("the live edge", () => {
  it("a view that shows the last bar follows new bars; one panned back holds still", () => {
    /* Last bar 149 is in view: three new bars move the view three bars on. */
    expect(followFeed({ min: 120, max: 155 }, 149, 152)).toEqual({ min: 123, max: 158 });
    /* Panned back to bar 60: the bars arrive off screen, the view does not move. */
    expect(followFeed({ min: 30, max: 60 }, 149, 152)).toEqual({ min: 30, max: 60 });
    expect(followFeed(null, 149, 152)).toBeNull();
  });
  it("is away from live only when the last bar is out of view", () => {
    expect(isAwayFromLive(null, 149)).toBe(false);
    expect(isAwayFromLive({ min: 120, max: 155 }, 149)).toBe(false);
    expect(isAwayFromLive({ min: 30, max: 60 }, 149)).toBe(true);
  });
  it("back to live keeps the zoom and puts the walk-in end at the right edge", () => {
    expect(backToLive({ min: 30, max: 60 }, TIME)).toEqual({ min: 127.5, max: 157.5 });
    /* As wide as the data: the full view. */
    expect(backToLive({ min: -2, max: 156 }, TIME)).toBeNull();
  });
});

describe("wheel", () => {
  it("down zooms out, up zooms in; a line-mode wheel counts as pixels; a big flick is capped", () => {
    expect(wheelFactor(100, 0)).toBeGreaterThan(1);
    expect(wheelFactor(-100, 0)).toBeLessThan(1);
    close(wheelFactor(3, 1), wheelFactor(48, 0));
    expect(wheelFactor(100_000, 0)).toBeLessThanOrEqual(2);
    expect(wheelFactor(-100_000, 0)).toBeGreaterThanOrEqual(0.5);
    close(wheelFactor(-100, 0) * wheelFactor(100, 0), 1);
  });
});

describe("keyboard", () => {
  it("arrows pan, plus and minus zoom time, Page Up and Page Down zoom price, 0 and Home reset, End goes back to live", () => {
    expect(keyAction("ArrowLeft", false)).toEqual({ kind: "panTime", by: -0.1 });
    expect(keyAction("ArrowRight", true)).toEqual({ kind: "panTime", by: 0.5 });
    expect(keyAction("ArrowUp", false)).toEqual({ kind: "panPrice", by: 0.1 });
    expect(keyAction("ArrowDown", false)).toEqual({ kind: "panPrice", by: -0.1 });
    expect(keyAction("+", false)).toEqual({ kind: "zoom", in: true, axis: "time" });
    expect(keyAction("=", false)).toEqual({ kind: "zoom", in: true, axis: "time" });
    expect(keyAction("-", false)).toEqual({ kind: "zoom", in: false, axis: "time" });
    /* "+" is Shift and "=" on many keyboards: Shift does not change it. */
    expect(keyAction("+", true)).toEqual({ kind: "zoom", in: true, axis: "time" });
    expect(keyAction("_", true)).toEqual({ kind: "zoom", in: false, axis: "time" });
    expect(keyAction("PageUp", false)).toEqual({ kind: "zoom", in: true, axis: "price" });
    expect(keyAction("PageDown", false)).toEqual({ kind: "zoom", in: false, axis: "price" });
    expect(keyAction("0", false)).toEqual({ kind: "reset" });
    expect(keyAction("Home", false)).toEqual({ kind: "reset" });
    expect(keyAction("End", false)).toEqual({ kind: "live" });
    expect(keyAction("a", false)).toBeNull();
  });
});

describe("Go to", () => {
  /* Bars every minute 10:00 to 12:00 on 5 Jan 2026, after hourly bars on 2 Jan. */
  const day = Date.UTC(2026, 0, 5, 10, 0);
  const history = Array.from({ length: 8 }, (_, i) => Date.UTC(2026, 0, 2, 9 + i));
  const times = [...history, ...Array.from({ length: 121 }, (_, i) => day + i * MINUTE)];
  const bounds = { first: "2025-10-01", last: "2026-01-05" };

  it("a date and time: about 90 minutes around it", () => {
    const r = parseGoTo({ mode: "date", date: "2026-01-05", time: "11:00" }, bounds);
    expect(r).toEqual({ ok: true, from: Date.UTC(2026, 0, 5, 10, 15), to: Date.UTC(2026, 0, 5, 11, 45) });
  });
  it("a custom range, both ends inclusive", () => {
    const r = parseGoTo({ mode: "range", fromDate: "2026-01-02", fromTime: "09:00", toDate: "2026-01-05", toTime: "10:30" }, bounds);
    expect(r).toEqual({ ok: true, from: Date.UTC(2026, 0, 2, 9), to: Date.UTC(2026, 0, 5, 10, 30) });
  });
  it("plain errors: a missing date, a bad time, outside the data, an end before the start", () => {
    expect(parseGoTo({ mode: "date", date: "", time: "10:00" }, bounds)).toEqual({ ok: false, field: "date", error: "Enter a date." });
    expect(parseGoTo({ mode: "date", date: "2026-01-05", time: "25:00" }, bounds)).toEqual({ ok: false, field: "time", error: "Enter a time as HH:MM, for example 10:30." });
    expect(parseGoTo({ mode: "date", date: "2026-02-01", time: "10:00" }, bounds)).toEqual({ ok: false, field: "date", error: "Pick a date from 1 Oct 2025 to 5 Jan 2026." });
    expect(parseGoTo({ mode: "date", date: "2025-09-30", time: "10:00" }, bounds)).toEqual({ ok: false, field: "date", error: "Pick a date from 1 Oct 2025 to 5 Jan 2026." });
    expect(parseGoTo({ mode: "range", fromDate: "2026-01-05", fromTime: "11:00", toDate: "2026-01-05", toTime: "10:00" }, bounds)).toEqual({ ok: false, field: "toDate", error: "The end must be after the start." });
  });
  it("an empty time means the start of the day", () => {
    expect(parseGoTo({ mode: "date", date: "2026-01-05", time: "" }, bounds)).toEqual({ ok: true, from: Date.UTC(2026, 0, 4, 23, 15), to: Date.UTC(2026, 0, 5, 0, 45) });
  });
  it("turns a window into bar positions; a window with no bars is refused", () => {
    expect(goToSpan(times, Date.UTC(2026, 0, 5, 10, 15), Date.UTC(2026, 0, 5, 11, 45), 5)).toEqual({ min: 8 + 15 - 0.5, max: 8 + 105 + 0.5 });
    /* A Saturday: nothing traded. */
    expect(goToSpan(times, Date.UTC(2026, 0, 3, 10), Date.UTC(2026, 0, 3, 12), 5)).toBeNull();
    /* One hourly bar: grown to the minimum span around it. */
    const one = goToSpan(times, Date.UTC(2026, 0, 2, 11, 30), Date.UTC(2026, 0, 2, 12, 30), 5)!;
    close(one.max - one.min, 5);
    close((one.max + one.min) / 2, 3);
  });
});

describe("the range a Go to needs", () => {
  const session = Date.UTC(2026, 0, 5, 9, 59);
  it("is the preset with the latest start that still reaches back to the window", () => {
    expect(rangeCovering(session + HOUR, session)).toBe("1D");
    expect(rangeCovering(session - 2 * 24 * HOUR, session)).toBe("3D");
    /* YTD (1 Jan) starts later than 5D (31 Dec). */
    expect(rangeCovering(Date.UTC(2026, 0, 1, 12), session)).toBe("YTD");
    expect(rangeCovering(session - 6 * 24 * HOUR, session)).toBe("1W");
    expect(rangeCovering(Date.UTC(2025, 10, 1), session)).toBe("3M");
    /* Before the longest preset reaches: no range shows it. */
    expect(rangeCovering(Date.UTC(2025, 9, 1), session)).toBeNull();
  });
  it("matches where each preset's window starts", () => {
    expect(executionRangeStart("1D", session)).toBe(session);
    expect(executionRangeStart("1W", session)).toBe(session - 7 * 24 * HOUR);
    expect(executionRangeStart("YTD", session)).toBe(Date.UTC(2026, 0, 1));
  });
});

describe("goToPlan", () => {
  const H = 60 * 60_000;
  /* The session: minute bars from hour 100; the longer range adds hourly bars before it. */
  const session = Array.from({ length: 60 }, (_, i) => 100 * H + i * 60_000);
  const history = Array.from({ length: 20 }, (_, i) => (80 + i) * H);
  const wider = [...history, ...session];

  it("a window inside the bars on the chart is shown from them", () => {
    expect(goToPlan(session, null, 100 * H + 5 * 60_000, 100 * H + 30 * 60_000)).toBe("here");
  });
  it("a window that starts before the chart's first bar takes the longer range, so it is shown whole", () => {
    expect(goToPlan(session, wider, 90 * H, 100 * H + 30 * 60_000)).toBe("wider");
  });
  it("a window wholly before the chart takes the longer range", () => {
    expect(goToPlan(session, wider, 85 * H, 90 * H)).toBe("wider");
  });
  it("a window that starts a little before the first bar, with nothing more further back, stays on the chart", () => {
    expect(goToPlan(session, wider, 99 * H + 50 * 60_000, 100 * H + 30 * 60_000)).toBe("here");
  });
  it("no bar in the window anywhere: none", () => {
    expect(goToPlan(session, wider, 99 * H + 10 * 60_000, 99 * H + 50 * 60_000)).toBe("none");
    expect(goToPlan(session, null, 100 * H + 10_000, 100 * H + 20_000)).toBe("none");
  });
});

describe("wheelTarget", () => {
  const base = { modifier: false, horizontal: false, sinceZoom: 10_000, release: 400 };
  const full = { x: null, y: null };
  const priceOnly = { x: null, y: { min: 1.37, max: 1.38 } };
  const timeZoomed = { x: { min: 10, max: 60 }, y: null };

  it("off the chart, and over the plot at the full view, a plain wheel is the page's", () => {
    expect(wheelTarget({ ...base, region: null, viewport: timeZoomed })).toBe("page");
    expect(wheelTarget({ ...base, region: "plot", viewport: full })).toBe("page");
    expect(wheelTarget({ ...base, region: "time", viewport: full })).toBe("page");
    expect(wheelTarget({ ...base, region: "price", viewport: full })).toBe("page");
  });
  it("with only the price scale zoomed, a plain wheel over the plot is still the page's (time has nothing to zoom out of)", () => {
    expect(wheelTarget({ ...base, region: "plot", viewport: priceOnly })).toBe("page");
    expect(wheelTarget({ ...base, region: "time", viewport: priceOnly })).toBe("page");
    expect(wheelTarget({ ...base, region: "plot", viewport: priceOnly, horizontal: true })).toBe("page");
    /* Over the price gutter it is the price scale's. */
    expect(wheelTarget({ ...base, region: "price", viewport: priceOnly })).toBe("zoomPrice");
  });
  it("Ctrl or Cmd makes it the chart's from the full view", () => {
    expect(wheelTarget({ ...base, region: "plot", viewport: full, modifier: true })).toBe("zoomTime");
    expect(wheelTarget({ ...base, region: "plot", viewport: priceOnly, modifier: true })).toBe("zoomTime");
    expect(wheelTarget({ ...base, region: "price", viewport: full, modifier: true })).toBe("zoomPrice");
  });
  it("once time is zoomed the plain wheel zooms or, sideways, pans; the gutter takes price", () => {
    expect(wheelTarget({ ...base, region: "plot", viewport: timeZoomed })).toBe("zoomTime");
    expect(wheelTarget({ ...base, region: "plot", viewport: timeZoomed, horizontal: true })).toBe("panTime");
    expect(wheelTarget({ ...base, region: "price", viewport: timeZoomed })).toBe("zoomPrice");
  });
  it("the tail of a zoom-out flick that reached the full view is swallowed, then the page has it", () => {
    expect(wheelTarget({ ...base, region: "plot", viewport: full, sinceZoom: 120 })).toBe("swallow");
    expect(wheelTarget({ ...base, region: "plot", viewport: priceOnly, sinceZoom: 120 })).toBe("swallow");
    expect(wheelTarget({ ...base, region: "plot", viewport: full, sinceZoom: 401 })).toBe("page");
  });
});
