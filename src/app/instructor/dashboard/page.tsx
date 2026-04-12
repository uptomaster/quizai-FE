"use client";

import Link from "next/link";
import { useLayoutEffect, useMemo, useState } from "react";

import { FlowPageHeader } from "@/components/common/flow-page-header";
import { InstructorFlowRail } from "@/components/instructor/instructor-flow-rail";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatTile } from "@/components/common/stat-tile";
import { useInstructorDashboardQuery } from "@/hooks/api/use-instructor-dashboard-query";
import { getStoredUser } from "@/lib/auth-storage";
import {
  readPersistedInstructorLiveSession,
  type PersistedInstructorLiveSession,
} from "@/lib/instructor-live-session";
import { cn, formatQuizScorePoints, toFiniteNumber } from "@/lib/utils";

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
    <section className="space-y-6">
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
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          title="진행한 라이브 퀴즈"
          description="누적 횟수"
          value={dashboardQuery.isLoading ? "…" : String(data?.total_sessions ?? 0)}
        />
        <StatTile title="평균 참여율" description="학생 참여 비율" value={participationPct} />
        <StatTile title="평균 정답률" description="문항별 정답 비율" value={correctPct} />
      </div>

      {liveSnapshot?.session ? (
        <Card className="border-primary/25 bg-primary/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">저장된 퀴즈방 (새로고침 복구)</CardTitle>
            <CardDescription>
              이 브라우저에 마지막으로 연 방이 있습니다. 아래에서 라이브 화면으로 돌아가 참여 코드·실시간·결과 불러오기를
              이어갈 수 있어요.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xl font-bold tracking-[0.15em] text-primary">
                {liveSnapshot.session.session_code}
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">
                {liveSnapshot.session.session_id}
              </p>
            </div>
            <Link
              href={`/instructor/sessions?session=${encodeURIComponent(liveSnapshot.session.session_id)}`}
              className={cn(buttonVariants({ variant: "default" }), "shrink-0 justify-center")}
            >
              라이브 화면으로
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold">최근 라이브 세션</p>
        <p className="mt-1 text-xs text-muted-foreground">행을 누르면 라이브 페이지로 이동합니다. (목록은 서버 집계 기준)</p>
        <div className="mt-3 space-y-3">
          {dashboardQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">불러오는 중…</p>
          ) : recent.length > 0 ? (
            recent.slice(0, 6).map((session) => {
              const title = session.lecture_title?.trim() || "제목 없는 세션";
              const score = toFiniteNumber(session.avg_score);
              const barPct = score === null ? 0 : Math.min(100, Math.max(0, score));
              return (
                <Link
                  key={session.session_id}
                  href={`/instructor/sessions?session=${encodeURIComponent(session.session_id)}`}
                  className="block rounded-xl p-2 -mx-2 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="min-w-0 truncate text-muted-foreground" title={session.session_id}>
                      {title}
                    </span>
                    <span className="shrink-0 tabular-nums text-foreground">{formatQuizScorePoints(session.avg_score)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full bg-gradient-to-r from-primary to-violet-500",
                        score === null && "opacity-40",
                      )}
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </Link>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">아직 기록된 라이브 세션이 없습니다.</p>
          )}
        </div>
      </div>
    </section>
  );
}
