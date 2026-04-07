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
        <StatTile title="전체 강의" description="등록된 강의 자료 수" value="127" delta="+4 today" />
        <StatTile title="업로드 실패" description="재처리 필요 건수" value="3" delta="-1" />
        <StatTile title="퀴즈 생성 성공률" description="최근 7일" value="96%" delta="+2%" />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>운영 점검 항목</CardTitle>
          <CardDescription>백엔드 연동 전까지는 샘플 데이터로 운영 흐름을 검증합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• 파싱 실패 강의: PDF 2건, PPTX 1건</p>
          <p>• 평균 처리 시간: 24초</p>
          <p>• 재시도 큐: 3건 대기</p>
        </CardContent>
      </Card>
    </section>
  );
}
