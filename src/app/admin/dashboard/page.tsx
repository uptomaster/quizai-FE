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
          title="활성 세션"
          description="현재 운영 중인 세션 수"
          value={String(platform?.active_sessions ?? 0)}
          delta={dashboardQuery.isFetching ? "동기화 중" : "최신"}
        />
        <StatTile
          title="오늘 세션 수"
          description="금일 생성된 세션"
          value={String(platform?.today_sessions ?? 0)}
          delta="실시간"
        />
        <StatTile
          title="평균 참여율"
          description="플랫폼 전체 참여율"
          value={`${Math.round(platform?.avg_participation ?? 0)}%`}
          delta="운영 지표"
        />
      </div>
    </section>
  );
}
