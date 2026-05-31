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

/** Migrate a whole zone array of blocks. */
export function migrateBlocks(blocks: Block[]): Block[] {
  return blocks.map(migrateColSpanToWidth);
}
