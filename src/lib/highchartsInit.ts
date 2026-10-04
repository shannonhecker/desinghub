import Highcharts from "highcharts";

/* ── Initialize Highcharts modules once (shared across ChartsPage + SimulatedHighchart) ── */
let modulesInit = false;

export function ensureHighchartsModules() {
  if (modulesInit || typeof window === "undefined") return;
  modulesInit = true;
  /* eslint-disable @typescript-eslint/no-require-imports */
  [
    require("highcharts/highcharts-more"),
    require("highcharts/modules/solid-gauge"),
    require("highcharts/modules/heatmap"),
    require("highcharts/modules/treemap"),
    /* Candlestick and OHLC series (the FX execution chart). */
    require("highcharts/modules/stock"),
    /* Screen-reader region, keyboard navigation of points, and no "consider
       including the accessibility module" console warning per chart. */
    require("highcharts/modules/accessibility"),
  ].forEach((m) => {
    const init = typeof m === "function" ? m : m?.default;
    if (typeof init === "function") init(Highcharts);
  });
}
