import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, describe, it, expect } from 'vitest';
import { useBuilder } from '@/store/useBuilder';
import { BUILDER_TEMPLATES } from '@/lib/builderTemplates';
import { EXECUTION_KEYS } from '@/lib/executionModel';
import { PanelFrame } from '../PanelFrame';
import { PanelConfigDialog } from '../PanelConfigDialog';
import { InstrumentHeaderBlock } from '../InstrumentHeader';
import { ExecutionChartBlock } from '../ExecutionChart';
import { RecordPanelBlock } from '../RecordPanel';
import { MetricTileBlock, EntityHeaderBlock } from '../ReportBlocks';
import { PreviewReadOnlyContext } from '../previewReadOnly';

let root: Root;
let host: HTMLDivElement;
const initial = useBuilder.getState();
const dataset = {
  id: 'test', label: 'Positions', baseCurrency: 'GBP',
  tables: [{ id: 'positions', label: 'Positions', grain: 'One entity',
    fields: [{ key: 'name', label: 'Name', role: 'dimension' as const }, { key: 'amount', label: 'Amount', role: 'measure' as const }],
    rows: [{ name: 'Alpha', amount: 35 }, { name: 'Beta', amount: 65 }],
  }],
};

beforeEach(() => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  /* The FX header's feed buttons are the design system's own (Salt's
     viewport provider observes its wrapper); jsdom has no ResizeObserver. */
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
  }
  useBuilder.setState(initial);
  host = document.createElement('div');
  host.className = 'bp-main';
  document.body.appendChild(host);
  root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); });
function render(element: React.ReactNode) { act(() => root.render(element)); }
function click(selector: string) {
  const button = host.querySelector<HTMLButtonElement>(selector);
  expect(button, selector).not.toBeNull();
  act(() => button!.click());
}

describe('report component behavior', () => {
  it('PanelFrame expands into the canvas and Escape restores opener focus', () => {
    render(<PanelFrame system="salt" blockId="panel" title="Holdings" height={300} tools>
      {height => <button data-height={height}>Panel action</button>}
    </PanelFrame>);
    const opener = host.querySelector<HTMLButtonElement>('[aria-label="Expand Holdings"]')!;
    act(() => opener.focus());
    click('[aria-label="Expand Holdings"]');
    expect(useBuilder.getState().expandedPanel).toMatchObject({ id: 'panel' });
    expect(host.querySelector('.dh-expand-inner')?.contains(document.activeElement)).toBe(true);
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(useBuilder.getState().expandedPanel).toBeNull();
    expect(document.activeElement).toBe(host.querySelector('[aria-label="Expand Holdings"]'));
    expect(document.activeElement?.isConnected).toBe(true);
  });

  it('PanelConfigDialog resets panel props to its template, then closes with Close and with Escape', () => {
    const tpl = BUILDER_TEMPLATES['performance-analytics'];
    const original = tpl.body.find(block => block.id === 'tpl-perf-allocation')!;
    useBuilder.setState({ activeTemplateId: 'performance-analytics', reportData: null,
      blocks: [{ ...original, props: { ...original.props, title: 'Changed title' } }],
      expandedPanel: { id: original.id, config: true },
    });
    const launcher = { current: null };
    render(<PanelConfigDialog system="uoaui" blockId={original.id} launcher={launcher} />);
    const dialog = document.body.querySelector<HTMLElement>('[role="dialog"].dh-cfg-dialog');
    expect(dialog?.getAttribute('aria-labelledby')).toBeTruthy();
    expect(document.getElementById(dialog!.getAttribute('aria-labelledby')!)?.textContent).toBe('Configuration');
    const button = (name: string) => [...document.body.querySelectorAll<HTMLButtonElement>('.dh-cfg-dialog button')].find(b => (b.getAttribute('aria-label') ?? b.textContent) === name)!;
    expect(button('Reset to first loaded').disabled).toBe(false);
    act(() => button('Reset to first loaded').click());
    expect(useBuilder.getState().blocks[0].props).toEqual(original.props);
    expect(button('Reset to first loaded').disabled).toBe(true);
    act(() => button('Close').click());
    expect(useBuilder.getState().expandedPanel).toEqual({ id: original.id, config: false });
    useBuilder.setState({ expandedPanel: { id: original.id, config: true } });
    act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(useBuilder.getState().expandedPanel).toEqual({ id: original.id, config: false });
  });

  it('PanelConfigDialog: the tabs, the Available tree and its filter, and a row group regroups the panel', () => {
    const tpl = BUILDER_TEMPLATES['performance-analytics'];
    const original = tpl.body.find(block => block.id === 'tpl-perf-allocation')!;
    useBuilder.setState({ activeTemplateId: 'performance-analytics', reportData: null, reportState: {},
      blocks: [original], expandedPanel: { id: original.id, config: true } });
    render(<PanelConfigDialog system="uoaui" blockId={original.id} launcher={{ current: null }} />);
    const q = <T extends Element = HTMLElement>(sel: string) => document.body.querySelector<T>(`.dh-cfg-dialog ${sel}`);
    const tabs = [...document.body.querySelectorAll<HTMLButtonElement>('.dh-cfg-dialog [role="tab"]')];
    expect(tabs.map(t => t.textContent)).toEqual(['Columns', 'Groups', 'Display']);
    expect(q('[role="tablist"]')?.getAttribute('aria-label')).toBeTruthy();
    /* Arrow keys move along the tabs. */
    act(() => { tabs[0].focus(); tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })); });
    expect(q('[role="tab"][aria-selected="true"]')?.textContent).toBe('Groups');
    expect(q('[role="tree"]')).not.toBeNull();
    expect(q('[role="treeitem"][aria-expanded="true"]')).not.toBeNull();
    const before = q('#dh-cfg-available')!.textContent;
    /* Filter: counts follow, then "No matches". */
    const input = q<HTMLInputElement>('#dh-cfg-filter-groups')!;
    const type = (v: string) => act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, v);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    type('zzzz');
    expect(q('#dh-cfg-available')!.textContent).toBe('Available: 0');
    expect(q('.dh-cfg-pane')!.textContent).toContain('No matches');
    type('');
    expect(q('#dh-cfg-available')!.textContent).toBe(before);
    /* The donut is grouped already and has no column group: nothing to add. */
    expect(q('.dh-cfg-leaf.is-addable')).toBeNull();
    expect(q('.dh-cfg-pane:last-child')!.textContent).toContain('A pie or donut has no column group');
    /* Remove the row group: the empty state; add one back: the panel regroups by it. */
    act(() => q<HTMLButtonElement>('.dh-cfg-pane:last-child button[aria-label^="Remove"]')!.click());
    expect(q('.dh-cfg-pane:last-child')!.textContent).toContain('No row groups');
    expect(q('.dh-cfg-pane:last-child')!.textContent).toContain('Add attributes from Available');
    const addable = q<HTMLElement>('.dh-cfg-leaf.is-addable')!;
    const key = addable.getAttribute('data-node')!.replace('leaf-', '');
    act(() => addable.click());
    expect((useBuilder.getState().blocks[0].props.binding as { groupBy?: string }).groupBy).toBe(key);
    expect(q('.dh-cfg-pane:last-child')!.textContent).toContain(addable.querySelector('.dh-cfg-name')!.textContent);
  });

  it('InstrumentHeader changes the selected order and updates the active tab', () => {
    useBuilder.setState({ activeTemplateId: 'fx-execution', reportData: null, reportState: {} });
    render(<InstrumentHeaderBlock />);
    const tabs = host.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    expect(tabs.length).toBeGreaterThan(1);
    const nextId = tabs[1].querySelector('.dh-instrument-mono')!.textContent;
    act(() => tabs[1].click());
    expect(useBuilder.getState().reportState[EXECUTION_KEYS.order]).toBe(nextId);
    expect(tabs[1].getAttribute('aria-selected')).toBe('true');
    expect(tabs[0].getAttribute('aria-selected')).toBe('false');
    expect(host.textContent).toContain('Sample data');
  });

  it('ExecutionChart range and interval controls update report state', () => {
    useBuilder.setState({ activeTemplateId: 'fx-execution', reportData: null, reportState: {} });
    render(<ExecutionChartBlock system="salt" />);
    const ranges = host.querySelectorAll<HTMLButtonElement>('.dh-exec-range');
    const range = ranges[0];
    act(() => range.click());
    expect(useBuilder.getState().reportState[EXECUTION_KEYS.range]).toBe(range.textContent);
    expect(range.getAttribute('aria-pressed')).toBe('true');
    click('[aria-label="Interval"]');
    const options = host.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
    const selected = options[1].textContent;
    act(() => options[1].click());
    expect(useBuilder.getState().reportState[EXECUTION_KEYS.interval]).toBe(selected);
    expect(host.querySelector('[role="menu"]')).toBeNull();
  });

  it('RecordPanel follows a selected row and clearing returns its empty instruction', () => {
    useBuilder.setState({ reportData: dataset, reportState: {}, blocks: [{ id: 'record', type: 'RecordPanel', props: {
      title: 'Detail', binding: { table: 'positions', keyField: 'name', state: 'entity',
        sections: [{ type: 'pairs', items: [{ label: 'Amount', field: 'amount' }] }],
      },
    } }] });
    render(<RecordPanelBlock system="salt" blockId="record" />);
    expect(host.textContent).toContain('Select a row');
    act(() => useBuilder.getState().setReportState('entity', 'Beta'));
    expect(host.querySelector('dd')?.textContent).toBe('65');
    click('.dh-record-clear');
    expect(useBuilder.getState().reportState.entity).toBeUndefined();
    expect(host.textContent).toContain('Select a row');
  });

  it('MetricTile selection updates the category without selecting the editor block', () => {
    useBuilder.setState({ reportState: {}, blocks: [{ id: 'tile', type: 'MetricTile', props: {
      label: 'Governance', value: '42', selectState: 'category', selectValue: 'governance',
    } }] });
    let bubbled = false;
    render(<PreviewReadOnlyContext.Provider value={true}><div onClick={() => { bubbled = true; }}>
      <MetricTileBlock system="salt" blockId="tile" />
    </div></PreviewReadOnlyContext.Provider>);
    click('.dh-tile');
    expect(useBuilder.getState().reportState.category).toBe('governance');
    expect(host.querySelector('.dh-tile')?.getAttribute('aria-pressed')).toBe('true');
    expect(bubbled).toBe(false);
  });

  it('EntityHeader rereads the selected entity instead of retaining stale facts', () => {
    useBuilder.setState({ reportData: dataset, reportState: { entity: 'Alpha' }, blocks: [{ id: 'entity', type: 'EntityHeader', props: {
      binding: { table: 'positions', keyField: 'name', state: 'entity' }, facts: [{ label: 'Amount', field: 'amount' }],
    } }] });
    render(<EntityHeaderBlock system="salt" blockId="entity" />);
    expect(host.querySelector('h2')?.textContent).toBe('Alpha');
    act(() => useBuilder.getState().setReportState('entity', 'Beta'));
    expect(host.querySelector('h2')?.textContent).toBe('Beta');
    expect(host.querySelector('dd')?.textContent).toBe('65');
  });
});
