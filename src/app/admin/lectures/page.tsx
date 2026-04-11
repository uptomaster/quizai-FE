"use client";

import { PageHero } from "@/components/common/page-hero";
import { StatTile } from "@/components/common/stat-tile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDashboardQuery } from "@/hooks/api/use-admin-dashboard-query";
import { useLecturesQuery } from "@/hooks/api/use-lectures-query";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";

export default function AdminLecturesPage() {
  const lecturesQuery = useLecturesQuery(1, 50);
  const adminQuery = useAdminDashboardQuery();

  const total = lecturesQuery.data?.total;
  const platform = adminQuery.data?.platform;
  const rows = lecturesQuery.data?.lectures ?? [];

  const statValue = (n: number | undefined, loading: boolean) => {
    if (loading) {
      return "…";
    }
    return typeof n === "number" ? String(n) : "—";
  };

  return (
    <section className="space-y-6">
      <PageHero
        title="강의 데이터"
        description="등록된 강의 목록과 플랫폼 세션 지표를 확인합니다."
        className="from-emerald-500/15 via-cyan-500/15 to-sky-500/15"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          title="등록 강의"
          description="목록 API 기준 총계"
          value={statValue(total, lecturesQuery.isLoading)}
        />
        <StatTile
          title="활성 세션"
          description="운영 대시보드 기준"
          value={statValue(platform?.active_sessions, adminQuery.isLoading)}
        />
        <StatTile
          title="오늘 세션"
          description="금일 생성"
          value={statValue(platform?.today_sessions, adminQuery.isLoading)}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>강의 목록</CardTitle>
          <CardDescription>최근 등록 순(최대 50건)</CardDescription>
        </CardHeader>
        <CardContent>
          {lecturesQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : lecturesQuery.isError ? (
            <p className="text-sm text-destructive">강의 목록을 불러오지 못했습니다.</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">등록된 강의가 없습니다.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {rows.map((lec) => (
                <li key={lec.lecture_id} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{coerceRenderableText(lec.title) || "강의"}</p>
                    <p className="text-xs text-muted-foreground">
                      {lec.created_at ? new Date(lec.created_at).toLocaleString() : null}
                      {typeof lec.quiz_count === "number" ? ` · 퀴즈 ${lec.quiz_count}세트` : null}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
