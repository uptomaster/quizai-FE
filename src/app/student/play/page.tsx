"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { QuizQuestionView, formatQuizClock } from "@/components/quiz/quiz-question-view";
import { StudentFlowRail } from "@/components/student/student-flow-rail";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuizDeadlineCountdown } from "@/hooks/use-quiz-deadline-countdown";
import { useQuizSocket } from "@/hooks/use-quiz-socket";
import { AUTH_KEYS, getStoredUser } from "@/lib/auth-storage";
import { getRememberedJoinNickname, getRememberedSessionWsUrl } from "@/lib/session-ws-url";
import { cn } from "@/lib/utils";
import Link from "next/link";

function StudentPlayContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const user = getStoredUser();
  const token =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_KEYS.accessToken) : null;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [directWsUrl, setDirectWsUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!sessionId) {
      setDirectWsUrl(undefined);
      return;
    }
    setDirectWsUrl(getRememberedSessionWsUrl(sessionId));
  }, [sessionId]);

  const joinNickname = getRememberedJoinNickname(sessionId);

  const socket = useQuizSocket({
    sessionId,
    directWsUrl,
    enabled: sessionId.length > 0,
    nickname: joinNickname ?? user?.name ?? "student",
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
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border bg-background px-3 py-2">
        <StudentFlowRail />
        <div className="mt-1.5 flex justify-end">
          <Link href="/student/dashboard" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs")}>
            결과
          </Link>
        </div>
      </div>
      {sessionId ? (
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/80 bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex min-w-0 flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              남은 시간
            </span>
            <span
              className={cn(
                "font-mono text-2xl font-bold tabular-nums",
                remainingSec !== null && remainingSec <= 5 ? "text-destructive" : "text-foreground",
              )}
            >
              {active ? formatQuizClock(remainingSec) : "—"}
            </span>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p
              className={cn(
                "font-medium",
                socket.isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400",
              )}
            >
              {socket.isConnected ? "실시간 연결됨" : "연결 중…"}
            </p>
            {socket.connectionAttempt > 0 && !socket.isConnected ? (
              <p className="mt-0.5 text-[10px]">재시도 {socket.connectionAttempt}</p>
            ) : null}
          </div>
        </header>
      ) : null}

      <main className="flex flex-1 flex-col justify-center px-4 py-6">
        {!sessionId ? (
          <Card className="mx-auto w-full max-w-md border-dashed shadow-sm">
            <CardHeader>
              <CardTitle>세션 없음</CardTitle>
              <CardDescription>참여 코드로 입장한 뒤 이 화면으로 이동해야 합니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" type="button" onClick={() => window.location.assign("/student/join")}>
                참여 코드 입력
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mx-auto w-full max-w-lg">
            {currentQuestion ? (
              <QuizQuestionView
                key={currentQuestion.quiz_id}
                variant="student"
                question={currentQuestion.question}
                options={currentQuestion.options ?? []}
                timeLimitSec={currentQuestion.time_limit}
                remainingSec={remainingSec}
                selectedOption={selectedOption}
                onSelectOption={(index) => {
                  setSelectedOption(index);
                  setSubmitted(false);
                }}
                onSubmit={handleSubmit}
                submitDisabled={!active}
                footerNote={submitted ? "제출 완료. 강사 화면에서 집계됩니다." : undefined}
              />
            ) : (
              <Card className="border-border/90 shadow-lg">
                <CardContent className="py-14 text-center">
                  <p className="text-base font-medium text-foreground">문항 대기</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {socket.isConnected
                      ? "강사가 문항을 열면 여기에 표시됩니다."
                      : "실시간 서버에 연결하는 중입니다…"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function StudentPlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background px-4 text-sm text-muted-foreground">
          퀴즈 화면을 불러오는 중…
        </div>
      }
    >
      <StudentPlayContent />
    </Suspense>
  );
}
