# Commit Convention

프론트엔드 저장소는 아래 규칙으로 커밋 메시지를 작성합니다.

## Format

`<type>: <subject>`

예시:

- `feat: 결과 분석 및 대시보드 구현`
- `feat: WebSocket 실시간 구현`
- `fix: python version`

## Allowed Types

- `feat`: 사용자 기능 추가/확장
- `fix`: 버그 수정/오작동 해결
- `refactor`: 동작 변화 없는 구조 개선
- `docs`: 문서 수정
- `chore`: 빌드/설정/의존성 등 운영 작업

## Subject Rules

- 한국어/영어 모두 가능, 짧고 명확하게 작성
- 같은 변경 묶음은 **한 번만** 커밋 (중복 메시지 금지)
- 가능한 "무엇을 왜 했는지"가 드러나게 작성
- 불필요한 기호/이모지 사용 금지

## Examples For This Project

- `feat: 강의 업로드-퀴즈생성-세션시작 핵심 플로우 단순화`
- `feat: WebSocket 세션 이벤트 스키마 반영`
- `fix: 401 인증 만료 시 로그인 리다이렉트 처리`
- `chore: Render 배포 환경변수 기본값 갱신`
