/**
 * chartViewport - the maths of looking around a chart: zoom, pan, axis
 * scaling, box zoom, reset, following a feed, and "Go to" a date.
 *
 * Pure: spans in, spans out. A span is the part of an axis on screen, in
 * the axis's own units (bar positions for time, a price for price). `null`
 * means "the full view": the chart's own extremes, which follow the feed.
 *
 * The viewport is the reader's own: it is never report state, never saved,
 * shared or exported (see useChartNavigation, which holds it).
 */

export interface Span { min: number; max: number }
/** What is on screen: null on an axis is its full (automatic) extent. */
export interface Viewport { x: Span | null; y: Span | null }
export const FULL_VIEW: Viewport = Object.freeze({ x: null, y: null }) as Viewport;

/** The time axis's extent (the data plus the walk-in room) and the fewest bars a view may show. */
export interface TimeBounds { min: number; max: number; minSpan: number }
/** Price spans: no narrower than `minSpan`, no wider than `maxSpan`. */
export interface PriceLimits { minSpan: number; maxSpan: number }

/** One step of the zoom buttons and keys. */
export const ZOOM_STEP = 1.25;
/** Below this the comparison treats two positions as the same. */
const EPS = 1e-9;

const width = (s: Span) => s.max - s.min;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function isFullView(v: Viewport): boolean {
  return v.x === null && v.y === null;
}

/** A time span moved inside the bounds (it slides; it does not shrink unless
 *  wider than the data); the full view when it covers all of it. */
export function clampTime(span: Span, b: TimeBounds): Span | null {
  const full = b.max - b.min;
  const w = Math.min(Math.max(width(span), b.minSpan), full);
  if (w >= full - EPS) return null;
  let min = span.min + (width(span) - w) / 2;
  min = clamp(min, b.min, b.max - w);
  return { min, max: min + w };
}

/** Zoom the time axis by `factor` (below 1 zooms in) around `anchor`: the bar
 *  under the pointer stays where it is on screen. */
export function zoomTime(span: Span | null, anchor: number, factor: number, b: TimeBounds): Span | null {
  const from = span ?? { min: b.min, max: b.max };
  const full = b.max - b.min;
  const w = clamp(width(from) * factor, b.minSpan, full);
  if (w >= full - EPS) return null;
  const ratio = clamp((anchor - from.min) / width(from), 0, 1);
  const min = anchor - ratio * w;
  return clampTime({ min, max: min + w }, b);
}

/** Zoom the price axis around `anchor` (the price under the pointer). */
export function zoomPrice(span: Span, anchor: number, factor: number, limits: PriceLimits): Span {
  const w = clamp(width(span) * factor, limits.minSpan, limits.maxSpan);
  const ratio = clamp((anchor - span.min) / width(span), 0, 1);
  const min = anchor - ratio * w;
  return { min, max: min + w };
}

/** Move the time span by `delta` bars, stopping at either end. */
export function panTime(span: Span, delta: number, b: TimeBounds): Span {
  const w = width(span);
  const min = clamp(span.min + delta, b.min, b.max - w);
  return { min, max: min + w };
}

/** Move the price span by `delta`: a manual price scale can go past the data. */
export function panPrice(span: Span, delta: number): Span {
  return { min: span.min + delta, max: span.max + delta };
}

/** Drag on the price axis: scale around the centre. */
export function scalePrice(span: Span, factor: number, limits: PriceLimits): Span {
  const centre = (span.min + span.max) / 2;
  const half = clamp(width(span) * factor, limits.minSpan, limits.maxSpan) / 2;
  return { min: centre - half, max: centre + half };
}

/** Drag on the time axis: stretch from the right edge. */
export function scaleTime(span: Span | null, factor: number, b: TimeBounds): Span | null {
  const from = span ?? { min: b.min, max: b.max };
  const full = b.max - b.min;
  const w = clamp(width(from) * factor, b.minSpan, full);
  if (w >= full - EPS) return null;
  const min = Math.max(b.min, from.max - w);
  return clampTime({ min, max: min + w }, b);
}

/** The rectangle of a box zoom, corner to corner in axis units; a side
 *  thinner than its minimum grows to it around its centre. */
export function boxSpans(a: { x: number; y: number }, c: { x: number; y: number }, time: TimeBounds, price: PriceLimits): Viewport {
  const grow = (lo: number, hi: number, min: number): Span => {
    if (hi - lo >= min) return { min: lo, max: hi };
    const mid = (lo + hi) / 2;
    return { min: mid - min / 2, max: mid + min / 2 };
  };
  const x = grow(Math.min(a.x, c.x), Math.max(a.x, c.x), time.minSpan);
  const y = grow(Math.min(a.y, c.y), Math.max(a.y, c.y), price.minSpan);
  return { x: clampTime(x, time), y: width(y) > price.maxSpan ? null : y };
}

/* ── The live edge ── */

/** New bars arrived (the last bar went from `before` to `after`). A view that
 *  shows the last bar moves on with them; one panned back holds still. */
export function followFeed(span: Span | null, before: number, after: number): Span | null {
  if (span === null) return null;
  if (span.max >= before - EPS) return { min: span.min + (after - before), max: span.max + (after - before) };
  return span;
}

/** True when the reader has moved the view so the latest bar is off screen. */
export function isAwayFromLive(span: Span | null, lastBar: number): boolean {
  return span !== null && span.max < lastBar - EPS;
}

/** Back to the latest bar: the same zoom, with the right edge at the axis end. */
export function backToLive(span: Span | null, b: TimeBounds): Span | null {
  if (span === null) return null;
  const w = width(span);
  if (w >= b.max - b.min - EPS) return null;
  return { min: b.max - w, max: b.max };
}

/* ── Input ── */

/** How much one wheel event zooms (above 1 zooms out). A line-mode wheel is
 *  counted as 16 pixels a line, a page as 400; one flick is capped at twice. */
export function wheelFactor(deltaY: number, deltaMode: number): number {
  const px = deltaMode === 1 ? deltaY * 16 : deltaMode === 2 ? deltaY * 400 : deltaY;
  return clamp(Math.exp(px * 0.002), 0.5, 2);
}

export type KeyAction =
  | { kind: "panTime"; by: number }
  | { kind: "panPrice"; by: number }
  | { kind: "zoom"; in: boolean; axis: "time" | "price" }
  | { kind: "reset" }
  | { kind: "live" };

/** The chart's keys, when it has focus. Pans are a share of the span on
 *  screen (Shift for a bigger step). */
export function keyAction(key: string, shift: boolean): KeyAction | null {
  const step = shift ? 0.5 : 0.1;
  switch (key) {
    case "ArrowLeft": return { kind: "panTime", by: -step };
    case "ArrowRight": return { kind: "panTime", by: step };
    case "ArrowUp": return { kind: "panPrice", by: step };
    case "ArrowDown": return { kind: "panPrice", by: -step };
    case "+": case "=": return { kind: "zoom", in: true, axis: "time" };
    case "-": case "_": return { kind: "zoom", in: false, axis: "time" };
    case "PageUp": return { kind: "zoom", in: true, axis: "price" };
    case "PageDown": return { kind: "zoom", in: false, axis: "price" };
    case "0": case "Home": return { kind: "reset" };
    case "End": return { kind: "live" };
    default: return null;
  }
}

/* ── Go to ── */

export type GoToInput =
  | { mode: "date"; date: string; time: string }
  | { mode: "range"; fromDate: string; fromTime: string; toDate: string; toTime: string };
export type GoToField = "date" | "time" | "fromDate" | "fromTime" | "toDate" | "toTime";
export type GoToResult = { ok: true; from: number; to: number } | { ok: false; field: GoToField; error: string };

/** A Go to on one date shows this much either side of its time. */
export const GO_TO_HALF_WINDOW = 45 * 60_000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAY_LABEL = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** "2026-01-05" as "5 Jan 2026". */
export function dayLabel(day: string): string {
  return DAY_LABEL.format(Date.parse(`${day}T00:00:00Z`));
}
/** A time as its UTC day ("2026-01-05"). */
export function dayOf(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

/** Read the dialog's fields. Dates must lie within `bounds` (inclusive days);
 *  an empty time is the start of the day. Errors are plain sentences. */
export function parseGoTo(input: GoToInput, bounds: { first: string; last: string }): GoToResult {
  const outside = `Pick a date from ${dayLabel(bounds.first)} to ${dayLabel(bounds.last)}.`;
  const at = (date: string, time: string, dateField: GoToField, timeField: GoToField): { t: number } | { field: GoToField; error: string } => {
    if (!DATE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) return { field: dateField, error: "Enter a date." };
    if (date < bounds.first || date > bounds.last) return { field: dateField, error: outside };
    if (time && !TIME.test(time)) return { field: timeField, error: "Enter a time as HH:MM, for example 10:30." };
    return { t: Date.parse(`${date}T${time || "00:00"}:00Z`) };
  };
  if (input.mode === "date") {
    const r = at(input.date.trim(), input.time.trim(), "date", "time");
    if (!("t" in r)) return { ok: false, ...r };
    return { ok: true, from: r.t - GO_TO_HALF_WINDOW, to: r.t + GO_TO_HALF_WINDOW };
  }
  const from = at(input.fromDate.trim(), input.fromTime.trim(), "fromDate", "fromTime");
  if (!("t" in from)) return { ok: false, ...from };
  const to = at(input.toDate.trim(), input.toTime.trim(), "toDate", "toTime");
  if (!("t" in to)) return { ok: false, ...to };
  if (to.t <= from.t) return { ok: false, field: "toDate", error: "The end must be after the start." };
  return { ok: true, from: from.t, to: to.t };
}

/** The bars a time window holds, as a span of positions (bars are addressed
 *  by position; `times` is each bar's start). Null when no bar falls in it. */
export function goToSpan(times: readonly number[], from: number, to: number, minSpan: number): Span | null {
  let first = -1;
  let last = -1;
  for (let i = 0; i < times.length; i++) {
    if (times[i] < from) continue;
    if (times[i] > to) break;
    if (first < 0) first = i;
    last = i;
  }
  if (first < 0) return null;
  const span = { min: first - 0.5, max: last + 0.5 };
  if (width(span) >= minSpan) return span;
  const mid = (span.min + span.max) / 2;
  return { min: mid - minSpan / 2, max: mid + minSpan / 2 };
}

/** Which bars answer a Go to window: the ones on the chart now ("here"), a
 *  longer range's ("wider"), or none. The chart's own bars are enough when
 *  they start at or before the window; when the window starts earlier, a
 *  longer range is taken if it holds more of the window (so a window that
 *  straddles the range's start is shown whole, not cut to what was on
 *  screen). `wider` is the bars the shortest range reaching `from` would
 *  show, or null when there is none. */
export function goToPlan(shown: readonly number[], wider: readonly number[] | null, from: number, to: number): "here" | "wider" | "none" {
  const count = (times: readonly number[]) => { let n = 0; for (const t of times) if (t >= from && t <= to) n++; return n; };
  const here = count(shown);
  if (shown.length && shown[0] <= from) return here ? "here" : "none";
  if (wider && count(wider) > here) return "wider";
  return here ? "here" : "none";
}
