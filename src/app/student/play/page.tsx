"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { PageHero } from "@/components/common/page-hero";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuizSocket } from "@/hooks/use-quiz-socket";
import { AUTH_KEYS, getStoredUser } from "@/lib/auth-storage";

const FALLBACK_QUESTION = {
  quiz_id: "preview-1",
  question: "지도학습과 비지도학습의 가장 큰 차이는 무엇인가요?",
  options: [
    "레이블 데이터 사용 여부",
    "모델의 실행 속도",
    "GPU 사용 여부",
    "데이터셋 파일 형식",
  ],
  time_limit: 30,
};

function StudentPlayContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const user = getStoredUser();
  const token =
    typeof window !== "undefined" ? localStorage.getItem(AUTH_KEYS.accessToken) : null;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [progress, setProgress] = useState(0);

  const socket = useQuizSocket({
    sessionId,
    enabled: sessionId.length > 0,
    nickname: user?.name ?? "student",
    token: token ?? undefined,
  });

  const currentQuestion = useMemo(() => {
    if (socket.lastEvent?.type === "quiz_started") {
      return socket.lastEvent.payload;
    }
    return FALLBACK_QUESTION;
  }, [socket.lastEvent]);

  const handleSubmit = () => {
    if (selectedOption === null) {
      toast.error("선택지를 고른 뒤 제출해주세요.");
      return;
    }
    socket.sendAnswer(currentQuestion.quiz_id, selectedOption);
    setSubmitted(true);
    setProgress((prev) => Math.min(100, prev + 25));
    toast.success("답안을 제출했어요.");
  };

  return (
    <section className="space-y-6">
      <PageHero
        title="실시간 퀴즈 Play"
        description="한 화면에 한 문항씩 집중해서 풀고, 즉시 피드백을 받으세요."
      />

      <Card>
        <CardHeader>
          <CardTitle>진행 상태</CardTitle>
          <CardDescription>
            연결 상태: {socket.isConnected ? "Connected" : "Waiting"} | 세션 ID:{" "}
            {sessionId || "미입력"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">문항 진행률 {progress}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{currentQuestion.question}</CardTitle>
          <CardDescription>
            제한 시간: {currentQuestion.time_limit}초 | 문항 ID: {currentQuestion.quiz_id}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={`${currentQuestion.quiz_id}-${index}`}
              type="button"
              onClick={() => {
                setSelectedOption(index);
                setSubmitted(false);
              }}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                selectedOption === index
                  ? "border-primary bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              {index + 1}. {option}
            </button>
          ))}
          <Button onClick={handleSubmit} className="w-full">
            답안 제출
          </Button>
          {submitted ? (
            <p className="text-sm text-blue-700">제출 완료! 다음 문항을 기다리는 중입니다.</p>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}

export default function StudentPlayPage() {
  return (
    <Suspense fallback={<section className="space-y-6"><Card><CardContent className="pt-6 text-sm text-muted-foreground">퀴즈 화면을 준비 중입니다...</CardContent></Card></section>}>
      <StudentPlayContent />
    </Suspense>
  );
}
