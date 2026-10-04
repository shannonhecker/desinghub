/* ════════════════════════════════════════════════════════════
   useChartNavigation: one local viewport applied to the drawn chart.
   The rail's actions and the keys move it; the feed asks it what the
   time axis should do; in Edit it does nothing.
   ════════════════════════════════════════════════════════════ */

import { describe, it, expect, afterEach, beforeAll, vi } from "vitest";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import type HighchartsReact from "highcharts-react-official";
import { useChartNavigation, type ChartNavigation } from "../useChartNavigation";

beforeAll(() => { (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true; });

/** A stand-in for the drawn chart: two axes that record their extremes. */
function fakeChart() {
  const axis = (min: number, max: number) => {
    const a = {
      options: { max } as { max?: number },
      user: null as [number, number] | null,
      setExtremes: vi.fn((lo?: number, hi?: number) => { a.user = lo === undefined || hi === undefined ? null : [lo, hi]; }),
      update: vi.fn((o: { max?: number }) => { a.options = { ...a.options, ...o }; }),
      getExtremes: () => ({ min: a.user?.[0] ?? min, max: a.user?.[1] ?? max, dataMin: min, dataMax: max }),
    };
    return a;
  };
  const x = axis(-0.5, 157.5);
  const y = axis(1.376, 1.378);
  return { x, y, chart: { xAxis: [x], yAxis: [{}, y], redraw: vi.fn() } };
}

let root: Root | null = null;
let host: HTMLDivElement | null = null;
afterEach(() => { act(() => root?.unmount()); host?.remove(); root = null; host = null; window.localStorage.clear(); });

function mount(enabled: boolean, viewKey = "a") {
  const fake = fakeChart();
  const out: { nav: ChartNavigation | null; plot: HTMLDivElement | null } = { nav: null, plot: null };
  function Harness({ k }: { k: string }) {
    const chartRef = React.useRef({ chart: fake.chart } as unknown as HighchartsReact.RefObject);
    const plotRef = React.useRef<HTMLDivElement>(null);
    const nav = useChartNavigation({ chartRef, plotRef, enabled, viewKey: k, build: fake, axisMax: () => 157.5, lastBar: () => 149, accent: "teal" });
    React.useEffect(() => { out.nav = nav; out.plot = plotRef.current; });
    return <div ref={plotRef} tabIndex={0} onKeyDown={nav.onKeyDown} />;
  }
  host = document.createElement("div");
  document.body.appendChild(host);
  act(() => { root = createRoot(host!); root.render(<Harness k={viewKey} />); });
  const rerender = (k: string) => act(() => { root!.render(<Harness k={k} />); });
  return { fake, out, rerender };
}

describe("useChartNavigation", () => {
  it("zoom in keeps the latest bar in place while following; the view is on the plot element", () => {
    const { fake, out } = mount(true);
    act(() => out.nav!.zoomIn());
    const [min, max] = fake.x.user!;
    expect(max - min).toBeCloseTo(158 / 1.25, 6);
    /* The latest bar's right edge (149.5) is where it was: 8 bars from the axis end. */
    expect((149.5 - min) / (max - min)).toBeCloseTo((149.5 + 0.5) / 158, 6);
    expect(out.nav!.status.zoomed).toBe(true);
    expect(out.nav!.status.away).toBe(false);
    expect(out.plot!.dataset.viewX).toBeDefined();
    expect(fake.chart.redraw).toHaveBeenCalledTimes(1);
  });

  it("tells the feed what the time axis does: full view, following, or held", () => {
    const { out } = mount(true);
    /* The full view: the walk-in step owns the axis. */
    expect(out.nav!.holdTime(149, 150)).toBeNull();
    act(() => out.nav!.zoomIn());
    const following = out.nav!.viewport().x!;
    const moved = out.nav!.holdTime(149, 150)!;
    expect(moved.min).toBeCloseTo(following.min + 1, 6);
    /* Panned back: it holds still, and the rail offers the way back. */
    act(() => out.nav!.setViewport({ x: { min: 20, max: 60 }, y: null }));
    expect(out.nav!.status.away).toBe(true);
    expect(out.nav!.holdTime(150, 151)).toEqual({ min: 20, max: 60 });
    act(() => out.nav!.backToLive());
    expect(out.nav!.viewport().x).toEqual({ min: 117.5, max: 157.5 });
    expect(out.nav!.status.away).toBe(false);
  });

  it("reset clears both axes back to the chart's own extremes", () => {
    const { fake, out } = mount(true);
    act(() => out.nav!.setViewport({ x: { min: 20, max: 60 }, y: { min: 1.3765, max: 1.3775 } }));
    expect(fake.y.user).toEqual([1.3765, 1.3775]);
    act(() => out.nav!.reset());
    expect(fake.x.user).toBeNull();
    expect(fake.y.user).toBeNull();
    expect(out.nav!.status.zoomed).toBe(false);
    expect(out.plot!.dataset.viewX).toBeUndefined();
  });

  it("a Go to window is marked custom until the view is moved", () => {
    const { out } = mount(true);
    act(() => out.nav!.showSpan({ min: 30, max: 90 }));
    expect(out.nav!.status.custom).toBe(true);
    act(() => out.nav!.zoomOut());
    expect(out.nav!.status.custom).toBe(false);
  });

  it("a new order, interval or range starts from the full view", () => {
    const { out, rerender } = mount(true);
    act(() => out.nav!.setViewport({ x: { min: 20, max: 60 }, y: null }));
    rerender("b");
    expect(out.nav!.viewport()).toEqual({ x: null, y: null });
    expect(out.nav!.status.zoomed).toBe(false);
  });

  it("keys pan and zoom when the plot itself has focus; in Edit they do nothing", () => {
    const on = mount(true);
    const key = (el: HTMLElement, k: string) => act(() => { el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true })); });
    key(on.out.plot!, "+");
    expect(on.fake.x.user).not.toBeNull();
    key(on.out.plot!, "0");
    expect(on.fake.x.user).toBeNull();
    act(() => root?.unmount());
    host?.remove();
    const off = mount(false);
    key(off.out.plot!, "+");
    expect(off.fake.x.setExtremes).not.toHaveBeenCalled();
    expect(off.out.nav!.status.zoomed).toBe(false);
  });

  it("the press-and-hold hint shows once, on the first move, and Got it stores that", () => {
    const { out } = mount(true);
    act(() => out.nav!.zoomIn());
    expect(out.nav!.status.hint).toBe(true);
    act(() => out.nav!.dismissHint());
    expect(out.nav!.status.hint).toBe(false);
    act(() => root?.unmount());
    host?.remove();
    const again = mount(true);
    act(() => again.out.nav!.zoomIn());
    expect(again.out.nav!.status.hint).toBe(false);
  });
});
