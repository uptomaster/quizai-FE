"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { FlowPageHeader } from "@/components/common/flow-page-header";
import { FlowSurface } from "@/components/common/flow-surface";
import { SessionResultPanel } from "@/components/student/session-result-panel";
import { StudentFlowRail } from "@/components/student/student-flow-rail";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/common/stat-tile";
import { useSessionResultQuery } from "@/hooks/api/use-session-result-query";
import { useStudentQuizResultsQuery } from "@/hooks/api/use-student-quiz-results-query";
import { getStoredUser } from "@/lib/auth-storage";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import { gradeLabelKo } from "@/lib/session-user-copy";
import { cn } from "@/lib/utils";

function StudentDashboardInner() {
  const user = getStoredUser();
  const searchParams = useSearchParams();
  const myResultsQuery = useStudentQuizResultsQuery();
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const resultQuery = useSessionResultQuery(selectedSessionId);

  useEffect(() => {
    const fromQuery = searchParams.get("open") === "quiz-results";
    const fromHash = typeof window !== "undefined" && window.location.hash === "#quiz-results";
    if (fromQuery || fromHash) {
      window.requestAnimationFrame(() => {
        document.getElementById("quiz-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [searchParams]);

  useEffect(() => {
    const list = myResultsQuery.data?.results ?? [];
    if (list.length > 0 && !selectedSessionId) {
      setSelectedSessionId(list[0].session_id);
    }
  }, [myResultsQuery.data?.results, selectedSessionId]);

  const summaries = useMemo(() => {
    const rows = myResultsQuery.data?.results ?? [];
    return [...rows].sort((a, b) => {
      const ta = a.attended_at ? new Date(a.attended_at).getTime() : 0;
      const tb = b.attended_at ? new Date(b.attended_at).getTime() : 0;
      return tb - ta;
    });
  }, [myResultsQuery.data?.results]);

  const scoreStats = useMemo(() => {
    const scores = summaries.map((s) => s.my_score).filter((n): n is number => typeof n === "number");
    if (scores.length === 0) {
      return { avg: null as number | null, count: summaries.length };
    }
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return { avg, count: summaries.length };
  }, [summaries]);

  const latestGrade = summaries[0]?.grade;

  return (
    <section className="space-y-8">
      <FlowPageHeader
        rail={<StudentFlowRail />}
        title="결과"
        description="참여한 퀴즈 요약과, 세션별 상세·순위(익명)를 볼 수 있어요."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => window.location.assign("/student/join")}>
              코드
            </Button>
            <Button size="sm" onClick={() => window.location.assign("/student/play")}>
              퀴즈
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          title="참여 횟수"
          description="기록된 세션"
          value={myResultsQuery.isLoading ? "…" : `${scoreStats.count}회`}
        />
        <StatTile
          title="평균 점수"
          description={scoreStats.count > 0 ? "기록이 있는 세션 기준" : "기록이 없어요"}
          value={
            myResultsQuery.isLoading ? "…" : scoreStats.avg !== null ? `${scoreStats.avg}점` : "—"
          }
        />
        <StatTile
          title="최근 등급"
          description={summaries[0]?.attended_at ? new Date(summaries[0].attended_at).toLocaleDateString() : "최근 참여"}
          value={
            myResultsQuery.isLoading ? "…" : latestGrade ? gradeLabelKo(latestGrade) : "—"
          }
        />
      </div>

      <FlowSurface
        id="quiz-results"
        kicker="기록"
        title="퀴즈 결과"
        description="세션을 고르면 상세 점수와 순위·문항 요약을 불러옵니다."
        className="scroll-mt-8 border-primary/15"
      >
        <div className="space-y-6">
          {myResultsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">참여 기록을 불러오는 중…</p>
          ) : myResultsQuery.isError ? (
            <p className="text-sm text-destructive">결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
          ) : summaries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/25 p-8 text-center text-sm text-muted-foreground">
              아직 참여 기록이 없습니다. 강의를 신청한 뒤 참여 코드로 입장해 보세요.
            </div>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {summaries.map((row) => (
                <li key={row.session_id}>
                  <button
                    type="button"
                    onClick={() => setSelectedSessionId(row.session_id)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left text-sm ring-1 ring-transparent transition-all",
                      selectedSessionId === row.session_id
                        ? "border-primary/45 bg-primary/[0.07] ring-primary/15 shadow-[0_12px_40px_-16px_rgba(255,111,15,0.22)]"
                        : "border-border/60 bg-card/80 hover:border-primary/30 hover:bg-card hover:ring-black/[0.04] dark:hover:ring-white/[0.06]",
                    )}
                  >
                    <p className="font-semibold text-foreground">
                      {coerceRenderableText(row.title) || "라이브 퀴즈"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {row.attended_at ? <span>{new Date(row.attended_at).toLocaleString()}</span> : null}
                      {typeof row.my_score === "number" ? (
                        <span className="font-medium text-foreground">{row.my_score}점</span>
                      ) : null}
                      {row.grade ? (
                        <span className="rounded-full bg-muted px-2 py-0.5">{gradeLabelKo(row.grade)}</span>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedSessionId ? (
            <div className="border-t border-border/60 pt-6">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">선택 세션</p>
              <SessionResultPanel
                result={resultQuery.data}
                isLoading={resultQuery.isFetching}
                highlightUserId={user?.id}
              />
            </div>
          ) : null}
        </div>
      </FlowSurface>
    </section>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense
      fallback={
        <section className="space-y-4 p-4">
          <div className="h-8 max-w-[200px] animate-pulse rounded-xl bg-muted/60" />
          <div className="grid gap-3 md:grid-cols-3">
            <div className="h-24 animate-pulse rounded-3xl bg-muted/40" />
            <div className="h-24 animate-pulse rounded-3xl bg-muted/40" />
            <div className="h-24 animate-pulse rounded-3xl bg-muted/40" />
          </div>
          <p className="text-center text-sm text-muted-foreground">대시보드를 불러오는 중…</p>
        </section>
      }
    >
      <StudentDashboardInner />
    </Suspense>
  );
}
