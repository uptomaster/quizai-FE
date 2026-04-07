import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentSessionsPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">응답 기록</h2>
      <Card>
        <CardHeader>
          <CardTitle>최근 참여 세션</CardTitle>
          <CardDescription>세션별 점수와 정답률을 제공합니다.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          아직 기록이 없습니다.
        </CardContent>
      </Card>
    </section>
  );
}
