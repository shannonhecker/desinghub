/**
 * registry - the sample datasets a template can name.
 */

import { executionDataset, EXECUTION_DATASET_ID } from "./executionDataset";
import { financeDataset, FINANCE_DATASET_ID } from "./financeDataset";
import { issuerDataset, ISSUER_DATASET_ID } from "./issuerDataset";
import { sustainableDataset, SUSTAINABLE_DATASET_ID } from "./sustainableDataset";
import type { ReportDataset } from "./types";

const SAMPLE_DATASETS: Record<string, () => ReportDataset> = {
  [FINANCE_DATASET_ID]: financeDataset,
  [SUSTAINABLE_DATASET_ID]: sustainableDataset,
  [ISSUER_DATASET_ID]: issuerDataset,
  [EXECUTION_DATASET_ID]: executionDataset,
};

export function sampleDataset(id: string | null | undefined): ReportDataset | null {
  return id && id in SAMPLE_DATASETS ? SAMPLE_DATASETS[id]() : null;
}
