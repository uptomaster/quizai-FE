# Prompt History

사용자 프롬프트 원문 기록입니다.

## Entries
QuizAI 프론트엔드 개발을 위한 Cursor 지시서
1. 프로젝트 컨텍스트 (Project Context)
이 프로젝트는 **AI 기반 실시간 교육 피드백 플랫폼 'QuizAI'**입니다.

기간: ~ 2026. 04. 13 (MVP 개발 중)

역할: 프론트엔드 개발 (React/Next.js)

백엔드 환경: FastAPI + Supabase + Claude API (폴더 구조는 아래 참조)

핵심 흐름: 강사 자료 업로드 → AI 퀴즈 생성 → 실시간 세션 시작 → 학생 웹소켓 참여 → 데이터 분석 대시보드

2. 기술 스택 (Tech Stack)
Framework: Next.js 14 (App Router)

Language: TypeScript

Styling: Tailwind CSS + Shadcn/UI (Lucide React Icons)

Data Fetching: TanStack Query (React Query) v5 + Axios

Real-time: Native WebSocket (Browser API)

3. 백엔드 API & 모델 구조 (참고용)
백엔드 담당자가 제공한 app/routers/ 구조에 따라 다음 엔드포인트를 사용합니다:

Auth: /auth/login, /auth/register (JWT 기반)

Lectures: /lectures/upload, /lectures

Quizzes: /quizzes/generate, /quizzes/{lecture_id}

Sessions: /sessions/start, /sessions/{id}/answer, /sessions/{id}/result

WebSocket: ws://.../sessions/{id}/join

4. 커서에게 내리는 [초기 실행 명령]
Step 1: 환경 설정 및 공통 모듈 생성

"위 컨텍스트를 바탕으로 프로젝트 초기 설정을 진행해줘.

src/types/api.ts에 유저(Instructor/Student), 강의, 퀴즈, 세션 결과에 대한 TypeScript Interface를 백엔드 모델 구조를 유추해서 작성해줘.

src/lib/api-client.ts에 Axios 인스턴스를 만들고, localStorage의 access_token을 헤더에 자동 주입하는 인터셉터를 구현해줘.

Shadcn/UI의 Button, Input, Card, Dialog 컴포넌트를 미리 설치해줘."

Step 2: 레이아웃 및 인증 가드

"앱의 사용자 역할(role: instructor, student, admin)에 따라 접근 가능한 페이지를 제한하는 Auth Guard와 공통 사이드바 레이아웃을 만들어줘. 특히 모바일 환경을 고려한 반응형 디자인이 필수야."

Step 3: 실시간 기능(WebSocket) 훅

"백엔드의 websocket/manager.py 구조를 참고해서, 학생이 퀴즈 세션에 접속하고 서버의 이벤트를 수신할 수 있는 useQuizSocket 커스텀 훅을 작성해줘. 퀴즈 시작, 정답 제출, 세션 종료 이벤트를 처리해야 해."

🛠️ 개발 진행 시 유의사항 (커서 전용 규칙)
Zero-Footprint Personalization: 불필요한 사담은 생략하고 코드로 보여줄 것.

Error Handling: 모든 API 요청에 대해 try-catch와 토스트 알림(sonner 등)을 포함할 것.

UX Priority: AI 퀴즈 생성 시 시간이 걸리므로 반드시 로딩 상태(Skeleton UI)를 구현할 것.

Strict Typing: any 타입 사용을 금지하고 인터페이스를 엄격히 준수할 것.

Next.js 프로젝트 생성: npx create-next-app@latest (App Router, TS, Tailwind 선택)

커서 열기: 해당 폴더를 커서로 열고 위 내용을 전달.

백엔드 주소 확인: 백엔드 담당자에게 로컬 서버 주소(예: http://localhost:8000)를 받아 .env.local에 NEXT_PUBLIC_API_URL로 저장하세요.
2. 지금까지 설정한 내용을 md파일 하나 만들어줘. 백엔드 담당자에게 보여줘야해
3. 내가 먼저 할 수 있는걸 먼저해줘
4. 수강생 / 교강사 / 운영자 세 측면에서 각 페이지를 만들어야지.
5. 지금까지의 기록을 커밋하려고해.
6. https://github.com/HongikTheLegend/quizai-FE.git
7. 이제 다음 스텝으로 가보자
8. 로그인만 있는거야? 회원가입도 있어야할거같은데. 그리고 다른 여러 화면도 보여야하고 지금 에러도 몇개있는거같아
9. 참여코드 랜덤 생성과 그걸 쳐서 입장할 수 있게하고 교강사가 pdf파일을 업로드하면 퀴즈 생성도될수 있게해야해
10. 프론트와 백엔드 기준을 명확히 나누는 문서 하나 생성해줘. 그리고 vercel 연동을 미리해도되는건가?
11. Uncaught Error: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <SegmentViewNode type="layout" pagePath="layout.tsx">
      <SegmentTrieNode>
      <link>
      <script>
      <script>
      <script>
      <RootLayout>
        <html lang="en" className="geist_a715...">
          <body className="min-h-full...">
            <AppProviders>
              <QueryClientProvider client={{}}>
                <AuthGuard>
                  <AppShell>
                    <div className="flex min-h...">
                      <aside className="hidden w-6...">
                        <h1>
                        <SidebarLinks items={[...]} pathname="/instructo...">
                          <nav className="space-y-2">
                            <LinkComponent href="/instructo..." onClick={undefined} className="block roun...">
                              <a
+                               className="block rounded-lg px-3 py-2 text-sm transition-colors bg-primary text-primar..."
-                               className="block rounded-lg px-3 py-2 text-sm transition-colors text-muted-foreground ..."
                                ref={function}
                                onClick={function onClick}
                                onMouseEnter={function onMouseEnter}
                                onTouchStart={function onTouchStart}
+                               href="/instructor/dashboard"
-                               href="/student/dashboard"
                              >
+                               대시보드
-                               내 진행현황
                            ...
                      ...
                ...

    at throwOnHydrationMismatch (react-dom-client.development.js:5465:11)
    at prepareToHydrateHostInstance (react-dom-client.development.js:5561:21)
    at completeWork (react-dom-client.development.js:12924:15)
    at runWithFiberInDEV (react-dom-client.development.js:986:30)
    at completeUnitOfWork (react-dom-client.development.js:19132:19)
    at performUnitOfWork (react-dom-client.development.js:19005:11)
    at workLoopConcurrentByScheduler (react-dom-client.development.js:18982:9)
    at renderRootConcurrent (react-dom-client.development.js:18964:15)
    at performWorkOnRoot (react-dom-client.development.js:17822:11)
    at performWorkOnRootViaSchedulerTask (react-dom-client.development.js:20471:7)
    at MessagePort.performWorkUntilDeadline (scheduler.development.js:45:48)


이런 에러 발생중이고, 프론트엔드 차원에서 할 수 있는 최선을 다해서 더 UI를 세련되게 바꾸고 기능을 추가해. 그리고 매 프롬프트마다 커밋을 진행해
12. 브랜치를 main으로 해야지. master는 쓰지 말고, main으로 하고 실 배포전 브랜치에서 작업하고 성공하면 main으로 병합하는 식으로 진행해
13. 없애고, UI를 업그레이드 하고 기능도 좀 더 유저 친화적으로 만들어.
14. 디자인을 더 업그레이드해봐 그러면.
15. 지금 너무 밋밋하고, 더 창의적인 요소가 있으면 좋겠어. 그리고 색도 너무 없으니 따분해보여. 그리고 개설 과목도 열고 볼 수 있으면 좋을거같아
16. 필터(진행중/모집중), 검색, 카드 정렬, 애니메이션 전환뿐만 아니라 진짜 교육 플랫폼처럼 만들어줘
17. 모든 측면에서 확장해서 가져와
18. 내가 지금까지 입력한 프롬프트를 md파일에 따로 저장하고 입력할때마다 최신화해
19. https://quizai-be.onrender.com/docs  여기 백엔드 담당자가 배포한 링크인데 우리에 적용해야해
20. 필요한 백엔드 정보가 더 있어? 이제 프론트엔드 API연결을 마무리지어야해서
21. 내가 보내준 스웨거 링크로 프론트 백엔드 연결작업을 일단 완벽하게 진행해
22. 응 테스트하자
23. [HMR] connected
lecture-service.ts:18  POST https://quizai-be.onrender.com/lectures/upload 401 (Unauthorized)
dispatchXhrRequest @ xhr.js:220
xhr @ xhr.js:16
dispatchRequest @ dispatchRequest.js:48
Promise.then
_request @ Axios.js:180
request @ Axios.js:41
httpMethod @ Axios.js:241
wrap @ bind.js:12
uploadPdf @ lecture-service.ts:18
useUploadLectureMutation.useMutation @ use-upload-lecture-mutation.ts:12
fn @ mutation.ts:190
run @ retryer.ts:156
start @ retryer.ts:222
execute @ mutation.ts:235
await in execute
mutate @ mutationObserver.ts:142
handleUploadLecture @ page.tsx:69
executeDispatch @ react-dom-client.development.js:20610
runWithFiberInDEV @ react-dom-client.development.js:986
processDispatchQueue @ react-dom-client.development.js:20660
(anonymous) @ react-dom-client.development.js:21234
batchedUpdates$1 @ react-dom-client.development.js:3377
dispatchEventForPluginEventSystem @ react-dom-client.development.js:20814
dispatchEvent @ react-dom-client.development.js:25817
dispatchDiscreteEvent @ react-dom-client.development.js:25785Understand this error
api-client.ts:43  POST https://quizai-be.onrender.com/quizzes/generate 401 (Unauthorized)
24. # 개요

프론트엔드(quizai-FE)와 백엔드(quizai-BE)가 합의한 **JSON Request / Response 구조** 확정 문서입니다.

이 문서를 기준으로 양측이 독립적으로 개발합니다. 스키마 변경 시 반드시 이 문서를 먼저 업데이트하고 상대방에게 알려야 합니다.

> **Base URL (로컬):** `http://localhost:8000`
> 

> **Base URL (배포):** `https://quizai-api.onrender.com`
> 

> **인증 방식:** `Authorization: Bearer <access_token>` 헤더
> 

---

# 1. 인증 (Auth)

## POST /auth/register

**Request**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "김민준",
  "role": "instructor"
}
```

> role: `instructor` | `student` | `admin`
> 

**Response 201**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "김민준",
    "role": "instructor"
  }
}
```

**Response 400** (이미 존재하는 이메일)

```json
{
  "detail": "Email already registered"
}
```

---

## POST /auth/login

**Request**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid-string",
    "email": "user@example.com",
    "name": "김민준",
    "role": "instructor"
  }
}
```

**Response 401**

```json
{
  "detail": "Invalid email or password"
}
```

---

# 2. 강의록 (Lectures)

## POST /lectures/upload

**Request** — `multipart/form-data`

```
file: <PDF/TXT/DOCX 파일>
title: "머신러닝 기초" (선택)
```

**Response 201**

```json
{
  "lecture_id": "lec_abc123",
  "title": "머신러닝 기초",
  "file_url": "https://storage.supabase.co/...",
  "text_length": 4820,
  "created_at": "2026-04-07T10:00:00Z"
}
```

---

## GET /lectures

**Query Params:** `?page=1&limit=20`

**Response 200**

```json
{
  "lectures": [
    {
      "lecture_id": "lec_abc123",
      "title": "머신러닝 기초",
      "quiz_count": 5,
      "created_at": "2026-04-07T10:00:00Z"
    }
  ],
  "total": 12
}
```

---

# 3. 퀴즈 (Quizzes)

## POST /quizzes/generate

**Request**

```json
{
  "lecture_id": "lec_abc123",
  "count": 5,
  "type": "multiple_choice"
}
```

> type: `multiple_choice` | `short_answer`
> 

**Response 201**

```json
{
  "quiz_set_id": "qs_xyz789",
  "lecture_id": "lec_abc123",
  "quizzes": [
    {
      "id": "q_001",
      "question": "지도학습과 비지도학습의 가장 큰 차이점은?",
      "options": [
        "사용하는 알고리즘의 종류",
        "레이블(정답) 데이터의 유무",
        "처리할 수 있는 데이터의 크기",
        "모델의 연산 속도"
      ],
      "answer": 1,
      "explanation": "지도학습은 레이블 데이터를 사용하고 비지도학습은 레이블 없이 패턴을 찾습니다."
    }
  ]
}
```

> `answer`는 0-based index
> 

**Response 400** (lecture_id 없음)

```json
{
  "detail": "Lecture not found"
}
```

---

## GET /quizzes/{lecture_id}

**Response 200**

```json
{
  "lecture_id": "lec_abc123",
  "quizzes": [
    {
      "id": "q_001",
      "question": "...",
      "options": ["①", "②", "③", "④"],
      "answer": 1,
      "explanation": "..."
    }
  ]
}
```

---

# 4. 세션 (Sessions)

## POST /sessions/start

**Request**

```json
{
  "quiz_set_id": "qs_xyz789",
  "time_limit": 30
}
```

> `time_limit`: 문항당 제한 시간 (초)
> 

**Response 201**

```json
{
  "session_id": "sess_001",
  "session_code": "A7K3",
  "ws_url": "wss://quizai-api.onrender.com/sessions/sess_001/join",
  "status": "waiting"
}
```

---

## WS /sessions/{session_id}/join

**연결 URL**

```
wss://quizai-api.onrender.com/sessions/{session_id}/join?nickname=이수진&token=JWT
```

**서버 → 클라이언트 이벤트**

```json
// 입장 확인
{ "type": "session_joined", "payload": { "participant_count": 18, "nickname": "이수진" } }

// 퀴즈 시작 (강사가 시작 누를 때)
{ "type": "quiz_started", "payload": { "quiz_id": "q_001", "question": "...", "options": ["①","②","③","④"], "time_limit": 30 } }

// 응답률 업데이트 (강사에게만)
{ "type": "answer_update", "payload": { "total": 24, "answered": 18, "rate": 75.0, "distribution": [4, 11, 2, 1] } }

// 정답 공개 (강사가 공개 버튼 클릭 시)
{ "type": "answer_revealed", "payload": { "correct_option": 1, "explanation": "..." } }

// 세션 종료
{ "type": "session_ended", "payload": { "session_id": "sess_001" } }
```

**클라이언트 → 서버 메시지**

```json
// 강사: 퀴즈 시작
{ "type": "quiz_start", "quiz_id": "q_001" }

// 강사: 정답 공개
{ "type": "reveal_answer" }

// 강사: 세션 종료
{ "type": "end_session" }
```

---

## POST /sessions/{session_id}/answer

**Request**

```json
{
  "quiz_id": "q_001",
  "selected_option": 1,
  "response_time_ms": 7200
}
```

> `selected_option`: 0-based index
> 

**Response 200**

```json
{
  "is_correct": true,
  "correct_option": 1,
  "explanation": "지도학습은 레이블 데이터를 사용하고 비지도학습은 레이블 없이 패턴을 찾습니다."
}
```

---

## GET /sessions/{session_id}/result

**Response 200**

```json
{
  "session_id": "sess_001",
  "total_students": 24,
  "avg_score": 68.5,
  "grade_distribution": {
    "excellent": 10,
    "needs_practice": 9,
    "needs_review": 5
  },
  "weak_concepts": ["과적합", "정규화"],
  "quiz_stats": [
    {
      "quiz_id": "q_001",
      "correct_count": 18,
      "wrong_count": 6,
      "error_rate": 25.0
    }
  ],
  "students": [
    {
      "student_id": "uuid",
      "nickname": "이수진",
      "score": 67,
      "grade": "needs_practice",
      "answers": [
        { "quiz_id": "q_001", "is_correct": true, "selected_option": 1 }
      ]
    }
  ]
}
```

> grade: `excellent` | `needs_practice` | `needs_review`
> 

---

# 5. 대시보드 (Dashboard)

## GET /dashboard/instructor

**Response 200**

```json
{
  "instructor_id": "uuid",
  "total_sessions": 12,
  "avg_participation_rate": 88.0,
  "avg_correct_rate": 71.5,
  "quality_score": {
    "quiz_frequency": 85,
    "student_performance": 72,
    "followup_action": 90,
    "total": 82
  },
  "recent_sessions": [
    {
      "session_id": "sess_001",
      "lecture_title": "머신러닝 기초",
      "student_count": 24,
      "avg_score": 68.5,
      "created_at": "2026-04-07T10:00:00Z"
    }
  ]
}
```

---

## GET /dashboard/admin

**Response 200**

```json
{
  "platform": {
    "active_sessions": 12,
    "today_sessions": 47,
    "avg_participation": 82.0
  },
  "instructors": [
    {
      "instructor_id": "uuid",
      "name": "김민준",
      "total_sessions": 12,
      "avg_participation_rate": 88.0,
      "quality_score": 92
    }
  ],
  "at_risk_students": [
    {
      "student_id": "uuid",
      "name": "최지수",
      "risk_level": "high",
      "risk_score": 92,
      "risk_factors": ["미참여 3회", "연속 오답", "접속 이탈"]
    }
  ]
}
```

> risk_level: `high` | `medium` | `low`
> 

---

# 6. 공통 에러 포맷

모든 에러는 아래 형식으로 통일합니다.

```json
{
  "detail": "에러 메시지"
}
```

| HTTP 코드 | 상황 |
| --- | --- |
| 400 | 잘못된 요청 (필드 누락, 형식 오류) |
| 401 | 인증 실패 (토큰 없음/만료) |
| 403 | 권한 없음 (role 불일치) |
| 404 | 리소스 없음 |
| 500 | 서버 내부 오류 |

---

# 7. 프론트엔드 확인 요청 사항 (백엔드 → 프론트)

아래 항목은 프론트엔드 담당자가 확인 후 이 페이지에 코멘트로 답변해주세요.

- [ ]  `access_token` 키 이름 확정 (`access_token` vs `accessToken`)
- [ ]  WebSocket 토큰 전달 방식 확정 (쿼리스트링 `?token=` vs 첫 메시지로 전송)
- [ ]  업로드 진행률 필요 여부 (SSE or polling)
- [ ]  수강생 결과 페이지에서 `nickname` 표시 or `name` 표시
25. 회원가입 로그인은 잘 돼. 퀴즈세션도 만들어지는거같긴한데, 지금 UI UX가 너무 난잡해서 뭘 어떻게 하는지도 모르겠어. 이 사이트의 기능을 유저 친화적으로 더 풀어야해
26. feat: 결과 분석 및 대시보드 구현
feat: WebSocket 실시간 구현
feat: 전체 구현 완료 및 Render 배포 설정
feat: 전체 구현 완료 및 Render 배포 설정
feat: 전체 구현 완료 및 Render 배포 설정
fix:python version

그리고 이런식으로 백엔드에서 커밋했으니 우리도 이런 규칙으로 커밋하도록해
27. Access to XMLHttpRequest at 'https://quizai-api.onrender.com/dashboard/instructor' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
quizai-api.onrender.com/dashboard/instructor:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
dashboard:1 Access to XMLHttpRequest at 'https://quizai-api.onrender.com/dashboard/instructor' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
quizai-api.onrender.com/dashboard/instructor:1  Failed to load resource: net::ERR_FAILED

그리고 수강생 교강사 운영진 다 테스트해야하는데 지금 로그인하면 하나밖에 못하니까 로그아웃도 만들어놓고 전반적으로 토스 UI로 구성해
28. 백엔드 담장자가 아직 cors허용을 안했다는걸 어떻게알아? 했을수도있잖아
29. 응
30. 그리고 더미 데이터말고 실제 데이터베이스와 연결해야해. 일단 백엔드담당자가 SUPABASE와 연동했다했어. 그리고 내가 분명 UI UX 완전히 갈아엎으라고 했잖아. 지금의 상태에서 완전한 대격변을해
31. Access to XMLHttpRequest at 'https://quizai-api.onrender.com/sessions/join' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
quizai-api.onrender.com/sessions/join:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
login:1 Access to XMLHttpRequest at 'https://quizai-api.onrender.com/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
quizai-api.onrender.com/auth/login:1  Failed to load resource: net::ERR_FAILEDUnderstand this error
login:1 Access to XMLHttpRequest at 'https://quizai-api.onrender.com/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
quizai-api.onrender.com/auth/login:1  Failed to load resource: net::ERR_FAILED

그리고 갑자기 로그인도 안돼. 
32. 화면 구성 제안: "Simple & Insightful"
1. [강사 전용] 퀴즈 생성 및 대시보드
강사 화면의 핵심은 **'복잡한 과정을 AI가 대신해준다'**는 느낌을 주는 것입니다.

메인 대시보드 (Home):

현재 진행 중인 강의 목록과 평균 이해도 그래프.

퀴즈 생성 (AI Magic):

파일 업로드 영역: 강의록(PDF, TXT)을 드래그 앤 드롭하는 심플한 인터페이스.

생성 대기 UI: Claude API가 퀴즈를 생성하는 동안 'AI가 강의 내용을 분석 중입니다...'라는 애니메이션과 함께 핵심 키워드 추출 화면 노출.

퀴즈 리뷰: 생성된 퀴즈를 카드로 보여주고, 즉석에서 수정/삭제 가능한 리스트.

실시간 분석 (Insight):

정답률 분포: "3번 문항의 정답률이 낮습니다. 보충 설명이 필요해 보입니다." 같은 AI 코멘트 카드.

학생별 스코어보드: 정량화된 데이터 기반의 실시간 순위 및 성취도 지표.

2. [수강생 전용] 퀴즈 참여 및 결과
학생 화면은 **'학습이 아니라 게임 같다'**는 몰입감이 중요합니다.

퀴즈 대기실: 6자리 코드 입력 또는 강의 선택 후 대기. (토스 송금 화면처럼 단순하게)

실시간 퀴즈 (Play):

한 화면에 한 문항씩만 노출.

선택지 클릭 시 즉각적인 인터랙션 (햅틱 반응이나 시각적 피드백).

개별 리포트:

이해도 점수: "오늘 강의의 85%를 이해했어요!" 같은 칭찬 문구.

오답 노트: AI가 요약해준 '내가 놓친 핵심 개념' 정리 섹션.

3. [운영자/전체 공통] UI 시스템 (Toss Style)
현재 적용하신 app-shell.tsx 톤에 맞춘 세부 가이드입니다.

Typography: Pretendard 또는 Toss Product Sans 계열의 굵고 시원한 폰트 사용.

Color System:

Primary: #0064FF (Toss Blue) - 주요 버튼, 진행 바.

Background: #F2F4F6 (Light Gray) - 전체 배경.

Card: #FFFFFF (White) - 개별 콘텐츠 단위.

Component:

Page Hero: 화면 상단에 "안녕하세요, 남혁님. 오늘 퀴즈 참여율은 92%입니다." 같은 개인화 메시지 배치.

Stat Tile: 숫자 데이터는 무조건 크게, 변화량은 작은 배지로 표시.
33. 응

## Update Rule

- 새 프롬프트가 들어오면 번호를 이어서 추가합니다.
- 요약 없이 사용자 프롬프트 원문 그대로 기록합니다.
