"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { AuthRolePicker } from "@/components/auth/auth-role-picker";
import { SiteLogo } from "@/components/common/site-logo";
import { useRegisterMutation } from "@/hooks/api/use-register-mutation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getRoleHomePath, saveAuthSession } from "@/lib/auth-storage";
import type { AuthRequest, UserRole } from "@/types/api";

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const [role, setRole] = useState<UserRole>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const payload: AuthRequest = {
        name,
        email,
        password,
        role,
      };

      const data = await registerMutation.mutateAsync(payload);
      const user = { ...data.user, role };
      saveAuthSession(user, data.tokens);
      toast.success("회원가입이 완료되었습니다.");
      router.push(getRoleHomePath(role));
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
          <CardTitle>QuizAI 회원가입</CardTitle>
          <CardDescription>역할을 고른 뒤 정보를 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <AuthRolePicker value={role} onChange={setRole} disabled={registerMutation.isPending} />
            <div className="space-y-2">
              <p className="text-sm font-medium">2. 프로필</p>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="이름"
                required
                autoComplete="name"
              />
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
                autoComplete="new-password"
              />
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="비밀번호 확인"
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={registerMutation.isPending} className="w-full">
              {registerMutation.isPending ? "가입 중..." : "회원가입"}
            </Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground">
            이미 계정이 있나요?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-2 hover:underline">
              로그인
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            가입 응답과 관계없이 선택한 역할로 첫 화면이 열립니다. 운영자 계정은 서버에서 허용된 경우에만 API가
            통과합니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
