/**
 * computed - measures derived from other measures AFTER aggregation.
 *
 * A ratio of two sums (VaR as a percent of market value), a difference
 * (excess = portfolio - benchmark), a share of the grand total, or an
 * adjustment (a fee drag added to a return) cannot be aggregated row by row:
 * they are computed per result cell, once the underlying measures have been
 * summed or averaged.
 */

import { cellKey, type CellMap, type QueryResult } from "./query";

export type ComputedSpec =
  /** (a / b) * 100, e.g. VaR as a percent of market value. */
  | { as: string; op: "percentOf"; of: [string, string] }
  /** a - b, e.g. excess return. */
  | { as: string; op: "diff"; of: [string, string] }
  /** The measure as a percent of its grand total, e.g. "% of total". */
  | { as: string; op: "shareOfTotal"; of: [string] }
  /** a * factor + offset, e.g. a benchmark scaled, or a fee drag added. */
  | { as: string; op: "adjust"; of: [string]; factor?: number; offset?: number };

function compute(spec: ComputedSpec, get: (key: string) => number | null, totalOf: (key: string) => number | null): number | null {
  const a = get(spec.of[0]);
  switch (spec.op) {
    case "percentOf": {
      const b = get(spec.of[1]);
      return a === null || b === null || b === 0 ? null : (a / b) * 100;
    }
    case "diff": {
      const b = get(spec.of[1]);
      return a === null || b === null ? null : a - b;
    }
    case "shareOfTotal": {
      const t = totalOf(spec.of[0]);
      return a === null || t === null || t === 0 ? null : (a / t) * 100;
    }
    case "adjust":
      return a === null ? null : a * (spec.factor ?? 1) + (spec.offset ?? 0);
  }
}

/** Add computed measures to a result (in order, so one can build on another).
 *  `grandTotal` supplies the denominators for shareOfTotal; pass the result
 *  of the same query's total. A result that carries its own total gets the
 *  computed measures there too. */
export function applyComputed(result: QueryResult, specs: ComputedSpec[], grandTotal?: CellMap): QueryResult {
  if (specs.length === 0) return result;
  const totals = grandTotal ?? result.total;
  const pivots: (string | null)[] = result.pivots.length ? result.pivots : [null];
  const extend = (cells: CellMap): CellMap => {
    const out: CellMap = { ...cells };
    for (const spec of specs) {
      for (const p of pivots) {
        out[cellKey(p, spec.as)] = compute(
          spec,
          (k) => out[cellKey(p, k)] ?? null,
          (k) => (totals ? (totals[cellKey(p, k)] ?? null) : null),
        );
      }
    }
    return out;
  };
  const added = specs.map((s) => s.as).filter((k) => !result.measures.includes(k));
  return {
    ...result,
    measures: [...result.measures, ...added],
    cells: result.cells.map(extend),
    ...(result.total ? { total: extend(result.total) } : {}),
  };
}
