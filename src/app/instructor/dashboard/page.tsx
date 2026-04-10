"use client";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/common/page-hero";
import { StatTile } from "@/components/common/stat-tile";
import { useInstructorDashboardQuery } from "@/hooks/api/use-instructor-dashboard-query";

export default function InstructorDashboardPage() {
  const dashboardQuery = useInstructorDashboardQuery();
  const data = dashboardQuery.data;
  const recent = data?.recent_sessions ?? [];

  return (
    <section className="space-y-6">
      <PageHero
        title="안녕하세요, 남혁님"
        description={`오늘 퀴즈 참여율은 ${Math.round(data?.avg_participation_rate ?? 0)}%입니다. 낮은 정답률 문항부터 보충하면 학습 효율이 올라갑니다.`}
        actions={
          <>
          <Button onClick={() => window.location.assign("/instructor/lectures")}>퀴즈 만들기</Button>
          <Button variant="outline" onClick={() => window.location.assign("/instructor/sessions")}>
            세션 시작
          </Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          title="총 세션 수"
          description="누적 세션 운영 횟수"
          value={String(data?.total_sessions ?? 0)}
          delta={dashboardQuery.isFetching ? "동기화 중" : "최신"}
        />
        <StatTile
          title="평균 참여율"
          description="학생 참여 평균"
          value={`${Math.round(data?.avg_participation_rate ?? 0)}%`}
          delta="실시간"
        />
        <StatTile
          title="평균 정답률"
          description="세션 문제 정답 정확도"
          value={`${Math.round(data?.avg_correct_rate ?? 0)}%`}
          delta={`${Math.round(data?.quality_score.total ?? 0)} 품질점수`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm font-semibold">현재 진행 강의 이해도</p>
          <div className="mt-3 space-y-3">
            {recent.length > 0 ? (
              recent.slice(0, 4).map((session) => (
                <div key={session.session_id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span>{session.lecture_title}</span>
                    <span>{Math.round(session.avg_score)}점</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${Math.min(100, Math.max(0, session.avg_score))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">표시할 세션 데이터가 없습니다.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm font-semibold">AI Insight</p>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p className="rounded-lg border bg-blue-50 p-3">
              3번 문항의 정답률이 낮습니다. 보충 설명이 필요해 보입니다.
            </p>
            <p className="rounded-lg border p-3">
              평균 점수가 70점 이하인 세션은 퀴즈 난이도 조정이 권장됩니다.
            </p>
            <p className="rounded-lg border p-3">
              다음 세션 시작 전 오답률 상위 개념을 5분 요약으로 복습하세요.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
