"use client";

import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { useBuilder } from "@/store/useBuilder";
import { EXECUTION_KEYS } from "@/lib/executionModel";
import {
  createTicker, executionOrderOf, feedBaseView, FEED_MAX_BARS, FEED_SEED, FEED_TICK_MS, withFeed,
  type FeedSample, type Ticker,
} from "@/lib/executionFeed";
import type { ReportState } from "@/lib/reportData/binding";
import type { ReportDataset } from "@/lib/reportData/types";
import { usePreviewReadOnly } from "./previewReadOnly";

/* ══════════════════════════════════════════════════════════
   useExecutionFeed - the sample feed's clock, for this tab only.

   One timer for the page, however many blocks read the feed. It runs
   while at least one block holds it (the chart or the header, while
   presenting with the feed switched on), the tab is visible, and the
   reader has not asked for reduced motion (then it starts paused until
   they press Resume). The bars live here, in memory: they are never
   written to the builder store, so they never reach the dataset, a
   saved session, a share or an export. Reset starts the seeded session
   again; choosing another order starts that order's.
   ══════════════════════════════════════════════════════════ */

interface FeedStore {
  /** Which dataset and order the bars belong to. */
  key: string | null;
  samples: readonly FeedSample[];
  /** Bumped when the bars start again (reset, another order): the chart redraws from scratch. */
  generation: number;
  running: boolean;
  /** Held paused for reduced motion until the reader resumes. */
  motionHold: boolean;
  hidden: boolean;
}

const INITIAL: FeedStore = { key: null, samples: [], generation: 0, running: false, motionHold: false, hidden: false };
export const useFeedStore = create<FeedStore>(() => ({ ...INITIAL }));

let ticker: Ticker | null = null;
let makeTicker: (() => Ticker | null) | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const holders = new Set<symbol>();
let motionChecked = false;
let stopListening: (() => void) | null = null;

function sync(): void {
  const s = useFeedStore.getState();
  const want = holders.size > 0 && ticker !== null && !s.hidden && !s.motionHold && s.samples.length < FEED_MAX_BARS;
  if (want && timer === null) timer = setInterval(tick, FEED_TICK_MS);
  if (!want && timer !== null) { clearInterval(timer); timer = null; }
  if (s.running !== want) useFeedStore.setState({ running: want });
}

function tick(): void {
  if (!ticker) return;
  const sample = ticker.next();
  useFeedStore.setState((s) => ({ samples: [...s.samples, sample] }));
  if (useFeedStore.getState().samples.length >= FEED_MAX_BARS) sync();
}

/** Point the feed at a dataset and order; a different one starts afresh. */
function adopt(key: string, make: () => Ticker | null): void {
  makeTicker = make;
  if (useFeedStore.getState().key === key && ticker) return;
  ticker = make();
  useFeedStore.setState((s) => ({ key, samples: [], generation: s.generation + 1 }));
  sync();
}

const isHidden = (): boolean => typeof document !== "undefined" && document.visibilityState === "hidden";

function hold(id: symbol): void {
  holders.add(id);
  if (!motionChecked) {
    motionChecked = true;
    const reduce = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) useFeedStore.setState({ motionHold: true });
  }
  if (!stopListening && typeof document !== "undefined") {
    const onVisibility = () => { useFeedStore.setState({ hidden: isHidden() }); sync(); };
    document.addEventListener("visibilitychange", onVisibility);
    /* The reader can change the motion setting while the page is open. */
    const motion = typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    const onMotion = () => { useFeedStore.setState({ motionHold: Boolean(motion?.matches) }); sync(); };
    motion?.addEventListener?.("change", onMotion);
    stopListening = () => {
      document.removeEventListener("visibilitychange", onVisibility);
      motion?.removeEventListener?.("change", onMotion);
    };
    useFeedStore.setState({ hidden: isHidden() });
  }
  sync();
}

function release(id: symbol): void {
  holders.delete(id);
  if (holders.size === 0 && stopListening) { stopListening(); stopListening = null; }
  sync();
}

/** Start the seeded session again (the timer, if any, carries on). */
export function resetFeed(): void {
  if (!makeTicker) return;
  ticker = makeTicker();
  useFeedStore.setState((s) => ({ samples: [], generation: s.generation + 1 }));
  sync();
}

/** Lift the reduced-motion hold (the reader pressed Resume). */
export function resumeFeed(): void {
  useFeedStore.setState({ motionHold: false });
  sync();
}

/** Tests only: forget everything, stop the timer. */
export function __resetFeedForTests(): void {
  if (timer !== null) clearInterval(timer);
  timer = null;
  ticker = null;
  makeTicker = null;
  holders.clear();
  motionChecked = false;
  stopListening?.();
  stopListening = null;
  useFeedStore.setState({ ...INITIAL });
}

/* The dataset with the bars laid over it, once per set of bars however many
   blocks ask (each tick is a new samples array). */
let lastOverlay: { dataset: ReportDataset; order: string; samples: readonly FeedSample[]; out: ReportDataset } | null = null;
export function liveDataset(dataset: ReportDataset, order: string, samples: readonly FeedSample[]): ReportDataset {
  if (lastOverlay && lastOverlay.dataset === dataset && lastOverlay.order === order && lastOverlay.samples === samples) return lastOverlay.out;
  const out = withFeed(dataset, order, samples);
  lastOverlay = { dataset, order, samples, out };
  return out;
}

/* A dataset's identity for the key: an uploaded workbook starts its own feed. */
const ids = new WeakMap<ReportDataset, number>();
let nextId = 1;
function datasetId(dataset: ReportDataset): number {
  let id = ids.get(dataset);
  if (id === undefined) { id = nextId++; ids.set(dataset, id); }
  return id;
}
function feedKey(dataset: ReportDataset, state: ReportState): string | null {
  const order = executionOrderOf(dataset, state);
  return order === null ? null : `${datasetId(dataset)}:${order}`;
}

export interface ExecutionFeed {
  /** The bars added so far for the order on screen. */
  samples: readonly FeedSample[];
  /** Changes when the bars start again. */
  generation: number;
  /** True while bars are being added. */
  running: boolean;
  /** True once the feed has added all the bars it will (Reset starts again). */
  ended: boolean;
  /** The bars right now, without subscribing (for building a chart once). */
  peek: () => readonly FeedSample[];
}

const NONE: readonly FeedSample[] = [];

/**
 * The feed for a block that shows it. `active`: the block wants it running
 * (presenting, with the feed switched on). Holding it starts the shared
 * timer; unmounting or going inactive lets it go.
 */
export function useExecutionFeed({ dataset, state, active }: { dataset: ReportDataset | null; state: ReportState; active: boolean }): ExecutionFeed {
  const order = state[EXECUTION_KEYS.order];
  const key = useMemo(() => (dataset ? feedKey(dataset, order ? { [EXECUTION_KEYS.order]: order } : {}) : null), [dataset, order]);

  useEffect(() => {
    if (!dataset || !key) return;
    adopt(key, () => {
      const base = feedBaseView(dataset, order ? { [EXECUTION_KEYS.order]: order } : {});
      return base ? createTicker(base, FEED_SEED) : null;
    });
  }, [dataset, key, order]);

  useEffect(() => {
    if (!active || !key) return;
    const id = Symbol("feed");
    hold(id);
    return () => release(id);
  }, [active, key]);

  const mine = useFeedStore((s) => s.key === key && key !== null);
  const samples = useFeedStore((s) => s.samples);
  const generation = useFeedStore((s) => s.generation);
  const running = useFeedStore((s) => s.running);
  const peek = useMemo(() => () => {
    const s = useFeedStore.getState();
    return key !== null && s.key === key ? s.samples : NONE;
  }, [key]);
  return {
    peek,
    samples: mine ? samples : NONE,
    generation,
    running: mine && active && running,
    ended: mine && samples.length >= FEED_MAX_BARS,
  };
}

/**
 * The canvas dataset with the feed's bars laid over it, for the blocks
 * that read tables (the header, the statistics, the gauge, the donut).
 * Only while presenting: Edit shows the report as saved.
 */
export function useFeedDataset(dataset: ReportDataset | null): ReportDataset | null {
  const readOnly = usePreviewReadOnly();
  const order = useBuilder((s) => s.reportState[EXECUTION_KEYS.order]);
  const key = useFeedStore((s) => s.key);
  const samples = useFeedStore((s) => s.samples);
  return useMemo(() => {
    if (!readOnly || !dataset || samples.length === 0 || key === null) return dataset;
    const state: ReportState = order ? { [EXECUTION_KEYS.order]: order } : {};
    if (feedKey(dataset, state) !== key) return dataset;
    return liveDataset(dataset, executionOrderOf(dataset, state)!, samples);
  }, [readOnly, dataset, order, key, samples]);
}

/** Live / Paused and Reset. Pausing is report state (`fxLive`), so the
 *  chat and a saved report see it; Reset is for this tab only. */
export function useFeedControls(): { pause: () => void; resume: () => void; reset: () => void } {
  const setReportState = useBuilder((s) => s.setReportState);
  return useMemo(() => ({
    pause: () => setReportState(EXECUTION_KEYS.live, "Off"),
    resume: () => { setReportState(EXECUTION_KEYS.live, "On"); resumeFeed(); },
    reset: resetFeed,
  }), [setReportState]);
}
