"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/api-client";
import type { Session } from "@/types/api";

interface JoinSessionRequest {
  joinCode: string;
}

export default function StudentJoinPage() {
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinedSession, setJoinedSession] = useState<Session | null>(null);

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsJoining(true);

    try {
      const data = await apiRequest<Session, JoinSessionRequest>({
        method: "POST",
        url: "/sessions/join",
        data: { joinCode },
      });
      setJoinedSession(data);
      toast.success("세션 참여에 성공했습니다.");
    } catch {
      // apiRequest에서 토스트를 처리합니다.
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">세션 참여</h2>
      <Card>
        <CardHeader>
          <CardTitle>참여 코드 입력</CardTitle>
          <CardDescription>교강사가 공유한 코드로 세션에 접속합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="flex flex-col gap-3 md:flex-row">
            <Input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="join code"
              required
            />
            <Button type="submit" disabled={isJoining}>
              {isJoining ? "참여 중..." : "참여하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
      {joinedSession && (
        <Card>
          <CardHeader>
            <CardTitle>참여 완료</CardTitle>
            <CardDescription>세션 정보</CardDescription>
          </CardHeader>
          <CardContent className="text-sm">
            세션 ID: <span className="font-medium">{joinedSession.id}</span>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
