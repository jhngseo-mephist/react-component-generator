# Agent Rules

## Operational Commands

- 기본 명령은 package.json의 Bun 스크립트를 사용한다. 의존성 변경 시 bun.lock을 함께 관리하고 다른 패키지 관리자의 잠금 파일을 추가하지 않는다.
- 개발: `bun run dev` (API와 Vite 동시 실행), 서버만 실행: `bun run server`.
- 빌드: `bun run build`, 정적 빌드 미리보기: `bun run preview`.
- 검증: `bun run lint`, `bun run test`. 테스트 러너는 Vitest이므로 `bun test`로 대체하지 않는다.
- Bun을 찾을 수 없고 node_modules가 설치되어 있으면 정적 검증은 `node node_modules/typescript/bin/tsc -b`, `node node_modules/vite/bin/vite.js build`, `node node_modules/eslint/bin/eslint.js .`, `node node_modules/vitest/vitest.mjs run`으로 수행할 수 있다. API 실행은 Bun이 필요하다.

## Golden Rules

- **보안 경계:** 서버 환경 키의 실제 값은 브라우저로 반환하지 않는다. /api/config는 제공자별 존재 여부만 반환한다. 키를 VITE_ 변수나 클라이언트 번들로 옮기지 않는다. 근거: [server/index.ts:59](server/index.ts#L59), [server/index.ts:147](server/index.ts#L147).
- **하드 제약:** 생성물은 앱 소스와 달리 import 없는 JavaScript/JSX와 인라인 스타일이어야 한다. TypeScript 문법을 허용하는 식으로 시스템 프롬프트를 변경하지 않는다. 근거: [server/index.ts:9](server/index.ts#L9), [server/index.ts:20](server/index.ts#L20), [src/components/LivePreview.tsx:14](src/components/LivePreview.tsx#L14).
- **이중 방어:** 프롬프트의 render 호출 지시와 서버 응답 정규화를 모두 유지한다. 지시만으로 출력 형식을 보장한다고 가정하지 않는다. 근거: [server/index.ts:12](server/index.ts#L12), [server/index.ts:188](server/index.ts#L188), [server/generator.ts:16](server/generator.ts#L16).
- **테스트 경계:** 기존 테스트는 입력 UI와 서버 순수 함수에 집중되어 있다. 전체 테스트 통과를 API 라우팅·실제 제공자 호출·동적 미리보기의 통합 검증으로 보고하지 않는다. 근거: [src/components/PromptInput.test.tsx:6](src/components/PromptInput.test.tsx#L6), [server/generator.test.ts:1](server/generator.test.ts#L1), [server/fallback.test.ts:1](server/fallback.test.ts#L1), [vite.config.ts:16](vite.config.ts#L16).
- **실행 경계:** API 포트나 경로 변경 시 Bun 서버와 Vite 프록시를 함께 검토한다. 정적 preview가 API까지 실행한다고 가정하지 않는다. 근거: [server/index.ts:138](server/index.ts#L138), [vite.config.ts:8](vite.config.ts#L8), [package.json:7](package.json#L7).

## TDD Rule

**이 규칙은 Rigid — 상황에 맞게 변형하지 마라.**

이 섹션은 **전역 기본값(fallback)**이다. 작업 대상의 하위 디렉토리 AGENTS.md에 별도의 TDD 규칙이 있으면 **하위 규칙을 우선**한다.

### 적용 기준

**반드시 적용:**

- 비즈니스 로직과 상태 전이
- API 요청·응답 처리 및 외부 서비스 연동 로직
- 유틸리티·변환·검증 함수
- 버그 수정: 버그를 재현하는 실패 테스트부터 작성

**TDD 불필요:**

- 타입 정의만 변경
- 설정 파일만 변경
- 동작 로직 없는 순수 UI·스타일·레이아웃 변경
- SQL 작성·변경

파일 위치나 확장자가 아니라 **변경 내용**으로 판단한다. UI·설정에 적용 대상 로직이 섞이면 해당 로직에는 TDD를 적용한다. TDD 면제는 필요한 검증까지 면제한다는 뜻이 아니다.

### RED–GREEN–REFACTOR

1. **RED:** 다음에 구현할 **하나의 동작에 하나의 테스트**를 작성한다. 반드시 실행해 실패를 확인한다. 실패 이유는 **기능 미구현 또는 수정 대상 동작의 부재**여야 한다. 문법 오류, 잘못된 import, 환경·설정 오류는 RED로 인정하지 않는다. 테스트가 이미 통과하면 기대 동작과 재현 조건을 바로잡고 다시 실행한다.
2. **GREEN:** 실패한 테스트를 통과시키는 **최소한의 코드만** 작성한다. **YAGNI**를 지키고 예상 기능·불필요한 추상화를 추가하지 않는다. **신규 테스트와 기존 테스트가 모두 통과**하는지 확인한다.
3. **REFACTOR:** 중복 제거, 이름 개선, 헬퍼 추출로 구조를 정리한다. 변경마다 테스트를 실행해 **green을 유지**한다. **새 동작을 추가하지 않는다.**
4. **반복:** 다음 동작의 **RED**로 돌아간다.

### 삭제 강제 규칙

- 적용 대상에서 **테스트 전에 프로덕션 코드를 먼저 작성했다면 해당 선작성 코드를 삭제하고 RED부터 재시작**한다.
- **참고용으로 남기는 것도 금지**한다. 주석·복사본·임시 파일로 보존하거나 옆에 두고 테스트를 맞추지 않는다.
- 삭제 대상은 이번 작업에서 테스트보다 먼저 작성한 코드다. 기존 코드나 사용자 변경을 임의로 삭제하지 않는다.

### 변명 차단표

| 변명 | 반론 |
| --- | --- |
| 너무 단순해서 테스트 불필요 | **단순함은 면제 기준이 아니다.** 적용 대상이면 작은 실패 테스트부터 작성한다. |
| 나중에 추가하겠다 | 사후 테스트는 RED 확인을 대체하지 못한다. **지금 실패를 확인한다.** |
| 시간이 없다 | 동작 범위를 줄여 사이클을 완료한다. **순서를 생략하지 않는다.** |
| 삭제하면 낭비 | 선작성 코드를 남기면 테스트가 구현을 추종한다. **삭제하고 RED부터 재시작한다.** |
| 프로토타입이다 | 프로토타입도 **적용 기준은 동일**하다. 코드의 임시성을 예외로 삼지 않는다. |

## Project Context

사용자 작업 흐름과 실행 방법은 [README.md](README.md)를 기준으로 한다. 변경 시 프롬프트 입력에서 생성 코드 확인까지의 연결을 보존한다.

기술: React 19, TypeScript 5.9, Vite 8, Bun, react-live 4, Vitest 4.

## Standards & References

- 기존 함수형 컴포넌트와 훅 패턴을 따른다. 타입 전용 의존성은 import type으로 가져온다. TypeScript strict 및 ESLint 설정을 변경 회피 수단으로 완화하지 않는다.
- Git 작업은 현재 브랜치와 사용자 변경을 보존한다. 커밋은 [.agents/skills/commit/SKILL.md](.agents/skills/commit/SKILL.md)에 따라 논리적 단위와 정확한 메시지를 제안하고 승인 후 실행한다. 형식: `feat/fix/refactor/chore: 한국어 요약`. 별도 요청 없이 push나 이력 재작성을 하지 않는다.
- 규칙과 코드가 어긋나면 해당 근거를 다시 확인하고 업데이트를 제안한다. 모든 AGENTS.md는 500줄 미만으로 유지한다. AGENTS.md를 생성한 디렉토리에는 CLAUDE.md의 @AGENTS.md 연결을 유지한다.

## Context Map

- **[API·모델 호출·응답 정규화 수정](server/AGENTS.md)** — Bun 실행과 제공자별 응답 처리 규칙.
- **[입력·결과 상태·미리보기 수정](src/AGENTS.md)** — 브라우저 상태와 react-live 실행 계약.
