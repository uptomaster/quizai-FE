"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useJoinSessionMutation } from "@/hooks/api/use-join-session-mutation";
import type { Session } from "@/types/api";

export default function StudentJoinPage() {
  const [joinCode, setJoinCode] = useState("");
  const [joinedSession, setJoinedSession] = useState<Session | null>(null);
  const joinSessionMutation = useJoinSessionMutation();

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const data = await joinSessionMutation.mutateAsync({ joinCode });
      setJoinedSession(data);
      toast.success("세션 참여에 성공했습니다.");
    } catch {
      // apiRequest에서 토스트를 처리합니다.
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-pink-500/10 via-fuchsia-500/10 to-blue-500/10 p-5">
        <h2 className="text-2xl font-semibold">세션 참여</h2>
        <p className="mt-1 text-sm text-muted-foreground">교강사가 공유한 6자리 참여코드를 입력하세요.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>참여 코드 입력</CardTitle>
          <CardDescription>교강사가 공유한 코드로 세션에 접속합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="flex flex-col gap-3 md:flex-row">
            <Input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="참여코드 6자리"
              required
            />
            <Button type="submit" disabled={joinSessionMutation.isPending}>
              {joinSessionMutation.isPending ? "참여 중..." : "참여하기"}
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
          <CardContent className="space-y-2 text-sm">
            <p>
              세션 ID: <span className="font-medium">{joinedSession.id}</span>
            </p>
            <p>
              참여코드: <span className="font-medium text-primary">{joinedSession.joinCode}</span>
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
