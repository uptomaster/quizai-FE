"use client";

import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import { gradeLabelKo } from "@/lib/session-user-copy";
import { cn, formatQuizScorePoints, toFiniteNumber } from "@/lib/utils";
import type { SessionResult } from "@/types/api";

interface SessionResultPanelProps {
  result: SessionResult | undefined;
  isLoading: boolean;
  /** 로그인한 수강생과 매칭해 카드 강조 */
  highlightUserId?: string;
  highlightNickname?: string;
}

export function SessionResultPanel({
  result,
  isLoading,
  highlightUserId,
  highlightNickname,
}: SessionResultPanelProps) {
  const sortedStudents = useMemo(() => {
    if (!result) {
      return [];
    }
    const rows = result.students ?? [];
    return [...rows].sort((a, b) => {
      const sa = toFiniteNumber(a.score) ?? -1;
      const sb = toFiniteNumber(b.score) ?? -1;
      return sb - sa;
    });
  }, [result]);

  const weakConcepts = result?.weak_concepts ?? [];

  const isMe = (studentId: string, nickname: string) =>
    (highlightUserId && studentId === highlightUserId) ||
    (highlightNickname && nickname === highlightNickname);

  if (isLoading) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-border/90 bg-muted/20 p-6 text-center text-sm text-muted-foreground">
        결과를 불러오지 못했거나 아직 집계되지 않았습니다.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/80 bg-gradient-to-br from-card to-primary/[0.04] shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground">이 퀴즈 평균</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{formatQuizScorePoints(result.avg_score)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground">참여 인원</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {toFiniteNumber(result.total_students) !== null
                ? `${Math.round(toFiniteNumber(result.total_students)!)}명`
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs font-medium text-muted-foreground">복습 포인트</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{weakConcepts.length}개</p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold">AI 한 줄 요약</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          많이 틀린 주제는{" "}
          <span className="font-medium text-foreground">
            {weakConcepts
              .slice(0, 2)
              .map((w) => coerceRenderableText(w))
              .filter(Boolean)
              .join(", ") || "아직 없음"}
          </span>
          입니다.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">전체 순위 (내 행 강조)</p>
        {sortedStudents.map((student) => {
          const mine = isMe(student.student_id, student.nickname);
          return (
            <article
              key={student.student_id}
              className={cn(
                "rounded-2xl border p-4 shadow-sm",
                mine ? "border-primary/50 bg-primary/[0.06] ring-1 ring-primary/20" : "border-border/80 bg-card/90",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">
                  {coerceRenderableText(student.nickname) || "—"}
                  {mine ? (
                    <span className="ml-2 text-xs font-normal text-primary">나</span>
                  ) : null}
                </p>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    student.grade === "excellent"
                      ? "bg-emerald-50 text-emerald-800"
                      : student.grade === "needs_practice"
                        ? "bg-amber-50 text-amber-900"
                        : "bg-rose-50 text-rose-800",
                  )}
                >
                  {gradeLabelKo(student.grade)}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">점수 {formatQuizScorePoints(student.score)}</p>
            </article>
          );
        })}
      </div>
    </>
  );
}
