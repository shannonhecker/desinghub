/**
 * recordPanelModel - one record of a table, laid out as a detail panel.
 *
 * A Record Panel block shows the row a grid has selected (the security the
 * user clicked): a few label/value pairs, small tables of that record's
 * figures, and a trend line. Like a grid's cells, the layout is data: the
 * same description draws the panel on the canvas and in the export.
 */

import { deltaView, flagEmoji, formatGridValue, sparkPoints, valueTone, RATING_TONES, type DeltaView, type GridColumnKind, type GridTone } from "./dataGridModel";
import { CURRENCY_STATE, currencyRate, type ReportState } from "./reportData/binding";
import { tableOf, type DataRow, type ReportDataset } from "./reportData/types";

export interface RecordPair {
  label: string;
  field: string;
  kind?: GridColumnKind;
  decimals?: number;
  compact?: boolean;
  /** A money amount: converted to the selected currency. */
  money?: boolean;
  /** "flag": a country code with its flag. "badge": a toned badge (ratings).
   *  "signed": a figure with its sign, good when positive and bad when not. */
  as?: "flag" | "badge" | "signed";
  /** Text before and after the figure ("EUR ", " pips"). */
  prefix?: string;
  suffix?: string;
}

export interface RecordTableRow {
  label: string;
  /** One field per value column. */
  fields: string[];
  /** Show the direction of change between two of the fields as an arrow. */
  change?: { from: string; to: string; upIsGood?: boolean };
}

export type RecordSection =
  | { type: "pairs"; items: RecordPair[]; /** "rows": one pair per line, label left and value right. */ layout?: "rows"; /** Band alternate rows. */ zebra?: boolean }
  | { type: "table"; title?: string; columns: string[]; kind?: GridColumnKind; decimals?: number; rows: RecordTableRow[] }
  | { type: "trend"; title?: string; field: string; categories?: string[]; seriesName?: string };

/** Which row of a table a block shows: the one whose `keyField` equals the
 *  value of a report state, a fixed `key`, or a `fallback` while the state is
 *  unset. */
export interface RowLookup {
  table: string;
  keyField: string;
  /** Report state holding the key. */
  state?: string;
  /** A fixed key (a tile that always shows one category). */
  key?: string;
  /** Key used while the state is unset. */
  fallback?: string;
}

export interface RecordBinding extends RowLookup {
  /** Report state holding the selected record's key. */
  state: string;
  sections: RecordSection[];
}

export function isRowLookup(v: unknown): v is RowLookup {
  const b = v as RowLookup | null;
  return typeof b === "object" && b !== null && typeof b.table === "string" && typeof b.keyField === "string";
}

/** The key a lookup resolves to right now ("" when there is none). */
export function lookupKey(lookup: RowLookup, state: ReportState): string {
  return lookup.key ?? (lookup.state ? state[lookup.state] : undefined) ?? lookup.fallback ?? "";
}

/** The row a lookup names, or null. */
export function lookupRow(lookup: RowLookup, dataset: ReportDataset, state: ReportState): DataRow | null {
  const key = lookupKey(lookup, state);
  if (!key) return null;
  return tableOf(dataset, lookup.table)?.rows.find((r) => String(r[lookup.keyField] ?? "") === key) ?? null;
}

/** A field of a row as display text. */
export function fieldText(row: DataRow | null, field: string, format: { kind?: GridColumnKind; decimals?: number; compact?: boolean; suffix?: string } = {}): string {
  if (!row) return "";
  const v = row[field];
  if (v === null || v === undefined || v === "") return "";
  const text = typeof v === "number" ? formatGridValue({ field, header: "", kind: format.kind ?? "number", decimals: format.decimals ?? 0, compact: format.compact }, v) : String(v);
  return format.suffix ? `${text}${format.suffix}` : text;
}

/** A tone stored in the data ("good", "bad"...), or the fallback. */
export function fieldTone(row: DataRow | null, field: string | undefined, fallback: GridTone = "neutral"): GridTone {
  const v = field && row ? String(row[field] ?? "") : "";
  return (["good", "mid", "bad", "neutral", "accent"] as GridTone[]).includes(v as GridTone) ? (v as GridTone) : fallback;
}

export interface ResolvedPair {
  label: string;
  text: string;
  flag?: string;
  tone?: GridTone;
  /** A signed figure: the tone its text takes. */
  signed?: GridTone;
}
export type ResolvedSection =
  | { type: "pairs"; items: ResolvedPair[]; layout?: "rows"; zebra?: boolean }
  | { type: "table"; title?: string; columns: string[]; rows: { label: string; cells: string[]; change: DeltaView | null }[] }
  | { type: "trend"; title?: string; categories: string[]; points: number[]; seriesName: string };

export interface ResolvedRecord {
  title: string;
  sections: ResolvedSection[];
}

export function isRecordBinding(v: unknown): v is RecordBinding {
  const b = v as RecordBinding | null;
  return typeof b === "object" && b !== null && typeof b.table === "string" && typeof b.keyField === "string" && typeof b.state === "string" && Array.isArray(b.sections);
}

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** The selected record, resolved for display. Null when nothing is selected,
 *  or the selection names no row of the table. */
export function resolveRecord(binding: RecordBinding, dataset: ReportDataset, state: ReportState): ResolvedRecord | null {
  const key = lookupKey(binding, state);
  const row = lookupRow(binding, dataset, state);
  if (!row) return null;
  const currency = state[CURRENCY_STATE] ?? dataset.baseCurrency;
  const rate = currencyRate(dataset, currency);

  const sections: ResolvedSection[] = binding.sections.map((section) => {
    if (section.type === "pairs") {
      return {
        type: "pairs",
        ...(section.layout === "rows" ? { layout: "rows" as const } : {}),
        ...(section.zebra ? { zebra: true } : {}),
        items: section.items.map((item) => {
          const raw = row[item.field];
          const value = item.money && typeof raw === "number" ? raw * rate : raw;
          const text = formatGridValue({ field: item.field, header: item.label, kind: item.kind, decimals: item.decimals, compact: item.compact, ...(item.money ? { currency } : {}) }, value);
          const signed = item.as === "signed" && typeof raw === "number";
          return {
            label: item.label,
            text: `${item.prefix ?? ""}${signed && raw >= 0 ? "+" : ""}${text}${item.suffix ?? ""}`,
            ...(signed ? { signed: (raw >= 0 ? "good" : "bad") as GridTone } : {}),
            ...(item.as === "flag" && flagEmoji(raw) ? { flag: flagEmoji(raw) } : {}),
            ...(item.as === "badge" ? { tone: valueTone(RATING_TONES, raw, "bad") } : {}),
          };
        }),
      };
    }
    if (section.type === "table") {
      const column = { field: "", header: "", kind: section.kind ?? "number", decimals: section.decimals ?? 0 };
      return {
        type: "table",
        ...(section.title ? { title: section.title } : {}),
        columns: section.columns,
        rows: section.rows.map((r) => {
          const from = r.change ? num(row[r.change.from]) : null;
          const to = r.change ? num(row[r.change.to]) : null;
          return {
            label: r.label,
            cells: r.fields.map((f) => formatGridValue(column, row[f])),
            change: r.change && from !== null && to !== null ? deltaView(to - from, r.change.upIsGood ?? true) : null,
          };
        }),
      };
    }
    const points = sparkPoints(row[section.field]);
    return {
      type: "trend",
      ...(section.title ? { title: section.title } : {}),
      points,
      categories: section.categories?.length === points.length ? section.categories : points.map((_, i) => String(i + 1)),
      seriesName: section.seriesName ?? section.title ?? "Value",
    };
  });
  return { title: key, sections };
}
