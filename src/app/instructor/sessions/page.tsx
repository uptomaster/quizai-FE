"use client";

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ConnectionStatus } from "@/components/common/connection-status";
import { FlowPageHeader } from "@/components/common/flow-page-header";
import { LiveQuizStatusPanel } from "@/components/common/live-quiz-status-panel";
import { TechDetails } from "@/components/common/tech-details";
import { InstructorFlowRail } from "@/components/instructor/instructor-flow-rail";
import { QuizQuestionView, formatQuizClock } from "@/components/quiz/quiz-question-view";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuizDeadlineCountdown } from "@/hooks/use-quiz-deadline-countdown";
import { useStartSessionMutation } from "@/hooks/api/use-start-session-mutation";
import { useQuizSocket } from "@/hooks/use-quiz-socket";
import { AUTH_KEYS, getStoredUser } from "@/lib/auth-storage";
import { getInstructorQuizHistoryByQuizSetId } from "@/lib/instructor-quiz-history";
import {
  clearPersistedInstructorLiveSession,
  readPersistedInstructorLiveSession,
  writePersistedInstructorLiveSession,
} from "@/lib/instructor-live-session";
import {
  liveQuizBroadcastChannelId,
  type LiveQuizBroadcastMessage,
  type LiveQuizBroadcastPayload,
} from "@/lib/live-quiz-broadcast";
import { readLastQuizSet, type LastQuizSetInfo } from "@/lib/last-quiz-set";
import type { QuizWsEvent } from "@/lib/quiz-ws-live-state";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import { liveRoomPhaseLabel } from "@/lib/session-user-copy";
import { cn } from "@/lib/utils";
import type { QuizQuestion, Session, StartSessionRequest } from "@/types/api";

function describeLiveEvent(event: QuizWsEvent | null): string {
  if (!event) {
    return "대기 중";
  }
  switch (event.type) {
    case "session_joined":
      return `${coerceRenderableText(event.payload.nickname) || "참여자"}님이 퀴즈방에 들어왔습니다. (함께하는 인원 약 ${event.payload.participant_count}명)`;
    case "quiz_started":
      return "새 문항이 시작되었습니다. 수강생 화면에 문제가 열렸는지 확인하세요.";
    case "answer_update":
      return `응답 현황: ${event.payload.answered}/${event.payload.total}명 제출 (${Math.round(event.payload.rate)}%).`;
    case "participant_answer":
      return `${coerceRenderableText(event.payload.nickname) || "참여자"}님이 현재 문항 답안을 ${event.payload.submitted ? "제출했습니다" : "취소/대기 상태입니다"}.`;
    case "answer_revealed":
      return "정답이 공개되었습니다.";
    case "session_ended":
      return "이번 라이브 퀴즈가 종료되었습니다.";
    case "error":
      return `알림: ${coerceRenderableText(event.payload.message)}`;
    default:
      return "새로운 활동이 감지되었습니다.";
  }
}

function InstructorSessionsPageInner() {
  const searchParams = useSearchParams();
  const [quizSetId, setQuizSetId] = useState("");
  const [lastQuizHint, setLastQuizHint] = useState<LastQuizSetInfo | null>(null);
  /** 퀴즈 빌더에서 불러온 요약 대신, 세트 번호를 직접 쓰고 싶을 때 */
  const [useCustomQuizSetId, setUseCustomQuizSetId] = useState(false);
  const [timeLimit, setTimeLimit] = useState("30");
  const [session, setSession] = useState<Session | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [answer, setAnswer] = useState("0");
  /** 로컬에 저장된 세트 순서로 강사 화면에 즉시 표시 (-1 = 아직 「다음 문항」 미클릭) */
  const [localRoundIndex, setLocalRoundIndex] = useState(-1);
  const [localRoundStartedAt, setLocalRoundStartedAt] = useState<number | null>(null);
  /** useMemo만 쓰면 하이드레이션 직후 localStorage 미반영으로 빈 배열이 고정될 수 있어 effect로 동기화 */
  const [localQuestions, setLocalQuestions] = useState<QuizQuestion[]>([]);
  const startSessionMutation = useStartSessionMutation();

  useEffect(() => {
    const stored = readLastQuizSet();
    setLastQuizHint(stored);
    const fromUrl = searchParams.get("quiz_set_id")?.trim();
    const persisted = readPersistedInstructorLiveSession();

    if (persisted?.session) {
      setSession(persisted.session);
      setQuizSetId(persisted.quizSetId);
      setTimeLimit(persisted.timeLimit);
      setUseCustomQuizSetId(persisted.useCustomQuizSetId);
      if (fromUrl) {
        setQuizSetId(fromUrl);
        setUseCustomQuizSetId(false);
      }
      return;
    }

    if (fromUrl) {
      setQuizSetId(fromUrl);
      setUseCustomQuizSetId(false);
      return;
    }
    if (stored?.quizSetId) {
      setQuizSetId(stored.quizSetId);
      setUseCustomQuizSetId(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!session?.session_id) {
      return;
    }
    writePersistedInstructorLiveSession({
      session,
      quizSetId,
      timeLimit,
      useCustomQuizSetId,
    });
  }, [session, quizSetId, timeLimit, useCustomQuizSetId]);

  const showQuizSummary =
    Boolean(lastQuizHint) &&
    Boolean(quizSetId) &&
    lastQuizHint?.quizSetId === quizSetId &&
    !useCustomQuizSetId;

  const sessionId = session?.session_id ?? "";
  const user = getStoredUser();
  const accessToken =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_KEYS.accessToken) : null;

  const socket = useQuizSocket({
    sessionId,
    directWsUrl: session?.ws_url,
    enabled: Boolean(session?.session_id),
    nickname: user?.name ?? "instructor",
    token: accessToken ?? undefined,
    debugLabel: "instructor",
  });

  const active = socket.liveSession.activeQuiz;

  const timeLimitSec = useMemo(
    () => Math.min(180, Math.max(10, Number(timeLimit) || 30)),
    [timeLimit],
  );

  useEffect(() => {
    const id = quizSetId.trim();
    if (!id) {
      setLocalQuestions([]);
      return;
    }
    const entry = getInstructorQuizHistoryByQuizSetId(id);
    setLocalQuestions(entry?.questions ?? []);
  }, [quizSetId]);

  const displayQuiz = useMemo(() => {
    if (active) {
      return active;
    }
    if (localRoundIndex < 0 || !localQuestions.length || localRoundStartedAt === null) {
      return null;
    }
    const q = localQuestions[localRoundIndex];
    if (!q) {
      return null;
    }
    return {
      quiz_id: q.id,
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [],
      time_limit: timeLimitSec,
      startedAt: localRoundStartedAt,
    };
  }, [active, localRoundIndex, localQuestions, localRoundStartedAt, timeLimitSec]);

  const displayQuizRef = useRef(displayQuiz);
  displayQuizRef.current = displayQuiz;
  const liveBroadcastRef = useRef<BroadcastChannel | null>(null);

  /** 같은 PC 수강생 탭과 문항 동기화(늦게 연 탭은 `request_sync` 로 재요청). */
  useEffect(() => {
    if (!sessionId || typeof BroadcastChannel === "undefined") {
      return;
    }
    const bc = new BroadcastChannel(liveQuizBroadcastChannelId(sessionId));
    liveBroadcastRef.current = bc;
    const send = () => {
      const dq = displayQuizRef.current;
      const payload: LiveQuizBroadcastPayload = dq
        ? {
            activeQuiz: {
              quiz_id: dq.quiz_id,
              question: dq.question,
              options: dq.options,
              time_limit: dq.time_limit,
              startedAt: dq.startedAt,
            },
          }
        : { activeQuiz: null };
      bc.postMessage(payload);
    };
    send();
    const onMessage = (ev: MessageEvent<LiveQuizBroadcastMessage>) => {
      const d = ev.data;
      if (d && typeof d === "object" && "type" in d && d.type === "request_sync") {
        send();
      }
    };
    bc.addEventListener("message", onMessage);
    return () => {
      liveBroadcastRef.current = null;
      bc.removeEventListener("message", onMessage);
      bc.close();
    };
  }, [sessionId]);

  useEffect(() => {
    const ch = liveBroadcastRef.current;
    if (!ch) {
      return;
    }
    const dq = displayQuizRef.current;
    const payload: LiveQuizBroadcastPayload = dq
      ? {
          activeQuiz: {
            quiz_id: dq.quiz_id,
            question: dq.question,
            options: dq.options,
            time_limit: dq.time_limit,
            startedAt: dq.startedAt,
          },
        }
      : { activeQuiz: null };
    ch.postMessage(payload);
  }, [displayQuiz]);

  const mergedLiveSession = useMemo(() => {
    const base = socket.liveSession;
    if (base.activeQuiz) {
      return base;
    }
    if (displayQuiz) {
      return { ...base, activeQuiz: displayQuiz };
    }
    return base;
  }, [socket.liveSession, displayQuiz]);

  const deadlineMs = displayQuiz ? displayQuiz.startedAt + displayQuiz.time_limit * 1000 : null;
  const remainingSec = useQuizDeadlineCountdown(deadlineMs);

  useEffect(() => {
    setLocalRoundIndex(-1);
    setLocalRoundStartedAt(null);
  }, [session?.session_id]);

  const activitySummary = useMemo(() => {
    if (sessionId && socket.isConnected && !socket.lastEvent) {
      return "학생 입장·문항 시작 시 여기에 뜹니다.";
    }
    return describeLiveEvent(socket.lastEvent);
  }, [sessionId, socket.isConnected, socket.lastEvent]);
  const rawEventText = useMemo(
    () => (socket.lastEvent ? JSON.stringify(socket.lastEvent, null, 2) : ""),
    [socket.lastEvent],
  );

  const handleStartSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const payload: StartSessionRequest = {
        quiz_set_id: quizSetId,
        time_limit: Number(timeLimit),
      };
      const startedSession = await startSessionMutation.mutateAsync(payload);
      setSession(startedSession);
      writePersistedInstructorLiveSession({
        session: startedSession,
        quizSetId,
        timeLimit,
        useCustomQuizSetId,
      });
      toast.success("라이브 퀴즈방이 열렸습니다. 참여코드를 학생에게 알려주세요.");
    } catch {
      // api-client 인터셉터에서 토스트를 처리합니다.
    }
  };

  const handleEndLiveSession = () => {
    clearPersistedInstructorLiveSession();
    setSession(null);
    setLocalRoundIndex(-1);
    setLocalRoundStartedAt(null);
    toast.success("저장된 퀴즈방을 지웠어요. 새 참여코드로 다시 열 수 있어요.");
  };

  const handleCopyJoinCode = async () => {
    if (!session?.session_code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(session.session_code);
      toast.success("참여코드를 복사했습니다.");
    } catch {
      toast.error("클립보드 복사에 실패했습니다.");
    }
  };

  const handleCopyQuizSetHint = async () => {
    if (!quizSetId.trim()) {
      return;
    }
    try {
      await navigator.clipboard.writeText(quizSetId.trim());
      toast.success("퀴즈 세트 번호를 복사했습니다.");
    } catch {
      toast.error("복사에 실패했습니다.");
    }
  };

  const handleSendAnnouncement = () => {
    if (!announcement.trim()) {
      toast.error("공지 내용을 입력해주세요.");
      return;
    }
    toast.success("수강생에게 공지를 보냈습니다.");
    setAnnouncement("");
  };

  const handleNextQuestion = () => {
    if (localQuestions.length > 0) {
      const next = localRoundIndex + 1;
      if (next >= localQuestions.length) {
        toast.info("저장된 세트 문항은 여기까지예요. 서버에서 다음 문항이 열리면 화면이 갱신됩니다.");
      } else {
        setLocalRoundIndex(next);
        setLocalRoundStartedAt(Date.now());
      }
    }
    socket.startNextQuestion();
  };

  return (
    <section className="space-y-6">
      <FlowPageHeader rail={<InstructorFlowRail />} title="라이브 방" description="방을 열면 참여 코드가 나와요." />

      <Card>
        <CardHeader>
          <CardTitle>방 열기</CardTitle>
          <CardDescription>
            퀴즈 세트와 제한 시간을 정해 주세요. 열린 방은 이 브라우저에 저장되어 새로고침해도 같은 참여코드가 유지됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleStartSession} className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="quiz-set-field">
                어떤 퀴즈로 진행할까요?
              </label>
              {showQuizSummary && lastQuizHint ? (
                <div
                  id="quiz-set-field"
                  className="space-y-2 rounded-xl border border-border bg-muted/25 p-4"
                >
                  <div>
                    <p className="font-semibold leading-snug">
                      {lastQuizHint.lectureTitle ?? "퀴즈 빌더에서 만든 세트"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      문항 {lastQuizHint.totalQuestions}개가 연결돼 있어요.
                    </p>
                    <p className="mt-2 break-all font-mono text-xs leading-relaxed text-foreground">
                      퀴즈 세트 번호 {lastQuizHint.quizSetId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleCopyQuizSetHint}>
                      세트 번호 복사
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => {
                        setUseCustomQuizSetId(true);
                        setQuizSetId("");
                      }}
                    >
                      다른 퀴즈 세트 쓰기
                    </Button>
                  </div>
                </div>
              ) : (
                <Input
                  id="quiz-set-field"
                  value={quizSetId}
                  onChange={(e) => setQuizSetId(e.target.value)}
                  placeholder="퀴즈 빌더에서 만든 뒤 오면 자동으로 채워져요"
                  className="font-mono text-sm"
                  required
                />
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">문항당 제한(초)</label>
              <Input
                type="number"
                min={10}
                max={180}
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col items-stretch gap-2 md:items-end">
              <Button
                type="submit"
                disabled={startSessionMutation.isPending || Boolean(session)}
                className="w-full md:w-auto"
              >
                {startSessionMutation.isPending ? "만드는 중…" : "퀴즈방 열기"}
              </Button>
              {session ? (
                <p className="text-xs text-muted-foreground">
                  이미 방이 열려 있어요. 새 참여코드가 필요하면 아래에서 방을 종료한 뒤 다시 열어 주세요.
                </p>
              ) : null}
            </div>
          </form>

          {session ? (
            <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">참여코드</p>
                  <p className="mt-1 break-all font-mono text-2xl font-bold tracking-[0.12em] text-primary sm:text-3xl md:text-4xl">
                    {session.session_code}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{liveRoomPhaseLabel(session.status)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={handleCopyJoinCode}>
                    코드 복사
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleEndLiveSession}>
                    방 종료 (저장 삭제)
                  </Button>
                </div>
              </div>
              <TechDetails title="세션 상세">
                <p className="break-all text-muted-foreground">
                  <span className="font-medium text-foreground">세션 번호</span> {session.session_id}
                </p>
                <p className="mt-2 break-all text-muted-foreground">
                  <span className="font-medium text-foreground">실시간 연결</span> {session.ws_url}
                </p>
              </TechDetails>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {session ? (
        <Card>
          <CardHeader className="space-y-2 pb-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>같이 보는 퀴즈</CardTitle>
                <CardDescription>
                  수강생 화면과 같은 문항·보기·타이머예요. 이 브라우저에 저장된 세트가 있으면 「다음 문항」 즉시
                  반영되고, 서버 이벤트가 오면 그쪽과 맞춰집니다.
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  남은 시간
                </p>
                <p
                  className={cn(
                    "font-mono text-2xl font-bold tabular-nums",
                    remainingSec !== null && remainingSec <= 5 ? "text-destructive" : "text-foreground",
                  )}
                >
                  {displayQuiz ? formatQuizClock(remainingSec) : "—"}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              {displayQuiz ? (
                <QuizQuestionView
                  key={`${displayQuiz.quiz_id}-${displayQuiz.startedAt}`}
                  variant="instructor"
                  question={displayQuiz.question}
                  options={displayQuiz.options}
                  timeLimitSec={displayQuiz.time_limit}
                  remainingSec={remainingSec}
                />
              ) : (
                <div className="w-full max-w-lg rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                  <p className="text-base font-medium text-foreground">문항 대기</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {localQuestions.length === 0
                      ? "이 브라우저에 해당 퀴즈 세트 기록이 없으면, 서버에서 문항이 열릴 때까지 기다리거나 퀴즈 빌더에서 같은 세트로 저장해 주세요."
                      : "「다음 문항」을 누르면 여기에 첫 문항이 열려요."}
                  </p>
                </div>
              )}
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={handleNextQuestion}
              disabled={!sessionId || !socket.isConnected}
            >
              다음 문항
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>실시간</CardTitle>
            <CardDescription>입장·제출이 여기 반영돼요.</CardDescription>
          </div>
          <ConnectionStatus isConnected={socket.isConnected} />
        </CardHeader>
        <CardContent className="space-y-4">
          {!sessionId ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground">
              먼저 방을 열어 주세요.
            </p>
          ) : (
            <>
              {!socket.isConnected ? (
                <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
                  연결 중…
                  {socket.connectionAttempt > 0 ? ` (${socket.connectionAttempt})` : null}
                </div>
              ) : null}
              <LiveQuizStatusPanel
                variant="instructor"
                live={mergedLiveSession}
                remainingSec={remainingSec}
                isConnected={socket.isConnected}
                showConnectionChip={false}
              />
              <p className="text-xs text-muted-foreground">{activitySummary}</p>
              <TechDetails title="이벤트 원문">
                {rawEventText ? (
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap text-[11px] text-muted-foreground">
                    {rawEventText}
                  </pre>
                ) : (
                  <p className="text-muted-foreground">이벤트 없음</p>
                )}
              </TechDetails>
            </>
          )}

          <TechDetails title="테스트 답안 전송">
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                value={questionId}
                onChange={(e) => setQuestionId(e.target.value)}
                placeholder="문항 ID (예: q_001)"
                disabled={!sessionId}
              />
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="선택한 보기 번호 (0부터)"
                disabled={!sessionId}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => socket.sendAnswer(questionId, Number(answer))}
                disabled={
                  !sessionId ||
                  !socket.isConnected ||
                  !questionId.trim() ||
                  Number.isNaN(Number(answer))
                }
              >
                테스트 제출
              </Button>
            </div>
          </TechDetails>
        </CardContent>
      </Card>

      <TechDetails title="공지 보내기 (선택)">
        <div className="grid gap-2 md:grid-cols-[1fr_auto]">
          <Input
            value={announcement}
            onChange={(e) => setAnnouncement(e.target.value)}
            placeholder="예: 잠시 후 2번째 퀴즈를 시작합니다."
          />
          <Button type="button" onClick={handleSendAnnouncement}>
            보내기
          </Button>
        </div>
      </TechDetails>
    </section>
  );
}

export default function InstructorSessionsPage() {
  return (
    <Suspense
      fallback={
        <section className="space-y-6 p-4 text-sm text-muted-foreground">라이브 퀴즈 화면을 불러오는 중…</section>
      }
    >
      <InstructorSessionsPageInner />
    </Suspense>
  );
}
