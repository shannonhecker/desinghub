"use client";

/**
 * Highcharts and AG Grid are the two heaviest things the builder draws with
 * (about 225 KB and 330 KB compressed) and neither is needed until a chart or
 * a data grid is on the canvas: not on the home screen, not in the template
 * gallery. Every part of the builder that draws one imports it from here, so
 * the library stays out of the first load and arrives with the first block
 * that uses it.
 *
 * One static import of SimulatedHighchart, SimulatedDataGrid or
 * ExecutionChart anywhere in the builder's first-load graph puts the library
 * back (e2e/lazy-heavy.spec.ts watches for that). Types are safe to import
 * from those modules: `import type` is erased when the site is built.
 */
import dynamic from "next/dynamic";
import React, { Suspense, lazy } from "react";
import { useBuilder, type DesignSystem } from "@/store/useBuilder";
import { panelHeightOf } from "@/lib/panelMetrics";

/** A quiet block the size the real one will be, so nothing below it moves
    when the library arrives. */
function Placeholder({ height }: { height: number }) {
  return <div aria-hidden style={{ height, borderRadius: 8, background: "var(--ds-surface-2, rgba(127,127,127,0.08))" }} />;
}

export const LazyDataGrid = dynamic(
  () => import("./SimulatedDataGrid").then((m) => m.SimulatedDataGrid),
  { ssr: false },
);

export const LazyHighchart = dynamic(
  () => import("./SimulatedHighchart").then((m) => m.SimulatedHighchart),
  { ssr: false, loading: () => <Placeholder height={250} /> },
);

/** The trend line in a record panel: the same chart at its own height. */
export const RECORD_TREND_HEIGHT = 150;
export const LazyTrendChart = dynamic(
  () => import("./SimulatedHighchart").then((m) => m.SimulatedHighchart),
  { ssr: false, loading: () => <Placeholder height={RECORD_TREND_HEIGHT} /> },
);

const ExecutionChartImpl = lazy(() => import("./ExecutionChart").then((m) => ({ default: m.ExecutionChartBlock })));

/** The FX execution chart (Highcharts and a data grid). While it loads, the
    block holds the height the panel is set to. */
export function LazyExecutionChartBlock(props: { system: DesignSystem; blockId?: string }) {
  const height = useBuilder((s) => panelHeightOf((props.blockId ? s.blocks.find((b) => b.id === props.blockId) : undefined)?.props ?? {}));
  return (
    <Suspense fallback={<Placeholder height={height} />}>
      <ExecutionChartImpl {...props} />
    </Suspense>
  );
}
