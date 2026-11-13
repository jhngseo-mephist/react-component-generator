import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./components/ComponentCard', () => ({ ComponentCard: () => null }));
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ json: async () => ({ envKeys: { google: false, anthropic: false } }) }));
});
afterEach(() => vi.unstubAllGlobals());

it('restores the selected provider and its own manually entered API key after remount', async () => {
  const first = render(<App />);
  await waitFor(() => expect(fetch).toHaveBeenCalled());
  fireEvent.change(screen.getByLabelText('API 키'), { target: { value: 'google-test-key' } });
  fireEvent.change(screen.getByLabelText('AI 제공자'), { target: { value: 'anthropic' } });
  expect(screen.getByLabelText('API 키')).toHaveValue('');
  fireEvent.change(screen.getByLabelText('API 키'), { target: { value: 'anthropic-test-key' } });
  first.unmount();
  render(<App />);
  expect(screen.getByLabelText('AI 제공자')).toHaveValue('anthropic');
  expect(screen.getByLabelText('API 키')).toHaveValue('anthropic-test-key');
  fireEvent.change(screen.getByLabelText('AI 제공자'), { target: { value: 'google' } });
  expect(screen.getByLabelText('API 키')).toHaveValue('google-test-key');
  fireEvent.change(screen.getByLabelText('API 키'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('AI 제공자'), { target: { value: 'anthropic' } });
  fireEvent.change(screen.getByLabelText('AI 제공자'), { target: { value: 'google' } });
  expect(screen.getByLabelText('API 키')).toHaveValue('');
});

it('restores submitted prompt history independently of deleted components and reuses it', async () => {
  vi.mocked(fetch).mockImplementation(async (url) => ({
    ok: true,
    json: async () => url === '/api/config'
      ? { envKeys: { google: true, anthropic: false } }
      : { code: 'render(<div />)' },
  }) as Response);
  const first = render(<App />);
  await screen.findByText('.env 키가 연결되어 있습니다.');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '나만의 히스토리 카드' } });
  fireEvent.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
  await screen.findByRole('button', { name: '전체 삭제' });
  fireEvent.click(screen.getByRole('button', { name: '전체 삭제' }));
  first.unmount();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: '나만의 히스토리 카드' }));
  expect(screen.getByRole('textbox')).toHaveValue('나만의 히스토리 카드');
});
