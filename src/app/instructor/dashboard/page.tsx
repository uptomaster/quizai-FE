import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function InstructorDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-indigo-500/10 via-cyan-500/10 to-emerald-500/10 p-5">
        <h2 className="text-2xl font-semibold">교강사 대시보드</h2>
        <p className="mt-1 text-sm text-muted-foreground">강의 업로드부터 세션 운영까지 한 화면에서 관리하세요.</p>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <a href="/instructor/lectures">퀴즈 만들기</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/instructor/sessions">세션 시작</a>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>내 강의 수</CardTitle>
            <CardDescription>업로드 완료된 강의 자료</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>진행 중 세션</CardTitle>
            <CardDescription>현재 활성화된 퀴즈 세션</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>평균 정답률</CardTitle>
            <CardDescription>최근 7일 기준</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">0%</CardContent>
        </Card>
      </div>
    </section>
  );
}
