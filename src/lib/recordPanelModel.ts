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
  /** "flag": a country code with its flag. "badge": a toned badge (ratings). */
  as?: "flag" | "badge";
}

export interface RecordTableRow {
  label: string;
  /** One field per value column. */
  fields: string[];
  /** Show the direction of change between two of the fields as an arrow. */
  change?: { from: string; to: string; upIsGood?: boolean };
}

export type RecordSection =
  | { type: "pairs"; items: RecordPair[] }
  | { type: "table"; title?: string; columns: string[]; kind?: GridColumnKind; decimals?: number; rows: RecordTableRow[] }
  | { type: "trend"; title?: string; field: string; categories?: string[]; seriesName?: string };

export interface RecordBinding {
  table: string;
  /** Field that identifies a record (the grid's first column). */
  keyField: string;
  /** Report state holding the selected record's key. */
  state: string;
  sections: RecordSection[];
}

export interface ResolvedPair {
  label: string;
  text: string;
  flag?: string;
  tone?: GridTone;
}
export type ResolvedSection =
  | { type: "pairs"; items: ResolvedPair[] }
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
  const key = state[binding.state];
  if (!key) return null;
  const row: DataRow | undefined = tableOf(dataset, binding.table)?.rows.find((r) => String(r[binding.keyField] ?? "") === key);
  if (!row) return null;
  const currency = state[CURRENCY_STATE] ?? dataset.baseCurrency;
  const rate = currencyRate(dataset, currency);

  const sections: ResolvedSection[] = binding.sections.map((section) => {
    if (section.type === "pairs") {
      return {
        type: "pairs",
        items: section.items.map((item) => {
          const raw = row[item.field];
          const value = item.money && typeof raw === "number" ? raw * rate : raw;
          const text = formatGridValue({ field: item.field, header: item.label, kind: item.kind, decimals: item.decimals, compact: item.compact, ...(item.money ? { currency } : {}) }, value);
          return {
            label: item.label,
            text,
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
