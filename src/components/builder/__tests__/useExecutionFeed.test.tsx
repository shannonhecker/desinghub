import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executionDataset, EXECUTION_ORDERS } from "@/lib/reportData/executionDataset";
import { EXECUTION_KEYS } from "@/lib/executionModel";
import { createTicker, feedBaseView, FEED_SEED } from "@/lib/executionFeed";
import { __resetFeedForTests, resetFeed, resumeFeed, useExecutionFeed, useFeedStore, type ExecutionFeed } from "../useExecutionFeed";

const dataset = executionDataset();
const snapshot = JSON.stringify(dataset);

let host: HTMLDivElement;
let root: Root;
let latest: ExecutionFeed | null = null;
function Probe({ state, active }: { state: Record<string, string>; active: boolean }) {
  latest = useExecutionFeed({ dataset, state, active });
  return null;
}
const mount = (state: Record<string, string> = {}, active = true) => act(() => root.render(<Probe state={state} active={active} />));
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

let reducedMotion = false;
let hidden = false;
beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();
  reducedMotion = false;
  hidden = false;
  window.matchMedia = ((q: string) => ({ matches: q.includes("reduce") && reducedMotion, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof window.matchMedia;
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
  __resetFeedForTests();
  host = document.createElement("div");
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  vi.useRealTimers();
});

describe("useExecutionFeed", () => {
  it("adds one bar a second while live, the same bars a ticker gives", () => {
    mount();
    expect(latest!.samples).toHaveLength(0);
    expect(latest!.running).toBe(true);
    advance(3000);
    expect(latest!.samples).toHaveLength(3);
    const ticker = createTicker(feedBaseView(dataset, {})!, FEED_SEED);
    expect(latest!.samples).toEqual([ticker.next(), ticker.next(), ticker.next()]);
  });

  it("does not tick when inactive (Edit, or fxLive Off)", () => {
    mount({}, false);
    advance(5000);
    expect(latest!.samples).toHaveLength(0);
    expect(latest!.running).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("starts paused when the reader prefers reduced motion; Resume starts it", () => {
    reducedMotion = true;
    mount();
    advance(3000);
    expect(latest!.samples).toHaveLength(0);
    expect(latest!.running).toBe(false);
    act(() => resumeFeed());
    advance(2000);
    expect(latest!.samples).toHaveLength(2);
  });

  it("pauses while the tab is hidden and goes on when it is shown again", () => {
    mount();
    advance(2000);
    hidden = true;
    act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    advance(5000);
    expect(latest!.samples).toHaveLength(2);
    expect(latest!.running).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    hidden = false;
    act(() => { document.dispatchEvent(new Event("visibilitychange")); });
    advance(1000);
    expect(latest!.samples).toHaveLength(3);
  });

  it("Reset returns to the seeded session; repeated resets leave one timer", () => {
    mount();
    advance(4000);
    const first = latest!.samples;
    for (let i = 0; i < 5; i++) act(() => resetFeed());
    expect(latest!.samples).toHaveLength(0);
    expect(vi.getTimerCount()).toBe(1);
    advance(4000);
    expect(latest!.samples).toEqual(first);
  });

  it("an order switch starts that order's session; the other order's bars never show", () => {
    mount({ [EXECUTION_KEYS.order]: EXECUTION_ORDERS[0] });
    advance(3000);
    mount({ [EXECUTION_KEYS.order]: EXECUTION_ORDERS[1] });
    expect(latest!.samples).toHaveLength(0);
    advance(2000);
    expect(latest!.samples).toHaveLength(2);
    expect(latest!.samples.every((s) => s.pct === null)).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("unmounting stops the timer; the dataset is never written to", () => {
    mount();
    advance(3000);
    act(() => root.unmount());
    expect(vi.getTimerCount()).toBe(0);
    expect(useFeedStore.getState().running).toBe(false);
    expect(JSON.stringify(dataset)).toBe(snapshot);
    root = createRoot(host);
  });
});
