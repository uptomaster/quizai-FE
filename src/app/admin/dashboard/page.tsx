import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-slate-500/10 via-emerald-500/10 to-sky-500/10 p-5">
        <h2 className="text-2xl font-semibold">운영자 대시보드</h2>
        <p className="mt-1 text-sm text-muted-foreground">서비스 상태, 사용자 권한, 세션 품질을 통합 모니터링합니다.</p>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <a href="/admin/users">사용자 관리</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/admin/sessions">세션 모니터링</a>
          </Button>
        </div>
      </div>
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
