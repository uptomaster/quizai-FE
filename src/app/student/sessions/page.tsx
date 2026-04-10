"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/common/page-hero";
import { useSessionResultQuery } from "@/hooks/api/use-session-result-query";
import { cn } from "@/lib/utils";

export default function StudentSessionsPage() {
  const [sessionIdInput, setSessionIdInput] = useState("");
  const [sessionId, setSessionId] = useState("");
  const resultQuery = useSessionResultQuery(sessionId);
  const result = resultQuery.data;

  const sortedStudents = useMemo(() => {
    if (!result) {
      return [];
    }

    return [...result.students].sort((a, b) => b.score - a.score);
  }, [result]);

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!sessionIdInput.trim()) {
      toast.error("세션 ID를 입력해주세요.");
      return;
    }
    setSessionId(sessionIdInput.trim());
  };

  return (
    <section className="space-y-6">
      <PageHero
        title="세션 결과 조회"
        description="실제 DB에 저장된 세션 결과를 세션 ID 기준으로 조회합니다."
      />
      <Card>
        <CardHeader>
          <CardTitle>결과 조회</CardTitle>
          <CardDescription>교강사가 공유한 세션 ID를 입력해 결과를 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col gap-2 md:flex-row">
            <Input
              value={sessionIdInput}
              onChange={(event) => setSessionIdInput(event.target.value)}
              placeholder="session_id 입력"
            />
            <Button type="submit" disabled={resultQuery.isFetching}>
              {resultQuery.isFetching ? "조회 중..." : "조회"}
            </Button>
          </form>

          {result ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">평균 점수</p>
                    <p className="text-2xl font-semibold">{Math.round(result.avg_score)}점</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">총 수강생</p>
                    <p className="text-2xl font-semibold">{result.total_students}명</p>
                  </CardContent>
                </Card>
                <Card className="border-slate-200">
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">취약 개념 수</p>
                    <p className="text-2xl font-semibold">{result.weak_concepts.length}개</p>
                  </CardContent>
                </Card>
              </div>
              <div className="rounded-xl border bg-white p-4">
                <p className="text-sm font-semibold">AI 오답 요약</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  오답의 대부분이 `{result.weak_concepts.slice(0, 2).join(", ")}` 개념에서 발생했어요.
                  다음 세션 전 5분 복습을 추천합니다.
                </p>
              </div>

              <div className="grid gap-2">
                {sortedStudents.map((student) => (
                  <article key={student.student_id} className="rounded-xl border bg-white p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{student.nickname}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-1 text-xs font-medium",
                          student.grade === "excellent"
                            ? "bg-blue-50 text-blue-700"
                            : student.grade === "needs_practice"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700",
                        )}
                      >
                        {student.grade}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">점수 {student.score}점</p>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              세션 ID를 입력하면 실제 결과 데이터를 가져옵니다.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
