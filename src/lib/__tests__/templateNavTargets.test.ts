import { describe, it, expect } from 'vitest';
import { BUILDER_TEMPLATES, VALID_TEMPLATE_IDS } from '../builderTemplates';

/* Every navigation target a template offers must lead somewhere with content:
   another report (a template link), the page already on the canvas, or an
   authored page. Selecting a nav item must never open a blank page. */
describe('template navigation targets', () => {
  for (const [id, tpl] of Object.entries(BUILDER_TEMPLATES)) {
    it(`${id}: every sidebar item has content`, () => {
      const blank: string[] = [];
      tpl.sidebar.forEach((block, i) => {
        if (block.type !== 'NavItem') return;
        const link = block.props.templateId;
        if (typeof link === 'string' && (VALID_TEMPLATE_IDS as readonly string[]).includes(link)) return;
        const current = block.props.active === true || (i === 0 && !tpl.sidebar.some(b => b.props.active === true));
        if (current && tpl.body.length > 0) return;
        const page = tpl.pages?.find(p => p.id === block.id);
        if (page && page.body.length > 0) return;
        blank.push(String(block.props.label));
      });
      expect(blank).toEqual([]);
    });
  }
});
