import { it, expect } from 'vitest';
import ts from 'typescript';
import Highcharts from 'highcharts';
import 'highcharts/modules/accessibility';
import { chartHelperSource } from '../chartExporter';

it('exported chart code supports donut/pie updates and removes cleared center labels', () => {
  const source = ts.transpileModule(chartHelperSource('salt'), { compilerOptions: { target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React } }).outputText;
  // Execute the actual generated helper, not a parallel options implementation.
  const options = new Function('Highcharts', `${source}; return (kind, props) => { const v = chartTheme('light'); return chartOptionsWithSettings(kind, chartBaseTheme(v, CHART_PALETTE), v, props); };`)(Highcharts);
  const host = document.createElement('div');
  document.body.appendChild(host);
  const props = { seriesData: [{ name: 'A', y: 35 }, { name: 'B', y: 65 }], centerLabel: 'Total', hideTitle: true };
  const chart = Highcharts.chart(host, options('donut', props));
  try {
    expect(host.textContent).toContain('Total');
    chart.update(options('pie', props), true, true, false);
    expect(Number.parseFloat(String((chart.series[0].options as Highcharts.SeriesPieOptions).innerSize))).toBe(0);
    expect(host.textContent).not.toContain('Total');
    expect(chart.series[0].points.map(point => point.y)).toEqual([35, 65]);
    chart.update(options('donut', props), true, true, false);
    expect(host.textContent).toContain('Total');
    chart.update(options('donut', { ...props, centerLabel: '' }), true, true, false);
    expect(host.textContent).not.toContain('Total');
  } finally { chart.destroy(); host.remove(); }
});

import { describe } from 'vitest';
import { buildChartOptions, type HighchartType, type ChartProps, type ThemeVars } from '@/components/builder/SimulatedHighchart';
const vars: ThemeVars = { primary: '#1B7F9E', bg: '#fff', fg: '#111', fgSec: '#444', fgTer: '#777', surface: '#f5f5f5', border: '#ccc', positive: '#0a0', warning: '#fa0', negative: '#d00' };
const theme = { chart: { width: 600, height: 300, animation: false }, title: { style: {} }, xAxis: { labels: {}, title: {} }, yAxis: { labels: {}, title: {} }, tooltip: {}, legend: {}, plotOptions: { series: { animation: false } } };
const generated = ts.transpileModule(chartHelperSource('salt'), { compilerOptions: { target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React } }).outputText;
const exportedOptions = new Function('Highcharts', `${generated}; return (kind, props) => { const v = chartTheme('light'); return chartOptionsWithSettings(kind, chartBaseTheme(v, CHART_PALETTE), v, props); };`)(Highcharts) as (kind: HighchartType, props: ChartProps) => Highcharts.Options;
const builders = [
  ['builder', (kind: HighchartType, props: ChartProps) => buildChartOptions(kind, structuredClone(theme), vars, props)],
  ['export', exportedOptions],
] as const;

describe.each(builders)('%s chart transitions', (_name, options) => {
  it.each([['stacked-column', 'column'], ['stacked-bar', 'bar'], ['stacked-area', 'area']] as const)('%s to %s removes stacking', (from, to) => {
    const host = document.createElement('div'); document.body.appendChild(host);
    const props = { categories: ['A', 'B'], series: [{ name: 'One', data: [10, 20] }, { name: 'Two', data: [30, 40] }] };
    const chart = Highcharts.chart(host, options(from, props));
    try {
      expect((chart.series[0].options as Highcharts.SeriesColumnOptions).stacking).toBe('normal');
      chart.update(options(to, props), true, true, false);
      expect(chart.series.map(series => (series.options as Highcharts.SeriesColumnOptions).stacking)).toEqual([undefined, undefined]);
      expect(chart.series.map(series => series.points.map(point => point.y))).toEqual([[10, 20], [30, 40]]);
      chart.update(options(from, props), true, true, false);
      expect(chart.series.map(series => (series.options as Highcharts.SeriesColumnOptions).stacking)).toEqual(['normal', 'normal']);
    } finally { chart.destroy(); host.remove(); }
  });

  it.each(['line', 'spline', 'area', 'column', 'bar', 'stacked-column', 'stacked-bar', 'stacked-area'] as const)('combination to %s and back retains every series', kind => {
    const host = document.createElement('div'); document.body.appendChild(host);
    const props = { categories: ['A', 'B'], series: [{ name: 'Secondary', data: [10, 20], yAxis: 1 as const }, { name: 'Primary', data: [30, 40] }] };
    const chart = Highcharts.chart(host, options('combination', props));
    try {
      expect(chart.yAxis).toHaveLength(2);
      chart.update(options(kind, props), true, true, false);
      expect(chart.series.map(series => [series.name, series.points.map(point => point.y)])).toEqual([['Secondary', [10, 20]], ['Primary', [30, 40]]]);
      expect(chart.yAxis).toHaveLength(1);
      chart.update(options('combination', props), true, true, false);
      expect(chart.series.map(series => [series.name, series.points.map(point => point.y)])).toEqual([['Secondary', [10, 20]], ['Primary', [30, 40]]]);
      expect(chart.yAxis).toHaveLength(2);
      expect(chart.series[0].yAxis).toBe(chart.yAxis[1]);
    } finally { chart.destroy(); host.remove(); }
  });
});
