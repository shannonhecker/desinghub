/* ══════════════════════════════════════════════════════════
   Per-type DEFAULT layout stamped onto newly created blocks
   (library click-to-add, drag-drop, chat add). Kept in its own
   dependency-free module so both the store (addBlockFromLibrary)
   and the drop handlers can read it without an import cycle
   through blockRegistry.

   Why: an unsized block defaults to width "fill" + stretch, which
   is right for inputs/cards/tables but wrong for selection
   controls — a checkbox or switch dropped into the body rendered
   as a full-width "selected bar". These types hug their content
   instead. Only the DEFAULT changes: users can still set any
   width/align in the inspector, and existing saved blocks are
   untouched (the stamp happens at creation time only).
   ══════════════════════════════════════════════════════════ */

import type { LayoutProps } from "@/store/useBuilder";

const HUG_CONTENT: LayoutProps = { width: "auto", align: "start" };

const DEFAULT_BLOCK_LAYOUTS: Record<string, LayoutProps> = {
  SimulatedCheckbox: HUG_CONTENT,
  SimulatedSwitch: HUG_CONTENT,
  SimulatedToggleButton: HUG_CONTENT,
  /* Spacer is a fixed-size gutter sized by its own `size` prop; hugging keeps
     it from stretching to fill a row and swallowing the whole zone. */
  Spacer: HUG_CONTENT,
};

/** Default `layout` for a block type, or undefined when the type keeps
 *  the container-driven default (fill/stretch). Returns a fresh copy so
 *  callers can mutate the block's layout safely. */
export function defaultLayoutForType(type: string): LayoutProps | undefined {
  const layout = DEFAULT_BLOCK_LAYOUTS[type];
  return layout ? { ...layout } : undefined;
}
