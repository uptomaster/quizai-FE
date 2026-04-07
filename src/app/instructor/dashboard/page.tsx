import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function InstructorDashboardPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">교강사 대시보드</h2>
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
