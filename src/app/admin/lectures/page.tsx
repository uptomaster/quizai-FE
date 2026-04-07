import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLecturesPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">강의 데이터 관리</h2>
      <Card>
        <CardHeader>
          <CardTitle>강의/퀴즈 운영 현황</CardTitle>
          <CardDescription>업로드 실패 및 생성 실패 강의를 점검합니다.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          운영 정책(삭제/복구/비활성화)은 백엔드 권한 정책 확정 후 연결 예정입니다.
        </CardContent>
      </Card>
    </section>
  );
}
