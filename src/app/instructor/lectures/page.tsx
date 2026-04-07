"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/api-client";
import type { GenerateQuizRequest, QuizQuestion } from "@/types/api";

export default function InstructorLecturesPage() {
  const [lectureId, setLectureId] = useState("");
  const [count, setCount] = useState("5");
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsGenerating(true);

    try {
      const payload: GenerateQuizRequest = {
        lectureId,
        questionCount: Number(count),
      };

      const data = await apiRequest<QuizQuestion[], GenerateQuizRequest>({
        method: "POST",
        url: "/quizzes/generate",
        data: payload,
      });

      setQuestions(data);
      toast.success("AI 퀴즈 생성이 완료되었습니다.");
    } catch {
      // apiRequest에서 토스트를 처리합니다.
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">강의 자료 / AI 퀴즈 생성</h2>
      <Card>
        <CardHeader>
          <CardTitle>퀴즈 생성</CardTitle>
          <CardDescription>강의 ID와 문항 수를 입력하세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="grid gap-3 md:grid-cols-3">
            <Input
              value={lectureId}
              onChange={(event) => setLectureId(event.target.value)}
              placeholder="lecture_id"
              required
            />
            <Input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(event) => setCount(event.target.value)}
              required
            />
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? "생성 중..." : "퀴즈 생성"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isGenerating ? (
        <div className="grid gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <div className="grid gap-3">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <p className="font-medium">{question.prompt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
