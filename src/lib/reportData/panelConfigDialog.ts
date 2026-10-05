/**
 * panelConfigDialog - the pure part of the panel Configuration dialog: the
 * Available tree (Dimensions and Metrics, each under "Fields"), its filter,
 * and the edits the Columns and Groups tabs make, mapped onto PanelConfig.
 *
 * The model is unchanged: a panel has one row group (`rows`), one column
 * group (`columns`, the pivot) and an ordered list of figures (`values`).
 * The dialog shows that and nothing it cannot do.
 */

import { defaultAggregation, type PanelConfig } from "./panelConfig";
import { dimensionsOf, fieldOf, measuresOf, type DataTable } from "./types";

export type ConfigTab = "columns" | "groups" | "display" | "setting";

export interface TreeLeaf {
  key: string;
  label: string;
  /** "abc" for a dimension, "123" for a metric. */
  tag: "abc" | "123";
  /** Can be added on this tab (not already chosen, of the right kind). */
  addable: boolean;
}
export interface TreeGroup {
  id: "dimensions" | "metrics";
  label: string;
  leaves: TreeLeaf[];
}
export interface AvailableTree {
  groups: TreeGroup[];
  /** Leaves shown, after the filter. */
  count: number;
}

/** What is chosen already on a tab: its figures (Columns) or its groups (Groups). */
function chosen(config: PanelConfig, tab: ConfigTab): Set<string> {
  if (tab === "groups") return new Set([config.rows, config.columns].filter((k): k is string => Boolean(k)));
  return new Set(config.values.map((v) => v.field));
}

/** The Available tree for a tab, narrowed by `filter` (case-insensitive, by name). */
export function availableTree(table: DataTable, config: PanelConfig, tab: ConfigTab, filter = ""): AvailableTree {
  const q = filter.trim().toLowerCase();
  const taken = chosen(config, tab);
  const groupsFull = Boolean(config.rows && config.columns);
  const match = (label: string) => !q || label.toLowerCase().includes(q);
  const dims = dimensionsOf(table).filter((f) => match(f.label)).map<TreeLeaf>((f) => ({
    key: f.key, label: f.label, tag: "abc", addable: tab === "groups" && !taken.has(f.key) && !groupsFull,
  }));
  const mets = measuresOf(table).filter((f) => match(f.label)).map<TreeLeaf>((f) => ({
    key: f.key, label: f.label, tag: "123", addable: tab === "columns" && !taken.has(f.key),
  }));
  const groups: TreeGroup[] = [];
  if (dims.length) groups.push({ id: "dimensions", label: "Dimensions", leaves: dims });
  if (mets.length) groups.push({ id: "metrics", label: "Metrics", leaves: mets });
  return { groups, count: dims.length + mets.length };
}

/* ── Columns: the figures, in order ── */

export function addColumn(config: PanelConfig, key: string, table: DataTable): PanelConfig {
  const field = fieldOf(table, key);
  if (!field || field.role !== "measure" || config.values.some((v) => v.field === key)) return config;
  return { ...config, values: [...config.values, { field: key, agg: defaultAggregation(field, table) }] };
}

/** A panel keeps at least one figure. */
export function canRemoveColumn(config: PanelConfig): boolean {
  return config.values.length > 1;
}

export function removeColumn(config: PanelConfig, key: string): PanelConfig {
  if (!canRemoveColumn(config)) return config;
  return { ...config, values: config.values.filter((v) => v.field !== key) };
}

export function moveColumn(config: PanelConfig, key: string, by: -1 | 1): PanelConfig {
  const at = config.values.findIndex((v) => v.field === key);
  const to = at + by;
  if (at < 0 || to < 0 || to >= config.values.length) return config;
  const values = [...config.values];
  [values[at], values[to]] = [values[to], values[at]];
  return { ...config, values };
}

export function setAggregation(config: PanelConfig, key: string, agg: PanelConfig["values"][number]["agg"]): PanelConfig {
  return { ...config, values: config.values.map((v) => (v.field === key ? { ...v, agg } : v)) };
}

/* ── Groups: one row group, one column group ── */

/** Add a dimension: into the row group when it is empty, else the column group. */
export function addGroup(config: PanelConfig, key: string, table: DataTable): PanelConfig {
  const field = fieldOf(table, key);
  if (!field || field.role !== "dimension" || config.rows === key || config.columns === key) return config;
  if (!config.rows) return { ...config, rows: key };
  if (!config.columns) return { ...config, columns: key };
  return config;
}

export function removeGroup(config: PanelConfig, slot: "rows" | "columns"): PanelConfig {
  return { ...config, [slot]: null };
}
