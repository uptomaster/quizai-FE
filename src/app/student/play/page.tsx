"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { FlowSurface } from "@/components/common/flow-surface";
import { QuizQuestionView, formatQuizClock } from "@/components/quiz/quiz-question-view";
import { StudentFlowRail } from "@/components/student/student-flow-rail";
import { Button, buttonVariants } from "@/components/ui/button";
import { useQuizDeadlineCountdown } from "@/hooks/use-quiz-deadline-countdown";
import { useQuizSocket } from "@/hooks/use-quiz-socket";
import { AUTH_KEYS, getStoredUser } from "@/lib/auth-storage";
import {
  liveQuizBroadcastChannelId,
  type LiveQuizBroadcastMessage,
  type LiveQuizBroadcastPayload,
} from "@/lib/live-quiz-broadcast";
import type { LiveSessionState } from "@/lib/quiz-ws-live-state";
import {
  getRememberedJoinNickname,
  getRememberedSessionWsUrl,
  rememberSessionWsUrl,
} from "@/lib/session-ws-url";
import { cn } from "@/lib/utils";
import { sessionService } from "@/services/session-service";
import type { SessionStudentResult } from "@/types/api";
import Link from "next/link";

function StudentPlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const user = getStoredUser();
  const token =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_KEYS.accessToken) : null;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [myResultRow, setMyResultRow] = useState<SessionStudentResult | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  /** 교강사 탭이 BroadcastChannel 로 보낸 문항(서버가 학생에게 quiz_started 를 안 줄 때 보조) */
  const [relayedActive, setRelayedActive] = useState<NonNullable<LiveSessionState["activeQuiz"]> | null>(
    null,
  );

  /** 첫 페인트부터 join 응답과 동일한 ws_url 로 붙게 함(비어 있으면 NEXT_PUBLIC_WS_URL 폴백으로 잘못된 방에 연결됨). */
  const directWsUrl = useMemo(() => {
    if (!sessionId) {
      return undefined;
    }
    const fromQuery = searchParams.get("wsUrl")?.trim();
    if (fromQuery) {
      return fromQuery;
    }
    return getRememberedSessionWsUrl(sessionId);
  }, [sessionId, searchParams]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    const fromQuery = searchParams.get("wsUrl")?.trim();
    if (fromQuery) {
      rememberSessionWsUrl(sessionId, fromQuery);
      router.replace(`/student/play?sessionId=${encodeURIComponent(sessionId)}`, { scroll: false });
    }
  }, [sessionId, searchParams, router]);

  useEffect(() => {
    if (!sessionId || typeof BroadcastChannel === "undefined") {
      return;
    }
    const bc = new BroadcastChannel(liveQuizBroadcastChannelId(sessionId));
    const handler = (ev: MessageEvent<LiveQuizBroadcastMessage>) => {
      const d = ev.data;
      if (!d || typeof d !== "object") {
        return;
      }
      if ("type" in d && d.type === "request_sync") {
        return;
      }
      const p = d as LiveQuizBroadcastPayload;
      if (p.activeQuiz === null) {
        setRelayedActive(null);
        return;
      }
      const q = p.activeQuiz;
      setRelayedActive({
        quiz_id: q.quiz_id,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : [],
        time_limit: typeof q.time_limit === "number" ? q.time_limit : 30,
        startedAt: typeof q.startedAt === "number" ? q.startedAt : Date.now(),
        ...(typeof q.question_index === "number" ? { question_index: q.question_index } : {}),
        ...(typeof q.question_total === "number" ? { question_total: q.question_total } : {}),
      });
    };
    bc.addEventListener("message", handler);
    bc.postMessage({ type: "request_sync" });
    return () => {
      bc.removeEventListener("message", handler);
      bc.close();
    };
  }, [sessionId]);

  const joinNickname = getRememberedJoinNickname(sessionId);

  const socket = useQuizSocket({
    sessionId,
    directWsUrl,
    enabled: sessionId.length > 0,
    nickname: joinNickname ?? user?.name ?? "student",
    token: token ?? undefined,
    debugLabel: "student",
  });

  const wsActive = socket.liveSession.activeQuiz;
  const effectiveActive = wsActive ?? relayedActive;

  const currentQuestion = useMemo(() => {
    if (!effectiveActive) {
      return null;
    }
    return {
      quiz_id: effectiveActive.quiz_id,
      question: effectiveActive.question,
      options: effectiveActive.options,
      time_limit: effectiveActive.time_limit,
    };
  }, [effectiveActive]);

  useEffect(() => {
    setSelectedOption(null);
    setSubmitted(false);
  }, [effectiveActive?.quiz_id, effectiveActive?.startedAt]);

  useEffect(() => {
    setMyResultRow(null);
  }, [sessionId]);

  useEffect(() => {
    if (socket.liveSession.liveEnded) {
      setRelayedActive(null);
    }
  }, [socket.liveSession.liveEnded]);

  const deadlineMs = effectiveActive ? effectiveActive.startedAt + effectiveActive.time_limit * 1000 : null;
  const remainingSec = useQuizDeadlineCountdown(deadlineMs);

  const liveEnded = socket.liveSession.liveEnded;
  const questionProgressLabel = useMemo(() => {
    const q = effectiveActive;
    if (!q?.question_total || q.question_index === undefined) {
      return null;
    }
    return `${q.question_index + 1} / ${q.question_total}`;
  }, [effectiveActive]);

  const timeUpOnCurrent =
    Boolean(effectiveActive) && remainingSec !== null && remainingSec <= 0 && !liveEnded;

  const allRoundsDone = useMemo(() => {
    const q = effectiveActive;
    if (
      !submitted ||
      !currentQuestion ||
      !q ||
      typeof q.question_total !== "number" ||
      q.question_index === undefined
    ) {
      return false;
    }
    return q.question_index + 1 >= q.question_total;
  }, [submitted, currentQuestion, effectiveActive]);

  const loadMyResult = useCallback(async () => {
    if (!sessionId || !user?.id) {
      toast.error("로그인 정보가 없어 결과를 불러올 수 없습니다.");
      return;
    }
    setResultLoading(true);
    try {
      const res = await sessionService.getResult(sessionId);
      const mine = res.students.find((s) => s.student_id === user.id) ?? null;
      setMyResultRow(mine);
      if (!mine) {
        toast.info("이 세션 집계에 본인 행이 없습니다. 강사에게 문의해 주세요.");
      } else {
        toast.success("내 결과를 불러왔습니다.");
      }
    } catch {
      toast.error("결과를 불러오지 못했습니다.");
    } finally {
      setResultLoading(false);
    }
  }, [sessionId, user?.id]);

  const handleSubmit = () => {
    if (!currentQuestion) {
      return;
    }
    if (selectedOption === null) {
      toast.error("답을 고른 뒤 제출해주세요.");
      return;
    }
    if (remainingSec !== null && remainingSec <= 0) {
      toast.error("이 문항의 제한 시간이 지났습니다.");
      return;
    }
    socket.sendAnswer(currentQuestion.quiz_id, selectedOption);
    setSubmitted(true);
    toast.success("답안을 보냈어요.");
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 -z-10 mesh-page-bg opacity-90"
        aria-hidden
      />
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-card/70 px-3 py-2.5 backdrop-blur-md md:px-4">
        <StudentFlowRail />
        <Link
          href="/student/dashboard"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 text-xs font-semibold")}
        >
          내 결과
        </Link>
      </div>
      {sessionId ? (
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border/50 bg-gradient-to-r from-primary/[0.07] via-card/80 to-background px-4 py-3.5 backdrop-blur-md supports-[backdrop-filter]:bg-card/70 md:px-5">
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
              {effectiveActive ? formatQuizClock(remainingSec) : "—"}
            </span>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {questionProgressLabel ? (
              <p className="mb-0.5 font-mono text-[11px] font-semibold text-foreground">문항 {questionProgressLabel}</p>
            ) : null}
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

      <main className="flex flex-1 flex-col justify-center px-4 py-8 md:py-10">
        {!sessionId ? (
          <FlowSurface
            variant="ghost"
            kicker="안내"
            title="세션에 연결되지 않았어요"
            description="참여 코드로 입장한 뒤 이 화면으로 이동해야 합니다."
            className="mx-auto w-full max-w-md border-dashed"
          >
            <Button className="w-full" type="button" size="lg" onClick={() => window.location.assign("/student/join")}>
              참여 코드 입력
            </Button>
          </FlowSurface>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-6">
            {liveEnded ? (
              <FlowSurface
                kicker="종료"
                title="퀴즈가 종료되었습니다"
                description="강사가 세션을 마쳤어요. 아래에서 내 점수를 불러올 수 있습니다."
                variant="accent"
                className="border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] via-card/85 to-background"
              >
                <div className="space-y-4">
                  <Button type="button" size="lg" onClick={() => void loadMyResult()} disabled={resultLoading}>
                    {resultLoading ? "불러오는 중…" : "내 결과 보기"}
                  </Button>
                  {myResultRow ? (
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-4 text-sm ring-1 ring-black/[0.03]">
                      <p className="font-semibold">나</p>
                      <p className="mt-1 text-muted-foreground">
                        점수 <span className="font-mono font-medium text-foreground">{myResultRow.score}</span> · 등급{" "}
                        <span className="text-foreground">{myResultRow.grade}</span>
                      </p>
                    </div>
                  ) : null}
                  <Link
                    href="/student/dashboard"
                    className={cn(buttonVariants({ variant: "outline", size: "lg" }), "inline-flex w-full justify-center")}
                  >
                    대시보드로
                  </Link>
                </div>
              </FlowSurface>
            ) : null}

            {!liveEnded && allRoundsDone ? (
              <FlowSurface
                kicker="완료"
                title="이 세트 문항을 모두 제출했습니다"
                description="강사가 세션을 종료할 때까지 기다릴 수도 있고, 아래에서 바로 나가거나 집계가 올랐는지 확인할 수도 있어요."
                variant="accent"
              >
                <div className="space-y-4">
                  <Button type="button" size="lg" onClick={() => void loadMyResult()} disabled={resultLoading}>
                    {resultLoading ? "불러오는 중…" : "내 집계 결과 보기"}
                  </Button>
                  {myResultRow ? (
                    <div className="rounded-2xl border border-border/60 bg-background/80 p-4 text-sm ring-1 ring-black/[0.03]">
                      <p className="font-semibold">나</p>
                      <p className="mt-1 text-muted-foreground">
                        점수 <span className="font-mono font-medium text-foreground">{myResultRow.score}</span> · 등급{" "}
                        <span className="text-foreground">{myResultRow.grade}</span>
                      </p>
                    </div>
                  ) : null}
                  <Link
                    href="/student/dashboard"
                    className={cn(buttonVariants({ variant: "default", size: "lg" }), "inline-flex w-full justify-center")}
                  >
                    대시보드로 이동
                  </Link>
                </div>
              </FlowSurface>
            ) : null}

            {!liveEnded && !allRoundsDone && currentQuestion ? (
              <>
                {timeUpOnCurrent && !submitted ? (
                  <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-center text-xs text-amber-950 dark:text-amber-100">
                    제한 시간이 지났습니다. 서버가 허용하지 않으면 제출되지 않을 수 있어요.
                  </p>
                ) : null}
                <QuizQuestionView
                  key={`${currentQuestion.quiz_id}-${effectiveActive?.startedAt ?? 0}`}
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
                  submitDisabled={
                    !socket.isConnected || !currentQuestion || submitted || (remainingSec !== null && remainingSec <= 0)
                  }
                  footerNote={
                    submitted
                      ? "제출 완료. 강사 화면에서 집계됩니다."
                      : timeUpOnCurrent
                        ? "시간 종료"
                        : undefined
                  }
                />
                {submitted ? (
                  <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-center ring-1 ring-black/[0.03] dark:ring-white/[0.04]">
                    <p className="text-xs text-muted-foreground">
                      다음 문항은 강사가 시작할 때까지 기다려 주세요. 세션이 끝났다면 상단의 결과 링크나 아래를 이용해
                      주세요.
                    </p>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
                      <Link
                        href="/student/dashboard"
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "justify-center")}
                      >
                        대시보드
                      </Link>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => void loadMyResult()}
                        disabled={resultLoading}
                      >
                        {resultLoading ? "불러오는 중…" : "내 결과 불러오기"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </>
            ) : null}

            {!liveEnded && !allRoundsDone && !currentQuestion ? (
              <div className="rounded-[1.35rem] border border-dashed border-border/70 bg-muted/15 px-6 py-16 text-center ring-1 ring-black/[0.03] dark:ring-white/[0.05] md:rounded-3xl md:py-20">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">대기</p>
                <p className="mt-3 text-lg font-semibold text-foreground">문항이 아직 열리지 않았어요</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                  {socket.isConnected
                    ? "지금 진행 중인 문항이 열리면 여기서 풀 수 있어요. 늦게 들어온 경우 이전 문항은 건너뜁니다."
                    : "실시간 연결을 맺는 중입니다."}
                </p>
              </div>
            ) : null}
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
