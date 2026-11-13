# Frontend Rules

## Module Context

React 화면은 생성 요청 상태를 관리하고, 받은 코드를 react-live로 실행하거나 텍스트로 표시한다. 브라우저에서는 상대 /api 경로로 서버와 통신한다.

## Tech Stack & Constraints

React 19, react-live 4, React Testing Library, jsdom을 사용한다. 앱 자체는 TypeScript지만 생성 코드의 런타임 계약은 루트 규칙을 따른다.

## Implementation Patterns

- 생성 요청과 결과 배열 변경은 useComponentGenerator에서 관리하고, 입력 및 카드 동작은 콜백으로 연결한다.
- GeneratedComponent.createdAt은 Date로 사용한다. 저장·복원 기능 추가 시 문자열을 그대로 전달하지 말고 Date 복원을 포함한다. 근거: [types/index.ts:3](types/index.ts#L3), [components/ComponentCard.tsx:18](components/ComponentCard.tsx#L18).
- 기존 테마 값은 App.css의 토큰을 우선 사용한다. 앱 스타일 수정 시 동적 생성 컴포넌트까지 바뀌는 전역 선택자 확장을 피한다.

## Testing Strategy

- 입력 UI 테스트: `bun run test -- src/components/PromptInput.test.tsx`.
- 사용자 입력과 클릭은 기존 테스트처럼 userEvent와 접근 가능한 role/name으로 확인한다. 테스트별 DOM 정리는 test/setup.ts에서 수행한다.
- 요청·제공자 전환 수정 시 성공/실패, 키 초기화, 로딩 종료를 해당 동작 수준에서 검증한다. 기존 PromptInput 테스트만으로 훅이나 App 흐름이 검증되지는 않는다.
- 스타일 변경은 넓은 화면과 모바일에서 입력·설정·결과 배치를 확인한다. jsdom 테스트는 레이아웃 및 react-live의 실제 브라우저 실행 검증을 대신하지 않는다.

## Local Golden Rules

- **이중 방어:** 제출 핸들러의 trim·로딩 검사와 버튼 disabled 조건을 함께 유지한다. Ctrl/Meta+Enter도 같은 핸들러를 호출하므로 버튼만 막아서는 충분하지 않다. 근거: [components/PromptInput.tsx:20](components/PromptInput.tsx#L20), [components/PromptInput.tsx:45](components/PromptInput.tsx#L45), [components/PromptInput.tsx:54](components/PromptInput.tsx#L54).
- **키 경계:** 사용자 요청에 따라 직접 입력한 키만 localStorage에 제공자별로 저장·복원한다. 제공자 전환 시 해당 제공자의 키를 선택하며 다른 제공자의 키를 요청에 보내지 않는다. 서버 환경 키는 boolean으로만 조회하고 실제 값을 저장하거나 브라우저로 가져오지 않는다. 근거: [App.tsx](App.tsx), [hooks/useStoredState.ts](hooks/useStoredState.ts).
- **재실행 의미:** 미리보기 새로고침은 React key를 바꿔 리마운트하며 생성 API를 호출하지 않는다. 재생성은 기존 prompt로 별도 요청한다. 두 액션을 합치지 않는다. 근거: [components/ComponentCard.tsx:33](components/ComponentCard.tsx#L33), [components/ComponentCard.tsx:41](components/ComponentCard.tsx#L41), [components/ComponentCard.tsx:70](components/ComponentCard.tsx#L70).
- **상태 계약:** 새 결과는 배열 앞에 추가하고 실패 여부와 관계없이 finally에서 로딩을 해제한다. 오류 응답을 컴포넌트로 추가하지 않는다. 근거: [hooks/useComponentGenerator.ts:31](hooks/useComponentGenerator.ts#L31), [hooks/useComponentGenerator.ts:42](hooks/useComponentGenerator.ts#L42).
- **실행 경계:** LiveProvider는 현재 앱 문맥에서 생성 코드를 실행하며 별도 iframe 샌드박스가 아니다. 미리보기를 보안 격리로 설명하거나 비밀값을 scope에 주입하지 않는다. 근거: [components/LivePreview.tsx:14](components/LivePreview.tsx#L14).
