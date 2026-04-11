import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/common/page-hero";
import { StatTile } from "@/components/common/stat-tile";

export default function AdminLecturesPage() {
  return (
    <section className="space-y-6">
      <PageHero
        title="강의 데이터 관리"
        description="업로드/퀴즈 생성 품질을 모니터링하고 실패 파이프라인을 점검하세요."
        className="from-emerald-500/15 via-cyan-500/15 to-sky-500/15"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile title="전체 강의" description="등록된 강의 수" value="—" />
        <StatTile title="처리 이슈" description="점검 필요 건수" value="—" />
        <StatTile title="생성 성공률" description="최근 기간" value="—" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>강의 운영</CardTitle>
          <CardDescription>강의 자료 처리와 품질 지표는 운영 정책에 맞게 연결됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>강의별 현황과 알림은 운영 정책에 맞게 구성할 수 있습니다.</p>
        </CardContent>
      </Card>
    </section>
  );
}
