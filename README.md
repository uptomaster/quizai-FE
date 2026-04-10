This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Team Rules

- Commit message convention: `COMMIT_CONVENTION.md`

## API Proxy (CORS workaround)

- Local development uses same-origin proxy at `/api/proxy/*`
- Target backend URL is configured by `API_SERVER_URL` (default: `https://quizai-api.onrender.com`)
- If `NEXT_PUBLIC_API_URL` is unset, frontend client uses `/api/proxy`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

### Git 연동(권장)

1. [Vercel Dashboard](https://vercel.com/new) → **Add New…** → **Project** → GitHub 저장소 선택 (`quizai-FE` 등).
2. **Framework Preset**: Next.js (자동 감지).
3. **Root Directory**: 저장소 루트(기본값).
4. **Environment Variables** (선택 — 비워도 기본 백엔드로 동작):
   - `.env.example` 참고. 로컬과 동일하게 쓰려면 `NEXT_PUBLIC_API_URL=/api/proxy` 권장.
5. **Deploy**. 이후 `main` 푸시마다 프로덕션 배포가 갱신됩니다.

`vercel.json`에서 서버리스/API 라우트 리전을 **서울(`icn1`)** 으로 두었습니다. 다른 리전이 필요하면 해당 파일을 수정하세요.

### CLI

```bash
npx vercel login
npx vercel --prod
```

인증 후 프로젝트를 연결(link)하면 동일하게 프로덕션 배포됩니다.

More: [Next.js on Vercel](https://nextjs.org/docs/app/building-your-application/deploying).
