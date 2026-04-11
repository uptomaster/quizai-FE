"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/common/page-hero";
import { StudentFlowRail } from "@/components/student/student-flow-rail";
import { Button, buttonVariants } from "@/components/ui/button";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnrollLectureMutation } from "@/hooks/api/use-enroll-lecture-mutation";
import { useLecturesQuery } from "@/hooks/api/use-lectures-query";

export default function StudentLecturesPage() {
  const lecturesQuery = useLecturesQuery(1, 20);
  const enrollMutation = useEnrollLectureMutation();
  const [justEnrolled, setJustEnrolled] = useState<Record<string, true>>({});

  const handleEnroll = async (lectureId: string) => {
    try {
      await enrollMutation.mutateAsync(lectureId);
      setJustEnrolled((prev) => ({ ...prev, [lectureId]: true }));
      toast.success("수강 신청이 완료되었습니다.");
    } catch {
      // apiRequest shows server detail in a toast
    }
  };

  return (
    <section className="space-y-6">
      <StudentFlowRail />
      <PageHero
        title="강의 신청"
        description="수강할 강의를 선택하면 이후 해당 수업의 라이브 퀴즈에 참여할 수 있습니다."
        actions={
          <Link href="/student/join" className={cn(buttonVariants({ variant: "outline" }))}>
            참여 코드로 입장
          </Link>
        }
      />

      <Card className="border-dashed border-border/90 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>신청 가능한 강의</CardTitle>
          <CardDescription>목록은 서버에 등록된 강의입니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {lecturesQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : lecturesQuery.isError ? (
            <p className="text-sm text-destructive">강의 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
          ) : (lecturesQuery.data?.lectures ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">신청 가능한 강의가 없습니다.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {(lecturesQuery.data?.lectures ?? []).map((lec) => {
                const enrolled = lec.is_enrolled === true || Boolean(justEnrolled[lec.lecture_id]);
                return (
                  <li key={lec.lecture_id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium">{coerceRenderableText(lec.title) || "강의"}</p>
                      <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                        강의 코드 {lec.lecture_id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {typeof lec.quiz_count === "number" ? `퀴즈 ${lec.quiz_count}세트` : "강의"}
                        {lec.created_at
                          ? ` · ${new Date(lec.created_at).toLocaleDateString()}`
                          : null}
                      </p>
                    </div>
                    {enrolled ? (
                      <span className="text-sm font-medium text-emerald-600">수강 중</span>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={enrollMutation.isPending}
                        onClick={() => handleEnroll(lec.lecture_id)}
                      >
                        수강 신청
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
