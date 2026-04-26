"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { FlowPageHeader } from "@/components/common/flow-page-header";
import { FlowSurface } from "@/components/common/flow-surface";
import { TechDetails } from "@/components/common/tech-details";
import { InstructorFlowRail } from "@/components/instructor/instructor-flow-rail";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGenerateQuizMutation } from "@/hooks/api/use-generate-quiz-mutation";
import { useLecturesQuery } from "@/hooks/api/use-lectures-query";
import { useUploadLectureMutation } from "@/hooks/api/use-upload-lecture-mutation";
import { notifyIfLectureFileTooLarge } from "@/services/lecture-service";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  persistInstructorQuizDraft,
  readInstructorQuizHistory,
  removeInstructorQuizHistoryEntry,
  upsertInstructorQuizHistory,
  type InstructorQuizHistoryEntry,
} from "@/lib/instructor-quiz-history";
import { readLastQuizSet, saveLastQuizSet } from "@/lib/last-quiz-set";
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
  const [quizHistory, setQuizHistory] = useState<InstructorQuizHistoryEntry[]>([]);
  const persistDraftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lecturesQuery = useLecturesQuery(1, 50);
  const lectures = lecturesQuery.data?.lectures ?? [];

  const refreshQuizHistory = useCallback(() => {
    setQuizHistory(readInstructorQuizHistory());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    refreshQuizHistory();
    const last = readLastQuizSet();
    const list = readInstructorQuizHistory();
    const match = last?.quizSetId ? list.find((e) => e.quizSetId === last.quizSetId) : null;
    if (match && match.questions.length > 0) {
      setQuizSetId(match.quizSetId);
      setQuestions(match.questions);
    }
    const saved = sessionStorage.getItem(SESSION_LECTURE_KEY);
    if (match?.lectureId?.trim()) {
      setChosenLectureId(match.lectureId.trim());
      sessionStorage.setItem(SESSION_LECTURE_KEY, match.lectureId.trim());
    } else if (saved) {
      setChosenLectureId(saved);
    }
  }, [refreshQuizHistory]);

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

  useEffect(() => {
    if (!quizSetId.trim() || questions.length === 0) {
      return;
    }
    if (persistDraftTimerRef.current) {
      clearTimeout(persistDraftTimerRef.current);
    }
    persistDraftTimerRef.current = setTimeout(() => {
      persistInstructorQuizDraft({
        quizSetId,
        lectureId: effectiveLectureId || undefined,
        lectureTitle: activeLecture?.title ?? uploadedLecture?.title,
        questions,
      });
      refreshQuizHistory();
    }, 600);
    return () => {
      if (persistDraftTimerRef.current) {
        clearTimeout(persistDraftTimerRef.current);
      }
    };
  }, [
    quizSetId,
    questions,
    effectiveLectureId,
    activeLecture?.title,
    uploadedLecture?.title,
    refreshQuizHistory,
  ]);

  const handleLoadFromHistory = useCallback((entry: InstructorQuizHistoryEntry) => {
    setQuizSetId(entry.quizSetId);
    setQuestions(entry.questions);
    setEditingQuestionId(null);
    if (entry.lectureId?.trim()) {
      setChosenLectureId(entry.lectureId.trim());
      sessionStorage.setItem(SESSION_LECTURE_KEY, entry.lectureId.trim());
    }
    saveLastQuizSet({
      quizSetId: entry.quizSetId,
      lectureTitle: entry.lectureTitle,
      totalQuestions: entry.questions.length,
    });
    toast.success("이 퀴즈 세트를 불러왔습니다.");
  }, []);

  const handleDeleteHistory = useCallback(
    (entry: InstructorQuizHistoryEntry) => {
      removeInstructorQuizHistoryEntry(entry.id);
      refreshQuizHistory();
      if (entry.quizSetId === quizSetId) {
        setQuestions([]);
        setQuizSetId("");
        setEditingQuestionId(null);
      }
      toast.success("기록에서 삭제했습니다.");
    },
    [quizSetId, refreshQuizHistory],
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
    const qs = mode === "replace" ? data.quizzes : [...questions, ...data.quizzes];
    upsertInstructorQuizHistory({
      quizSetId: data.quiz_set_id,
      lectureId: lecId,
      lectureTitle: meta?.lectureTitle,
      questions: qs,
    });
    refreshQuizHistory();
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
    <section className="space-y-8">
      <FlowPageHeader
        rail={<InstructorFlowRail />}
        title="강의·퀴즈"
        description="강의를 고른 뒤 PDF를 올리면 문항이 생성됩니다. 아래 편집기에서 다듬고 라이브 방으로 넘어가세요."
        actions={
          <Button type="button" onClick={() => window.location.assign("/instructor/sessions")}>
            라이브 방
          </Button>
        }
      />

      <TechDetails title="저장된 퀴즈">
        <div className="space-y-3">
          {quizHistory.length === 0 ? (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              생성한 퀴즈가 없습니다. 아래에서 만들면 여기에 쌓입니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {quizHistory.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-2 rounded-lg border border-border/80 bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {coerceRenderableText(row.lectureTitle) || "제목 없음"} · {row.questions.length}문항
                    </p>
                    <p className="mt-0.5 break-all font-mono text-xs text-muted-foreground">{row.quizSetId}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(row.updatedAt).toLocaleString("ko-KR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => handleLoadFromHistory(row)}>
                      불러오기
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => handleDeleteHistory(row)}>
                      삭제
                    </Button>
                    <Link
                      href={`/instructor/sessions?quiz_set_id=${encodeURIComponent(row.quizSetId)}`}
                      className={cn(buttonVariants({ variant: "default", size: "sm" }), "inline-flex")}
                    >
                      라이브
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </TechDetails>

      <FlowSurface kicker="대상" title="강의 선택" description="목록에서 고르거나 강의 ID를 직접 입력하세요.">
        <div className="space-y-3">
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
        </div>
      </FlowSurface>

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
              if (notifyIfLectureFileTooLarge(file)) {
                return;
              }
              setPdfFile(file);
              if (!title.trim() && !activeLecture) {
                setTitle(file.name.replace(/\.[^/.]+$/, ""));
              }
            }
          }}
        >
          <CardHeader>
            <CardTitle>PDF 올리고 퀴즈 생성</CardTitle>
            <CardDescription>
              {activeLecture
                ? "선택한 강의에 자료를 추가하고 퀴즈를 만듭니다."
                : "새 강의면 제목·파일로 강의를 만들고, 이후에는 위에서 같은 강의를 골라 자료를 더할 수 있습니다."}
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
                onChange={(event) => {
                  const f = event.target.files?.[0] ?? null;
                  if (f && notifyIfLectureFileTooLarge(f)) {
                    event.target.value = "";
                    setPdfFile(null);
                    return;
                  }
                  setPdfFile(f);
                }}
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
            <p className="mt-3 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {uploadLectureMutation.isPending
                ? "파일 업로드 중…"
                : generateQuizMutation.isPending
                  ? "퀴즈 문항 생성 중…"
                  : effectiveLectureId
                    ? "같은 강의로 아래에서 문항을 더 붙이거나 덮어쓸 수 있습니다."
                    : "강의를 고른 뒤 PDF를 올리면 퀴즈 생성이 시작됩니다."}
            </p>
          </CardContent>
        </Card>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle>문항 더 만들기 · 덮어쓰기</CardTitle>
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
          <CardTitle>문항 편집</CardTitle>
          <CardDescription>가다듬은 뒤 라이브 방에서 퀴즈를 엽니다.</CardDescription>
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
