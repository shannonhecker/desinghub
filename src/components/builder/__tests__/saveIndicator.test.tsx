import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { it, expect, vi } from 'vitest';
import { useBuilder } from '@/store/useBuilder';
import { SaveIndicator } from '../SaveIndicator';
vi.mock('@/lib/firebase', () => ({ isFirebaseConfigured: false }));

it('renders the save status when optional hint storage is unavailable', () => {
  (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
  const previous = useBuilder.getState();
  useBuilder.setState({ currentSessionId: 'local', saveState: 'saved' });
  const storage = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new DOMException('Blocked', 'SecurityError'); });
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    act(() => root.render(<SaveIndicator />));
    expect(host.textContent).toContain('Saved on this device');
  } finally {
    act(() => root.unmount());
    storage.mockRestore();
    useBuilder.setState(previous);
  }
});
