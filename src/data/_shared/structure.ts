/**
 * Structure-padding type system. Each DS exports a `<DS>_STRUCTURE_PADDING`
 * scale typed against `StructurePaddingScale` so the cross-DS resolver
 * can mix-and-match without losing type safety.
 *
 * `canvas` — outer canvas wrapper padding
 * `zone`   — header / sidebar / body / footer interior padding
 * `block`  — chrome wrapper around each rendered DS component
 * `gap`    — sibling spacing inside each zone
 *
 * Padding is orthogonal to density (component sizing). Each DS's S/M/L
 * values stay native to that DS's spacing rhythm.
 */

export type StructurePaddingSize = "small" | "medium" | "large";

export interface StructurePaddingValue {
  canvas: number;
  zone: number;
  block: number;
  gap: number;
}

export type StructurePaddingScale = Record<StructurePaddingSize, StructurePaddingValue>;
