"use client";

import { useMemo } from "react";
import { useBuilder } from "@/store/useBuilder";
import { BUILDER_TEMPLATES, type BuilderTemplate } from "@/lib/builderTemplates";
import { resolveBinding, type BoundData, type DataBinding } from "@/lib/reportData/binding";
import { sampleDataset } from "@/lib/reportData/registry";
import type { ReportDataset } from "@/lib/reportData/types";

/** The dataset the canvas is showing: an uploaded one if there is one, else
 *  the sample dataset of the template on the canvas. */
export function useCanvasDataset(): ReportDataset | null {
  const uploaded = useBuilder((s) => s.reportData);
  const templateId = useBuilder((s) => s.activeTemplateId);
  return useMemo(() => {
    if (uploaded) return uploaded;
    const template = templateId ? (BUILDER_TEMPLATES as Record<string, BuilderTemplate | undefined>)[templateId] : undefined;
    return sampleDataset(template?.datasetId);
  }, [uploaded, templateId]);
}

function isBinding(v: unknown): v is DataBinding {
  return typeof v === "object" && v !== null && typeof (v as DataBinding).table === "string" && Array.isArray((v as DataBinding).measures);
}

/** Derive a block's data from its `binding` prop, the canvas dataset and the
 *  report state. null when the block has no binding (or nothing to bind to):
 *  the block then renders its own static props. */
export function useBoundData(props: Record<string, unknown>): BoundData | null {
  const binding = props.binding;
  const dataset = useCanvasDataset();
  const reportState = useBuilder((s) => s.reportState);
  return useMemo(
    () => (isBinding(binding) && dataset ? resolveBinding(binding, dataset, reportState) : null),
    [binding, dataset, reportState],
  );
}
