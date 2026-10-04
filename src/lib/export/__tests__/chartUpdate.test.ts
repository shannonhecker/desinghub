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
