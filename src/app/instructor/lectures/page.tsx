"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHero } from "@/components/common/page-hero";
import { TechDetails } from "@/components/common/tech-details";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGenerateQuizMutation } from "@/hooks/api/use-generate-quiz-mutation";
import { useLecturesQuery } from "@/hooks/api/use-lectures-query";
import { useUploadLectureMutation } from "@/hooks/api/use-upload-lecture-mutation";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { saveLastQuizSet } from "@/lib/last-quiz-set";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import { cn } from "@/lib/utils";
import type { GenerateQuizRequest, Lecture, QuizQuestion } from "@/types/api";

const SESSION_LECTURE_KEY = "instructor_builder_lecture_id";

export default function InstructorLecturesPage() {
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [count, setCount] = useState("5");
  const [extraCount, setExtraCount] = useState("5");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizSetId, setQuizSetId] = useState("");
  const [uploadedLecture, setUploadedLecture] = useState<Lecture | null>(null);
  /** 목록 선택·직접 입력·업로드 후 동기화되는 작업 중 강의 ID */
  const [chosenLectureId, setChosenLectureId] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const lecturesQuery = useLecturesQuery(1, 50);
  const lectures = lecturesQuery.data?.lectures ?? [];

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const saved = sessionStorage.getItem(SESSION_LECTURE_KEY);
    if (saved) {
      setChosenLectureId(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !chosenLectureId.trim()) {
      return;
    }
    sessionStorage.setItem(SESSION_LECTURE_KEY, chosenLectureId.trim());
  }, [chosenLectureId]);

  const uploadLectureMutation = useUploadLectureMutation();
  const generateQuizMutation = useGenerateQuizMutation();

  const isBusy = uploadLectureMutation.isPending || generateQuizMutation.isPending;

  const matchedFromList = useMemo(
    () => (chosenLectureId.trim() ? lectures.find((l) => l.lecture_id === chosenLectureId.trim()) : undefined),
    [lectures, chosenLectureId],
  );

  const activeLecture = useMemo((): Lecture | null => {
    if (matchedFromList) {
      return matchedFromList;
    }
    if (uploadedLecture && uploadedLecture.lecture_id === chosenLectureId.trim()) {
      return uploadedLecture;
    }
    return null;
  }, [matchedFromList, uploadedLecture, chosenLectureId]);

  const effectiveLectureId = chosenLectureId.trim() || uploadedLecture?.lecture_id || "";

  const aiKeywords = useMemo(
    () =>
      activeLecture || uploadedLecture
        ? ["핵심 개념 분류", "난이도 자동 균형", "오답 유도 포인트 탐지"]
        : ["강의 텍스트 정규화", "키워드 추출", "문항 포맷 최적화"],
    [activeLecture, uploadedLecture],
  );

  const runGenerate = async (
    lecId: string,
    quizCount: number,
    mode: "replace" | "append",
    meta?: { lectureTitle?: string },
  ) => {
    const payload: GenerateQuizRequest = {
      lecture_id: lecId,
      count: quizCount,
    };
    const prevLen = questions.length;
    const data = await generateQuizMutation.mutateAsync(payload);
    setQuizSetId(data.quiz_set_id);
    let totalAfter: number;
    if (mode === "replace") {
      setQuestions(data.quizzes);
      totalAfter = data.quizzes.length;
    } else {
      totalAfter = prevLen + data.quizzes.length;
      setQuestions((prev) => [...prev, ...data.quizzes]);
    }
    saveLastQuizSet({
      quizSetId: data.quiz_set_id,
      lectureTitle: meta?.lectureTitle,
      totalQuestions: totalAfter,
    });
    return data;
  };

  const handleUploadLecture = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const appendTargetId =
      activeLecture?.lecture_id ?? (chosenLectureId.trim() || undefined);
    const uploadTitle = activeLecture?.title ?? title.trim();

    if (!uploadTitle) {
      toast.error("강의 제목을 입력하거나, 위에서 기존 강의를 먼저 선택해주세요.");
      return;
    }
    if (!pdfFile) {
      toast.error("PDF(또는 텍스트) 파일을 선택해주세요.");
      return;
    }

    const n = Number(count);
    const quizCount = Number.isFinite(n) && n >= 1 ? Math.min(20, n) : 5;

    try {
      const lecture = await uploadLectureMutation.mutateAsync({
        file: pdfFile,
        title: uploadTitle,
        lectureId: appendTargetId,
      });
      setUploadedLecture(lecture);
      setChosenLectureId(lecture.lecture_id);
      toast.success(
        appendTargetId
          ? "자료가 추가되었습니다. 같은 강의로 퀴즈를 생성합니다…"
          : "업로드 완료. 같은 강의로 퀴즈를 자동 생성합니다…",
      );

      await runGenerate(lecture.lecture_id, quizCount, "replace", { lectureTitle: lecture.title });
      toast.success(`퀴즈 ${quizCount}문항 생성이 완료되었습니다.`);
    } catch {
      // api-client / generate 실패 시 토스트는 인터셉터·뮤테이션에서 처리
    }
  };

  const handleGenerateMore = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveLectureId.trim()) {
      toast.error("먼저 강의를 선택하거나 PDF 업로드로 강의를 만든 뒤 진행해 주세요.");
      return;
    }
    const n = Number(extraCount);
    const quizCount = Number.isFinite(n) && n >= 1 ? Math.min(20, n) : 5;

    try {
      await runGenerate(effectiveLectureId.trim(), quizCount, "append", {
        lectureTitle: activeLecture?.title ?? uploadedLecture?.title,
      });
      toast.success(`추가로 ${quizCount}문항을 붙였습니다.`);
    } catch {
      // apiRequest에서 토스트
    }
  };

  const handleManualRegenerate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!effectiveLectureId.trim()) {
      toast.error("강의를 선택하거나 업로드로 강의 ID를 만든 뒤 진행해 주세요.");
      return;
    }
    const n = Number(count);
    const quizCount = Number.isFinite(n) && n >= 1 ? Math.min(20, n) : 5;

    try {
      await runGenerate(effectiveLectureId.trim(), quizCount, "replace", {
        lectureTitle: activeLecture?.title ?? uploadedLecture?.title,
      });
      toast.success("퀴즈를 새로 덮어썼습니다.");
    } catch {
      // apiRequest에서 토스트
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

  const clearLectureSelection = () => {
    setChosenLectureId("");
    setUploadedLecture(null);
    setTitle("");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_LECTURE_KEY);
    }
  };

  return (
    <section className="space-y-6">
      <PageHero
        eyebrow="AI Builder"
        title="강의를 고른 뒤, 자료를 쌓고 퀴즈를 만듭니다"
        description="먼저 작업할 강의를 선택하거나(또는 첫 PDF로 새 강의를 만든 뒤), 같은 강의에 PDF를 계속 올려 퀴즈를 생성·다듬고 라이브로 송출하세요."
        actions={
          <Button type="button" onClick={() => window.location.assign("/instructor/sessions")}>
            라이브 퀴즈로 이동
          </Button>
        }
      />

      <Card className="border-primary/15">
        <CardHeader>
          <CardTitle>1) 작업할 강의 선택</CardTitle>
          <CardDescription>
            서버에 등록된 강의 목록에서 고르거나, 아래에 강의 번호를 직접 입력하세요. 새 강의는「2)」에서 제목과 첫 PDF로
            만들 수 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {lecturesQuery.isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <select
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              )}
              value={matchedFromList ? chosenLectureId : ""}
              onChange={(event) => {
                const v = event.target.value;
                setChosenLectureId(v);
                if (v) {
                  setTitle("");
                }
              }}
            >
              <option value="">목록에서 강의 선택…</option>
              {lectures.map((lec) => (
                <option key={lec.lecture_id} value={lec.lecture_id}>
                  {coerceRenderableText(lec.title) || "강의"} · {lec.lecture_id}
                </option>
              ))}
            </select>
          )}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">강의 번호 직접 입력 (목록에 없을 때)</p>
            <Input
              value={chosenLectureId}
              onChange={(event) => setChosenLectureId(event.target.value)}
              placeholder="lec_…"
              className="font-mono text-sm"
            />
          </div>
          {activeLecture ? (
            <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <p>
                <span className="text-muted-foreground">선택된 강의</span>{" "}
                <span className="font-medium text-foreground">
                  {coerceRenderableText(activeLecture.title) || "강의"}
                </span>
              </p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{activeLecture.lecture_id}</p>
            </div>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={clearLectureSelection}>
            선택 초기화 (새 강의 만들기 준비)
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          className={`border-2 ${dragOver ? "border-primary bg-primary/5" : "border-dashed border-border bg-card"}`}
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
              if (!title.trim() && !activeLecture) {
                setTitle(file.name.replace(/\.[^/.]+$/, ""));
              }
            }
          }}
        >
          <CardHeader>
            <CardTitle>2) 같은 강의에 PDF 올리고 퀴즈 생성</CardTitle>
            <CardDescription>
              {activeLecture
                ? "선택한 강의에 자료를 추가하고, 곧바로 퀴즈를 생성합니다."
                : "새 강의면 제목과 파일을 넣으면 강의가 생기고, 이후에는 위에서 그 강의를 골라 계속 추가할 수 있어요."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUploadLecture} className="space-y-3">
              {!activeLecture ? (
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="새 강의 제목"
                  required
                />
              ) : (
                <p className="rounded-md border border-dashed border-border/80 bg-muted/20 px-3 py-2 text-sm">
                  자료 추가 대상:{" "}
                  <span className="font-medium">{coerceRenderableText(activeLecture.title) || "강의"}</span>
                </p>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">이번에 생성할 문항 수 (1–20)</label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                  required
                />
              </div>
              <Input
                type="file"
                accept="application/pdf,text/plain,.docx"
                onChange={(event) => setPdfFile(event.target.files?.[0] ?? null)}
                required
              />
              <Button type="submit" disabled={isBusy} className="w-full">
                {uploadLectureMutation.isPending
                  ? "업로드 중…"
                  : generateQuizMutation.isPending
                    ? "퀴즈 생성 중…"
                    : activeLecture
                      ? "자료 추가 후 퀴즈 생성"
                      : "업로드 후 퀴즈 자동 생성"}
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              {pdfFile ? `선택 파일: ${pdfFile.name}` : "선택된 파일이 없습니다."}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>진행 상태</CardTitle>
            <CardDescription>업로드와 퀴즈 생성이 한 흐름으로 이어집니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm font-medium">
              {uploadLectureMutation.isPending
                ? "파일을 서버에 올리는 중…"
                : generateQuizMutation.isPending
                  ? "같은 강의에 대해 AI가 문항을 만들고 있어요…"
                  : effectiveLectureId
                    ? "준비됨. 아래에서 문항을 더 붙이거나 덮어쓸 수 있어요."
                    : "강의를 고른 뒤 PDF를 올리면 자동으로 퀴즈 생성이 시작됩니다."}
            </p>
            <div className="space-y-2">
              {aiKeywords.map((keyword) => (
                <div key={keyword} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <span>{keyword}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      generateQuizMutation.isPending ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {generateQuizMutation.isPending ? "running" : "idle"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>3) 같은 강의로 문항만 더 만들기 / 덮어쓰기</CardTitle>
          <CardDescription>
            위에서 선택·업로드로 정해진 강의 ID(<span className="font-mono">{effectiveLectureId || "—"}</span>)를
            사용합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleGenerateMore} className="grid gap-3 md:grid-cols-[140px_auto] md:items-end">
            <Input
              type="number"
              min={1}
              max={20}
              value={extraCount}
              onChange={(event) => setExtraCount(event.target.value)}
              title="추가 문항 수"
            />
            <Button type="submit" disabled={isBusy || !effectiveLectureId.trim()}>
              {generateQuizMutation.isPending ? "생성 중…" : "문항 더 붙이기"}
            </Button>
          </form>

          <div className="border-t border-border/80 pt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">전체 문항 새로 생성 (덮어쓰기)</p>
            <form onSubmit={handleManualRegenerate} className="grid gap-3 md:grid-cols-[100px_auto] md:items-end">
              <Input
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(event) => setCount(event.target.value)}
              />
              <Button type="submit" variant="outline" disabled={isBusy || !effectiveLectureId.trim()}>
                전체 새로 생성
              </Button>
            </form>
          </div>

          {effectiveLectureId ? (
            <TechDetails title="참고 번호">
              <p className="break-all text-muted-foreground">
                <span className="font-medium text-foreground">강의:</span>{" "}
                <span className="font-mono">{effectiveLectureId}</span>
              </p>
              {quizSetId ? (
                <p className="mt-2 break-all text-muted-foreground">
                  <span className="font-medium text-foreground">퀴즈 세트:</span>{" "}
                  <span className="font-mono">{quizSetId}</span>
                </p>
              ) : null}
            </TechDetails>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>퀴즈 리뷰</CardTitle>
          <CardDescription>생성된 퀴즈를 다듬은 뒤, 라이브 퀴즈 화면에서 방을 열어 수업에 사용하세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {quizSetId && questions.length > 0 ? (
            <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-medium text-primary">생성된 퀴즈</p>
                  <p className="mt-1 text-lg font-semibold leading-snug">
                    {activeLecture?.title ?? uploadedLecture?.title ?? "방금 만든 퀴즈"}
                  </p>
                  <p className="text-sm text-muted-foreground">총 {questions.length}문항 · 수업에서 바로 쓸 수 있어요.</p>
                  <p className="mt-2 break-all font-mono text-xs text-foreground">
                    <span className="font-sans font-medium text-muted-foreground">강의 코드 </span>
                    {effectiveLectureId}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-foreground">
                    <span className="font-sans font-medium text-muted-foreground">퀴즈 세트 번호 </span>
                    {quizSetId}
                  </p>
                </div>
                <Link
                  href={`/instructor/sessions?quiz_set_id=${encodeURIComponent(quizSetId)}`}
                  className={cn(buttonVariants(), "shrink-0 sm:self-center")}
                >
                  이 퀴즈로 라이브 방 열기
                </Link>
              </div>
            </div>
          ) : null}
          {generateQuizMutation.isPending ? (
            <div className="grid gap-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : questions.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">총 {questions.length}문항</p>
              {questions.map((question) => (
                <article key={question.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    {editingQuestionId === question.id ? (
                      <Input
                        value={
                          typeof question.question === "string"
                            ? question.question
                            : coerceRenderableText(question.question)
                        }
                        onChange={(event) =>
                          handleQuestionTextUpdate(question.id, event.target.value)
                        }
                      />
                    ) : (
                      <p className="font-medium">{coerceRenderableText(question.question)}</p>
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
                        {idx + 1}. {coerceRenderableText(option)}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </>
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              아직 생성된 퀴즈가 없습니다. 강의를 선택한 뒤 PDF를 올리면 자동으로 채워집니다.
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
