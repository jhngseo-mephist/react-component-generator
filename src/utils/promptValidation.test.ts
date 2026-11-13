import { describe, expect, it } from 'vitest';
import { isPromptLengthValid } from './promptValidation';

describe('isPromptLengthValid', () => {
  it.each([0, 499, 500])('%i자 입력을 허용한다', (length) => {
    expect(isPromptLengthValid('가'.repeat(length))).toBe(true);
  });

  it('공백과 줄바꿈도 제한에 포함한다', () => {
    expect(isPromptLengthValid('가'.repeat(499) + ' \n')).toBe(false);
  });
  it('501자 입력을 거부한다', () => {
    expect(isPromptLengthValid('가'.repeat(501))).toBe(false);
  });
});
