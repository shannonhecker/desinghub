/**
 * Undo/redo history for the builder canvas.
 * Tracks snapshots of canvas-related state slices from useBuilder.
 */

import { useBuilder } from "./useBuilder";
import type { Block, DesignSystem, BuilderMode, ZoneId } from "./useBuilder";

interface CanvasSnapshot {
  blocks: Block[];
  headerBlocks: Block[];
  sidebarBlocks: Block[];
  footerBlocks: Block[];
  designSystem: DesignSystem;
  mode: BuilderMode;
  density: string;
  themeKey: string;
  colorOverrides: Record<string, string>;
}

const MAX_HISTORY = 50;

let past: CanvasSnapshot[] = [];
let future: CanvasSnapshot[] = [];

function takeSnapshot(): CanvasSnapshot {
  const s = useBuilder.getState();
  return {
    blocks: s.blocks,
    headerBlocks: s.headerBlocks,
    sidebarBlocks: s.sidebarBlocks,
    footerBlocks: s.footerBlocks,
    designSystem: s.designSystem,
    mode: s.mode,
    density: s.density,
    themeKey: s.themeKey,
    colorOverrides: { ...s.colorOverrides },
  };
}

function applySnapshot(snap: CanvasSnapshot) {
  useBuilder.setState({
    blocks: snap.blocks,
    headerBlocks: snap.headerBlocks,
    sidebarBlocks: snap.sidebarBlocks,
    footerBlocks: snap.footerBlocks,
    designSystem: snap.designSystem,
    mode: snap.mode,
    density: snap.density,
    themeKey: snap.themeKey,
    colorOverrides: snap.colorOverrides,
    hasOverrides: Object.keys(snap.colorOverrides).length > 0,
  });
}

/** Call before any canvas mutation to save the current state */
export function pushSnapshot() {
  past.push(takeSnapshot());
  if (past.length > MAX_HISTORY) past.shift();
  // Any new action clears the redo stack
  future = [];
}

/** Undo the last canvas change */
export function undo() {
  if (past.length === 0) return;
  future.push(takeSnapshot());
  const prev = past.pop()!;
  applySnapshot(prev);
}

/** Redo the last undone change */
export function redo() {
  if (future.length === 0) return;
  past.push(takeSnapshot());
  const next = future.pop()!;
  applySnapshot(next);
}

/** Check if undo/redo is available */
export function canUndo() { return past.length > 0; }
export function canRedo() { return future.length > 0; }

/** Reset history (e.g. on project load) */
export function clearHistory() {
  past = [];
  future = [];
}
