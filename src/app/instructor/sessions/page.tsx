"use client";

import {
  FormEvent,
  Fragment,
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  withInstructorSessionWsFallback,
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
import {
  isSessionResultVacantShell,
  sessionResultMissingDetailRows,
} from "@/lib/session-result-vacancy";
import { liveRoomPhaseLabel } from "@/lib/session-user-copy";
import { cn, formatAverageScoreOneDecimal, formatQuizScorePoints, toFiniteNumber } from "@/lib/utils";
import { sessionService } from "@/services/session-service";
import type {
  QuizQuestion,
  Session,
  SessionResult,
  SessionStudentResult,
  StartSessionRequest,
} from "@/types/api";

function sessionStudentGradeLabel(grade: SessionStudentResult["grade"]): string {
  switch (grade) {
    case "excellent":
      return "우수";
    case "needs_practice":
      return "보통";
    case "needs_review":
      return "보완";
    default:
      return grade;
  }
}

function optionLetter(index: number): string {
  if (index >= 0 && index < 26) {
    return String.fromCharCode(65 + index);
  }
  return String(index + 1);
}

function formatAnswerChoiceLabel(index: number, options: string[] | undefined): string {
  const letter = optionLetter(index);
  const raw = options?.[index]?.trim();
  if (!raw) {
    return `${letter}번`;
  }
  const short = raw.length > 48 ? `${raw.slice(0, 48)}…` : raw;
  return `${letter} · ${short}`;
}

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
  /** false면 대시보드 등에서 과거 session_id만으로 연 경우 — 로컬에 남은 진행 중 방을 덮어쓰지 않음 */
  const [shouldPersistLiveSession, setShouldPersistLiveSession] = useState(true);

  useLayoutEffect(() => {
    const stored = readLastQuizSet();
    setLastQuizHint(stored);
    const fromUrlQuizSet = searchParams.get("quiz_set_id")?.trim() ?? "";
    const sessionFromUrl = searchParams.get("session")?.trim() ?? "";
    const persisted = readPersistedInstructorLiveSession();
    const persistedId = persisted?.session?.session_id?.trim() ?? "";

    const openAsHistoryOnly =
      Boolean(sessionFromUrl) && (persistedId.length === 0 || sessionFromUrl !== persistedId);

    if (openAsHistoryOnly) {
      setShouldPersistLiveSession(false);
      setSessionResult(null);
      setSessionResultError(null);
      setSession(
        withInstructorSessionWsFallback({
          session_id: sessionFromUrl,
          session_code: "이전 세션",
          status: "ended",
          ws_url: "",
        }),
      );
      if (fromUrlQuizSet) {
        setQuizSetId(fromUrlQuizSet);
        setUseCustomQuizSetId(false);
      } else if (stored?.quizSetId) {
        setQuizSetId(stored.quizSetId);
        setUseCustomQuizSetId(false);
      } else {
        setQuizSetId("");
        setUseCustomQuizSetId(true);
      }
      setTimeLimit("30");
      return;
    }

    setShouldPersistLiveSession(true);

    if (persisted?.session) {
      setSession(withInstructorSessionWsFallback(persisted.session));
      setQuizSetId(persisted.quizSetId);
      setTimeLimit(persisted.timeLimit);
      setUseCustomQuizSetId(persisted.useCustomQuizSetId);
      if (fromUrlQuizSet) {
        setQuizSetId(fromUrlQuizSet);
        setUseCustomQuizSetId(false);
      }
      return;
    }

    if (fromUrlQuizSet) {
      setQuizSetId(fromUrlQuizSet);
      setUseCustomQuizSetId(false);
      return;
    }
    if (stored?.quizSetId) {
      setQuizSetId(stored.quizSetId);
      setUseCustomQuizSetId(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!shouldPersistLiveSession || !session?.session_id) {
      return;
    }
    writePersistedInstructorLiveSession({
      session,
      quizSetId,
      timeLimit,
      useCustomQuizSetId,
    });
  }, [shouldPersistLiveSession, session, quizSetId, timeLimit, useCustomQuizSetId]);

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
    enabled: Boolean(session?.session_id) && shouldPersistLiveSession,
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
      question_index: localRoundIndex,
      question_total: localQuestions.length,
    };
  }, [active, localRoundIndex, localQuestions, localRoundStartedAt, timeLimitSec]);

  const displayQuizRef = useRef(displayQuiz);
  displayQuizRef.current = displayQuiz;
  const liveBroadcastRef = useRef<BroadcastChannel | null>(null);

  /** 같은 PC 수강생 탭과 문항 동기화(늦게 연 탭은 `request_sync` 로 재요청). */
  useEffect(() => {
    if (!sessionId || typeof BroadcastChannel === "undefined" || !shouldPersistLiveSession) {
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
              ...(typeof dq.question_index === "number" ? { question_index: dq.question_index } : {}),
              ...(typeof dq.question_total === "number" ? { question_total: dq.question_total } : {}),
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
  }, [sessionId, shouldPersistLiveSession]);

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
            ...(typeof dq.question_index === "number" ? { question_index: dq.question_index } : {}),
            ...(typeof dq.question_total === "number" ? { question_total: dq.question_total } : {}),
          },
        }
      : { activeQuiz: null };
    ch.postMessage(payload);
  }, [displayQuiz]);

  const mergedLiveSession = useMemo(() => {
    const base = socket.liveSession;
    if (base.liveEnded) {
      return base;
    }
    if (base.activeQuiz) {
      return base;
    }
    if (displayQuiz) {
      return { ...base, activeQuiz: displayQuiz };
    }
    return base;
  }, [socket.liveSession, displayQuiz]);

  const deadlineMs =
    socket.liveSession.liveEnded || !displayQuiz
      ? null
      : displayQuiz.startedAt + displayQuiz.time_limit * 1000;
  const remainingSec = useQuizDeadlineCountdown(deadlineMs);

  useEffect(() => {
    setLocalRoundIndex(-1);
    setLocalRoundStartedAt(null);
  }, [session?.session_id]);

  useEffect(() => {
    if (socket.lastEvent?.type === "session_ended") {
      setLocalRoundIndex(-1);
      setLocalRoundStartedAt(null);
    }
  }, [socket.lastEvent]);

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

  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [sessionResultLoading, setSessionResultLoading] = useState(false);
  const [sessionResultError, setSessionResultError] = useState<string | null>(null);
  const [expandedSessionStudentId, setExpandedSessionStudentId] = useState<string | null>(null);

  const quizQuestionMetaById = useMemo(() => {
    const map = new Map<string, { question: string; options: string[] }>();
    const id = quizSetId.trim();
    if (!id) {
      return map;
    }
    const entry = getInstructorQuizHistoryByQuizSetId(id);
    for (const q of entry?.questions ?? []) {
      map.set(q.id, { question: q.question, options: Array.isArray(q.options) ? q.options : [] });
    }
    return map;
  }, [quizSetId]);

  const loadSessionResult = useCallback(async (options?: { silent?: boolean }) => {
    if (!session?.session_id) {
      return;
    }
    setSessionResultLoading(true);
    setSessionResultError(null);
    try {
      const data = await sessionService.getResult(session.session_id);
      setSessionResult(data);
      if (isSessionResultVacantShell(data)) {
        toast.warning(
          "집계 결과가 비어 있습니다. 세션이 종료·정산됐는지 백엔드를 확인하거나, 잠시 뒤 다시 불러오기를 눌러 주세요.",
        );
      } else if (sessionResultMissingDetailRows(data)) {
        toast.info("요약 인원만 있고 학생별 행이 없습니다. API 응답의 students 배열을 확인해 주세요.");
      } else if (!options?.silent) {
        toast.success("세션 결과를 불러왔습니다.");
      }
    } catch {
      setSessionResultError("결과를 불러오지 못했습니다. 세션이 종료됐는지 확인해 주세요.");
      toast.error("세션 결과 요청에 실패했습니다.");
    } finally {
      setSessionResultLoading(false);
    }
  }, [session?.session_id]);

  useEffect(() => {
    if (shouldPersistLiveSession || !session?.session_id) {
      return;
    }
    void loadSessionResult({ silent: true });
  }, [shouldPersistLiveSession, session?.session_id, loadSessionResult]);

  const handleStartSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const payload: StartSessionRequest = {
        quiz_set_id: quizSetId,
        time_limit: Number(timeLimit),
      };
      const startedSession = await startSessionMutation.mutateAsync(payload);
      setSessionResult(null);
      setSessionResultError(null);
      setShouldPersistLiveSession(true);
      setSession(withInstructorSessionWsFallback(startedSession));
      writePersistedInstructorLiveSession({
        session: withInstructorSessionWsFallback(startedSession),
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
    const wasPersistedLive = shouldPersistLiveSession;
    setShouldPersistLiveSession(true);
    if (wasPersistedLive) {
      clearPersistedInstructorLiveSession();
    }
    setSession(null);
    setSessionResult(null);
    setSessionResultError(null);
    setLocalRoundIndex(-1);
    setLocalRoundStartedAt(null);
    toast.success(
      wasPersistedLive
        ? "저장된 퀴즈방을 지웠어요. 새 참여코드로 다시 열 수 있어요."
        : "과거 세션 조회를 닫았어요. 로컬에 남아 있던 진행 중 방은 그대로입니다.",
    );
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
        toast.info("세트의 마지막 문항입니다.");
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

      {!shouldPersistLiveSession ? (
        <p className="rounded-xl border border-border/80 bg-muted/35 px-4 py-2.5 text-sm text-muted-foreground">
          대시보드에서 고른 과거 세션만 보고 있어요. 브라우저에 남아 있는 진행 중 퀴즈방 저장은 덮어쓰지 않습니다.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>방 열기</CardTitle>
          <CardDescription>퀴즈 세트와 제한 시간을 정합니다.</CardDescription>
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
                <p className="text-xs text-muted-foreground">새 방은 아래에서 종료한 뒤 열 수 있습니다.</p>
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

      {session && socket.liveSession.liveEnded ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/[0.08] px-4 py-3 text-sm text-foreground">
          <p className="font-semibold text-amber-950 dark:text-amber-100">라이브 퀴즈가 종료되었습니다.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            수강생 화면도 종료 안내를 받았을 거예요. 아래에서 결과를 확인하거나 방을 정리할 수 있습니다.
          </p>
        </div>
      ) : null}

      {session ? (
        <Card>
          <CardHeader className="space-y-2 pb-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>현재 문항</CardTitle>
                {displayQuiz &&
                displayQuiz.question_total != null &&
                displayQuiz.question_index != null ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    서버 기준 진행 {(displayQuiz.question_index ?? 0) + 1} / {displayQuiz.question_total}
                  </p>
                ) : null}
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
                    {localQuestions.length === 0 ? "문항 대기" : "「다음 문항」을 눌러 시작하세요."}
                  </p>
                </div>
              )}
            </div>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={handleNextQuestion}
              disabled={!sessionId || !socket.isConnected || socket.liveSession.liveEnded}
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

      {session ? (
        <Card>
          <CardHeader>
            <CardTitle>세션 결과</CardTitle>
            <CardDescription>종료 후 집계 API로 요약을 불러옵니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => void loadSessionResult()}
                disabled={sessionResultLoading}
              >
                {sessionResultLoading ? "불러오는 중…" : "결과 불러오기"}
              </Button>
            </div>
            {sessionResultError ? (
              <p className="text-sm text-destructive">{sessionResultError}</p>
            ) : null}
            {sessionResult ? (
              <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4 text-sm">
                {isSessionResultVacantShell(sessionResult) ? (
                  <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-950 dark:text-amber-50">
                    <p className="font-semibold">공식 집계가 아직 비어 있습니다.</p>
                    <p className="mt-1 text-muted-foreground dark:text-amber-100/90">
                      학생이 제출했어도 세션 종료·채점 배치가 끝나기 전이면 0으로 올 수 있습니다. 백엔드에서{" "}
                      <code className="rounded bg-background/60 px-1 font-mono text-[10px]">GET /sessions/…/result</code>{" "}
                      가 제출 데이터를 묶는지 확인해 주세요.
                    </p>
                  </div>
                ) : null}
                {(() => {
                  const vacant = isSessionResultVacantShell(sessionResult);
                  return (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">참여 인원</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">
                      {vacant
                        ? "—"
                        : toFiniteNumber(sessionResult.total_students) !== null
                          ? Math.round(toFiniteNumber(sessionResult.total_students)!)
                          : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">평균 점수</p>
                    <p className="mt-0.5 text-lg font-semibold tabular-nums">
                      {vacant
                        ? "—"
                        : `${formatAverageScoreOneDecimal(sessionResult.avg_score)}${
                            toFiniteNumber(sessionResult.avg_score) !== null ? "점" : ""
                          }`}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">등급 분포</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {vacant
                        ? "집계 없음"
                        : (() => {
                            const g = sessionResult.grade_distribution;
                            if (!g) {
                              return "집계 없음";
                            }
                            const ex = toFiniteNumber(g.excellent);
                            const mid = toFiniteNumber(g.needs_practice);
                            const low = toFiniteNumber(g.needs_review);
                            if (ex === null && mid === null && low === null) {
                              return "집계 없음";
                            }
                            return `우수 ${ex ?? "—"} · 보통 ${mid ?? "—"} · 보완 ${low ?? "—"}`;
                          })()}
                    </p>
                  </div>
                </div>
                  );
                })()}
                {sessionResult.students.length > 0 ? (
                  <div className="max-h-72 overflow-auto rounded-lg border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-muted/90">
                        <tr>
                          <th className="px-3 py-2">닉네임</th>
                          <th className="px-3 py-2">점수</th>
                          <th className="px-3 py-2">등급</th>
                          <th className="px-3 py-2 w-24">문항</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessionResult.students.map((s) => {
                          const open = expandedSessionStudentId === s.student_id;
                          const answers = Array.isArray(s.answers) ? s.answers : [];
                          return (
                            <Fragment key={s.student_id}>
                              <tr className="border-t border-border/60">
                                <td className="px-3 py-2 font-medium">{s.nickname}</td>
                                <td className="px-3 py-2 tabular-nums">{formatQuizScorePoints(s.score)}</td>
                                <td className="px-3 py-2 text-muted-foreground">{sessionStudentGradeLabel(s.grade)}</td>
                                <td className="px-3 py-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-[11px]"
                                    onClick={() =>
                                      setExpandedSessionStudentId((prev) => (prev === s.student_id ? null : s.student_id))
                                    }
                                  >
                                    {open ? "접기" : "보기"}
                                  </Button>
                                </td>
                              </tr>
                              {open ? (
                                <tr className="border-t border-border/40 bg-muted/25">
                                  <td colSpan={4} className="px-3 py-3">
                                    {answers.length === 0 ? (
                                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                                        문항별 정오답 배열(
                                        <code className="rounded bg-background/70 px-1 font-mono text-[10px]">answers</code>
                                        )가 응답에 없습니다. 백엔드{" "}
                                        <code className="rounded bg-background/70 px-1 font-mono text-[10px]">
                                          GET /sessions/…/result
                                        </code>{" "}
                                        에 학생별 문항 결과를 포함해 주세요.
                                      </p>
                                    ) : (
                                      <ul className="space-y-2">
                                        {answers.map((a) => {
                                          const meta = quizQuestionMetaById.get(a.quiz_id);
                                          const title = meta?.question?.trim()
                                            ? meta.question.length > 72
                                              ? `${meta.question.slice(0, 72)}…`
                                              : meta.question
                                            : `문항 ${a.quiz_id.slice(0, 8)}…`;
                                          return (
                                            <li
                                              key={`${s.student_id}-${a.quiz_id}`}
                                              className="rounded-lg border border-border/70 bg-background/80 px-2.5 py-2"
                                            >
                                              <p className="text-[11px] font-medium text-foreground">{title}</p>
                                              <p className="mt-1 text-[11px] text-muted-foreground">
                                                선택{" "}
                                                <span className="font-mono text-foreground">
                                                  {formatAnswerChoiceLabel(a.selected_option, meta?.options)}
                                                </span>
                                                <span className="mx-1.5 text-border">·</span>
                                                <span
                                                  className={
                                                    a.is_correct ? "font-medium text-emerald-700 dark:text-emerald-400" : "font-medium text-destructive"
                                                  }
                                                >
                                                  {a.is_correct ? "정답" : "오답"}
                                                </span>
                                              </p>
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </td>
                                </tr>
                              ) : null}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {sessionResultMissingDetailRows(sessionResult)
                        ? "참여 인원은 있는데 students 배열이 비어 있습니다. 백엔드 GET /sessions/{id}/result 응답을 확인해 주세요."
                        : isSessionResultVacantShell(sessionResult)
                          ? "학생별 점수 행이 없습니다. (위 안내 참고)"
                          : "아직 학생별 결과 행이 없습니다."}
                    </p>
                    {isSessionResultVacantShell(sessionResult) && mergedLiveSession.participants.length > 0 ? (
                      <div className="rounded-lg border border-border bg-card/80 p-3">
                        <p className="mb-2 text-xs font-medium text-foreground">
                          실시간 방에서 잡힌 참가자 (공식 점수와 다를 수 있음)
                        </p>
                        <ul className="max-h-40 space-y-1 overflow-auto text-xs text-muted-foreground">
                          {mergedLiveSession.participants.map((p, i) => (
                            <li key={`${p.userId ?? p.nickname}-${i}`}>
                              · {coerceRenderableText(p.nickname) || "—"}
                              {p.role ? ` (${p.role})` : ""}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
