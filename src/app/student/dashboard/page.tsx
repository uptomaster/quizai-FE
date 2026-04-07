import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentDashboardPage() {
  return (
    <section className="space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-violet-500/10 via-pink-500/10 to-amber-500/10 p-5">
        <h2 className="text-2xl font-semibold">수강생 대시보드</h2>
        <p className="mt-1 text-sm text-muted-foreground">참여코드로 세션에 입장하고, 결과를 바로 확인하세요.</p>
        <div className="mt-4">
          <Button asChild>
            <a href="/student/join">세션 참여하기</a>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>참여 세션 수</CardTitle>
            <CardDescription>누적 퀴즈 세션 참여 횟수</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">0</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>평균 점수</CardTitle>
            <CardDescription>최근 응답 결과 기반</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">0점</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>정답률</CardTitle>
            <CardDescription>전체 문제 대비</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">0%</CardContent>
        </Card>
      </div>
    </section>
  );
}
