# Server Rules

## Module Context

Bun HTTP 서버에서 제공자 호출을 수행하고 결과를 미리보기용 코드로 정규화한다. 폴백과 코드 정규화는 서버 기동 없이 테스트 가능한 함수로 분리되어 있다.

## Tech Stack & Constraints

- Bun.serve, 기본 fetch, TypeScript를 사용한다. 제공자 요청은 현재 HTTP JSON 계약을 기준으로 수정한다.
- 루트 build의 TypeScript 프로젝트는 src와 vite.config.ts를 검사하며 server를 포함하지 않는다. 빌드 성공을 서버 타입 검사 완료로 보고하지 않는다. 근거: [../tsconfig.app.json:28](../tsconfig.app.json#L28), [../tsconfig.node.json:25](../tsconfig.node.json#L25).

## Implementation Patterns

- 요청 처리는 index.ts에, 서버 기동이 필요 없는 변환·시도 로직은 독립 함수에 둔다. 테스트에서 index.ts를 불러 Bun.serve를 실행시키지 않는다.
- 응답 변환은 stripCodeFences 다음 ensureRenderCall 순서로 적용한다. 코드 펜스 제거를 TypeScript 변환이나 안전성 검증으로 취급하지 않는다.

## Testing Strategy

- 서버 단위 테스트: `bun run test -- server`.
- 정규화 수정은 generator.test.ts에서 펜스 유무, 기존 render 보존, const/function 선언, 선언 없는 입력을 확인한다.
- 폴백 수정은 fallback.test.ts에서 첫 성공 종료, 다음 모델 시도, 최종 에러 전달, 빈 목록을 확인한다.
- HTTP 처리나 제공자 응답 형식 변경은 fetch를 모킹한 회귀 검증 또는 Bun 서버의 해당 경로 검증을 추가한다. 기존 순수 함수 테스트는 네트워크 계약을 검증하지 않는다.

## Local Golden Rules

- **비대칭:** Google만 우선순위 모델 목록을 순차 시도한다. Anthropic에 같은 정책이 있다고 가정하거나 병렬 요청으로 바꾸지 않는다. 현재 모든 실패에서 다음 모델을 시도하고 전부 실패하면 마지막 에러를 전달한다. 근거: [index.ts:68](index.ts#L68), [index.ts:134](index.ts#L134), [fallback.ts:11](fallback.ts#L11), [fallback.test.ts:27](fallback.test.ts#L27).
- **비대칭:** Google의 MAX_TOKENS 종료는 잘린 코드의 성공 응답이 아니라 오류로 처리한다. 이 검사를 제거하거나 잘린 결과를 정규화해 성공으로 반환하지 않는다. 근거: [index.ts:122](index.ts#L122).
- **키 우선순위:** 요청으로 받은 키가 환경 키보다 우선한다. 키 누락은 400으로 반환하고, 전체 요청 URL이나 키를 에러 메시지에 넣지 않는다. Google 요청 URL에는 키가 포함된다. 근거: [index.ts:64](index.ts#L64), [index.ts:99](index.ts#L99), [index.ts:167](index.ts#L167).
- **오류 계약:** 503과 429의 상태 코드 및 안내 메시지 분기를 보존한다. 프런트엔드는 JSON의 error를 읽는다. 근거: [index.ts:194](index.ts#L194), [../src/hooks/useComponentGenerator.ts:29](../src/hooks/useComponentGenerator.ts#L29).
- **기본값 차이:** provider 생략 시 서버는 anthropic, UI 초기값은 google이다. 제공자 추가·기본값 변경 시 서버 분기, 클라이언트 타입과 설정을 함께 검토하고 기존 차이를 무심코 지우지 않는다. 근거: [index.ts:161](index.ts#L161), [../src/App.tsx:16](../src/App.tsx#L16), [../src/types/index.ts:1](../src/types/index.ts#L1).
