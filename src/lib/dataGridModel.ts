/**
 * dataGridModel - the content of a Data Grid block, and how it is read.
 *
 * One typed model shared by the canvas renderer (AG Grid) and the code
 * export, so the grid that is exported is the grid on the canvas: the same
 * columns, groups, rows and number formats.
 */

export type GridColumnKind = "text" | "number" | "percent" | "currency";

export interface GridLeafColumn {
  /** Key into each row. */
  field: string;
  header: string;
  /** How values are formatted and aligned. Default "text". */
  kind?: GridColumnKind;
  /** Decimal places for number / percent / currency. Default 2 (0 for currency). */
  decimals?: number;
  /** ISO currency code for kind "currency". Default "GBP". */
  currency?: string;
  /** Abbreviate large numbers (2,840,000,000 -> 2.84bn) so a dense grid's
   *  money columns stay readable without truncating. */
  compact?: boolean;
  /** Pin to the left edge. */
  pinned?: boolean;
  /** Share of the free width (default 1). Ignored when `width` is set. */
  flex?: number;
  /** Fixed width in px. */
  width?: number;
  /** Smallest width a flexible column may shrink to. */
  minWidth?: number;
  /** Colour negative values as negative. */
  signed?: boolean;
}

export interface GridColumnGroup {
  header: string;
  children: GridLeafColumn[];
}

export type GridColumn = GridLeafColumn | GridColumnGroup;

/** A row: values by field. `_bold` marks a total / aggregate row; `_indent`
 *  (0, 1, 2...) indents the first column to show hierarchy. */
export type GridRow = Record<string, string | number | boolean | null | undefined>;

export function isColumnGroup(c: GridColumn): c is GridColumnGroup {
  return Array.isArray((c as GridColumnGroup).children);
}

/** Leaf columns in display order, groups flattened. */
export function leafColumns(columns: GridColumn[]): GridLeafColumn[] {
  return columns.flatMap((c) => (isColumnGroup(c) ? c.children : [c]));
}

export function isNumericKind(kind: GridColumnKind | undefined): boolean {
  return kind === "number" || kind === "percent" || kind === "currency";
}

const LOCALE = "en-GB";

/** Format one cell for display. Blank for null / undefined / empty; text
 *  passes through; numbers follow the column's kind. */
export function formatGridValue(column: GridLeafColumn, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const kind = column.kind ?? "text";
  if (!isNumericKind(kind)) return String(value);
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  if (kind === "currency") {
    const decimals = column.decimals ?? (column.compact ? 2 : 0);
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: column.currency ?? "GBP",
      ...(column.compact ? { notation: "compact" as const } : {}),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(n);
  }
  const decimals = column.decimals ?? 2;
  const text = new Intl.NumberFormat(LOCALE, {
    ...(column.compact ? { notation: "compact" as const } : {}),
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n);
  return kind === "percent" ? `${text}%` : text;
}

/** True when the cell should be drawn in the negative colour. */
export function isNegativeCell(column: GridLeafColumn, value: unknown): boolean {
  return Boolean(column.signed) && typeof value === "number" && value < 0;
}

/** Read a block's columns defensively: drop anything that is not a usable
 *  leaf or group, so a malformed prop cannot crash the grid. */
export function readGridColumns(raw: unknown): GridColumn[] {
  if (!Array.isArray(raw)) return [];
  const leaf = (c: unknown): GridLeafColumn | null => {
    if (!c || typeof c !== "object") return null;
    const o = c as Record<string, unknown>;
    if (typeof o.field !== "string" || !o.field) return null;
    return { ...(o as unknown as GridLeafColumn), header: typeof o.header === "string" ? o.header : o.field };
  };
  const out: GridColumn[] = [];
  for (const c of raw) {
    if (c && typeof c === "object" && Array.isArray((c as GridColumnGroup).children)) {
      const children = (c as GridColumnGroup).children.map(leaf).filter((x): x is GridLeafColumn => x !== null);
      if (children.length) out.push({ header: String((c as GridColumnGroup).header ?? ""), children });
    } else {
      const l = leaf(c);
      if (l) out.push(l);
    }
  }
  return out;
}

export function readGridRows(raw: unknown): GridRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((r): r is GridRow => Boolean(r) && typeof r === "object" && !Array.isArray(r));
}
