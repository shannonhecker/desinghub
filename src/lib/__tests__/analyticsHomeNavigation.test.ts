import { describe, it, expect, beforeEach } from 'vitest';
import { BUILDER_TEMPLATES } from '../builderTemplates';
import { applyTemplateToCanvas } from '../applyTemplate';
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
