"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/common/page-hero";
import { useAdminDashboardQuery } from "@/hooks/api/use-admin-dashboard-query";
import { cn } from "@/lib/utils";

type UserRole = "student" | "instructor" | "admin";

interface UserRow {
  id: string;
  name: string;
  role: UserRole;
  status: "active" | "suspended";
  detail: string;
}

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const dashboardQuery = useAdminDashboardQuery();

  const users = useMemo(() => {
    const instructorRows: UserRow[] = (dashboardQuery.data?.instructors ?? []).map(
      (instructor) => ({
        id: instructor.instructor_id,
        name: instructor.name,
        role: "instructor",
        status: "active",
        detail: `세션 ${instructor.total_sessions}회 / 참여율 ${Math.round(instructor.avg_participation_rate)}%`,
      }),
    );

    const atRiskStudentRows: UserRow[] = (dashboardQuery.data?.at_risk_students ?? []).map(
      (student) => ({
        id: student.student_id,
        name: student.name,
        role: "student",
        status: student.risk_level === "high" ? "suspended" : "active",
        detail: `리스크 ${student.risk_level} (${Math.round(student.risk_score)})`,
      }),
    );

    return [...instructorRows, ...atRiskStudentRows];
  }, [dashboardQuery.data]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;
      const matchesQuery =
        q.length === 0
          ? true
          : `${user.name} ${user.id} ${user.detail}`.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [query, roleFilter, users]);

  return (
    <section className="space-y-6">
      <PageHero
        title="사용자 권한 관리"
        description="교강사·수강생 계정과 리스크 신호를 한곳에서 확인합니다."
      />
      <Card>
        <CardHeader>
          <CardTitle>실시간 사용자 디렉토리</CardTitle>
          <CardDescription>운영 데이터에서 수강생 리스크/교강사 현황을 확인합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="이름, 이메일, ID 검색"
            />
            <div className="flex gap-2">
              <Button type="button" size="sm" variant={roleFilter === "all" ? "default" : "outline"} onClick={() => setRoleFilter("all")}>
                전체
              </Button>
              <Button type="button" size="sm" variant={roleFilter === "student" ? "default" : "outline"} onClick={() => setRoleFilter("student")}>
                수강생
              </Button>
              <Button type="button" size="sm" variant={roleFilter === "instructor" ? "default" : "outline"} onClick={() => setRoleFilter("instructor")}>
                교강사
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            {filteredUsers.map((user) => (
              <article key={user.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.id}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{user.detail}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">{user.role}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs",
                        user.status === "active"
                          ? "bg-emerald-500/15 text-emerald-700"
                          : "bg-rose-500/15 text-rose-700",
                      )}
                    >
                      {user.status}
                    </span>
                  </div>
                </div>
              </article>
            ))}
            {filteredUsers.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                조회된 사용자 데이터가 없습니다.
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
