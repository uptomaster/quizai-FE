"use client";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/common/page-hero";
import { StatTile } from "@/components/common/stat-tile";
import { useInstructorDashboardQuery } from "@/hooks/api/use-instructor-dashboard-query";

export default function InstructorDashboardPage() {
  const dashboardQuery = useInstructorDashboardQuery();
  const data = dashboardQuery.data;

  return (
    <section className="space-y-6">
      <PageHero
        title="교강사 대시보드"
        description="강의 업로드부터 세션 운영까지 한 화면에서 관리하세요."
        className="from-indigo-500/10 via-cyan-500/10 to-emerald-500/10"
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
          value={`${Math.round((data?.avg_participation_rate ?? 0) * 100)}%`}
          delta="실시간"
        />
        <StatTile
          title="평균 정답률"
          description="세션 문제 정답 정확도"
          value={`${Math.round((data?.avg_correct_rate ?? 0) * 100)}%`}
          delta={`${Math.round((data?.quality_score ?? 0) * 100)} 품질점수`}
        />
      </div>
    </section>
  );
}
