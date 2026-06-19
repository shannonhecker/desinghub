import type { Block } from "@/store/useBuilder";
import { colSpanToWidth } from "./layoutResolver";

/**
 * One-time migration: convert a block's legacy `props.colSpan` (1|2|3) to
 * the canonical `layout.width`, then drop `colSpan`. An explicit
 * `layout.width` wins (colSpan only fills an ABSENT width); `colSpan` is
 * always removed. Recurses into LayoutGroup `children`. Pure — returns new
 * block objects, never mutates the input.
 *
 * Runs at the persistence boundaries (firebase loadProject, share decode)
 * so sessions saved before the unified width model load and render
 * identically. `colSpanToWidth` is reused as the single source of truth for
 * the mapping, and the resolver keeps its colSpan fallback as a safety net
 * for any block that slips through un-migrated.
 */
export function migrateColSpanToWidth(block: Block): Block {
  const props = block.props as Record<string, unknown>;
  const hasColSpan = props.colSpan !== undefined;

  let layout = block.layout;
  let nextProps = block.props;
  if (hasColSpan) {
    const { colSpan, ...rest } = props;
    nextProps = rest;
    if (layout?.width === undefined) {
      layout = { ...layout, width: colSpanToWidth(colSpan) ?? "fill" };
    }
  }

  const children = block.children?.map(migrateColSpanToWidth);

  return {
    ...block,
    props: nextProps,
    ...(layout !== undefined ? { layout } : {}),
    ...(children !== undefined ? { children } : {}),
  };
}

/**
 * P3-3 column-start hygiene. `layout.gridCol` is authored as a canonical-12
 * column LINE, so normalize it on load to a positive integer in [1, 12]: a
 * fractional value is floored, an out-of-canonical value is clamped to 12, and a
 * non-positive / non-finite / non-numeric value is DROPPED so the block
 * auto-places (today's default) instead of carrying a bad pin. The resolver +
 * exporters still re-clamp the range proportionally against each grid at render;
 * this pass keeps the PERSISTED value clean, and the share-decode path adds its
 * own clamp for forged payloads. Pure; recurses into LayoutGroup children.
 */
export function migrateGridCol(block: Block): Block {
  const children = block.children?.map(migrateGridCol);
  let nextLayout = block.layout;
  if (block.layout && block.layout.gridCol !== undefined) {
    const { gridCol, ...rest } = block.layout;
    const n = Math.floor(Number(gridCol));
    nextLayout = Number.isFinite(n) && n >= 1 ? { ...rest, gridCol: Math.min(n, 12) } : rest;
  }
  return {
    ...block,
    ...(nextLayout !== undefined ? { layout: nextLayout } : {}),
    ...(children !== undefined ? { children } : {}),
  };
}

/** Migrate a whole zone array of blocks: colSpan→width, then gridCol hygiene. */
export function migrateBlocks(blocks: Block[]): Block[] {
  return blocks.map((b) => migrateGridCol(migrateColSpanToWidth(b)));
}
