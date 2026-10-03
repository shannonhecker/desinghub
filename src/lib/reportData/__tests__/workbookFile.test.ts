// @vitest-environment node
import { describe, it, expect } from "vitest";
import { readWorkbook, workbookBlob, workbookFileName } from "../workbookFile";
import { financeDataset } from "../financeDataset";
import { tableOf } from "../types";

/* The real xlsx libraries, end to end: write a workbook, read it back. */
describe("workbook file round trip", () => {
  const ds = financeDataset();

  it("writes a real .xlsx and reads the same dataset back", async () => {
    const blob = await workbookBlob(ds);
    expect(blob.size).toBeGreaterThan(5_000);
    const result = await readWorkbook(ds, blob);
    expect(result.issues).toEqual([]);
    expect(result.imported).toHaveLength(ds.tables.length);
    for (const t of ds.tables) {
      expect(tableOf(result.dataset!, t.id)!.rows, t.id).toEqual(t.rows);
    }
  }, 30_000);

  it("names the file after the dataset", () => {
    expect(workbookFileName(ds)).toBe("portfolio-data-template.xlsx");
  });

  it("rejects a non-xlsx file, an oversized file and garbage, without throwing", async () => {
    const named = (blob: Blob, name: string) => Object.assign(blob, { name });
    expect((await readWorkbook(ds, named(new Blob(["a,b"]), "data.csv"))).issues[0].message).toMatch(/not an .xlsx file/);
    const big = named(new Blob([new Uint8Array(1)]), "big.xlsx");
    Object.defineProperty(big, "size", { value: 11 * 1024 * 1024 });
    expect((await readWorkbook(ds, big)).issues[0].message).toMatch(/larger than 10 MB/);
    const garbage = await readWorkbook(ds, named(new Blob(["this is not a zip"]), "broken.xlsx"));
    expect(garbage.dataset).toBeNull();
    expect(garbage.issues[0].message).toMatch(/could not be read/);
  }, 30_000);
});
