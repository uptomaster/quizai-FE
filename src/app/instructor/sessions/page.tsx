"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelperTip } from "@/components/common/helper-tip";
import { PageHero } from "@/components/common/page-hero";
import { useStartSessionMutation } from "@/hooks/api/use-start-session-mutation";
import { Input } from "@/components/ui/input";
import { useQuizSocket } from "@/hooks/use-quiz-socket";
import type { Session, StartSessionRequest } from "@/types/api";

export default function InstructorSessionsPage() {
  const [quizSetId, setQuizSetId] = useState("");
  const [timeLimit, setTimeLimit] = useState("30");
  const [session, setSession] = useState<Session | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [questionId, setQuestionId] = useState("");
  const [answer, setAnswer] = useState("0");
  const startSessionMutation = useStartSessionMutation();

  const sessionId = session?.session_id ?? "";

  const socket = useQuizSocket({
    sessionId,
    directWsUrl: session?.ws_url,
    enabled: Boolean(session?.session_id),
  });

  const eventText = useMemo(
    () => (socket.lastEvent ? JSON.stringify(socket.lastEvent, null, 2) : "이벤트 없음"),
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
      toast.success("세션이 생성되었습니다.");
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

  const handleSendAnnouncement = () => {
    if (!announcement.trim()) {
      toast.error("공지 메시지를 입력해주세요.");
      return;
    }
    toast.success("수강생에게 공지 메시지를 전송했습니다.");
    setAnnouncement("");
  };

  return (
    <section className="space-y-4">
      <PageHero
        title="세션 진행/모니터링"
        description="세션 생성 후 참여코드를 복사해 수강생에게 전달하세요."
        className="from-cyan-500/10 via-blue-500/10 to-violet-500/10"
      />
      <HelperTip
        title="세션 운영 순서"
        steps={[
          "quiz set id와 제한 시간으로 세션을 시작합니다.",
          "생성된 참여코드를 학생에게 공유합니다.",
          "하단 실시간 채널에서 응답 이벤트를 모니터링합니다.",
        ]}
      />
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="grid gap-3 p-4 md:grid-cols-3 text-sm">
          <div className="rounded-lg border bg-background p-3">
            <p className="font-semibold">1) 세션 생성</p>
            <p className="text-muted-foreground">`quiz_set_id` 입력 후 시작</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="font-semibold">2) 참여코드 공유</p>
            <p className="text-muted-foreground">학생에게 코드 전달</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <p className="font-semibold">3) 실시간 모니터링</p>
            <p className="text-muted-foreground">연결 상태/이벤트 확인</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>세션 생성</CardTitle>
          <CardDescription>랜덤 참여코드가 발급되며 학생은 해당 코드로 입장합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartSession} className="grid gap-3 md:grid-cols-3">
            <Input
              value={quizSetId}
              onChange={(event) => setQuizSetId(event.target.value)}
              placeholder="quiz set id"
              required
            />
            <Input
              type="number"
              min={10}
              max={180}
              value={timeLimit}
              onChange={(event) => setTimeLimit(event.target.value)}
              placeholder="time limit (sec)"
              required
            />
            <Button type="submit" disabled={startSessionMutation.isPending}>
              {startSessionMutation.isPending ? "세션 생성 중..." : "세션 시작"}
            </Button>
          </form>
          {session && (
            <div className="mt-3 rounded-lg border p-3 text-sm space-y-2">
              <p>
                세션 ID: <span className="font-medium">{session.session_id}</span>
              </p>
              <p>
                참여코드: <span className="font-medium text-primary">{session.session_code}</span>
              </p>
              <Button type="button" size="sm" variant="outline" onClick={handleCopyJoinCode}>
                참여코드 복사
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>실시간 세션 채널</CardTitle>
          <CardDescription>세션 이벤트를 수신하고 테스트 응답을 전송합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={sessionId} readOnly placeholder="session id" />
          <div className="text-sm">
            연결 상태:{" "}
            <span className={socket.isConnected ? "text-emerald-600" : "text-rose-600"}>
              {socket.isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          {!sessionId && (
            <p className="rounded-md border border-dashed p-2 text-xs text-muted-foreground">
              먼저 상단에서 세션을 생성하면 실시간 채널이 활성화됩니다.
            </p>
          )}
          <div className="grid gap-2 md:grid-cols-3">
            <Input
              value={questionId}
              onChange={(event) => setQuestionId(event.target.value)}
              placeholder="quiz id"
              disabled={!sessionId}
            />
            <Input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="선택 옵션 인덱스 (예: 1)"
              disabled={!sessionId}
            />
            <Button
              onClick={() => socket.sendAnswer(questionId, Number(answer))}
              disabled={!sessionId || !questionId.trim() || Number.isNaN(Number(answer))}
            >
              정답 제출
            </Button>
          </div>
          <pre className="rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">{eventText}</pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>세션 운영 도구</CardTitle>
          <CardDescription>수강생 공지, 운영 메모, 세션 진행 체크를 관리합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <Input
              value={announcement}
              onChange={(event) => setAnnouncement(event.target.value)}
              placeholder="예: 10분 후 중간 퀴즈를 시작합니다."
            />
            <Button type="button" onClick={handleSendAnnouncement}>
              공지 전송
            </Button>
          </div>
          <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            운영 팁: 세션 시작 직후 참여코드를 재공지하고, 중간 체크 질문으로 집중도를 유지하세요.
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
