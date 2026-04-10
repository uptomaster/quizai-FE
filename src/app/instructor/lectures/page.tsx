"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHero } from "@/components/common/page-hero";
import { Input } from "@/components/ui/input";
import { useUploadLectureMutation } from "@/hooks/api/use-upload-lecture-mutation";
import { Skeleton } from "@/components/ui/skeleton";
import { useGenerateQuizMutation } from "@/hooks/api/use-generate-quiz-mutation";
import type { GenerateQuizRequest, Lecture, QuizQuestion } from "@/types/api";

export default function InstructorLecturesPage() {
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [lectureId, setLectureId] = useState("");
  const [count, setCount] = useState("5");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizSetId, setQuizSetId] = useState("");
  const [uploadedLecture, setUploadedLecture] = useState<Lecture | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const uploadLectureMutation = useUploadLectureMutation();
  const generateQuizMutation = useGenerateQuizMutation();

  const aiKeywords = useMemo(
    () =>
      uploadedLecture
        ? ["핵심 개념 분류", "난이도 자동 균형", "오답 유도 포인트 탐지"]
        : ["강의 텍스트 정규화", "키워드 추출", "문항 포맷 최적화"],
    [uploadedLecture],
  );

  const handleUploadLecture = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      toast.error("강의 제목을 입력해주세요.");
      return;
    }
    if (!pdfFile) {
      toast.error("PDF 파일을 선택해주세요.");
      return;
    }

    try {
      const lecture = await uploadLectureMutation.mutateAsync({
        file: pdfFile,
        title,
      });
      setUploadedLecture(lecture);
      setLectureId(lecture.lecture_id);
      toast.success("PDF 업로드가 완료되었습니다.");
    } catch {
      // api-client 인터셉터에서 토스트를 처리합니다.
    }
  };

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const payload: GenerateQuizRequest = {
        lecture_id: lectureId,
        count: Number(count),
      };

      const data = await generateQuizMutation.mutateAsync(payload);
      setQuestions(data.quizzes);
      setQuizSetId(data.quiz_set_id);
      toast.success("AI 퀴즈 생성이 완료되었습니다.");
    } catch {
      // apiRequest에서 토스트를 처리합니다.
    }
  };

  const handleDeleteQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== questionId));
  };

  const handleQuestionTextUpdate = (questionId: string, text: string) => {
    setQuestions((prev) =>
      prev.map((question) =>
        question.id === questionId ? { ...question, question: text } : question,
      ),
    );
  };

  return (
    <section className="space-y-6">
      <PageHero
        title="AI Magic Quiz Builder"
        description="강의 파일을 올리면 AI가 자동으로 퀴즈를 생성하고, 바로 리뷰/수정까지 끝낼 수 있습니다."
        actions={
          <>
            <Button type="button" onClick={() => window.location.assign("/instructor/sessions")}>
              실시간 분석 보기
            </Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          className={`border-2 ${dragOver ? "border-blue-500 bg-blue-50/60" : "border-dashed border-slate-300 bg-white"}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const file = event.dataTransfer.files?.[0];
            if (file) {
              setPdfFile(file);
              if (!title.trim()) {
                setTitle(file.name.replace(/\.[^/.]+$/, ""));
              }
            }
          }}
        >
          <CardHeader>
            <CardTitle>1) 파일 업로드</CardTitle>
            <CardDescription>PDF/TXT를 드래그 앤 드롭하거나 파일 선택으로 업로드하세요.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadLecture} className="space-y-3">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="강의 제목"
                required
              />
              <Input
                type="file"
                accept="application/pdf,text/plain,.docx"
                onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                required
              />
              <Button type="submit" disabled={uploadLectureMutation.isPending} className="w-full">
                {uploadLectureMutation.isPending ? "업로드 중..." : "업로드 시작"}
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              {pdfFile ? `선택 파일: ${pdfFile.name}` : "선택된 파일이 없습니다."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2) AI 분석 상태</CardTitle>
            <CardDescription>Claude가 강의 내용을 분석해 퀴즈를 구성합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">
              {generateQuizMutation.isPending
                ? "AI가 강의 내용을 분석 중입니다..."
                : "분석 대기 중입니다. lecture_id 입력 후 생성하세요."}
            </p>
            <div className="space-y-2">
              {aiKeywords.map((keyword) => (
                <div key={keyword} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <span>{keyword}</span>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                    {generateQuizMutation.isPending ? "processing" : "ready"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-100">
        <CardHeader>
          <CardTitle>3) 퀴즈 생성</CardTitle>
          <CardDescription>업로드된 lecture_id 또는 기존 ID로 AI 퀴즈를 생성합니다.</CardDescription>
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
            <Button type="submit" disabled={generateQuizMutation.isPending || !lectureId.trim()}>
              {generateQuizMutation.isPending ? "생성 중..." : "퀴즈 생성"}
            </Button>
          </form>
          {uploadedLecture ? (
            <p className="mt-2 text-xs text-muted-foreground">
              업로드 완료 lecture_id: <span className="font-medium">{uploadedLecture.lecture_id}</span>
            </p>
          ) : null}
          {quizSetId ? (
            <p className="mt-1 text-xs text-blue-700">생성된 quiz_set_id: {quizSetId}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>퀴즈 리뷰</CardTitle>
          <CardDescription>생성된 퀴즈를 즉시 수정/삭제하고 세션으로 넘기세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {generateQuizMutation.isPending ? (
            <div className="grid gap-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : questions.length > 0 ? (
            questions.map((question) => (
              <article key={question.id} className="rounded-xl border bg-white p-4">
                <div className="flex items-start justify-between gap-2">
                  {editingQuestionId === question.id ? (
                    <Input
                      value={question.question}
                      onChange={(event) =>
                        handleQuestionTextUpdate(question.id, event.target.value)
                      }
                    />
                  ) : (
                    <p className="font-medium">{question.question}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setEditingQuestionId((prev) =>
                          prev === question.id ? null : question.id,
                        )
                      }
                    >
                      {editingQuestionId === question.id ? "완료" : "수정"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {question.options.map((option, idx) => (
                    <li key={`${question.id}-${idx}`}>
                      {idx + 1}. {option}
                    </li>
                  ))}
                </ul>
              </article>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              생성된 퀴즈가 없습니다.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
