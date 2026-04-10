"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelperTip } from "@/components/common/helper-tip";
import { PageHero } from "@/components/common/page-hero";
import { Input } from "@/components/ui/input";
import { useJoinSessionMutation } from "@/hooks/api/use-join-session-mutation";
import type { Session } from "@/types/api";

export default function StudentJoinPage() {
  const router = useRouter();
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
        title="퀴즈 대기실"
        description="6자리 코드를 입력하면 바로 입장합니다. 토스 송금처럼 빠르고 단순하게."
      />
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>참여코드 입력</CardTitle>
          <CardDescription>코드만 입력하면 자동으로 세션 검증이 진행됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-3">
            <Input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="참여코드 6자리"
              required
              className="h-12 text-center text-xl tracking-[0.35em]"
            />
            <Button type="submit" disabled={joinSessionMutation.isPending} className="h-11 w-full">
              {joinSessionMutation.isPending ? "참여 중..." : "참여하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <HelperTip
        title="플레이 시작 전"
        steps={[
          "문항은 한 화면에 하나씩 노출됩니다.",
          "선택지 클릭 시 즉시 피드백이 제공됩니다.",
          "종료 후 개인 리포트를 확인할 수 있습니다.",
        ]}
      />
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
            <Button
              type="button"
              className="mt-2"
              onClick={() => router.push(`/student/play?sessionId=${joinedSession.session_id}`)}
            >
              퀴즈 플레이 시작
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
