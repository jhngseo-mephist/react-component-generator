import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useComponentGenerator } from './useComponentGenerator';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

it('restores generated components with Date values and persists deletions', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 'render(<div />)' }) }));
  const first = renderHook(() => useComponentGenerator());
  await act(async () => first.result.current.generate('card', undefined, 'google'));
  first.unmount();
  const restored = renderHook(() => useComponentGenerator());
  expect(restored.result.current.components).toHaveLength(1);
  expect(restored.result.current.components[0].createdAt).toBeInstanceOf(Date);
  act(() => restored.result.current.removeComponent(restored.result.current.components[0].id));
  restored.unmount();
  const empty = renderHook(() => useComponentGenerator());
  await waitFor(() => expect(empty.result.current.components).toEqual([]));
});

it.each(['{broken', '{}', '[{"id":"x","prompt":"p","code":"c","createdAt":"invalid"}]'])('ignores invalid saved components: %s', (saved) => {
  localStorage.setItem('component-studio.components', saved);
  const { result } = renderHook(() => useComponentGenerator());
  expect(result.current.components).toEqual([]);
});

it('keeps generation usable when browser storage is unavailable', async () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('full'); });
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: 'render(<div />)' }) }));
  try {
    const { result } = renderHook(() => useComponentGenerator());
    await act(async () => result.current.generate('card', undefined, 'google'));
    expect(result.current.components).toHaveLength(1);
    expect(result.current.isLoading).toBe(false);
  } finally {
    vi.restoreAllMocks();
  }
});

it('retains failed prompts once while excluding errors and loading state from restored results', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: 'provider unavailable' }) }));
  const first = renderHook(() => useComponentGenerator());
  await act(async () => first.result.current.generate('retry card', undefined, 'google'));
  await act(async () => first.result.current.generate('retry card', undefined, 'google'));
  expect(first.result.current.error).toBe('provider unavailable');
  expect(first.result.current.isLoading).toBe(false);
  first.unmount();
  const restored = renderHook(() => useComponentGenerator());
  expect(restored.result.current.promptHistory).toEqual(['retry card']);
  expect(restored.result.current.components).toEqual([]);
  expect(restored.result.current.error).toBeNull();
  expect(restored.result.current.isLoading).toBe(false);
});
