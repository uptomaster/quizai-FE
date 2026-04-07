import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/common/page-hero";
import { StatTile } from "@/components/common/stat-tile";

export default function AdminSessionsPage() {
  return (
    <section className="space-y-6">
      <PageHero
        title="세션 모니터링"
        description="실시간 세션 참여율과 이상 징후를 추적해 안정적인 수업 운영을 지원합니다."
        className="from-blue-500/15 via-cyan-500/15 to-indigo-500/15"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile title="활성 세션" description="현재 진행 중" value="6" delta="+2" />
        <StatTile title="평균 참여율" description="오늘 기준" value="82%" delta="+5%" />
        <StatTile title="이상 징후" description="네트워크/지연 이슈" value="1건" delta="-2" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>실시간 운영 로그</CardTitle>
          <CardDescription>문제 세션은 우선 확인 후 운영자 조치를 수행합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• session-203: 평균 응답 지연 1.9s (주의)</p>
          <p>• session-198: 참여율 95% (정상)</p>
          <p>• session-187: 브로드캐스트 재시도 2회 (모니터링 중)</p>
        </CardContent>
      </Card>
    </section>
  );
}
