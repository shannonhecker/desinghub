import { describe, it, expect, beforeEach } from 'vitest';
import { BUILDER_TEMPLATES } from '../builderTemplates';
import { applyTemplateToCanvas, openTemplateLink, setReportControlValue } from '../applyTemplate';
import { buildLocalSessionSnapshot, restoreLocalSession } from '../localSession';
import { useBuilder } from '@/store/useBuilder';

beforeEach(() => applyTemplateToCanvas(BUILDER_TEMPLATES['analytics-home'], 'salt'));
describe('Analytics Home destinations', () => {
  for (const [label, content] of [['Configuration', 'Base currency'], ['Approvals', 'Pending'], ['Reports', 'SI Portfolio Report, December']]) {
    it(`${label} opens populated reference content and keeps dashboard edits on return`, () => {
      const s = useBuilder.getState();
      const target = s.sidebarBlocks.find(block => block.props.label === label)!;
      s.updateBlockProps('tpl-home-hero', { title: 'My analytics workspace' });
      s.openNavPage(target.id, label);
      expect(JSON.stringify(useBuilder.getState().blocks)).toContain(content);
      useBuilder.getState().openNavPage('tpl-home-nav-0', 'Dashboards');
      expect(useBuilder.getState().blocks.find(block => block.id === 'tpl-home-hero')?.props.title).toBe('My analytics workspace');
    });
  }
  it('reapplying starts a fresh template without keeping old page edits', () => {
    useBuilder.getState().openNavPage('tpl-home-nav-1', 'Configuration');
    useBuilder.getState().setBlocks([{ id: 'old', type: 'PageTitle', props: { text: 'Old edit' } }]);
    applyTemplateToCanvas(BUILDER_TEMPLATES['analytics-home'], 'salt');
    useBuilder.getState().openNavPage('tpl-home-nav-1', 'Configuration');
    expect(JSON.stringify(useBuilder.getState().blocks)).toContain('Base currency');
    expect(useBuilder.getState().blocks.some(block => block.id === 'old')).toBe(false);
  });
});

/* Configuration holds report defaults. A reload clears the transient report
   state (chart picks, live values), so the four settings keep their value in
   the page itself and a report opened from Home reads it from there. */
describe('Analytics Home configuration defaults', () => {
  const reload = () => {
    const s = useBuilder.getState();
    restoreLocalSession({ id: s.currentSessionId ?? 'sess-test', name: 'Test', updatedAt: Date.now(), snapshot: buildLocalSessionSnapshot(s) });
  };
  const chooseOnConfiguration = (blockId: string, stateKey: string, value: string) => {
    useBuilder.getState().openNavPage('tpl-home-nav-1', 'Configuration');
    const block = useBuilder.getState().blocks.find(b => b.id === blockId)!;
    setReportControlValue(blockId, block.props as Record<string, unknown>, stateKey, value);
  };
  const filterValue = (stateKey: string) => {
    const bar = useBuilder.getState().headerBlocks.find(b => Array.isArray(b.props.filters))!;
    return (bar.props.filters as { stateKey: string; value: string }[]).find(f => f.stateKey === stateKey)?.value;
  };

  it('marks exactly the four Configuration settings as persisted', () => {
    useBuilder.getState().openNavPage('tpl-home-nav-1', 'Configuration');
    const flagged = useBuilder.getState().blocks.filter(b => b.props.persistValue === true).map(b => b.props.stateKey);
    expect(flagged).toEqual(['currency', 'benchmark', 'periodicity', 'feeType']);
  });

  it('a Configuration change survives a reload and opens the report in that currency', () => {
    chooseOnConfiguration('tpl-home-config-currency', 'currency', 'USD');
    useBuilder.getState().openNavPage('tpl-home-nav-3', 'Reports');
    reload();
    expect(useBuilder.getState().reportState).toEqual({});
    useBuilder.getState().openNavPage('tpl-home-nav-0', 'Dashboards');
    openTemplateLink(BUILDER_TEMPLATES['performance-analytics'], 'salt');
    const s = useBuilder.getState();
    expect(s.activeTemplateId).toBe('performance-analytics');
    /* The Currency dropdown shows report state first, then the filter's value. */
    expect(s.reportState.currency ?? filterValue('currency')).toBe('USD');
  });

  it('an explicit current choice outranks the saved default', () => {
    chooseOnConfiguration('tpl-home-config-currency', 'currency', 'USD');
    reload();
    useBuilder.getState().setReportState('currency', 'EUR');
    openTemplateLink(BUILDER_TEMPLATES['performance-analytics'], 'salt');
    expect(useBuilder.getState().reportState.currency).toBe('EUR');
  });

  it('the saved default comes back to Configuration after visiting a report and reloading', () => {
    chooseOnConfiguration('tpl-home-config-fees', 'feeType', 'Gross of fees');
    openTemplateLink(BUILDER_TEMPLATES['performance-analytics'], 'salt');
    reload();
    expect(filterValue('feeType')).toBe('Gross of fees');
    openTemplateLink(BUILDER_TEMPLATES['analytics-home'], 'salt');
    useBuilder.getState().openNavPage('tpl-home-nav-1', 'Configuration');
    expect(useBuilder.getState().blocks.find(b => b.id === 'tpl-home-config-fees')?.props.value).toBe('Gross of fees');
  });

  it('a report control without the flag stays transient', () => {
    const block = useBuilder.getState().blocks.find(b => b.id === 'tpl-home-filter-class')!;
    setReportControlValue(block.id, block.props as Record<string, unknown>, 'homeClass', 'Company');
    expect(useBuilder.getState().reportState.homeClass).toBe('Company');
    expect(useBuilder.getState().blocks.find(b => b.id === 'tpl-home-filter-class')?.props.value).toBe('All');
  });
});
