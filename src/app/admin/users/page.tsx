"use client";

import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/common/page-hero";
import { cn } from "@/lib/utils";

type UserRole = "student" | "instructor" | "admin";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "suspended";
}

const MOCK_USERS: UserRow[] = [
  { id: "u-101", name: "김수강", email: "student1@quizai.com", role: "student", status: "active" },
  { id: "u-102", name: "박교강", email: "teacher1@quizai.com", role: "instructor", status: "active" },
  { id: "u-103", name: "최운영", email: "admin1@quizai.com", role: "admin", status: "active" },
  { id: "u-104", name: "이학습", email: "student2@quizai.com", role: "student", status: "suspended" },
];

export default function AdminUsersPage() {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MOCK_USERS.filter((user) => {
      const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;
      const matchesQuery =
        q.length === 0
          ? true
          : `${user.name} ${user.email} ${user.id}`.toLowerCase().includes(q);
      return matchesRole && matchesQuery;
    });
  }, [query, roleFilter]);

  return (
    <section className="space-y-6">
      <PageHero
        title="사용자 권한 관리"
        description="수강생/교강사/운영자 권한을 관리하고, 계정 상태를 통합 모니터링합니다."
        className="from-fuchsia-500/15 via-pink-500/15 to-rose-500/15"
      />
      <Card>
        <CardHeader>
          <CardTitle>사용자 디렉토리</CardTitle>
          <CardDescription>검색 및 역할 필터로 대상 계정을 빠르게 찾을 수 있습니다.</CardDescription>
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
              <Button type="button" size="sm" variant={roleFilter === "admin" ? "default" : "outline"} onClick={() => setRoleFilter("admin")}>
                운영자
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            {filteredUsers.map((user) => (
              <article key={user.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email} | {user.id}</p>
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
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
