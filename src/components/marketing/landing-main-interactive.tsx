"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Layers,
  Radio,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HeroThreeBackdrop } from "./hero-three-backdrop";

const jumpLinks = [
  { href: "#flow", label: "수업 흐름" },
  { href: "#pillars", label: "핵심 기능" },
  { href: "#roles", label: "역할별" },
  { href: "#start", label: "시작하기" },
] as const;

const flowSteps = [
  {
    id: "upload",
    title: "자료",
    short: "업로드",
    detail: "강의 자료·텍스트를 올리면 문맥을 읽고 퀴즈 초안을 제안합니다.",
  },
  {
    id: "draft",
    title: "AI 초안",
    short: "생성",
    detail: "객관식·보기·해설까지 한 번에. 수정 후 세트로 저장해 수업에 연결합니다.",
  },
  {
    id: "live",
    title: "라이브",
    short: "진행",
    detail: "참여코드로 입장, 타이머·응답 집계가 실시간으로 같은 화면에 모입니다.",
  },
  {
    id: "insight",
    title: "결과",
    short: "복습",
    detail: "정답률·참여율·취약 포인트를 역할별 대시보드에서 바로 확인합니다.",
  },
] as const;

const pillars = [
  {
    icon: Sparkles,
    title: "AI 퀴즈 생성",
    summary: "자료 기반 초안",
    description:
      "강의 자료를 올리면 객관식·해설까지 자동 초안을 만듭니다. 수정 후 바로 수업에 씁니다.",
  },
  {
    icon: Radio,
    title: "라이브 실시간",
    summary: "코드 한 번 입장",
    description:
      "참여코드 한 번으로 입장. 남은 시간·응답 현황·참여자를 같은 화면에서 확인합니다.",
  },
  {
    icon: BarChart3,
    title: "학습 인사이트",
    summary: "데이터로 판단",
    description:
      "정답률·취약 개념·참여율을 한눈에. 교강사와 운영자가 같은 데이터로 의사결정합니다.",
  },
] as const;

type Persona = "instructor" | "student" | "admin";

const personaCopy: Record<
  Persona,
  { label: string; icon: typeof Users; headline: string; steps: string[]; accent: string }
> = {
  instructor: {
    label: "교강사",
    icon: Users,
    headline: "준비부터 리캡까지 한 흐름",
    steps: [
      "자료 업로드 후 퀴즈 세트 생성",
      "라이브 퀴즈방 열고 참여코드 공유",
      "실시간 응답과 결과로 수업 조율",
    ],
    accent: "text-primary",
  },
  student: {
    label: "수강생",
    icon: BookOpen,
    headline: "코드만으로 집중하는 퀴즈",
    steps: [
      "수업 신청 후 퀴즈방 입장",
      "제한 시간 안에 문항 풀이",
      "결과·복습 포인트 확인",
    ],
    accent: "text-violet-600 dark:text-violet-400",
  },
  admin: {
    label: "운영자",
    icon: Shield,
    headline: "같은 라이브를 모니터링",
    steps: ["실시간 세션에서 진행 현황 확인", "수업 품질·이상 징후 파악", "문의·대응에 활용"],
    accent: "text-foreground",
  },
};

const LANDING_SECTION_IDS = ["flow", "pillars", "roles", "start"] as const;

function useLandingSectionSpy() {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const els = LANDING_SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-38% 0px -38% 0px", threshold: [0.08, 0.2, 0.35] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);
  return active;
}

export function LandingMainInteractive() {
  const [flowIndex, setFlowIndex] = useState(0);
  const [pillarOpen, setPillarOpen] = useState<number | null>(null);
  const [persona, setPersona] = useState<Persona>("instructor");

  const spyActive = useLandingSectionSpy();

  const scrollToFlow = useCallback(() => {
    document.getElementById("flow")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const p = personaCopy[persona];
  const PersonaIcon = p.icon;

  return (
    <>
      <section className="relative overflow-hidden px-3 pb-10 pt-5 md:px-6 md:pb-16 md:pt-8">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.18_280/0.18),transparent)]" />
        <div className="pointer-events-none absolute right-0 top-1/4 z-0 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <HeroThreeBackdrop />

        <div className="relative z-10 mx-auto max-w-6xl space-y-5">
          <div className="rounded-[1.35rem] border border-border/45 bg-card/85 px-5 py-10 shadow-[0_12px_48px_-18px_rgba(15,23,42,0.12)] backdrop-blur-sm md:px-10 md:py-14 dark:bg-card/75 dark:shadow-[0_16px_52px_-16px_rgba(0,0,0,0.5)]">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.06] px-3 py-1.5 text-xs font-semibold text-primary">
              <Zap className="size-3.5" aria-hidden />
              차세대 교실을 위한 실시간 피드백
            </p>

            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
              <div className="min-w-0 flex-1">
                <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
                  자료는 올리고,
                  <br />
                  <span className="bg-gradient-to-r from-primary via-violet-600 to-violet-500 bg-clip-text text-transparent">
                    퀴즈는 AI가, 수업은 라이브로.
                  </span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
                  아래에서 <strong className="font-semibold text-foreground">한 사이클 흐름</strong>을 직접 눌러
                  보거나, 섹션으로 이동해 역할별 경험을 살펴보세요.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/register"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "h-12 gap-2 px-8 text-base shadow-lg shadow-primary/25",
                    )}
                  >
                    지금 시작하기
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                  <Link
                    href="/login"
                    className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-12 px-6 text-base")}
                  >
                    계정이 있어요
                  </Link>
                  <button
                    type="button"
                    onClick={scrollToFlow}
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "lg" }),
                      "h-12 gap-1.5 px-4 text-muted-foreground",
                    )}
                  >
                    흐름 보기
                    <ArrowDown className="size-4 opacity-70" aria-hidden />
                  </button>
                </div>
              </div>

              <div
                id="flow"
                className="w-full scroll-mt-28 rounded-2xl border border-border/50 bg-muted/20 p-4 md:max-w-md md:p-5 dark:bg-muted/10"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  수업 한 사이클
                </p>
                <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="수업 단계">
                  {flowSteps.map((step, i) => {
                    const active = i === flowIndex;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setFlowIndex(i)}
                        className={cn(
                          "flex min-w-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-all md:text-sm",
                          active
                            ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                            : "border-transparent bg-card/80 text-muted-foreground hover:border-border/80 hover:text-foreground",
                        )}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-background/80 text-[11px] font-bold text-foreground">
                          {i + 1}
                        </span>
                        <span className="truncate">{step.short}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 rounded-xl border border-border/50 bg-card/90 p-4 text-sm leading-relaxed text-muted-foreground shadow-sm">
                  <p className="font-semibold text-foreground">
                    {flowSteps[flowIndex].title}
                    <ChevronRight className="mx-1 inline size-3.5 opacity-50" aria-hidden />
                    <span className="font-normal text-muted-foreground">{flowSteps[flowIndex].short}</span>
                  </p>
                  <p className="mt-2">{flowSteps[flowIndex].detail}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 border-t border-border/50 pt-8 md:flex-row md:items-center md:justify-between">
              <nav className="flex flex-wrap gap-2" aria-label="페이지 섹션">
                {jumpLinks.map(({ href, label }) => {
                  const id = href.slice(1);
                  const isActive = spyActive === id;
                  return (
                    <a
                      key={href}
                      href={href}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors md:text-sm",
                        isActive
                          ? "border-primary/35 bg-primary/10 text-primary"
                          : "border-border/60 bg-card/60 text-muted-foreground hover:border-primary/25 hover:text-foreground",
                      )}
                    >
                      {label}
                    </a>
                  );
                })}
              </nav>
              <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {["PDF·텍스트 기반 생성", "실시간 라이브 반응", "역할별 화면"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <Check className="size-4 shrink-0 text-emerald-600" aria-hidden />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pillars"
        className="scroll-mt-28 px-3 py-10 md:px-6 md:py-16"
      >
        <div className="mx-auto max-w-6xl rounded-[1.35rem] border border-border/45 bg-muted/25 px-5 py-10 shadow-[0_8px_36px_-14px_rgba(15,23,42,0.08)] md:px-8 md:py-14 dark:bg-muted/15 dark:shadow-[0_10px_40px_-14px_rgba(0,0,0,0.4)]">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-primary">핵심 기능</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-2xl font-bold md:text-3xl">수업 현장에 맞춘 세 가지 축</p>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted-foreground">
            카드를 눌러 요약과 설명을 전환해 보세요.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3 md:gap-5">
            {pillars.map(({ icon: Icon, title, summary, description }, i) => {
              const open = pillarOpen === i;
              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => setPillarOpen(open ? null : i)}
                  className={cn(
                    "rounded-2xl border bg-card p-6 text-left shadow-[0_6px_26px_-10px_rgba(15,23,42,0.1)] transition-all dark:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.4)]",
                    open
                      ? "border-primary/40 ring-2 ring-primary/15"
                      : "border-border/50 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_14px_40px_-14px_rgba(15,23,42,0.14)]",
                  )}
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-xs font-medium text-primary/90">{summary}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {open ? description : `${description.slice(0, 78)}…`}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    {open ? "접기" : "자세히"}
                    <ChevronRight className={cn("size-3.5 transition-transform", open && "rotate-90")} aria-hidden />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="roles" className="scroll-mt-28 px-3 py-10 md:px-6 md:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-sm font-semibold uppercase tracking-widest text-primary">역할별</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-2xl font-bold md:text-3xl">누가 쓰든 같은 라이브 데이터</p>
          <div
            className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-2 rounded-2xl border border-border/50 bg-card/60 p-1.5 shadow-sm dark:bg-card/50"
            role="tablist"
            aria-label="사용자 역할"
          >
            {(Object.keys(personaCopy) as Persona[]).map((key) => {
              const item = personaCopy[key];
              const active = persona === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPersona(key)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all sm:flex-none sm:min-w-[120px]",
                    active ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div
            className={cn(
              "mt-8 rounded-[1.25rem] border border-border/50 p-7 shadow-[0_8px_32px_-14px_rgba(15,23,42,0.09)] md:p-9 dark:shadow-[0_10px_36px_-14px_rgba(0,0,0,0.42)]",
              persona === "instructor" && "bg-gradient-to-br from-primary/[0.08] to-transparent",
              persona === "student" && "bg-gradient-to-br from-violet-500/[0.07] to-transparent",
              persona === "admin" && "bg-gradient-to-br from-muted/40 to-transparent",
            )}
          >
            <div className={cn("flex items-center gap-2", p.accent)}>
              <PersonaIcon className="size-5" aria-hidden />
              <span className="text-sm font-semibold uppercase tracking-wide">{p.label}</span>
            </div>
            <h3 className="mt-3 text-xl font-bold">{p.headline}</h3>
            <ol className="mt-6 space-y-4">
              {p.steps.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                      persona === "instructor" && "bg-primary/15 text-primary",
                      persona === "student" && "bg-violet-500/15 text-violet-700 dark:text-violet-300",
                      persona === "admin" && "bg-muted text-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register" className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}>
                {p.label}로 시작
                <ArrowRight className="size-3.5" aria-hidden />
              </Link>
              <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                로그인
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-3 py-10 md:px-6 md:py-14">
        <div className="mx-auto max-w-6xl rounded-[1.35rem] border border-border/45 bg-card/70 px-6 py-10 shadow-[0_8px_36px_-14px_rgba(15,23,42,0.1)] md:px-10 md:py-11 dark:bg-card/60 dark:shadow-[0_10px_40px_-14px_rgba(0,0,0,0.45)]">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers className="size-5" aria-hidden />
                <span className="text-sm font-medium">운영 · 품질</span>
              </div>
              <h3 className="mt-2 text-2xl font-bold md:text-3xl">같은 라이브를 운영자도 모니터링</h3>
              <p className="mt-2 max-w-xl text-muted-foreground">
                진행 중인 세션을 모니터링하고 수업 품질을 함께 맞출 수 있습니다.
              </p>
            </div>
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "shrink-0 gap-2")}>
              팀으로 써보기
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section id="start" className="scroll-mt-28 px-3 py-10 md:px-6 md:py-16">
        <div className="mx-auto max-w-3xl rounded-[1.5rem] border border-primary/18 bg-gradient-to-br from-primary/[0.09] via-card to-violet-500/[0.08] px-6 py-12 text-center shadow-[0_14px_48px_-16px_rgba(79,70,229,0.2)] md:px-12 dark:shadow-[0_18px_52px_-14px_rgba(0,0,0,0.5)]">
          <h2 className="text-2xl font-bold md:text-3xl">다음 수업부터 QuizAI로 연결해 보세요</h2>
          <p className="mt-3 text-muted-foreground">회원가입 시 역할만 고르면 바로 맞춤 화면으로 들어갑니다.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: "lg" }), "min-w-[200px]")}>
              무료 회원가입
            </Link>
            <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-w-[160px]")}>
              로그인
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
