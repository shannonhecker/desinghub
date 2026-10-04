/**
 * reportData - the data behind a report template.
 *
 * A report's charts and grids are not hand-written arrays: they are views of
 * a small dataset of plain tables (holdings, returns, a time series...). A
 * block names a table and says how to read it (group rows by one dimension,
 * pivot another into columns, aggregate some measures); the canvas's filters
 * and selections feed that query. The same tables are what the user
 * downloads as a workbook and uploads back with real figures.
 */

export type FieldRole = "dimension" | "measure";
export type MeasureFormat = "number" | "percent" | "currency";

export interface DataField {
  /** Column key in each row, and the header in the workbook. */
  key: string;
  /** Human label ("Asset class"). */
  label: string;
  role: FieldRole;
  /** Display format for a measure. Default "number". */
  format?: MeasureFormat;
  /** One line shown in the workbook's guide sheet. */
  help?: string;
}

export type DataValue = string | number | null;
export type DataRow = Record<string, DataValue>;

export interface DataTable {
  /** Stable id, also the sheet name in the workbook. */
  id: string;
  label: string;
  /** What one row is ("One row per holding"). Shown in the workbook guide. */
  grain: string;
  fields: DataField[];
  rows: DataRow[];
}

export interface ReportDataset {
  id: string;
  label: string;
  /** ISO code the money measures are stored in. */
  baseCurrency: string;
  tables: DataTable[];
}

export function tableOf(dataset: ReportDataset, id: string): DataTable | undefined {
  return dataset.tables.find((t) => t.id === id);
}

export function fieldOf(table: DataTable, key: string): DataField | undefined {
  return table.fields.find((f) => f.key === key);
}

export function dimensionsOf(table: DataTable): DataField[] {
  return table.fields.filter((f) => f.role === "dimension");
}

export function measuresOf(table: DataTable): DataField[] {
  return table.fields.filter((f) => f.role === "measure");
}
