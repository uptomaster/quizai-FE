"use client";

import { FormEvent, useState } from "react";

import { LiveQuizStatusPanel } from "@/components/common/live-quiz-status-panel";
import { PageHero } from "@/components/common/page-hero";
import { StatTile } from "@/components/common/stat-tile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuizDeadlineCountdown } from "@/hooks/use-quiz-deadline-countdown";
import { useQuizSocket } from "@/hooks/use-quiz-socket";
import { AUTH_KEYS } from "@/lib/auth-storage";

export default function AdminSessionsPage() {
  const [roomIdInput, setRoomIdInput] = useState("");
  const [wsUrlInput, setWsUrlInput] = useState("");
  const [activeRoomId, setActiveRoomId] = useState("");
  const [activeWsUrl, setActiveWsUrl] = useState<string | undefined>(undefined);

  const token =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_KEYS.accessToken) : null;

  const socket = useQuizSocket({
    sessionId: activeRoomId,
    directWsUrl: activeWsUrl,
    enabled: activeRoomId.length > 0,
    nickname: "운영-모니터",
    token: token ?? undefined,
    debugLabel: "admin",
  });

  const active = socket.liveSession.activeQuiz;
  const deadlineMs = active ? active.startedAt + active.time_limit * 1000 : null;
  const remainingSec = useQuizDeadlineCountdown(deadlineMs);

  const handleConnect = (e: FormEvent) => {
    e.preventDefault();
    const id = roomIdInput.trim();
    if (!id) {
      return;
    }
    const ws = wsUrlInput.trim();
    setActiveRoomId(id);
    setActiveWsUrl(ws.length > 0 ? ws : undefined);
  };

  const handleDisconnect = () => {
    setActiveRoomId("");
    setActiveWsUrl(undefined);
  };

  return (
    <section className="space-y-8">
      <PageHero
        title="실시간 세션 모니터링"
        description="진행 중인 퀴즈 세션에 연결해 참여 인원과 제출 현황을 확인합니다."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile title="연결" description="세션 모니터링" value={activeRoomId ? "켜짐" : "꺼짐"} />
        <StatTile
          title="참여 인원"
          description="최근 이벤트 기준"
          value={socket.liveSession.participantCount != null ? String(socket.liveSession.participantCount) : "—"}
        />
        <StatTile
          title="제출 현황"
          description="응답 집계"
          value={
            socket.liveSession.answerProgress
              ? `${socket.liveSession.answerProgress.answered}/${socket.liveSession.answerProgress.total}`
              : "—"
          }
        />
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>세션 연결</CardTitle>
          <CardDescription>
            교강사 화면에 표시된 세션 번호를 입력하세요. 실시간 주소는 보통 비워 두면 됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleConnect} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Input
              value={roomIdInput}
              onChange={(ev) => setRoomIdInput(ev.target.value)}
              placeholder="세션 번호"
              className="font-mono text-sm"
            />
            <Input
              value={wsUrlInput}
              onChange={(ev) => setWsUrlInput(ev.target.value)}
              placeholder="실시간 주소 (필요할 때만)"
              className="font-mono text-xs"
            />
            <div className="flex gap-2">
              <Button type="submit">연결</Button>
              <Button type="button" variant="outline" onClick={handleDisconnect} disabled={!activeRoomId}>
                끊기
              </Button>
            </div>
          </form>
          {!token ? (
            <p className="text-xs text-amber-800 dark:text-amber-200">운영자 계정으로 로그인한 뒤 이용해 주세요.</p>
          ) : null}
        </CardContent>
      </Card>

      {activeRoomId ? (
        <LiveQuizStatusPanel
          variant="admin"
          live={socket.liveSession}
          remainingSec={remainingSec}
          isConnected={socket.isConnected}
        />
      ) : (
        <Card className="border-dashed shadow-sm">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            세션 번호를 입력한 뒤 연결하면 여기에 진행 현황이 표시됩니다.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
