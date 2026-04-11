"use client";

import { FlowPageHeader } from "@/components/common/flow-page-header";
import { InstructorFlowRail } from "@/components/instructor/instructor-flow-rail";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/common/stat-tile";
import { useInstructorDashboardQuery } from "@/hooks/api/use-instructor-dashboard-query";
import { getStoredUser } from "@/lib/auth-storage";

export default function InstructorDashboardPage() {
  const dashboardQuery = useInstructorDashboardQuery();
  const data = dashboardQuery.data;
  const recent = data?.recent_sessions ?? [];
  const user = getStoredUser();
  const greetingName = user?.name?.trim() || user?.email?.split("@")[0] || "선생님";

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
              : `참여 ${Math.round(data?.avg_participation_rate ?? 0)}% · 정답 ${Math.round(data?.avg_correct_rate ?? 0)}%`
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
        <StatTile
          title="평균 참여율"
          description="학생 참여 비율"
          value={
            dashboardQuery.isLoading ? "…" : `${Math.round(data?.avg_participation_rate ?? 0)}%`
          }
        />
        <StatTile
          title="평균 정답률"
          description="문항별 정답 비율"
          value={dashboardQuery.isLoading ? "…" : `${Math.round(data?.avg_correct_rate ?? 0)}%`}
        />
      </div>
      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold">최근 라이브 세션</p>
        <div className="mt-3 space-y-3">
          {dashboardQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">불러오는 중…</p>
          ) : recent.length > 0 ? (
            recent.slice(0, 6).map((session) => (
              <div key={session.session_id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span>{session.lecture_title}</span>
                  <span>{Math.round(session.avg_score)}점</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-violet-500"
                    style={{ width: `${Math.min(100, Math.max(0, session.avg_score))}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">아직 기록된 라이브 세션이 없습니다.</p>
          )}
        </div>
      </div>
    </section>
  );
}
