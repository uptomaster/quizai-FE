<div align="center">

# QuizAI · Frontend

[프로덕션](https://quizai-fe.vercel.app/) · [프론트/백엔드 경계](FRONT_BACKEND_BOUNDARY.md) · [커밋 규칙](COMMIT_CONVENTION.md)

</div>

---

## 이 서비스는

**QuizAI**는 강의·교육 현장에서 쓰기 위한 **퀴즈 생성·진행** 서비스입니다. 강사는 강의 자료(예: PDF)를 올리고, 백엔드의 AI 파이프라인이 이를 바탕으로 **문제를 자동 생성**합니다. 그다음 **참여 코드 하나**로 수강생이 같은 세션에 모여, 수업 중에 **실시간(WebSocket)으로** 문제를 풀고 제출·결과를 맞출 수 있게 만드는 흐름을 지원합니다.

이 저장소는 그중 **웹 프론트엔드**만 담당합니다. **로그인·강의·퀴즈·세션**에 맞는 화면과 상호작용, API 호출·로딩·에러 UX, 그리고 실시간 퀴즈 **연결 수명·이벤트 반영**을 구현합니다. 인증 검증, 문서 저장, AI 생성, 세션의 단일 진실(상태)은 [백엔드와의 역할 구분](FRONT_BACKEND_BOUNDARY.md)이 나누는 영역입니다.

### 기간 · 역할

프로젝트는 **2026년 4월 6일 ~ 4월 12일** 사이에, 역할을 **기획 / 프론트엔드 / 백엔드**로 나누어 진행했습니다.

| 역할 | 담당 |
|------|------|
| 기획 | 이관진 |
| 프론트엔드 | 이남혁 |
| 백엔드 | 주세원 |

**라이브 데모 (프론트)**  
[https://quizai-fe.vercel.app/](https://quizai-fe.vercel.app/)

---

## 목차

- [기간 · 역할](#기간--역할)
- [주요 기능과 기술 스택](#주요-기능과-기술-스택)
- [로컬 개발](#로컬-개발)
- [API 프록시와 환경 변수](#api-프록시와-환경-변수)
- [배포 (Vercel)](#배포-vercel)
- [참고 자료](#참고-자료)

---

## 주요 기능과 기술 스택

| 구분 | 내용 |
|------|------|
| 강사 | 대시보드, 강의/세션·라이브 퀴즈 진행 UI(업로드·생성 요청·참여 코드·상태 표시) |
| 수강생 | 입장(코드), 플레이·제출, 세션 결과 등 참여 흐름 |
| 실시간 | WebSocket으로 세션 이벤트(시작, 제출, 종료 등)를 화면에 반영 |

| 영역 | 사용 기술 |
|------|------------|
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 스타일 | Tailwind CSS 4, CVA, `tw-animate-css` |
| 데이터·요청 | TanStack Query, Axios |
| UI | Base UI, Lucide, Sonner, shadcn 관련 흐름 |
| 3D (선택) | React Three Fiber, Three.js |

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

팀 전체 규칙은 [COMMIT_CONVENTION.md](COMMIT_CONVENTION.md)의 커밋 메시지 컨벤션을 따릅니다.

---

## 로컬 개발

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.  
`app/` 아래를 수정하면 핫 리로드로 반영됩니다. 폰트는 [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)로 Geist 등을 최적화해 불러옵니다.

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |

---

## API 프록시와 환경 변수

로컬에서는 **동일 출처**로 백엔드에 붙이기 위해 `/api/proxy/*` 프록시를 사용합니다.

| 변수 | 설명 |
|------|------|
| `API_SERVER_URL` | 프록시가 전달할 백엔드 URL. 기본: `https://quizai-be.onrender.com` |
| `NEXT_PUBLIC_API_URL` | 클라이언트 API 베이스. **비우면** `/api/proxy` 사용(권장) |
| `ENABLE_PROXY_MOCK_FALLBACK` | 백엔드 없이 UI만 볼 때만 `true`. **기본은 끔**. 프로덕션에서는 켜지 마세요. |

기타 WebSocket·디버그 옵션은 [.env.example](.env.example)을 참고하세요.

---

## 배포 (Vercel)

### Git 연동 (권장)

1. [Vercel 대시보드](https://vercel.com/new) → **Add New…** → **Project** → GitHub 저장소 선택 (`quizai-FE` 등)
2. **Framework Preset**: Next.js(자동 감지)
3. **Root Directory**: 저장소 루트(기본)
4. **Environment Variables** (선택): `.env.example` 참고. 로컬과 맞추려면 `NEXT_PUBLIC_API_URL=/api/proxy` 권장
5. **Deploy** — 이후 기본 브랜치 푸시마다 프로덕션이 갱신됩니다

`vercel.json`에서 서버리스/API 라우트 리전을 **서울(`icn1`)**에 두었습니다. 다른 리전이 필요하면 해당 파일을 수정하세요.

### CLI

```bash
npx vercel login
npx vercel --prod
```

인증 후 프로젝트를 연결(link)하면 동일하게 프로덕션 배포됩니다.

---

## 참고 자료

- [Next.js 문서](https://nextjs.org/docs) — 기능과 App Router
- [Learn Next.js](https://nextjs.org/learn) — 튜토리얼
- [Next.js on Vercel](https://nextjs.org/docs/app/building-your-application/deploying) — 배포
- [Next.js GitHub](https://github.com/vercel/next.js)
