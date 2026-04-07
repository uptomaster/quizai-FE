import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSessionsPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">세션 모니터링</h2>
      <Card>
        <CardHeader>
          <CardTitle>실시간 세션 감시</CardTitle>
          <CardDescription>비정상 세션 및 참여율 이상치를 추적합니다.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          세션 제어 기능은 백엔드 관리 API 확정 후 연결 예정입니다.
        </CardContent>
      </Card>
    </section>
  );
}
