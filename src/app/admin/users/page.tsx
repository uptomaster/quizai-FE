import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">사용자 권한 관리</h2>
      <Card>
        <CardHeader>
          <CardTitle>역할 관리</CardTitle>
          <CardDescription>수강생/교강사/운영자 권한을 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          사용자 목록/권한 변경 API 연동 전입니다.
        </CardContent>
      </Card>
    </section>
  );
}
