"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelperTip } from "@/components/common/helper-tip";
import { PageHero } from "@/components/common/page-hero";
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

  const openedCourses = useMemo(
    () => [
      {
        id: "course-01",
        name: "데이터베이스 기초",
        week: "화/목 10:00",
        students: 42,
        status: "진행 중",
        lectureId: uploadedLecture?.id ?? "db-101",
        summary: "ERD 설계, 정규화, SQL 기본 쿼리를 다루는 코스",
      },
      {
        id: "course-02",
        name: "웹 프론트엔드 실습",
        week: "월/수 14:00",
        students: 58,
        status: "모집 중",
        lectureId: "fe-201",
        summary: "React 기반 컴포넌트 설계와 상태 관리 실전",
      },
      {
        id: "course-03",
        name: "AI 기반 서비스 기획",
        week: "금 16:00",
        students: 35,
        status: "준비 중",
        lectureId: "ai-301",
        summary: "생성형 AI API를 활용한 제품 설계/평가 방법론",
      },
    ],
    [uploadedLecture?.id],
  );

  return (
    <section className="space-y-6">
      <PageHero
        title="강의 자료 / AI 퀴즈 생성"
        description="PDF 업로드 - lecture_id 발급 - AI 퀴즈 생성 순서로 진행됩니다."
        className="from-cyan-500/20 via-fuchsia-500/20 to-indigo-500/20"
      />
      <HelperTip
        title="빠른 시작 가이드"
        steps={[
          "강의 PDF 업로드를 먼저 완료합니다.",
          "자동으로 입력된 lecture_id를 확인합니다.",
          "문항 수를 지정하고 퀴즈 생성을 실행합니다.",
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>개설 과목</CardTitle>
          <CardDescription>과목 카드를 열어서 스케줄/수강인원/lecture_id를 확인하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {openedCourses.map((course) => (
            <details
              key={course.id}
              className="group rounded-xl border bg-gradient-to-r from-white/70 to-white/30 p-3 open:from-primary/5 open:to-fuchsia-500/5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{course.name}</p>
                  <p className="text-xs text-muted-foreground">{course.week}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground group-open:bg-primary/10 group-open:text-primary">
                  {course.status}
                </span>
              </summary>
              <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
                <p>
                  수강 인원: <span className="font-medium text-foreground">{course.students}명</span>
                </p>
                <p>
                  lecture_id: <span className="font-medium text-foreground">{course.lectureId}</span>
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setLectureId(course.lectureId)}
                  className="justify-self-start"
                >
                  이 ID로 퀴즈 생성
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{course.summary}</p>
            </details>
          ))}
        </CardContent>
      </Card>

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
          {pdfFile ? (
            <p className="mt-1 text-xs text-muted-foreground">
              선택 파일: <span className="font-medium">{pdfFile.name}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-primary/20 shadow-sm">
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
