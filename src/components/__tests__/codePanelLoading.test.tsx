import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { it, expect, vi } from 'vitest';
import { useDesignHub } from '@/store/useDesignHub';

const pending = vi.hoisted(() => {
  let salt!: (value: unknown) => void;
  const saltPromise = new Promise(resolve => { salt = resolve; });
  return { salt, saltPromise };
});
vi.mock('@/data/salt/code-snippets', () => pending.saltPromise);
vi.mock('@/data/m3/code-snippets', () => ({ M3_CODE: { button: { react: 'M3 button snippet', html: 'M3 markup' } } }));
vi.mock('@/components/DesignHubApp', () => ({ useActiveTheme: () => ({ bg: '#fff', fg: '#111', activeSystem: 'm3' }) }));
vi.mock('@/data/registry', () => ({ getComponents: () => [{ id: 'button', name: 'Button' }], getSystemInfo: (name: string) => ({ name }) }));
import { CodePanel } from '../CodePanel';

it('a late previous-system load cannot replace current-system snippets', async () => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  const previous = useDesignHub.getState();
  useDesignHub.setState({ activeSystem: 'salt' });
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    await act(async () => { root.render(<CodePanel componentId="button" />); });
    await act(async () => { useDesignHub.setState({ activeSystem: 'm3' }); });
    expect(host.textContent).toContain('M3 button snippet');
    await act(async () => { pending.salt({ SALT_CODE: { button: { react: 'Salt button snippet', html: 'Salt markup' } } }); });
    expect(host.textContent).toContain('M3 button snippet');
    expect(host.textContent).not.toContain('Salt button snippet');
    await act(async () => { useDesignHub.setState({ activeSystem: 'salt' }); });
    expect(host.textContent).toContain('Salt button snippet');
  } finally {
    act(() => root.unmount());
    useDesignHub.setState(previous);
  }
});
