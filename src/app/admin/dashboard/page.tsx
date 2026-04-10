"use client";

import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/common/page-hero";
import { StatTile } from "@/components/common/stat-tile";
import { useAdminDashboardQuery } from "@/hooks/api/use-admin-dashboard-query";

export default function AdminDashboardPage() {
  const dashboardQuery = useAdminDashboardQuery();
  const platform = dashboardQuery.data?.platform;

  return (
    <section className="space-y-6">
      <PageHero
        title="운영자 대시보드"
        description="서비스 상태, 사용자 권한, 세션 품질을 통합 모니터링합니다."
        className="from-slate-500/10 via-emerald-500/10 to-sky-500/10"
        actions={
          <>
          <Button onClick={() => window.location.assign("/admin/users")}>사용자 관리</Button>
          <Button variant="outline" onClick={() => window.location.assign("/admin/sessions")}>
            세션 모니터링
          </Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          title="전체 사용자"
          description="학생/교강사/관리자 합계"
          value={String(platform?.total_users ?? 0)}
          delta={dashboardQuery.isFetching ? "동기화 중" : "최신"}
        />
        <StatTile
          title="총 세션 수"
          description="플랫폼 전체 세션"
          value={String(platform?.total_sessions ?? 0)}
          delta="실시간"
        />
        <StatTile
          title="평균 정답률"
          description="플랫폼 정답 정확도"
          value={`${Math.round((platform?.avg_correct_rate ?? 0) * 100)}%`}
          delta={`${platform?.total_answers ?? 0} answers`}
        />
      </div>
    </section>
  );
}
