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
  /** Draw the value as something richer than text (a heat tint, a bar, a
   *  chip, a sparkline...). See GridCell. */
  cell?: GridCell;
  /** Take the header text from the panel's current "View by" choice (the
   *  first column of a grid that regroups). */
  headerFrom?: "viewBy";
}

/** What a tone means, not what colour it is: each design system resolves it
 *  to its own status colour (toneColor). */
export type GridTone = "good" | "mid" | "bad" | "neutral" | "accent";
export const GRID_TONES: readonly GridTone[] = ["good", "mid", "bad", "neutral", "accent"];

export interface HeatThreshold {
  /** Values at or above `min` take the tone. Checked in order; the entry
   *  with no `min` is the fallback. */
  min?: number;
  tone: GridTone;
}

/** A richer rendering of a cell. Data, not code: the same description draws
 *  the cell on the canvas and in the export. */
export type GridCell =
  /** Background tint by bucket, e.g. a 0-10 score: good from 7, mid from 4. */
  | { type: "heat"; thresholds?: HeatThreshold[] }
  /** A thin bar with the value beside it. `scale: "fixed"` measures against
   *  `max` (default 100); "columnMax" against the largest value shown. */
  | { type: "bar"; scale?: "fixed" | "columnMax"; max?: number; tone?: GridTone }
  /** A tinted pill with an arrow and a signed number; blank at zero. */
  | { type: "deltaChip"; upIsGood?: boolean }
  /** Arrow + absolute value, toned by direction. `upIsGood: false` for a
   *  quantity whose rise is bad (emissions). `sparkField` puts a sparkline
   *  from another field in front. */
  | { type: "delta"; upIsGood?: boolean; sparkField?: string }
  /** A small line. The value is a list of numbers ("3, 4, 2, 6"). */
  | { type: "sparkline"; tone?: GridTone }
  /** A round badge, toned by its text. */
  | { type: "badge"; tones?: Record<string, GridTone>; fallback?: GridTone }
  /** A word, coloured and weighted by its value. */
  | { type: "toneText"; tones: Record<string, GridTone> }
  /** A small dot, then the value. Toned by the value (`tones`) or one tone;
   *  `hollow` values draw a ring instead of a filled dot; blank at zero. */
  | { type: "dot"; tone?: GridTone; tones?: Record<string, GridTone>; hollow?: string[]; hideZero?: boolean }
  /** A chip holding the value: a tinted label or a small solid counter. */
  | { type: "chip"; variant?: "tint" | "solid"; tones?: Record<string, GridTone>; fallback?: GridTone }
  /** A country flag from an ISO 3166 alpha-2 code, then the code. */
  | { type: "flag" }
  /** A rank number in a narrow, muted column. */
  | { type: "rank" };

const CELL_TYPES = new Set(["heat", "bar", "deltaChip", "delta", "sparkline", "badge", "toneText", "flag", "rank", "dot", "chip"]);

/** True when a dot cell shows nothing: a blank, or zero when zeros are hidden. */
export function dotIsBlank(cell: Extract<GridCell, { type: "dot" }>, value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true;
  return Boolean(cell.hideZero) && Number(value) === 0;
}

/** Default heat buckets: a 0-10 score. */
export const SCORE_THRESHOLDS: HeatThreshold[] = [{ min: 7, tone: "good" }, { min: 4, tone: "mid" }, { tone: "bad" }];
/** Default badge tones: credit-style ratings. */
export const RATING_TONES: Record<string, GridTone> = { AAA: "good", AA: "good", A: "good", BBB: "mid", BB: "mid" };

/** The CSS colour a tone resolves to in the active design system. */
export function toneColor(tone: GridTone): string {
  switch (tone) {
    case "good": return "var(--ds-status-positive)";
    case "mid": return "var(--ds-status-warning)";
    case "bad": return "var(--ds-status-negative)";
    case "accent": return "var(--ds-primary)";
    default: return "var(--ds-fg-tertiary)";
  }
}

const asNumber = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

/** The tone of a heat cell, or null for a blank / non-numeric value. */
export function heatTone(cell: Extract<GridCell, { type: "heat" }>, value: unknown): GridTone | null {
  const n = asNumber(value);
  if (n === null) return null;
  const thresholds = cell.thresholds?.length ? cell.thresholds : SCORE_THRESHOLDS;
  for (const t of thresholds) {
    if (t.min === undefined || n >= t.min) return t.tone;
  }
  return null;
}

/** How full a bar cell is, 0 to 1. `columnMax` is the largest value in the
 *  column (needed for scale "columnMax"). */
export function barShare(cell: Extract<GridCell, { type: "bar" }>, value: unknown, columnMax = 0): number {
  const n = asNumber(value);
  if (n === null || n <= 0) return 0;
  const max = cell.scale === "columnMax" ? columnMax : (cell.max ?? 100);
  return max > 0 ? Math.min(1, n / max) : 0;
}

export interface DeltaView {
  direction: "up" | "down" | "flat";
  tone: GridTone;
  /** Absolute value, unformatted. */
  magnitude: number;
}

/** Direction and tone of a change. Null for a blank value. */
export function deltaView(value: unknown, upIsGood = true): DeltaView | null {
  const n = asNumber(value);
  if (n === null) return null;
  if (n === 0) return { direction: "flat", tone: "neutral", magnitude: 0 };
  const up = n > 0;
  return { direction: up ? "up" : "down", tone: up === upIsGood ? "good" : "bad", magnitude: Math.abs(n) };
}

/** The tone of a badge or a toned word. */
export function valueTone(tones: Record<string, GridTone> | undefined, value: unknown, fallback: GridTone = "neutral"): GridTone {
  const key = String(value ?? "").trim();
  const tone = (tones ?? {})[key];
  return GRID_TONES.includes(tone) ? tone : fallback;
}

/** A sparkline's points from its cell value: a list ("3, 4, 2") or an array. */
export function sparkPoints(value: unknown): number[] {
  const parts = Array.isArray(value) ? value : String(value ?? "").split(/[,;\s]+/);
  return parts
    .map((p) => String(p).trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

/** SVG polyline points for a sparkline drawn in a `width` x `height` box,
 *  with `pad` kept clear at top and bottom. Empty for fewer than 2 points. */
export function sparkPolyline(points: number[], width: number, height: number, pad = 1.5): string {
  if (points.length < 2) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1);
  return points
    .map((v, i) => `${round1(i * step)},${round1(height - pad - ((v - min) / span) * (height - pad * 2))}`)
    .join(" ");
}
const round1 = (n: number): number => Math.round(n * 10) / 10;

/** The flag emoji for an ISO 3166 alpha-2 code; "" when the code is not two
 *  letters. */
export function flagEmoji(code: unknown): string {
  const c = String(code ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

/** A column's `cell`, when it is one this build understands. */
export function cellOf(column: GridLeafColumn): GridCell | null {
  const c = column.cell as { type?: unknown } | undefined;
  return c && typeof c === "object" && typeof c.type === "string" && CELL_TYPES.has(c.type) ? (column.cell as GridCell) : null;
}

/** The largest numeric value of a field across rows (for bar cells scaled to
 *  the column). Total rows are left out: a total would dwarf every part. */
export function columnMax(rows: GridRow[], field: string): number {
  let max = 0;
  for (const r of rows) {
    if (r._bold) continue;
    const n = asNumber(r[field]);
    if (n !== null && n > max) max = n;
  }
  return max;
}

export interface GridColumnGroup {
  header: string;
  children: GridLeafColumn[];
}

export type GridColumn = GridLeafColumn | GridColumnGroup;

/** A row: values by field. `_bold` marks a total / aggregate row; `_indent`
 *  (0, 1, 2...) indents the first column to show hierarchy; `_group` marks a
 *  group heading row (drawn on a sunken band, above its indented leaves). */
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
  /* Compact values are scaled here, not by Intl's compact notation: its
     suffixes depend on the browser's locale data ("£3.55bn" in one browser,
     "£3.55B" in another), and a report must read the same everywhere. */
  const [scaled, suffix] = column.compact ? compactScale(n) : [n, ""];
  if (kind === "currency") {
    const decimals = column.decimals ?? (column.compact ? 2 : 0);
    return (
      new Intl.NumberFormat(LOCALE, {
        style: "currency",
        currency: column.currency ?? "GBP",
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }).format(scaled) + suffix
    );
  }
  const decimals = column.decimals ?? 2;
  const text =
    new Intl.NumberFormat(LOCALE, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(scaled) + suffix;
  return kind === "percent" ? `${text}%` : text;
}

const COMPACT_STEPS: [divisor: number, suffix: string][] = [
  [1e12, "tn"],
  [1e9, "bn"],
  [1e6, "m"],
  [1e3, "k"],
];

/** A value scaled to thousands / millions / billions / trillions, with the
 *  suffix that names the scale. Values under a thousand are left alone. */
export function compactScale(n: number): [scaled: number, suffix: string] {
  const abs = Math.abs(n);
  for (const [divisor, suffix] of COMPACT_STEPS) {
    if (abs >= divisor) return [n / divisor, suffix];
  }
  return [n, ""];
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
