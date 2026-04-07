"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStartSessionMutation } from "@/hooks/api/use-start-session-mutation";
import { Input } from "@/components/ui/input";
import { useQuizSocket } from "@/hooks/use-quiz-socket";
import type { Session, StartSessionRequest } from "@/types/api";

export default function InstructorSessionsPage() {
  const [lectureId, setLectureId] = useState("");
  const [quizId, setQuizId] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [questionId, setQuestionId] = useState("");
  const [answer, setAnswer] = useState("");
  const startSessionMutation = useStartSessionMutation();

  const sessionId = session?.id ?? "";

  const socket = useQuizSocket({
    sessionId,
    enabled: Boolean(session?.id),
  });

  const eventText = useMemo(
    () => (socket.lastEvent ? JSON.stringify(socket.lastEvent, null, 2) : "이벤트 없음"),
    [socket.lastEvent],
  );

  const handleStartSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const payload: StartSessionRequest = {
        lectureId,
        quizId,
      };
      const startedSession = await startSessionMutation.mutateAsync(payload);
      setSession(startedSession);
      toast.success("세션이 생성되었습니다.");
    } catch {
      // api-client 인터셉터에서 토스트를 처리합니다.
    }
  };

  const handleCopyJoinCode = async () => {
    if (!session?.joinCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(session.joinCode);
      toast.success("참여코드를 복사했습니다.");
    } catch {
      toast.error("클립보드 복사에 실패했습니다.");
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">세션 진행/모니터링</h2>
      <Card>
        <CardHeader>
          <CardTitle>세션 생성</CardTitle>
          <CardDescription>랜덤 참여코드가 발급되며 학생은 해당 코드로 입장합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartSession} className="grid gap-3 md:grid-cols-3">
            <Input
              value={lectureId}
              onChange={(event) => setLectureId(event.target.value)}
              placeholder="lecture id"
              required
            />
            <Input
              value={quizId}
              onChange={(event) => setQuizId(event.target.value)}
              placeholder="quiz id"
              required
            />
            <Button type="submit" disabled={startSessionMutation.isPending}>
              {startSessionMutation.isPending ? "세션 생성 중..." : "세션 시작"}
            </Button>
          </form>
          {session && (
            <div className="mt-3 rounded-lg border p-3 text-sm space-y-2">
              <p>
                세션 ID: <span className="font-medium">{session.id}</span>
              </p>
              <p>
                참여코드: <span className="font-medium text-primary">{session.joinCode}</span>
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
              placeholder="question id"
              disabled={!sessionId}
            />
            <Input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="answer"
              disabled={!sessionId}
            />
            <Button onClick={() => socket.sendAnswer(questionId, answer)} disabled={!sessionId}>
              정답 제출
            </Button>
          </div>
          <pre className="rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">{eventText}</pre>
        </CardContent>
      </Card>
    </section>
  );
}
