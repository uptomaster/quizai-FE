"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useLoginMutation } from "@/hooks/api/use-login-mutation";
import { getRoleHomePath, saveAuthSession } from "@/lib/auth-storage";
import type { AppUser, AuthRequest, UserRole } from "@/types/api";

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

  const handleDemoEntry = (role: UserRole) => {
    const demoUser: AppUser = {
      id: `demo-${role}`,
      email: `${role}@quizai.local`,
      name: `Demo ${role}`,
      role,
      createdAt: new Date().toISOString(),
    };

    saveAuthSession(demoUser, {
      accessToken: "demo-token",
      tokenType: "bearer",
    });
    router.push(getRoleHomePath(role));
  };

  return (
    <div className="mx-auto flex h-full max-w-md items-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>QuizAI 로그인</CardTitle>
          <CardDescription>강의/세션 관리를 위해 로그인하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="이메일"
              required
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              required
            />
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
          <div className="mt-4 space-y-2 rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">백엔드 전 데모 진입</p>
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => handleDemoEntry("student")}>
                수강생
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleDemoEntry("instructor")}>
                교강사
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleDemoEntry("admin")}>
                운영자
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
