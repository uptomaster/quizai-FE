"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuizSocket } from "@/hooks/use-quiz-socket";

export default function InstructorSessionsPage() {
  const [sessionId, setSessionId] = useState("sample-session");
  const [questionId, setQuestionId] = useState("");
  const [answer, setAnswer] = useState("");

  const socket = useQuizSocket({
    sessionId,
    enabled: Boolean(sessionId),
  });

  const eventText = useMemo(
    () => (socket.lastEvent ? JSON.stringify(socket.lastEvent, null, 2) : "이벤트 없음"),
    [socket.lastEvent],
  );

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">세션 진행/모니터링</h2>
      <Card>
        <CardHeader>
          <CardTitle>실시간 세션 채널</CardTitle>
          <CardDescription>세션 이벤트를 수신하고 테스트 응답을 전송합니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value)}
            placeholder="session id"
          />
          <div className="text-sm">
            연결 상태:{" "}
            <span className={socket.isConnected ? "text-emerald-600" : "text-rose-600"}>
              {socket.isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Input
              value={questionId}
              onChange={(event) => setQuestionId(event.target.value)}
              placeholder="question id"
            />
            <Input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="answer"
            />
            <Button onClick={() => socket.sendAnswer(questionId, answer)}>정답 제출</Button>
          </div>
          <pre className="rounded-lg bg-muted p-3 text-xs whitespace-pre-wrap">{eventText}</pre>
        </CardContent>
      </Card>
    </section>
  );
}
