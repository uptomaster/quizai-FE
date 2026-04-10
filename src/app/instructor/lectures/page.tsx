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
import { cn } from "@/lib/utils";
import type { GenerateQuizRequest, Lecture, QuizQuestion } from "@/types/api";

type CourseStatus = "진행 중" | "모집 중" | "준비 중";
type SortMode = "latest" | "students" | "name";

interface OpenedCourse {
  id: string;
  name: string;
  week: string;
  students: number;
  status: CourseStatus;
  lectureId: string;
  summary: string;
  category: string;
  totalLectures: number;
  completionRate: number;
  updatedAt: string;
}

const STATUS_OPTIONS: Array<"all" | CourseStatus> = ["all", "진행 중", "모집 중", "준비 중"];

const STATUS_BADGE_CLASS: Record<CourseStatus, string> = {
  "진행 중": "bg-emerald-500/15 text-emerald-700",
  "모집 중": "bg-sky-500/15 text-sky-700",
  "준비 중": "bg-amber-500/15 text-amber-700",
};

export default function InstructorLecturesPage() {
  const [title, setTitle] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [lectureId, setLectureId] = useState("");
  const [count, setCount] = useState("5");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizSetId, setQuizSetId] = useState("");
  const [uploadedLecture, setUploadedLecture] = useState<Lecture | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CourseStatus>("all");
  const [sortMode, setSortMode] = useState<SortMode>("latest");
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const uploadLectureMutation = useUploadLectureMutation();
  const generateQuizMutation = useGenerateQuizMutation();

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

  const openedCourses = useMemo(
    (): OpenedCourse[] => [
      {
        id: "course-01",
        name: "데이터베이스 기초",
        week: "화/목 10:00",
        students: 42,
        status: "진행 중",
        lectureId: uploadedLecture?.id ?? "db-101",
        summary: "ERD 설계, 정규화, SQL 기본 쿼리를 다루는 코스",
        category: "CS Core",
        totalLectures: 16,
        completionRate: 78,
        updatedAt: "2026-04-06",
      },
      {
        id: "course-02",
        name: "웹 프론트엔드 실습",
        week: "월/수 14:00",
        students: 58,
        status: "모집 중",
        lectureId: "fe-201",
        summary: "React 기반 컴포넌트 설계와 상태 관리 실전",
        category: "Frontend",
        totalLectures: 20,
        completionRate: 0,
        updatedAt: "2026-04-07",
      },
      {
        id: "course-03",
        name: "AI 기반 서비스 기획",
        week: "금 16:00",
        students: 35,
        status: "준비 중",
        lectureId: "ai-301",
        summary: "생성형 AI API를 활용한 제품 설계/평가 방법론",
        category: "AI Product",
        totalLectures: 12,
        completionRate: 0,
        updatedAt: "2026-04-05",
      },
      {
        id: "course-04",
        name: "자료구조와 알고리즘",
        week: "화/금 13:00",
        students: 67,
        status: "진행 중",
        lectureId: "algo-401",
        summary: "배열/트리/그래프와 시간복잡도 분석 중심의 문제해결 트레이닝",
        category: "Algorithm",
        totalLectures: 24,
        completionRate: 63,
        updatedAt: "2026-04-04",
      },
    ],
    [uploadedLecture?.id],
  );

  const courseStats = useMemo(() => {
    const totalStudents = openedCourses.reduce((acc, cur) => acc + cur.students, 0);
    const averageCompletion =
      openedCourses.length > 0
        ? Math.round(
            openedCourses.reduce((acc, cur) => acc + cur.completionRate, 0) /
              openedCourses.length,
          )
        : 0;

    return {
      totalCourses: openedCourses.length,
      totalStudents,
      averageCompletion,
    };
  }, [openedCourses]);

  const displayedCourses = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    let filtered = openedCourses.filter((course) => {
      const matchesStatus =
        statusFilter === "all" ? true : course.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : `${course.name} ${course.category} ${course.summary}`
              .toLowerCase()
              .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });

    filtered = [...filtered].sort((a, b) => {
      if (sortMode === "students") {
        return b.students - a.students;
      }

      if (sortMode === "name") {
        return a.name.localeCompare(b.name, "ko");
      }

      return b.updatedAt.localeCompare(a.updatedAt);
    });

    return filtered;
  }, [openedCourses, search, sortMode, statusFilter]);

  return (
    <section className="space-y-6">
      <PageHero
        title="강의 운영 스튜디오"
        description="개설 과목 관리, PDF 업로드, AI 퀴즈 생성을 하나의 워크플로우로 운영하세요."
        className="from-cyan-500/25 via-fuchsia-500/25 to-indigo-500/25"
        actions={
          <>
            <Button type="button" variant="secondary">
              새 과목 개설
            </Button>
            <Button type="button" variant="outline">
              커리큘럼 템플릿
            </Button>
          </>
        }
      />
      <HelperTip
        title="빠른 시작 가이드"
        steps={[
          "강의 PDF 업로드를 먼저 완료합니다.",
          "자동으로 입력된 lecture_id를 확인합니다.",
          "문항 수를 지정하고 퀴즈 생성을 실행합니다.",
        ]}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/0">
          <CardHeader>
            <CardTitle>개설 과목</CardTitle>
            <CardDescription>현재 운영 중인 과목 수</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{courseStats.totalCourses}</CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-500/0">
          <CardHeader>
            <CardTitle>총 수강생</CardTitle>
            <CardDescription>전체 과목 등록 인원</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{courseStats.totalStudents}</CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/0">
          <CardHeader>
            <CardTitle>평균 완주율</CardTitle>
            <CardDescription>과목별 진행률 평균</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{courseStats.averageCompletion}%</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>개설 과목</CardTitle>
          <CardDescription>검색/필터/정렬로 원하는 과목을 빠르게 찾고 세부 정보를 펼쳐보세요.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 md:grid-cols-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="과목명/카테고리/설명 검색"
            />
            <div className="flex items-center gap-2">
              {STATUS_OPTIONS.map((status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={statusFilter === status ? "default" : "outline"}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all" ? "전체" : status}
                </Button>
              ))}
            </div>
            <select
              value={sortMode}
              onChange={(event) => setSortMode(event.target.value as SortMode)}
              className="h-9 rounded-lg border bg-background px-3 text-sm"
            >
              <option value="latest">최신 업데이트순</option>
              <option value="students">수강인원순</option>
              <option value="name">과목명순</option>
            </select>
          </div>

          <div className="grid gap-3">
            {displayedCourses.map((course) => {
              const expanded = expandedCourseId === course.id;
              return (
                <article
                  key={course.id}
                  className="rounded-2xl border bg-gradient-to-r from-white/80 to-white/30 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">{course.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {course.week} | {course.category} | 최근 수정 {course.updatedAt}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        STATUS_BADGE_CLASS[course.status],
                      )}
                    >
                      {course.status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-muted-foreground md:grid-cols-4">
                    <p>
                      수강 인원:{" "}
                      <span className="font-medium text-foreground">{course.students}명</span>
                    </p>
                    <p>
                      총 차시:{" "}
                      <span className="font-medium text-foreground">{course.totalLectures}차시</span>
                    </p>
                    <p>
                      완주율:{" "}
                      <span className="font-medium text-foreground">{course.completionRate}%</span>
                    </p>
                    <p>
                  lecture_id:{" "}
                      <span className="font-medium text-foreground">{course.lectureId}</span>
                    </p>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${course.completionRate}%` }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setLectureId(course.lectureId)}
                    >
                      이 ID로 퀴즈 생성
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={expanded ? "default" : "secondary"}
                      onClick={() =>
                        setExpandedCourseId((prev) => (prev === course.id ? null : course.id))
                      }
                    >
                      {expanded ? "요약 닫기" : "과목 열어보기"}
                    </Button>
                  </div>

                  <div
                    className={cn(
                      "grid transition-all duration-300",
                      expanded ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="rounded-lg border bg-background/70 p-3 text-sm text-muted-foreground">
                        {course.summary}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {displayedCourses.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              검색/필터 조건에 맞는 과목이 없습니다.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent">
          <CardHeader>
            <CardTitle>이번 주 라이브 세션 일정</CardTitle>
            <CardDescription>과목 운영 계획을 미리 확인하고 세션을 준비하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border bg-background/80 p-3">
              <p className="font-medium">화 10:00 - 데이터베이스 기초</p>
              <p className="text-muted-foreground">퀴즈 세트: 정규화/조인/인덱스</p>
            </div>
            <div className="rounded-lg border bg-background/80 p-3">
              <p className="font-medium">수 14:00 - 웹 프론트엔드 실습</p>
              <p className="text-muted-foreground">퀴즈 세트: 상태관리/비동기 흐름</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-fuchsia-500/10 to-transparent">
          <CardHeader>
            <CardTitle>강의 운영 인사이트</CardTitle>
            <CardDescription>플랫폼 품질 향상을 위한 액션 포인트입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• 모집 중 과목의 홍보 문구와 오리엔테이션 콘텐츠를 강화하세요.</p>
            <p>• 진행 중 과목 2개에서 퀴즈 참여율이 70% 미만입니다.</p>
            <p>• 다음 주 신규 템플릿(객관식+주관식 혼합) 적용 권장.</p>
          </CardContent>
        </Card>
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
              placeholder="강의 제목"
              required
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
          {uploadedLecture ? (
            <p className="mt-3 text-sm text-muted-foreground">
              업로드 완료 lecture_id:{" "}
              <span className="font-medium text-foreground">{uploadedLecture.id}</span>
            </p>
          ) : null}
          {quizSetId ? (
            <p className="mt-1 text-xs text-muted-foreground">
              최근 생성 quiz_set_id: <span className="font-medium">{quizSetId}</span>
            </p>
          ) : null}
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
            <Card key={question.id} className="transition-all duration-300 hover:shadow-md">
              <CardContent className="pt-6">
                <p className="font-medium">{question.question}</p>
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
