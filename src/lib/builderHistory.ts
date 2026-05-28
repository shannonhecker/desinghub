/**
 * Undo / redo history for the Builder canvas.
 *
 * Subscribes to useBuilder and snapshots the *canvas-relevant* slice
 * of state (blocks across all four zones, selectedComponents, active
 * template) after each change. Non-canvas state (chat messages, theme,
 * generating spinner) is deliberately NOT captured so that Cmd+Z
 * doesn't rewind a conversation or an irrelevant UI toggle.
 *
 * Implementation notes:
 * - RAF-debounced snapshots keep a rapid burst of property-editor
 *   tweaks from filling the past stack.
 * - An "applying" flag suppresses capture during undo()/redo() so we
 *   don't record our own restore operations as new history entries.
 * - Bounded ring buffer (MAX_HISTORY = 50) caps memory.
 */

import { useBuilder, type Block, type DesignSystem, type BuilderMode } from "@/store/useBuilder";

const MAX_HISTORY = 50;

/* Unified snapshot covers EVERY slice that an AI turn or canvas mutation
   may change. Previously `designSystem`, `mode`, `density`, `themeKey`,
   `colorOverrides` lived only on the deprecated store/useBuilderHistory
   stack, so an AI DS-switch followed by Cmd+Z silently failed to restore
   the DS (the lib/ snapshot didn't carry that field). Unifying here so
   one stack handles every undoable change. */
interface CanvasSnapshot {
  blocks: Block[];
  headerBlocks: Block[];
  sidebarBlocks: Block[];
  footerBlocks: Block[];
  selectedComponents: string[];
  activeTemplateId: string | null;
  designSystem: DesignSystem;
  mode: BuilderMode;
  density: string;
  themeKey: string;
  colorOverrides: Record<string, string>;
}

let past: CanvasSnapshot[] = [];
let future: CanvasSnapshot[] = [];
let lastCaptured: CanvasSnapshot | null = null;
/** Monotonic counter: > 0 means an apply() is in-flight and the
 *  subscription should skip capture. Using a counter (not a boolean)
 *  handles overlapping applies cleanly - each apply() increments on
 *  entry and decrements on its own RAF completion. */
let applyingCount = 0;
let pendingRaf: number | null = null;
let initialized = false;
/** Set by pushSnapshot() to mute exactly ONE upcoming subscription
 *  capture (or undo()'s flush-pending-RAF path). Without this, an
 *  explicit pushSnapshot would race the subscription's RAF and produce
 *  duplicate past[] entries for the same logical change. */
let suppressNextCapture = false;

function snap(): CanvasSnapshot {
  const s = useBuilder.getState();
  return {
    blocks: s.blocks,
    headerBlocks: s.headerBlocks,
    sidebarBlocks: s.sidebarBlocks,
    footerBlocks: s.footerBlocks,
    selectedComponents: s.selectedComponents,
    activeTemplateId: s.activeTemplateId,
    designSystem: s.designSystem,
    mode: s.mode,
    density: s.density,
    themeKey: s.themeKey,
    colorOverrides: { ...s.colorOverrides },
  };
}

function sameSnapshot(a: CanvasSnapshot, b: CanvasSnapshot): boolean {
  /* Reference equality on arrays and the override map is good enough for
     Zustand's immutable updates. colorOverrides is shallow-copied on
     capture so reference identity tracks intent (a re-spread = "changed"). */
  return (
    a.blocks === b.blocks &&
    a.headerBlocks === b.headerBlocks &&
    a.sidebarBlocks === b.sidebarBlocks &&
    a.footerBlocks === b.footerBlocks &&
    a.selectedComponents === b.selectedComponents &&
    a.activeTemplateId === b.activeTemplateId &&
    a.designSystem === b.designSystem &&
    a.mode === b.mode &&
    a.density === b.density &&
    a.themeKey === b.themeKey &&
    a.colorOverrides === b.colorOverrides
  );
}

function scheduleCapture() {
  if (applyingCount > 0) return;
  if (pendingRaf !== null) return;
  if (typeof window === "undefined") return;
  pendingRaf = requestAnimationFrame(() => {
    pendingRaf = null;
    // Re-check the guard at flush time in case an apply() started
    // between scheduling and this callback.
    if (applyingCount > 0) return;
    if (suppressNextCapture) {
      // pushSnapshot already wrote the canonical past[] entry for this
      // logical change; re-anchor lastCaptured so subsequent diffs work,
      // but don't push a duplicate.
      suppressNextCapture = false;
      lastCaptured = snap();
      return;
    }
    const current = snap();
    if (lastCaptured && sameSnapshot(lastCaptured, current)) return;
    if (lastCaptured) {
      past.push(lastCaptured);
      if (past.length > MAX_HISTORY) past = past.slice(past.length - MAX_HISTORY);
      future = [];
    }
    lastCaptured = current;
  });
}

function apply(snapshot: CanvasSnapshot) {
  applyingCount++;
  useBuilder.setState({
    blocks: snapshot.blocks,
    headerBlocks: snapshot.headerBlocks,
    sidebarBlocks: snapshot.sidebarBlocks,
    footerBlocks: snapshot.footerBlocks,
    selectedComponents: snapshot.selectedComponents,
    activeTemplateId: snapshot.activeTemplateId,
    designSystem: snapshot.designSystem,
    mode: snapshot.mode,
    density: snapshot.density,
    themeKey: snapshot.themeKey,
    colorOverrides: snapshot.colorOverrides,
    /* hasOverrides is a derived flag that store/useBuilderHistory used
       to set alongside colorOverrides. Mirror that derivation so a
       restored snapshot with overrides preserves the conditional UI. */
    hasOverrides: Object.keys(snapshot.colorOverrides).length > 0,
  });
  lastCaptured = snapshot;
  useBuilder.getState().bumpPreview();
  // Release the guard on the next tick so the subscription's scheduled
  // capture (which runs in a RAF) doesn't snapshot our restore. Uses
  // a counter so overlapping undo/redo calls don't prematurely re-arm
  // capture while a prior apply is still settling.
  requestAnimationFrame(() => {
    applyingCount = Math.max(0, applyingCount - 1);
  });
}

/** Synchronously capture the current state as an undo target.
 *
 *  Used by callers that mutate state imperatively in a single tick
 *  (e.g. `applyAIActions` running 6 store mutations) and need a
 *  guaranteed pre-mutation snapshot — unconditionally, not gated on
 *  `sameSnapshot(lastCaptured, current)`.
 *
 *  Flushes any pending RAF first so its post-mutation capture can't fire
 *  later and corrupt the new redo lineage; then pushes the current snap
 *  to past[], anchors `lastCaptured` to current, and clears future[]. */
export function pushSnapshot() {
  if (pendingRaf !== null) {
    cancelAnimationFrame(pendingRaf);
    pendingRaf = null;
  }
  const current = snap();
  past.push(current);
  if (past.length > MAX_HISTORY) past = past.slice(past.length - MAX_HISTORY);
  lastCaptured = current;
  future = [];
  /* Mute the next implicit capture (subscription RAF or undo() flush)
     so the imminent setState() calls don't double-push this same
     pre-mutation state. */
  suppressNextCapture = true;
}

export function initBuilderHistory(): () => void {
  if (initialized) return () => {};
  initialized = true;
  lastCaptured = snap();

  const unsubscribe = useBuilder.subscribe((state, prev) => {
    // Cheap gate: only scheduleCapture if something in our slice changed
    if (
      state.blocks === prev.blocks &&
      state.headerBlocks === prev.headerBlocks &&
      state.sidebarBlocks === prev.sidebarBlocks &&
      state.footerBlocks === prev.footerBlocks &&
      state.selectedComponents === prev.selectedComponents &&
      state.activeTemplateId === prev.activeTemplateId &&
      state.designSystem === prev.designSystem &&
      state.mode === prev.mode &&
      state.density === prev.density &&
      state.themeKey === prev.themeKey &&
      state.colorOverrides === prev.colorOverrides
    ) {
      return;
    }
    scheduleCapture();
  });

  return () => {
    unsubscribe();
    initialized = false;
    past = [];
    future = [];
    lastCaptured = null;
    applyingCount = 0;
    suppressNextCapture = false;
    if (pendingRaf !== null) {
      cancelAnimationFrame(pendingRaf);
      pendingRaf = null;
    }
  };
}

export function canUndo(): boolean {
  return past.length > 0;
}

export function canRedo(): boolean {
  return future.length > 0;
}

export function undo(): boolean {
  // Flush any pending capture so the current live state becomes available
  // for redo before we pop.
  if (pendingRaf !== null) {
    cancelAnimationFrame(pendingRaf);
    pendingRaf = null;
    if (suppressNextCapture) {
      // pushSnapshot already recorded the pre-mutation state; just
      // re-anchor lastCaptured to the now-current post-mutation state.
      suppressNextCapture = false;
      lastCaptured = snap();
    } else {
      const current = snap();
      if (lastCaptured && !sameSnapshot(lastCaptured, current)) {
        past.push(lastCaptured);
        if (past.length > MAX_HISTORY) past = past.slice(past.length - MAX_HISTORY);
      }
      lastCaptured = current;
    }
  }
  const prior = past.pop();
  if (!prior) return false;
  if (lastCaptured) future.push(lastCaptured);
  apply(prior);
  return true;
}

export function redo(): boolean {
  const next = future.pop();
  if (!next) return false;
  if (lastCaptured) past.push(lastCaptured);
  apply(next);
  return true;
}

/** Exposed for dev-tool / diagnostic uses. */
export function getHistoryStats() {
  return { pastLength: past.length, futureLength: future.length };
}
