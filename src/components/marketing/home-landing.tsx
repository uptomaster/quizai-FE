import Link from "next/link";

import { SiteLogo } from "@/components/common/site-logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { LandingMainInteractive } from "./landing-main-interactive";

export function HomeLanding() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 rounded-2xl border border-border/55 bg-card/90 px-4 py-2 shadow-[0_6px_28px_-12px_rgba(15,23,42,0.12)] backdrop-blur-md md:min-h-16 md:px-5 dark:bg-card/85 dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.45)]">
          <Link href="/" className="flex items-center gap-3 font-bold tracking-tight md:gap-3.5">
            <SiteLogo size={56} decorative priority className="rounded-xl" />
            <span className="flex flex-col leading-tight">
              <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-lg text-transparent md:text-xl">
                QuizAI
              </span>
              <span className="hidden text-[11px] font-medium text-muted-foreground sm:block">실시간 학습 플랫폼</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-muted-foreground")}>
              로그인
            </Link>
            <Link href="/register" className={cn(buttonVariants({ size: "sm" }))}>
              무료로 시작
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <LandingMainInteractive />
      </main>

      <footer className="mx-3 mb-8 mt-2 max-w-6xl rounded-2xl border border-border/40 bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground md:mx-auto md:mb-10 md:px-6">
        <p>© {new Date().getFullYear()} QuizAI · AI 기반 실시간 교육 피드백</p>
      </footer>
    </div>
  );
}
