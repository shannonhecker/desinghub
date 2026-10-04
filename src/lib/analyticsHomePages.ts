/** Populated Home destinations adapted from Shannon Hecker's Analytics Dashboard.
 * The lists are sample content; configuration changes the shared report filters. */
import type { Block, Page } from '@/store/useBuilder';
import { BODY_LAYOUT } from './financeTemplates';

const full = { width: '12fr' } as const;
const title = (id: string, text: string): Block => ({ id, type: 'PageTitle', props: { text, level: 2 }, layout: { ...full, height: '32px' } });
/* A Configuration setting: `persistValue` saves a change on the block itself,
   so it survives a reload while other report state stays transient. */
const field = (id: string, label: string, stateKey: string, value: string, options: string[]): Block => ({
  id, type: 'SimulatedDropdown', props: { label, stateKey, value, inline: true, optionsCsv: options.join(', '), persistValue: true },
  layout: { width: '6fr', height: '32px', spanTablet: 6, spanPhone: 12 },
});
const grid = (id: string, title: string, columns: [string, string][], rows: Record<string, string>[]): Block => ({
  id, type: 'DataGrid', props: { title, subtitle: 'Sample data', height: 360,
    columns: columns.map(([field, header]) => ({ field, header, minWidth: field === 'report' || field === 'name' ? 240 : 120, flex: field === 'report' || field === 'name' ? 2 : 1 })), rows,
  }, layout: full,
});

export const ANALYTICS_HOME_PAGES: Page[] = [
  { id: 'tpl-home-nav-1', name: 'Configuration', bodyLayout: BODY_LAYOUT, body: [
    title('tpl-home-config-title', 'Configuration'),
    title('tpl-home-config-data', 'Dashboard settings'),
    field('tpl-home-config-currency', 'Base currency', 'currency', 'GBP', ['GBP', 'USD', 'EUR']),
    field('tpl-home-config-benchmark', 'Default benchmark', 'benchmark', 'Primary', ['Primary', 'Secondary', 'Custom', 'None']),
    field('tpl-home-config-period', 'Periodicity', 'periodicity', 'Monthly', ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']),
    field('tpl-home-config-fees', 'Fee type', 'feeType', 'Net of fees', ['Net of fees', 'Gross of fees']),
  ] },
  { id: 'tpl-home-nav-2', name: 'Approvals', bodyLayout: BODY_LAYOUT, body: [
    title('tpl-home-approvals-title', 'Approvals'),
    grid('tpl-home-approvals-grid', 'Reports awaiting review', [['report', 'Report'], ['requestedBy', 'Requested by'], ['submitted', 'Submitted'], ['status', 'Status']], [
      { report: 'Sustainable Investment Portfolio Report', requestedBy: 'A. Okafor', submitted: 'Dec 02 2024', status: 'Pending' },
      { report: 'Performance, Q4 attribution', requestedBy: 'L. Marchetti', submitted: 'Dec 01 2024', status: 'Pending' },
      { report: 'Risk, VaR limits review', requestedBy: 'S. Haddad', submitted: 'Nov 28 2024', status: 'In review' },
      { report: 'SI Issuer Report, climate', requestedBy: 'R. Nguyen', submitted: 'Nov 27 2024', status: 'Approved' },
      { report: 'Screening, exclusions update', requestedBy: 'M. Bianchi', submitted: 'Nov 25 2024', status: 'Approved' },
    ]),
  ] },
  { id: 'tpl-home-nav-3', name: 'Reports', bodyLayout: BODY_LAYOUT, body: [
    title('tpl-home-reports-title', 'Reports Repository'),
    grid('tpl-home-reports-grid', 'Reports Repository', [['name', 'Report name'], ['owner', 'Owner'], ['modified', 'Modified'], ['format', 'Format']], [
      { name: 'SI Portfolio Report, December', owner: 'Portfolio Analytics', modified: 'Dec 02 2024', format: 'PDF' },
      { name: 'Performance attribution, YTD', owner: 'Performance Team', modified: 'Dec 01 2024', format: 'XLSX' },
      { name: 'Risk pack, monthly', owner: 'Risk Team', modified: 'Nov 30 2024', format: 'PDF' },
      { name: 'Issuer ESG breakdown', owner: 'SI Research', modified: 'Nov 29 2024', format: 'CSV' },
      { name: 'Screening universe snapshot', owner: 'Screening Desk', modified: 'Nov 26 2024', format: 'XLSX' },
    ]),
  ] },
];
