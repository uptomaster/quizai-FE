"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUploadLectureMutation } from "@/hooks/api/use-upload-lecture-mutation";
import { Skeleton } from "@/components/ui/skeleton";
import { useGenerateQuizMutation } from "@/hooks/api/use-generate-quiz-mutation";
import type { GenerateQuizRequest, Lecture, QuizQuestion } from "@/types/api";

export default function InstructorLecturesPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [lectureId, setLectureId] = useState("");
  const [count, setCount] = useState("5");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [uploadedLecture, setUploadedLecture] = useState<Lecture | null>(null);
  const uploadLectureMutation = useUploadLectureMutation();
  const generateQuizMutation = useGenerateQuizMutation();

  const handleUploadLecture = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pdfFile) {
      toast.error("PDF 파일을 선택해주세요.");
      return;
    }

    try {
      const lecture = await uploadLectureMutation.mutateAsync({
        file: pdfFile,
        title,
        description,
      });
      setUploadedLecture(lecture);
      setLectureId(lecture.id);
      toast.success("PDF 업로드가 완료되었습니다.");
    } catch {
      // api-client 인터셉터에서 토스트를 처리합니다.
    }
  };

  const handleGenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const payload: GenerateQuizRequest = {
        lectureId,
        questionCount: Number(count),
      };

      const data = await generateQuizMutation.mutateAsync(payload);

      setQuestions(data);
      toast.success("AI 퀴즈 생성이 완료되었습니다.");
    } catch {
      // apiRequest에서 토스트를 처리합니다.
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-xl border bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-purple-500/10 p-5">
        <h2 className="text-2xl font-semibold">강의 자료 / AI 퀴즈 생성</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF 업로드 -&gt; lecture_id 발급 -&gt; AI 퀴즈 생성 순서로 진행됩니다.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>PDF 업로드</CardTitle>
          <CardDescription>강의 PDF를 업로드하면 lecture_id가 생성됩니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUploadLecture} className="grid gap-3 md:grid-cols-2">
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="강의 제목 (선택)"
            />
            <Input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="설명 (선택)"
            />
            <Input
              type="file"
              accept="application/pdf"
              onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
              required
              className="md:col-span-2"
            />
            <Button type="submit" disabled={uploadLectureMutation.isPending} className="md:col-span-2">
              {uploadLectureMutation.isPending ? "업로드 중..." : "PDF 업로드"}
            </Button>
          </form>
          {uploadedLecture && (
            <p className="mt-3 text-sm text-muted-foreground">
              업로드 완료 lecture_id: <span className="font-medium text-foreground">{uploadedLecture.id}</span>
            </p>
          )}
          {pdfFile && (
            <p className="mt-1 text-xs text-muted-foreground">
              선택 파일: <span className="font-medium">{pdfFile.name}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>퀴즈 생성</CardTitle>
          <CardDescription>업로드된 lecture_id 또는 기존 ID로 퀴즈를 생성합니다.</CardDescription>
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
            <Button type="submit" disabled={generateQuizMutation.isPending}>
              {generateQuizMutation.isPending ? "생성 중..." : "퀴즈 생성"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {generateQuizMutation.isPending ? (
        <div className="grid gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : questions.length > 0 ? (
        <div className="grid gap-3">
          {questions.map((question) => (
            <Card key={question.id}>
              <CardContent className="pt-6">
                <p className="font-medium">{question.prompt}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            생성된 퀴즈가 없습니다. 강의 PDF를 업로드하고 퀴즈를 생성해보세요.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
