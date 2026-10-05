/**
 * panelMetrics - the fixed measurements of a framed panel (a chart or a data
 * grid drawn as a card with a header row).
 *
 * They are fixed, and the same in every design system, on purpose: a
 * template's panels must sit at the same position and size whichever system
 * is active, so the frame - not the component inside it - sets the box.
 * PanelFrame publishes them as CSS custom properties; the chart and grid
 * renderers use them to size their content to the space the frame leaves.
 */

/** Header row: title, subtitle, "View by". Tall enough for the tallest
 *  design system's compact select. */
export const PANEL_HEADER_HEIGHT = 48;
/** Padding around the panel body. */
export const PANEL_PADDING = 20;
/** Default overall panel height when a block does not set one. */
export const PANEL_DEFAULT_HEIGHT = 360;
/** Width reserved for the "View by" select. */
export const PANEL_VIEW_BY_WIDTH = 176;

/** Below this width a panel with a "View by" select stacks its header: the
 *  title on one line, the select and the tools on the next. */
export const PANEL_STACK_WIDTH = 340;
/** Height the second header line adds. */
export const PANEL_STACK_ROW = 28;

/** The dense report grid's row and header heights (SimulatedDataGrid). */
export const GRID_ROW_HEIGHT = 28;
export const GRID_HEADER_HEIGHT = 30;

/** A grid panel tall enough to show `rows` rows without an empty tail
 *  (the frame's header and padding, the grid's header, the rows and its
 *  1px borders). */
export function gridPanelHeightFor(rows: number): number {
  return PANEL_HEADER_HEIGHT + PANEL_PADDING + GRID_HEADER_HEIGHT + rows * GRID_ROW_HEIGHT + 2;
}

/** Height left for a panel's content once the header and the body padding
 *  (top is shared with the header, so one padding at the bottom) are taken. */
export function panelContentHeight(panelHeight: number): number {
  return Math.max(0, panelHeight - PANEL_HEADER_HEIGHT - PANEL_PADDING);
}

/** A block's panel height: its `height` prop when that is a sensible number,
 *  else the default. */
export function panelHeightOf(props: Record<string, unknown>): number {
  const n = Number(props.height);
  return Number.isFinite(n) && n >= 120 ? Math.round(n) : PANEL_DEFAULT_HEIGHT;
}

/** A block's "View by" choices, from `viewBy` (array) or `viewByCsv`. */
export function viewByOf(props: Record<string, unknown>): string[] {
  if (Array.isArray(props.viewBy)) return props.viewBy.map((v) => String(v).trim()).filter(Boolean);
  return String(props.viewByCsv ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Report-state key holding a panel's current "View by" choice. */
export function viewByStateKey(blockId: string): string {
  return `viewBy:${blockId}`;
}
