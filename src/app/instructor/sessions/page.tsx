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
    return "아직 표시할 활동이 없어요. 학생이 입장하거나 문항이 시작되면 이곳에 요약됩니다.";
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
      return "실시간 연결은 되었습니다. 학생이 입장하거나(참여 코드), 백엔드에서 문항을 시작하면 여기에 요약이 쌓입니다.";
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
      <FlowPageHeader
        rail={<InstructorFlowRail />}
        title="라이브 방"
        description="퀴즈 세트로 방을 열면 참여 코드가 생깁니다. 아래에서 실시간으로 입장·제출을 확인하세요."
      />

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>퀴즈방 만들기</CardTitle>
          <CardDescription>생성 즉시 참여코드가 나옵니다. 학생 앱에서는 이 코드만 입력하면 됩니다.</CardDescription>
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
                  <p className="mt-2 text-xs text-muted-foreground">
                    수강생 메뉴「참여 코드」에는 위와 <span className="font-medium text-foreground">동일한 문자열</span>을
                    입력합니다. (별도 4자리/6자리 구분 없음)
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    진행 단계: <span className="font-medium text-foreground">{liveRoomPhaseLabel(session.status)}</span>
                  </p>
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

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>실시간 참여 · 제출 현황</CardTitle>
            <CardDescription>
              학생이 입장·답안을 보낼 때마다 서버가 WebSocket 이벤트를 밀어 주면, 아래 숫자와 표가 바로 갱신됩니다.
            </CardDescription>
          </div>
          <ConnectionStatus isConnected={socket.isConnected} />
        </CardHeader>
        <CardContent className="space-y-4">
          {!sessionId ? (
            <p className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
              위에서 퀴즈방을 연 뒤에 참여 인원·제출 집계가 여기에 표시됩니다.
            </p>
          ) : (
            <>
              {!socket.isConnected ? (
                <div className="rounded-xl border border-amber-500/35 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
                  <p className="font-medium">실시간 서버(WebSocket)에 아직 연결되지 않았습니다.</p>
                  <p className="mt-1 text-xs opacity-90">
                    Render가 잠든 경우 잠시 후 자동으로 다시 붙습니다. 계속이면 백엔드에서 WebSocket 경로·토큰·Origin(
                    <span className="font-mono">quizai-fe.vercel.app</span>)을 확인하세요.
                    {socket.connectionAttempt > 0 ? (
                      <span className="ml-1">(재시도 {socket.connectionAttempt})</span>
                    ) : null}
                  </p>
                </div>
              ) : null}
              <LiveQuizStatusPanel
                variant="instructor"
                live={socket.liveSession}
                remainingSec={remainingSec}
                isConnected={socket.isConnected}
                showConnectionChip={false}
              />
              <p className="rounded-xl border border-border/80 bg-muted/20 p-3 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">최근 알림: </span>
                {activitySummary}
              </p>
              <TechDetails title="최근 WebSocket 이벤트 (원문)">
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

          <TechDetails title="개발자용 · 브라우저에서 답안 전송 시뮬">
            <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
              수업 운영은 위 표·집계만 보면 됩니다. 아래는 소켓 메시지 형식을 맞춰 볼 때만 쓰세요. 실제 문항은 보통
              백엔드/강사 쪽에서 시작합니다.
            </p>
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
