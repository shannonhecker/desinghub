/**
 * workbookFile - read and write the report workbook as a real .xlsx file.
 *
 * The xlsx libraries are imported on demand, so they are only downloaded
 * when someone actually downloads or uploads a workbook. Everything happens
 * in the browser: an uploaded file is never sent to a server.
 */

import { datasetToSheets, sheetsToDataset, type SheetCell, type WorkbookImport } from "./workbook";
import type { ReportDataset } from "./types";

/** Largest file we will try to read. */
export const MAX_WORKBOOK_BYTES = 10 * 1024 * 1024;

const HEADER_STYLE = { fontWeight: "bold" as const };

export async function workbookBlob(dataset: ReportDataset): Promise<Blob> {
  const { default: writeExcelFile } = await import("write-excel-file/universal");
  const sheets = datasetToSheets(dataset).map((s, index) => ({
    sheet: s.name,
    /* Header row bold; on the Guide sheet (index 0) the title and the two
       table headings are bold instead. */
    data: s.rows.map((row, r) =>
      row.map((value) => {
        if (value === null || value === undefined || value === "") return null;
        const bold = index === 0 ? r === 0 || r === 3 || r === 11 : r === 0;
        return bold ? { value, ...HEADER_STYLE } : { value };
      }),
    ),
    columns: (s.widths ?? []).map((width) => ({ width })),
    ...(index === 0 ? {} : { stickyRowsCount: 1 }),
  }));
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- the library's
     cell union is wider than our plain values need. */
  return writeExcelFile(sheets as any).toBlob();
}

export function workbookFileName(dataset: ReportDataset): string {
  const slug = dataset.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "report";
  return `${slug}-data-template.xlsx`;
}

/** Trigger a browser download of the dataset's workbook. */
export async function downloadWorkbook(dataset: ReportDataset): Promise<void> {
  const blob = await workbookBlob(dataset);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = workbookFileName(dataset);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Read an uploaded workbook against the template's dataset. Never throws:
 *  a file that cannot be read comes back as an error issue. */
export async function readWorkbook(base: ReportDataset, file: Blob & { name?: string }): Promise<WorkbookImport> {
  const fail = (message: string): WorkbookImport => ({ dataset: null, imported: [], issues: [{ level: "error", message }] });
  if (file.name && !/\.xlsx$/i.test(file.name)) return fail("That is not an .xlsx file. Download the data template and fill that in.");
  if (file.size > MAX_WORKBOOK_BYTES) return fail("That file is larger than 10 MB. Remove unused sheets or rows and try again.");
  try {
    const { default: readExcelFile } = await import("read-excel-file/universal");
    const sheets = (await readExcelFile(file)) as { sheet: string; data: SheetCell[][] }[];
    return sheetsToDataset(base, sheets);
  } catch {
    return fail("That file could not be read as an Excel workbook. Download the data template and fill that in.");
  }
}
