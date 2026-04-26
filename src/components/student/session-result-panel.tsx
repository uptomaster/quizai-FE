"use client";

import { useMemo } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import { stableParticipantAlias } from "@/lib/participant-anonymize";
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
    (!highlightUserId && highlightNickname && nickname === highlightNickname);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-2xl sm:rounded-3xl" />
          <Skeleton className="h-20 rounded-2xl sm:rounded-3xl" />
          <Skeleton className="h-20 rounded-2xl sm:rounded-3xl" />
        </div>
        <Skeleton className="h-24 rounded-2xl sm:rounded-3xl" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-border/80 bg-muted/15 p-8 text-center text-sm text-muted-foreground sm:rounded-3xl">
        결과를 불러오지 못했거나 아직 집계되지 않았습니다.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.07] to-card/90 px-4 py-4 ring-1 ring-black/[0.03] dark:ring-white/[0.05] sm:rounded-3xl sm:px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">이 퀴즈 평균</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {formatQuizScorePoints(result.avg_score)}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-4 ring-1 ring-black/[0.03] dark:bg-card/50 dark:ring-white/[0.05] sm:rounded-3xl sm:px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">참여 인원</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {toFiniteNumber(result.total_students) !== null
              ? `${Math.round(toFiniteNumber(result.total_students)!)}명`
              : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card/80 px-4 py-4 ring-1 ring-black/[0.03] dark:bg-card/50 dark:ring-white/[0.05] sm:rounded-3xl sm:px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">복습 포인트</p>
          <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-foreground">{weakConcepts.length}개</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 ring-1 ring-black/[0.03] dark:ring-white/[0.04] sm:rounded-3xl sm:p-5">
        <p className="text-sm font-semibold text-foreground">한 줄 요약</p>
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
        <p className="text-xs font-semibold text-muted-foreground">순위 · 타인은 익명으로만 표시됩니다</p>
        {sortedStudents.map((student, index) => {
          const mine = isMe(student.student_id, student.nickname);
          const rank = index + 1;
          const publicLabel = mine ? "나" : stableParticipantAlias(student.student_id);
          return (
            <article
              key={student.student_id}
              className={cn(
                "rounded-2xl border p-4 ring-1 transition-colors sm:rounded-3xl",
                mine
                  ? "border-primary/45 bg-primary/[0.07] ring-primary/20"
                  : "border-border/60 bg-card/80 ring-black/[0.03] hover:border-primary/25 dark:ring-white/[0.05]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">#{rank}</span>
                  {publicLabel}
                  {mine ? (
                    <span className="ml-2 text-xs font-normal text-primary">(본인)</span>
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
