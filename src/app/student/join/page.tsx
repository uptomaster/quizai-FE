"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FlowPageHeader } from "@/components/common/flow-page-header";
import { StudentFlowRail } from "@/components/student/student-flow-rail";
import { Input } from "@/components/ui/input";
import { useJoinSessionMutation } from "@/hooks/api/use-join-session-mutation";
import { getStoredUser } from "@/lib/auth-storage";
import {
  JOIN_CODE_MAX_LENGTH,
  JOIN_CODE_MIN_LENGTH,
  normalizeJoinCode,
} from "@/lib/join-code";
import { rememberJoinNickname, rememberSessionWsUrl } from "@/lib/session-ws-url";

export default function StudentJoinPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");
  const joinSessionMutation = useJoinSessionMutation();

  useEffect(() => {
    const name = getStoredUser()?.name?.trim();
    if (name) {
      setNickname(name);
    }
  }, []);

  const handleJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const code = normalizeJoinCode(joinCode);
      if (code.length < JOIN_CODE_MIN_LENGTH) {
        toast.error(`참여 코드를 ${JOIN_CODE_MIN_LENGTH}자 이상 입력해주세요.`);
        return;
      }
      const displayName = nickname.trim() || "학생";
      const data = await joinSessionMutation.mutateAsync({ joinCode: code, nickname: displayName });
      rememberSessionWsUrl(data.session_id, data.ws_url);
      rememberJoinNickname(data.session_id, displayName);
      toast.success("퀴즈 화면으로 이동합니다.");
      router.push(`/student/play?sessionId=${encodeURIComponent(data.session_id)}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "입장에 실패했습니다. 참여코드를 다시 확인해주세요.";
      toast.error(message);
    }
  };

  return (
    <section className="space-y-6">
      <FlowPageHeader
        rail={<StudentFlowRail />}
        title="참여 코드"
        actions={
          <Link href="/student/lectures" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            강의
          </Link>
        }
      />

      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>입력</CardTitle>
          <CardDescription>
            {JOIN_CODE_MIN_LENGTH}~{JOIN_CODE_MAX_LENGTH}자 · 영문·숫자
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="join-nickname">
                이름
              </label>
              <Input
                id="join-nickname"
                value={nickname}
                onChange={(event) => setNickname(event.target.value.slice(0, 32))}
                placeholder="예: 김민수"
                maxLength={32}
                autoComplete="nickname"
                className="h-11"
              />
            </div>
            <Input
              value={joinCode}
              onChange={(event) =>
                setJoinCode(event.target.value.toUpperCase().replace(/\s/g, "").slice(0, JOIN_CODE_MAX_LENGTH))
              }
              placeholder="예: 화면에 보이는 코드"
              required
              minLength={JOIN_CODE_MIN_LENGTH}
              maxLength={JOIN_CODE_MAX_LENGTH}
              autoComplete="off"
              inputMode="text"
              className="h-12 text-center font-mono text-xl tracking-[0.12em]"
            />
            <Button type="submit" disabled={joinSessionMutation.isPending} className="h-11 w-full">
              {joinSessionMutation.isPending ? "참여 중..." : "참여하기"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
