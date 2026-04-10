"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/common/page-hero";
import { Button, buttonVariants } from "@/components/ui/button";
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
      <PageHero
        title="수업 신청"
        description="세션에 참여하려면 먼저 해당 강의에 수강 신청이 되어 있어야 합니다. 아래 목록에서 신청할 수 있습니다."
        actions={
          <Link href="/student/join" className={cn(buttonVariants({ variant: "outline" }))}>
            세션 참여로 이동
          </Link>
        }
      />

      <Card className="border-dashed bg-white">
        <CardHeader>
          <CardTitle>열려 있는 강의</CardTitle>
          <CardDescription>
            백엔드가 <code className="text-xs">GET /lectures</code>와{" "}
            <code className="text-xs">POST /lectures/{"{lecture_id}"}/enroll</code>를 제공하면 여기서 바로 연동됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lecturesQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : lecturesQuery.isError ? (
            <p className="text-sm text-destructive">강의 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</p>
          ) : !lecturesQuery.data?.lectures.length ? (
            <p className="text-sm text-muted-foreground">신청 가능한 강의가 없습니다.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {lecturesQuery.data.lectures.map((lec) => {
                const enrolled = lec.is_enrolled === true || Boolean(justEnrolled[lec.lecture_id]);
                return (
                  <li key={lec.lecture_id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{lec.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {lec.lecture_id}
                        {typeof lec.quiz_count === "number" ? ` · 퀴즈 ${lec.quiz_count}세트` : null}
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
