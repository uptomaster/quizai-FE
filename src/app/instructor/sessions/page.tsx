"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { ConnectionStatus } from "@/components/common/connection-status";
import { FlowPageHeader } from "@/components/common/flow-page-header";
import { LiveQuizStatusPanel } from "@/components/common/live-quiz-status-panel";
import { TechDetails } from "@/components/common/tech-details";
import { InstructorFlowRail } from "@/components/instructor/instructor-flow-rail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuizDeadlineCountdown } from "@/hooks/use-quiz-deadline-countdown";
import { useStartSessionMutation } from "@/hooks/api/use-start-session-mutation";
import { useQuizSocket } from "@/hooks/use-quiz-socket";
import { AUTH_KEYS, getStoredUser } from "@/lib/auth-storage";
import { readLastQuizSet, type LastQuizSetInfo } from "@/lib/last-quiz-set";
import type { QuizWsEvent } from "@/lib/quiz-ws-live-state";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import { liveRoomPhaseLabel } from "@/lib/session-user-copy";
import type { Session, StartSessionRequest } from "@/types/api";

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
  /** 라이브에서 열 문항 ID (퀴즈 세트의 `quizzes[].id`와 동일해야 함) */
  const [startQuizId, setStartQuizId] = useState("");
  const startSessionMutation = useStartSessionMutation();

  useEffect(() => {
    const fromUrl = searchParams.get("quiz_set_id")?.trim();
    const stored = readLastQuizSet();
    setLastQuizHint(stored);
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
  });

  const active = socket.liveSession.activeQuiz;
  const deadlineMs = active ? active.startedAt + active.time_limit * 1000 : null;
  const remainingSec = useQuizDeadlineCountdown(deadlineMs);

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
      toast.success("라이브 퀴즈방이 열렸습니다. 참여코드를 학생에게 알려주세요.");
    } catch {
      // api-client 인터셉터에서 토스트를 처리합니다.
    }
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

  return (
    <section className="space-y-6">
      <FlowPageHeader rail={<InstructorFlowRail />} title="라이브 방" description="방을 열면 참여 코드가 나와요." />

      <Card>
        <CardHeader>
          <CardTitle>방 열기</CardTitle>
          <CardDescription>퀴즈 세트와 제한 시간을 정해 주세요.</CardDescription>
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
            <div className="flex items-end">
              <Button type="submit" disabled={startSessionMutation.isPending} className="w-full md:w-auto">
                {startSessionMutation.isPending ? "만드는 중…" : "퀴즈방 열기"}
              </Button>
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
                <Button type="button" variant="outline" onClick={handleCopyJoinCode}>
                  코드 복사
                </Button>
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
          <CardHeader className="pb-2">
            <CardTitle>문항 시작</CardTitle>
            <CardDescription>빌더에서 만든 문항 ID를 넣고 시작하세요.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="instructor-start-quiz-id">
                문항 ID
              </label>
              <Input
                id="instructor-start-quiz-id"
                value={startQuizId}
                onChange={(e) => setStartQuizId(e.target.value)}
                placeholder="q_001"
                disabled={!socket.isConnected}
                className="font-mono text-sm"
                autoComplete="off"
              />
            </div>
            <Button
              type="button"
              onClick={() => socket.startQuiz(startQuizId)}
              disabled={!sessionId || !socket.isConnected || !startQuizId.trim()}
            >
              시작
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
                live={socket.liveSession}
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
