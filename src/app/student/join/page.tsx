"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelperTip } from "@/components/common/helper-tip";
import { PageHero } from "@/components/common/page-hero";
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
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "세션 참여에 실패했습니다. 참여코드를 확인해주세요.";
      toast.error(message);
    }
  };

  return (
    <section className="space-y-6">
      <PageHero
        title="세션 참여"
        description="교강사가 공유한 6자리 참여코드를 입력하세요."
        className="from-pink-500/10 via-fuchsia-500/10 to-blue-500/10"
      />
      <HelperTip
        title="입장 팁"
        steps={[
          "참여코드는 대소문자 구분 없이 입력 가능합니다.",
          "입장 성공 시 세션 ID가 즉시 표시됩니다.",
          "코드가 틀리면 다시 확인 후 재입장하세요.",
        ]}
      />
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
              세션 ID: <span className="font-medium">{joinedSession.session_id}</span>
            </p>
            <p>
              참여코드: <span className="font-medium text-primary">{joinedSession.session_code}</span>
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
