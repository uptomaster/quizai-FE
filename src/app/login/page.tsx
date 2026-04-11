"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { SiteLogo } from "@/components/common/site-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLoginMutation } from "@/hooks/api/use-login-mutation";
import { getRoleHomePath, saveAuthSession } from "@/lib/auth-storage";
import type { AuthRequest } from "@/types/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLoginMutation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const payload: AuthRequest = { email, password };
      const data = await loginMutation.mutateAsync(payload);
      saveAuthSession(data.user, data.tokens);

      toast.success("로그인되었습니다.");
      router.push(getRoleHomePath(data.user.role));
    } catch {
      // apiRequest에서 토스트를 처리합니다.
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-0px)] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex justify-center">
        <Link href="/" className="rounded-lg outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
          <SiteLogo size={72} priority className="rounded-2xl" />
          <span className="sr-only">QuizAI 홈으로</span>
        </Link>
      </div>
      <p className="mb-4 text-center">
        <Link
          href="/"
          className="text-sm font-semibold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent hover:opacity-90"
        >
          ← QuizAI 홈
        </Link>
      </p>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>QuizAI 로그인</CardTitle>
          <CardDescription>가입한 이메일·비밀번호로 로그인합니다. 메뉴(역할)는 계정에 저장된 권한을 따릅니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">계정 정보</p>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="이메일"
                required
                autoComplete="email"
              />
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" disabled={loginMutation.isPending} className="w-full">
              {loginMutation.isPending ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground">
            계정이 없나요?{" "}
            <Link href="/register" className="font-medium text-primary underline-offset-2 hover:underline">
              회원가입
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            로그인 후 이동 경로는 서버가 내려준 역할(student / instructor / admin)에 맞춰집니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
