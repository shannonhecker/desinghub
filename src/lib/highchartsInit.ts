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
  ].forEach((m) => {
    const init = typeof m === "function" ? m : m?.default;
    if (typeof init === "function") init(Highcharts);
  });
}
