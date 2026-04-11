# QuizAI Frontend Setup Handoff

백엔드 담당자 공유용 프론트엔드 초기 세팅 문서입니다.  
현재 기준: MVP 개발 단계 (2026-04-07)

## 1) 프로젝트 개요

- 프론트엔드: Next.js (App Router) + TypeScript + Tailwind + Shadcn/UI
- 목표 플로우: 강의 업로드 -> AI 퀴즈 생성 -> 실시간 세션 -> 학생 응답 -> 결과 분석
- API 통신: Axios 기반 공통 클라이언트
- 상태/서버데이터: TanStack Query v5
- 실시간: Browser Native WebSocket

## 2) 현재 프론트엔드 스택

- `next`, `react`, `typescript`
- `axios`
- `@tanstack/react-query`
- `sonner` (토스트)
- `shadcn/ui` (`button`, `input`, `card`, `dialog`, `skeleton`)
- `lucide-react`

## 3) 환경 변수

`src/lib/api-client.ts`와 `src/hooks/use-quiz-socket.ts`에서 아래 값을 사용합니다.

배포 백엔드 문서: [QuizAI Swagger](https://quizai-be.onrender.com/docs)

`.env.local.example`

```env
NEXT_PUBLIC_API_URL=https://quizai-be.onrender.com
NEXT_PUBLIC_WS_URL=wss://quizai-be.onrender.com
```

## 4) API 타입 규약 (프론트 추정 모델)

정의 파일: `src/types/api.ts`

- 사용자
  - `UserRole`: `instructor | student | admin`
  - `Instructor`, `Student`, `Admin`, `AppUser`
- 인증
  - `AuthRequest`, `AuthTokens`, `AuthResponse`
- 강의/퀴즈
  - `Lecture`
  - `QuizQuestion`, `QuizChoice`, `GenerateQuizRequest`
- 세션/결과
  - `Session`, `SessionAnswerRequest`
  - `SessionResult`, `StudentSessionResult`
- 에러
  - `ApiErrorPayload`

> 주의: 일부 필드는 백엔드 스키마를 기준으로 추정 작성됨. 실제 응답 스펙 확정 시 즉시 동기화 필요.

## 5) API 클라이언트 동작

정의 파일: `src/lib/api-client.ts`

- Axios 인스턴스 생성 (`baseURL = NEXT_PUBLIC_API_URL`)
- 요청 인터셉터:
  - `localStorage.access_token` 자동 주입
  - `Authorization: Bearer <token>`
- 공통 요청 함수 `apiRequest<TResponse, TRequest>()`
  - 내부 `try-catch`
  - 에러 시 `sonner` 토스트 표시
  - 타입 안전 응답 반환

## 6) 인증/권한 가드

관련 파일:

- `src/components/auth/auth-guard.tsx`
- `src/lib/auth-storage.ts`
- `src/components/layout/app-shell.tsx`
- `src/components/providers/app-providers.tsx`

적용 사항:

- 비인증 사용자는 보호 라우트 접근 시 `/login` 리다이렉트
- 공개 라우트(` /login`, `/register`)는 인증 상태에서 `/dashboard`로 우회
- role 기반 접근 제한
  - `instructor`: `/instructor`, `/sessions`, `/lectures`, `/dashboard`
  - `student`: `/student`, `/sessions`, `/join`
  - `admin`: `/admin`, `/dashboard`, `/lectures`, `/sessions`
- 공통 레이아웃
  - 데스크톱: 좌측 사이드바
  - 모바일: 햄버거 + `Dialog` 메뉴

## 7) WebSocket 훅 계약

정의 파일: `src/hooks/use-quiz-socket.ts`, 파서: `src/lib/quiz-ws-live-state.ts`

**연결 URL (중요)**  
- **권장**: `POST /sessions/start` · `POST /sessions/join` 응답의 **`ws_url` 문자열을 그대로** 사용 (쿼리에 `nickname`, `token` 붙임).  
- 폴백만: `${NEXT_PUBLIC_WS_URL}/sessions/{sessionId}/join?nickname=…&token=…`  
→ 호스트·경로가 응답과 다르면 **교강사·수강생이 서로 다른 방**에 붙을 수 있음.

**클라이언트 → 서버 (JSON 텍스트 프레임)**

- 답안: `{ "type": "submit_answer", "quiz_id": "…", "selected_option": 0 }`
- 다음 문항: `{ "type": "next_question", "session_id": "<세션 UUID>" }`

**서버 → 클라이언트 (JSON, `type` + `payload` 권장. `event`/`data`·별칭 일부 수용)**

- 필수: 같은 세션 방에 연결된 **모든** 클라이언트(교강사·수강생)에게 **`quiz_started` 브로드캐스트** — 강사만 받고 학생은 못 받으면 수강생 화면에 문항이 안 뜸.
- `quiz_started` payload: `quiz_id`, `question`, `options[]`, `time_limit`(숫자 권장)
- 기타: `session_joined`, `answer_update`, `session_ended`, `error` 등 (`tryParseQuizWsEvent` 참고)

## 8) 화면 상태 (초기 구현)

- `src/app/login/page.tsx`
  - `/auth/login` 호출
  - 토큰/유저 로컬 저장
- `src/app/dashboard/page.tsx`
  - 대시보드 placeholder 카드
- `src/app/lectures/page.tsx`
  - `/quizzes/generate` 호출
  - 로딩 Skeleton UI 적용
- `src/app/sessions/page.tsx`
  - WebSocket 연결/이벤트 표시/정답 제출 예시
- `src/app/join/page.tsx`, `src/app/register/page.tsx`
  - placeholder 상태

## 9) 백엔드 확인 요청 사항

아래 항목 확정 부탁드립니다.

1. Auth 응답 JSON 스키마
   - `accessToken`/`refreshToken` 키 이름 정확 값
2. Quiz 생성 응답 스키마
   - `/quizzes/generate` 반환 타입(배열/객체 래핑 여부)
3. Session Result 스키마
   - `/sessions/{id}/result` 상세 필드
4. WebSocket 메시지 포맷
   - 이벤트 envelope 규칙 (`type`, `payload`) 확정
   - 서버 -> 클라이언트 이벤트 목록 최종본
5. CORS/인증 정책
   - 개발/배포 환경별 허용 origin
   - WebSocket 인증 방식 (토큰 헤더/쿼리/쿠키)

## 10) 백엔드 전달: 실서버 이슈 · WebSocket 점검 (2026-04)

아래는 **프론트만으로는 해결 불가**하거나 **서버 동작 확인이 필수**인 항목입니다.

### A. WebSocket이 “연결은 됐는데” 퀴즈가 안 보일 때

| 증상 | 가능 원인 (백엔드) |
|------|-------------------|
| 수강생 UI에 `실시간 연결됨`인데 계속 문항 대기 | 같은 `session_id` 룸에 붙었으나, **`next_question` 이후 `quiz_started`를 학생 소켓에 안 보냄** (강사에게만 응답 또는 단일 클라이언트만 전송) |
| 교강사만 문제 보이고 수강생은 대기 | 위와 동일 — **세션 단위 브로드캐스트** (`io.to(roomId)` / 채널 그룹 전체) 필요 |
| 연결 자체 실패·즉시 끊김 | **WSS Origin / 프록시 업그레이드** (Vercel FE ↔ Render BE), 방화벽, 잘못된 `ws_url` |

**요청**: `next_question` 수신 시 해당 세션에 참가 중인 **모든** WebSocket에 동일한 `quiz_started`(또는 합의한 이벤트)를 보내는지 확인.

### B. REST `GET /sessions/{session_id}/result` 가 403일 때

- 프론트는 **결과 대시보드**에서만 이 API를 호출함. 퀴즈 플레이(`/student/play`)와는 **별개**다.
- 목록(`GET /students/me/quiz-results`)에 있는 `session_id`로 상세를 열었을 때 403이면: **해당 세션 결과 조회 권한**이 토큰과 맞는지, 목록과 상세 정책이 일치하는지 백엔드 확인 필요.

### C. 세션 ID · `ws_url` 일치

- `POST /sessions/start`와 `POST /sessions/join`이 반환하는 **`session_id`는 동일 참여코드 기준으로 동일**해야 하고, **`ws_url`은 클라이언트가 그대로 써야** 한다.
- 프론트는 join 직후 `ws_url`을 쿼리/저장소에 넣어 **첫 연결부터** 동일 URL을 쓴다.

### D. 디버그 제안

- 서버 로그: `User … joined room [session_id]`, `broadcast quiz_started to room [session_id] (N clients)` 등
- 클라이언트: `NEXT_PUBLIC_DEBUG_QUIZ_WS=true` 시 콘솔에 수신 JSON·파싱 여부 로그 (`use-quiz-socket.ts`)

## 11) 실행 방법

```bash
npm install
npm run dev
```

브라우저: `http://localhost:3000`

---

필요 시 백엔드 OpenAPI 스펙 기준으로 `src/types/api.ts`를 정확 매핑해 2차 동기화하겠습니다.
