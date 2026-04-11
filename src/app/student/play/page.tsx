"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { LiveQuizStatusPanel } from "@/components/common/live-quiz-status-panel";
import { PageHero } from "@/components/common/page-hero";
import { StudentFlowRail } from "@/components/student/student-flow-rail";
import { TechDetails } from "@/components/common/tech-details";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuizDeadlineCountdown } from "@/hooks/use-quiz-deadline-countdown";
import { useQuizSocket } from "@/hooks/use-quiz-socket";
import { AUTH_KEYS, getStoredUser } from "@/lib/auth-storage";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import { cn } from "@/lib/utils";

function StudentPlayContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const user = getStoredUser();
  const token =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_KEYS.accessToken) : null;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const socket = useQuizSocket({
    sessionId,
    enabled: sessionId.length > 0,
    nickname: user?.name ?? "student",
    token: token ?? undefined,
  });

  const active = socket.liveSession.activeQuiz;

  const currentQuestion = useMemo(() => {
    if (!active) {
      return null;
    }
    return {
      quiz_id: active.quiz_id,
      question: active.question,
      options: active.options,
      time_limit: active.time_limit,
    };
  }, [active]);

  useEffect(() => {
    setSelectedOption(null);
    setSubmitted(false);
  }, [active?.quiz_id]);

  const deadlineMs = active ? active.startedAt + active.time_limit * 1000 : null;
  const remainingSec = useQuizDeadlineCountdown(deadlineMs);

  const handleSubmit = () => {
    if (!currentQuestion) {
      return;
    }
    if (selectedOption === null) {
      toast.error("답을 고른 뒤 제출해주세요.");
      return;
    }
    socket.sendAnswer(currentQuestion.quiz_id, selectedOption);
    setSubmitted(true);
    toast.success("답안을 보냈어요.");
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <StudentFlowRail />
      <PageHero
        title="라이브 퀴즈"
        description="강사가 문항을 열면 제한 시간이 시작됩니다. 아래에서 남은 시간과 제출 현황을 확인할 수 있습니다."
      />

      {sessionId ? (
        <LiveQuizStatusPanel
          variant="student"
          live={socket.liveSession}
          remainingSec={remainingSec}
          isConnected={socket.isConnected}
          selfSubmitted={submitted}
        />
      ) : null}

      <Card className="overflow-hidden border-border/80 shadow-md">
        <CardHeader className="border-b border-border/60 bg-muted/20">
          <CardTitle className="text-base">연결 상태</CardTitle>
          <CardDescription>
            {sessionId
              ? "세션에 연결된 경우 실시간으로 갱신됩니다."
              : "참여 코드로 입장한 뒤 이 화면으로 이동해야 합니다."}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {sessionId ? (
            <TechDetails title="연결 확인">
              <p className="break-all text-muted-foreground">
                <span className="font-medium text-foreground">세션</span>{" "}
                <span className="font-mono text-foreground">{sessionId}</span>
              </p>
            </TechDetails>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        {currentQuestion ? (
          <>
            <CardHeader>
              <CardTitle className="text-lg leading-snug md:text-xl">
                {coerceRenderableText(currentQuestion.question)}
              </CardTitle>
              <CardDescription>
                제한 시간 {currentQuestion.time_limit}초
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(currentQuestion.options ?? []).map((option, index) => (
                <button
                  key={`${currentQuestion.quiz_id}-${index}`}
                  type="button"
                  onClick={() => {
                    setSelectedOption(index);
                    setSubmitted(false);
                  }}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3.5 text-left text-sm transition-all",
                    selectedOption === index
                      ? "border-primary bg-primary/10 font-medium text-primary shadow-sm ring-2 ring-primary/20"
                      : "border-border/90 bg-card hover:border-primary/30 hover:bg-muted/50",
                  )}
                >
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  {coerceRenderableText(option)}
                </button>
              ))}
              <Button
                onClick={handleSubmit}
                className="mt-2 h-11 w-full text-base"
                size="lg"
                disabled={!active}
              >
                답안 제출
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle className="text-lg">문항 대기</CardTitle>
              <CardDescription>
                {sessionId
                  ? "강사가 문항을 열면 선택지가 나타납니다."
                  : "참여 코드로 입장한 뒤 이 화면으로 이동해야 합니다."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sessionId ? null : (
                <Button
                  className="w-full"
                  variant="outline"
                  type="button"
                  onClick={() => window.location.assign("/student/join")}
                >
                  참여 코드 입력
                </Button>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </section>
  );
}

export default function StudentPlayPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto max-w-2xl space-y-6">
          <Card className="border-dashed shadow-sm">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              퀴즈 화면을 준비하고 있어요…
            </CardContent>
          </Card>
        </section>
      }
    >
      <StudentPlayContent />
    </Suspense>
  );
}
