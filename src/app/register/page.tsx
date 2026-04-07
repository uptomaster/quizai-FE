"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { useRegisterMutation } from "@/hooks/api/use-register-mutation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getRoleHomePath, saveAuthSession } from "@/lib/auth-storage";
import type { AuthRequest } from "@/types/api";

type RegisterRole = "instructor" | "student";

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegisterMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<RegisterRole>("student");

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
      saveAuthSession(data.user, data.tokens);
      toast.success("회원가입이 완료되었습니다.");
      router.push(getRoleHomePath(data.user.role));
    } catch {
      // apiRequest에서 토스트를 처리합니다.
    }
  };

  return (
    <div className="mx-auto flex h-full max-w-md items-center">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>QuizAI 회원가입</CardTitle>
          <CardDescription>수강생 또는 교강사 계정을 생성합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="이름"
              required
            />
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
            <Input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="비밀번호 확인"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={role === "student" ? "default" : "outline"}
                onClick={() => setRole("student")}
              >
                수강생
              </Button>
              <Button
                type="button"
                variant={role === "instructor" ? "default" : "outline"}
                onClick={() => setRole("instructor")}
              >
                교강사
              </Button>
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
        </CardContent>
      </Card>
    </div>
  );
}
