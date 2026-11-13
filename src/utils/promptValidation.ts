export const MAX_PROMPT_LENGTH = 500;

/** 공백과 줄바꿈을 포함한 입력 원문의 UTF-16 길이를 검증한다. */
export function isPromptLengthValid(prompt: string): boolean {
  return prompt.length <= MAX_PROMPT_LENGTH;
}
