import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptInput } from './PromptInput';

describe('PromptInput', () => {
  it('500자까지 생성할 수 있고 현재 글자 수를 표시한다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);
    const prompt = '가'.repeat(500);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: prompt } });
    expect(screen.getByText('500 / 500자')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    expect(onGenerate).toHaveBeenCalledWith(prompt);
  });

  it('500자 초과 시 오류를 표시하고 버튼 제출을 막는다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '가'.repeat(501) } });
    expect(screen.getByRole('alert')).toHaveTextContent('프롬프트는 500자 이내로 입력해주세요.');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/프롬프트는 500자 이내로 입력해주세요/);
    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it.each(['ctrlKey', 'metaKey'])('500자 초과 시 %s+Enter 제출을 막는다', (modifier) => {
    const onGenerate = vi.fn();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '가'.repeat(501) } });
    fireEvent.keyDown(input, { key: 'Enter', [modifier]: true });
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('초과 입력을 500자로 줄이면 오류가 해제되고 다시 생성할 수 있다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '가'.repeat(501) } });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: '가'.repeat(500) } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'false');
    await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    expect(onGenerate).toHaveBeenCalledWith('가'.repeat(500));
  });

  it('앞뒤 공백을 제거하기 전의 원문 길이로 제출을 검증한다', () => {
    const onGenerate = vi.fn();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: ' ' + '가'.repeat(500) } });
    fireEvent.submit(input.closest('form')!);
    expect(onGenerate).not.toHaveBeenCalled();
  });

  it('프롬프트가 비어 있으면 생성 버튼이 비활성이다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
  });

  it('입력하면 버튼이 활성화되고 클릭 시 입력값으로 onGenerate가 호출된다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

    await user.type(screen.getByRole('textbox'), '프로필 카드');
    const submit = screen.getByRole('button', { name: '컴포넌트 생성' });
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onGenerate).toHaveBeenCalledWith('프로필 카드');
  });

  it('로딩 중에는 생성 버튼이 비활성이고 "생성 중..." 을 보여준다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: '생성 중...' })).toBeDisabled();
  });
});
