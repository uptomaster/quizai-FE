# Prompt History

사용자 프롬프트 원문 기록입니다.

## Entries

1. 커서(Cursor) 에이전트가 백엔드 구조를 완벽히 학습하고, 당신의 의도대로 코드를 짤 수 있도록 하는 **[프론트엔드 빌드업 최종 가이드]**입니다.

이 내용을 복사해서 커서의 Composer(Ctrl+I) 또는 **Chat(Ctrl+L)**에 붙여넣으세요.

🚀 QuizAI 프론트엔드 개발을 위한 Cursor 지시서
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

💡 당신이 지금 바로 할 일
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
12. 응 진행해
13. 브랜치를 main으로 해야지.
14. master는 쓰지 말고, main으로 하고 실 배포전 브랜치에서 작업하고 성공하면 main으로 병합하는 식으로 진행해
15. 없애고, UI를 기가막히게 업그레이드 하고 기능도 좀 더 유저 친화적으로 만들어.
16. 디자인을 더 업그레이드해봐 그러면.
17. 지금 너무 밋밋하고, 더 창의적인 요소가 있으면 좋겠어. 그리고 색도 너무 없으니 따분해보여. 그리고 개설 과목도 열고 볼 수 있으면 좋을거같아
18. 필터(진행중/모집중), 검색, 카드 정렬, 애니메이션 전환뿐만 아니라 진짜 교육 플랫폼처럼 만들어줘
19. 모든 측면에서 확장해서 가져와
20. 내가 지금까지 입력한 프롬프트를 md파일에 따로 저장하고 입력할때마다 최신화해
21. 요약하지말고 매 요청마다 내 프롬프트대로 작성해

## Update Rule

- 새 프롬프트가 들어오면 번호를 이어서 추가합니다.
- 요약 없이 사용자 프롬프트 원문 그대로 기록합니다.
