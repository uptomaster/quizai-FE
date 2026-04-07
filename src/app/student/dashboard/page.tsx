import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentDashboardPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">수강생 대시보드</h2>
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
