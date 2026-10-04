/** Populated Home destinations adapted from Shannon Hecker's Analytics Dashboard.
 * The lists are sample content; configuration changes the shared report filters. */
import type { Block, Page } from '@/store/useBuilder';
import { BODY_LAYOUT } from './financeTemplates';
import { gridPanelHeightFor } from './panelMetrics';

const full = { width: '12fr' } as const;
/* One page heading with a plain-language caption, then section headings. */
const heading = (id: string, text: string, caption: string): Block => ({ id, type: 'PageTitle', props: { text, caption }, layout: full });
const title = (id: string, text: string): Block => ({ id, type: 'PageTitle', props: { text, level: 2 }, layout: { ...full, height: '32px' } });
/* A Configuration setting: `persistValue` saves a change on the block itself,
   so it survives a reload while other report state stays transient. */
const field = (id: string, label: string, stateKey: string, value: string, options: string[]): Block => ({
  id, type: 'SimulatedDropdown', props: { label, stateKey, value, inline: true, optionsCsv: options.join(', '), persistValue: true },
  /* Four to a row: each control is as wide as its label and value need. */
  layout: { width: '3fr', height: '32px', spanTablet: 6, spanPhone: 12 },
});
/* Each column is at least as wide as its longest value (12px text, about
   6.6px a character, plus the cell padding), so nothing ends in an
   ellipsis; spare width goes to the first column. When a phone is narrower
   than the columns, the grid scrolls sideways inside its panel, and its
   right edge fades while there is more to the right (`edgeFade`). */
const CHAR_PX = 6.6;
const CELL_PAD_PX = 26;
const grid = (id: string, title: string, columns: [string, string][], rows: Record<string, string>[], width: 6 | 12 = 12): Block => ({
  id, type: 'DataGrid', props: { title, subtitle: 'Sample data', height: gridPanelHeightFor(rows.length), edgeFade: true,
    columns: columns.map(([field, header], i) => ({
      field, header, flex: i === 0 ? 2 : 1,
      minWidth: Math.ceil(Math.max(header.length, ...rows.map((r) => String(r[field] ?? '').length)) * CHAR_PX + CELL_PAD_PX),
    })), rows,
  }, layout: width === 12 ? full : { width: `${width}fr`, spanTablet: 12, spanPhone: 12 },
});

export const ANALYTICS_HOME_PAGES: Page[] = [
  { id: 'tpl-home-nav-1', name: 'Configuration', bodyLayout: BODY_LAYOUT, body: [
    heading('tpl-home-config-title', 'Configuration', 'Reports you open from Home start with these settings. Changes save with this workspace.'),
    title('tpl-home-config-data', 'Report defaults'),
    field('tpl-home-config-currency', 'Base currency', 'currency', 'GBP', ['GBP', 'USD', 'EUR']),
    field('tpl-home-config-benchmark', 'Default benchmark', 'benchmark', 'Primary', ['Primary', 'Secondary', 'Custom', 'None']),
    field('tpl-home-config-period', 'Periodicity', 'periodicity', 'Monthly', ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']),
    field('tpl-home-config-fees', 'Fee type', 'feeType', 'Net of fees', ['Net of fees', 'Gross of fees']),
    /* Two lists side by side under the settings, then the change log. */
    grid('tpl-home-config-sources', 'Data sources', [['name', 'Source'], ['refreshed', 'Last refreshed'], ['status', 'Status']], [
      { name: 'Holdings and transactions', refreshed: 'Dec 02, 06:00', status: 'Up to date' },
      { name: 'Benchmarks', refreshed: 'Dec 02, 06:00', status: 'Up to date' },
      { name: 'Market prices', refreshed: 'Dec 02, 05:30', status: 'Up to date' },
      { name: 'ESG and climate research', refreshed: 'Dec 01, 22:00', status: 'Up to date' },
      { name: 'Risk models', refreshed: 'Nov 29, 18:00', status: 'Weekly' },
    ], 6),
    grid('tpl-home-config-delivery', 'Scheduled deliveries', [['name', 'Report'], ['when', 'Sent'], ['to', 'To']], [
      { name: 'SI Portfolio Report', when: 'Monthly, 2nd', to: 'Investment team' },
      { name: 'Performance attribution', when: 'Monthly, 3rd', to: 'Portfolio leads' },
      { name: 'Risk pack', when: 'Weekly', to: 'Risk team' },
      { name: 'Screening snapshot', when: 'Quarterly', to: 'Compliance' },
      { name: 'Governance scorecard', when: 'Quarterly', to: 'Stewardship' },
    ], 6),
    grid('tpl-home-config-log', 'Recent changes', [['name', 'Setting'], ['from', 'From'], ['to', 'To'], ['by', 'Changed by'], ['when', 'When']], [
      { name: 'Default benchmark', from: 'Secondary', to: 'Primary', by: 'A. Okafor', when: 'Nov 28 2024' },
      { name: 'Periodicity', from: 'Quarterly', to: 'Monthly', by: 'L. Marchetti', when: 'Nov 14 2024' },
      { name: 'Fee type', from: 'Gross of fees', to: 'Net of fees', by: 'A. Okafor', when: 'Oct 30 2024' },
      { name: 'Base currency', from: 'USD', to: 'GBP', by: 'S. Haddad', when: 'Oct 02 2024' },
    ]),
  ] },
  { id: 'tpl-home-nav-2', name: 'Approvals', bodyLayout: BODY_LAYOUT, body: [
    heading('tpl-home-approvals-title', 'Approvals', 'Reports waiting for sign-off before they are shared.'),
    grid('tpl-home-approvals-grid', 'Reports awaiting review', [['report', 'Report'], ['requestedBy', 'Requested by'], ['submitted', 'Submitted'], ['status', 'Status']], [
      { report: 'Sustainable Investment Portfolio Report', requestedBy: 'A. Okafor', submitted: 'Dec 02 2024', status: 'Pending' },
      { report: 'Performance, Q4 attribution', requestedBy: 'L. Marchetti', submitted: 'Dec 01 2024', status: 'Pending' },
      { report: 'Risk, VaR limits review', requestedBy: 'S. Haddad', submitted: 'Nov 28 2024', status: 'In review' },
      { report: 'SI Issuer Report, climate', requestedBy: 'R. Nguyen', submitted: 'Nov 27 2024', status: 'Approved' },
      { report: 'Screening, exclusions update', requestedBy: 'M. Bianchi', submitted: 'Nov 25 2024', status: 'Approved' },
      { report: 'Entity comparison, utilities', requestedBy: 'J. Park', submitted: 'Nov 22 2024', status: 'Approved' },
      { report: 'Governance scorecard, Q3', requestedBy: 'E. Laurent', submitted: 'Nov 20 2024', status: 'Returned' },
      { report: 'Climate, portfolio alignment', requestedBy: 'T. Adeyemi', submitted: 'Nov 18 2024', status: 'Approved' },
    ]),
  ] },
  { id: 'tpl-home-nav-3', name: 'Reports', bodyLayout: BODY_LAYOUT, body: [
    heading('tpl-home-reports-title', 'Reports Repository', 'Every report published from this workspace.'),
    grid('tpl-home-reports-grid', 'All reports', [['name', 'Report name'], ['owner', 'Owner'], ['modified', 'Modified'], ['format', 'Format']], [
      { name: 'SI Portfolio Report, December', owner: 'Portfolio Analytics', modified: 'Dec 02 2024', format: 'PDF' },
      { name: 'Performance attribution, YTD', owner: 'Performance Team', modified: 'Dec 01 2024', format: 'XLSX' },
      { name: 'Risk pack, monthly', owner: 'Risk Team', modified: 'Nov 30 2024', format: 'PDF' },
      { name: 'Issuer ESG breakdown', owner: 'SI Research', modified: 'Nov 29 2024', format: 'CSV' },
      { name: 'Screening universe snapshot', owner: 'Screening Desk', modified: 'Nov 26 2024', format: 'XLSX' },
      { name: 'Controversies watchlist', owner: 'SI Research', modified: 'Nov 22 2024', format: 'PDF' },
      { name: 'Governance scorecard, Q3', owner: 'Stewardship Team', modified: 'Nov 20 2024', format: 'PDF' },
      { name: 'Climate alignment, portfolio', owner: 'Portfolio Analytics', modified: 'Nov 18 2024', format: 'XLSX' },
    ]),
  ] },
];
