"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useState } from "react";
import { ChevronRight, Radio, Users } from "lucide-react";

import { FlowPageHeader } from "@/components/common/flow-page-header";
import { FlowSurface } from "@/components/common/flow-surface";
import { InstructorFlowRail } from "@/components/instructor/instructor-flow-rail";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatTile } from "@/components/common/stat-tile";
import { useInstructorDashboardQuery } from "@/hooks/api/use-instructor-dashboard-query";
import { getStoredUser } from "@/lib/auth-storage";
import {
  readPersistedInstructorLiveSession,
  type PersistedInstructorLiveSession,
} from "@/lib/instructor-live-session";
import { readSessionLectureLabel } from "@/lib/session-display-title";
import { cn, formatQuizScorePoints, toFiniteNumber } from "@/lib/utils";

function formatRecentSessionWhen(iso: string | undefined): string {
  if (!iso?.trim()) {
    return "";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const diffMs = Date.now() - d.getTime();
  const diffDays = Math.floor(diffMs / 86_400_000);
  if (diffDays <= 0) {
    return "오늘";
  }
  if (diffDays === 1) {
    return "어제";
  }
  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }
  return new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export default function InstructorDashboardPage() {
  const [liveSnapshot, setLiveSnapshot] = useState<PersistedInstructorLiveSession | null>(null);

  useLayoutEffect(() => {
    const sync = () => setLiveSnapshot(readPersistedInstructorLiveSession());
    sync();
    const onVis = () => {
      if (document.visibilityState === "visible") {
        sync();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const dashboardQuery = useInstructorDashboardQuery();
  const data = dashboardQuery.data;
  const recent = data?.recent_sessions ?? [];
  const user = getStoredUser();
  const greetingName = user?.name?.trim() || user?.email?.split("@")[0] || "선생님";

  const rateSummary = useMemo(() => {
    if (!data) {
      return "…";
    }
    const p = toFiniteNumber(data.avg_participation_rate);
    const c = toFiniteNumber(data.avg_correct_rate);
    const pStr = p !== null ? `${Math.round(p)}` : "—";
    const cStr = c !== null ? `${Math.round(c)}` : "—";
    return `참여 ${pStr}% · 정답 ${cStr}%`;
  }, [data]);

  const participationPct = useMemo(() => {
    if (dashboardQuery.isLoading) {
      return "…";
    }
    const v = toFiniteNumber(data?.avg_participation_rate);
    return v !== null ? `${Math.round(v)}%` : "—";
  }, [dashboardQuery.isLoading, data?.avg_participation_rate]);

  const correctPct = useMemo(() => {
    if (dashboardQuery.isLoading) {
      return "…";
    }
    const v = toFiniteNumber(data?.avg_correct_rate);
    return v !== null ? `${Math.round(v)}%` : "—";
  }, [dashboardQuery.isLoading, data?.avg_correct_rate]);

  return (
    <section className="space-y-10">
      <FlowPageHeader
        rail={<InstructorFlowRail />}
        title={`${greetingName}님`}
        description={
          dashboardQuery.isLoading
            ? "…"
            : dashboardQuery.isError
              ? "불러오기 실패"
              : rateSummary
        }
        actions={
          <>
            <Button variant="outline" onClick={() => window.location.assign("/instructor/lectures")}>
              강의
            </Button>
            <Button onClick={() => window.location.assign("/instructor/sessions")}>라이브</Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile
          title="진행한 라이브 퀴즈"
          description="누적 횟수"
          value={dashboardQuery.isLoading ? "…" : String(data?.total_sessions ?? 0)}
        />
        <StatTile title="평균 참여율" description="학생 참여 비율" value={participationPct} />
        <StatTile title="평균 정답률" description="문항별 정답 비율" value={correctPct} />
      </div>

      {liveSnapshot?.session ? (
        <FlowSurface
          kicker="복구"
          title="이 브라우저에 저장된 퀴즈방"
          description="새로고침해도 여기서 라이브 화면으로 돌아가 참여 코드·실시간·결과를 이어갈 수 있어요."
          variant="accent"
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-inner ring-1 ring-primary/20">
                <Radio className="h-7 w-7" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  참여 코드
                </p>
                <p className="font-mono text-3xl font-black tracking-[0.18em] text-primary sm:text-4xl">
                  {liveSnapshot.session.session_code}
                </p>
                <p className="break-all font-mono text-[10px] leading-relaxed text-muted-foreground">
                  {liveSnapshot.session.session_id}
                </p>
              </div>
            </div>
            <Link
              href={`/instructor/sessions?session=${encodeURIComponent(liveSnapshot.session.session_id)}`}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "shrink-0 justify-center gap-2 px-8 shadow-md shadow-primary/20 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/25",
              )}
            >
              라이브로 복귀
              <ChevronRight className="h-4 w-4 opacity-90" aria-hidden />
            </Link>
          </div>
        </FlowSurface>
      ) : null}

      <div className="overflow-hidden rounded-[1.35rem] border border-border/60 bg-gradient-to-b from-card/70 via-card/40 to-muted/20 p-1 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.35)] ring-1 ring-black/[0.04] dark:from-card/35 dark:via-card/25 dark:to-muted/10 dark:shadow-[0_24px_60px_-40px_rgba(0,0,0,0.55)] dark:ring-white/[0.06] md:rounded-3xl">
        <div className="px-4 pb-2 pt-5 md:px-6 md:pt-6">
          <div className="mb-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">히스토리</p>
              <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">최근 라이브 세션</h2>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-muted-foreground">
                카드를 누르면 해당 세션 화면으로 이동합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="relative px-2 pb-4 md:px-3 md:pb-5">
          <div
            className="absolute bottom-6 left-[19px] top-4 w-px bg-gradient-to-b from-primary/45 via-border/80 to-transparent md:left-[23px]"
            aria-hidden
          />
          <ul className="space-y-2">
            {dashboardQuery.isLoading ? (
              <li className="py-10 pl-10 text-center text-sm text-muted-foreground md:pl-12">불러오는 중…</li>
            ) : recent.length > 0 ? (
              recent.slice(0, 6).map((session, idx) => {
                const title =
                  session.lecture_title?.trim() ||
                  readSessionLectureLabel(session.session_id) ||
                  "라이브 세션";
                const score = toFiniteNumber(session.avg_score);
                const barPct = score === null ? 0 : Math.min(100, Math.max(0, score));
                const when = formatRecentSessionWhen(session.created_at);
                const students = session.student_count;
                return (
                  <li key={session.session_id} className="relative">
                    <span
                      className="absolute left-2 top-1/2 z-[1] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-gradient-to-br from-primary to-primary/85 text-[11px] font-bold text-primary-foreground shadow-md shadow-primary/25 ring-2 ring-primary/15 md:left-3"
                      aria-hidden
                    >
                      {idx + 1}
                    </span>
                    <Link
                      href={`/instructor/sessions?session=${encodeURIComponent(session.session_id)}`}
                      className="group relative ml-9 mr-1 block overflow-hidden rounded-2xl border border-border/50 bg-card/60 py-4 pl-4 pr-3 shadow-sm backdrop-blur-[6px] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_16px_40px_-28px_rgba(255,111,15,0.35)] dark:bg-card/40 dark:hover:bg-card/55 md:ml-11 md:pl-5 md:pr-4"
                    >
                      <div
                        className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-primary/[0.06] to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                        aria-hidden
                      />
                      <div className="relative flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                            {title}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-muted-foreground">
                            <span title={session.session_id}>{session.session_id.slice(0, 10)}…</span>
                            {when ? (
                              <>
                                <span className="text-border" aria-hidden>
                                  ·
                                </span>
                                <span>{when}</span>
                              </>
                            ) : null}
                          </div>
                          {students > 0 ? (
                            <div className="mt-2.5 flex flex-wrap gap-2">
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-0.5 text-[11px] font-medium text-foreground ring-1 ring-border/60 dark:bg-muted/30">
                                <Users className="h-3 w-3 text-primary" aria-hidden />
                                참여 {students}명
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <ChevronRight
                            className="h-5 w-5 text-muted-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                            aria-hidden
                          />
                          <div className="text-right">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                              평균
                            </p>
                            <span className="text-base font-bold tabular-nums text-primary md:text-lg">
                              {formatQuizScorePoints(session.avg_score)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-3.5 h-2 overflow-hidden rounded-full bg-muted/90 ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]">
                        <div
                          className={cn(
                            "h-full rounded-full bg-gradient-to-r from-primary via-orange-400/95 to-amber-300/90 dark:to-amber-400/80",
                            score === null && "opacity-40",
                          )}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })
            ) : (
              <li className="rounded-2xl border border-dashed border-border/70 bg-muted/10 py-14 pl-10 text-center text-sm text-muted-foreground md:pl-12">
                아직 기록된 라이브 세션이 없습니다. 라이브 방에서 퀴즈를 열어 보세요.
              </li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}
