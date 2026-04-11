"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { FlowPageHeader } from "@/components/common/flow-page-header";
import { SessionResultPanel } from "@/components/student/session-result-panel";
import { StudentFlowRail } from "@/components/student/student-flow-rail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <section className="space-y-6">
      <FlowPageHeader
        rail={<StudentFlowRail />}
        title="결과"
        description="참여한 퀴즈 점수와 문항별 결과입니다."
        actions={
          <>
            <Button variant="outline" onClick={() => window.location.assign("/student/join")}>
              참여 코드
            </Button>
            <Button onClick={() => window.location.assign("/student/play")}>퀴즈 화면</Button>
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

      <Card id="quiz-results" className="scroll-mt-6 border-primary/12 shadow-[0_8px_32px_-12px_rgba(15,23,42,0.09)]">
        <CardHeader>
          <CardTitle>퀴즈 결과</CardTitle>
          <CardDescription>세션을 선택하면 상세 점수와 문항별 결과를 불러옵니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                      "w-full rounded-2xl border p-4 text-left text-sm shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] transition-all",
                      selectedSessionId === row.session_id
                        ? "border-primary/50 bg-primary/[0.06] shadow-[0_6px_20px_-8px_rgba(79,70,229,0.2)]"
                        : "border-border/60 bg-card hover:border-primary/35 hover:shadow-[0_8px_24px_-10px_rgba(15,23,42,0.1)]",
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
            <div className="border-t border-border/80 pt-6">
              <p className="mb-3 text-sm font-medium text-foreground">선택한 퀴즈 상세</p>
              <SessionResultPanel
                result={resultQuery.data}
                isLoading={resultQuery.isFetching}
                highlightUserId={user?.id}
                highlightNickname={user?.name}
              />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

export default function StudentDashboardPage() {
  return (
    <Suspense
      fallback={
        <section className="space-y-6 p-4 text-sm text-muted-foreground">대시보드를 불러오는 중…</section>
      }
    >
      <StudentDashboardInner />
    </Suspense>
  );
}
