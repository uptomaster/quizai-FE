import { apiRequest } from "@/lib/api-client";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import type { StudentMyQuizResultsResponse, StudentMyQuizSummary } from "@/types/api";

const GRADES = new Set(["excellent", "needs_practice", "needs_review"]);

const normalizeQuizSummary = (raw: unknown): StudentMyQuizSummary => {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const session_id = coerceRenderableText(row.session_id) || "";
  const titleRaw = row.title;
  const title =
    titleRaw === null || titleRaw === undefined
      ? undefined
      : coerceRenderableText(titleRaw) || undefined;
  const attended_at =
    typeof row.attended_at === "string" ? row.attended_at : undefined;
  const my_score =
    typeof row.my_score === "number" && Number.isFinite(row.my_score) ? row.my_score : undefined;
  const g = row.grade;
  const grade: StudentMyQuizSummary["grade"] =
    typeof g === "string" && GRADES.has(g)
      ? (g as StudentMyQuizSummary["grade"])
      : undefined;

  return { session_id, title, attended_at, my_score, grade };
};

export const studentService = {
  /** 백엔드에 해당 GET이 없으면 404 → 빈 목록 (콘솔 네트워크 404는 브라우저에 남을 수 있음). */
  async listMyQuizResults(): Promise<StudentMyQuizResultsResponse> {
    const res = await apiRequest<StudentMyQuizResultsResponse>({
      method: "GET",
      url: "/students/me/quiz-results",
      emptyOn404: { results: [] },
    });
    const raw = res as unknown as Record<string, unknown>;
    let list: unknown[] = [];
    if (Array.isArray(raw.results)) {
      list = raw.results;
    } else if (raw.data && typeof raw.data === "object") {
      const inner = raw.data as Record<string, unknown>;
      if (Array.isArray(inner.results)) {
        list = inner.results;
      }
    }
    return { results: list.map(normalizeQuizSummary) };
  },
};
