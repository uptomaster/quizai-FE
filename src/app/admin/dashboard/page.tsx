import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">운영자 대시보드</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>전체 사용자</CardTitle>
            <CardDescription>학생/교강사/관리자 합계</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>오늘 세션 수</CardTitle>
            <CardDescription>생성된 세션 기준</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>시스템 상태</CardTitle>
            <CardDescription>API/WS 가용성 모니터링</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">정상</CardContent>
        </Card>
      </div>
    </section>
  );
}
