import { getInstructorQuizHistoryByQuizSetId } from "@/lib/instructor-quiz-history";
import type { LastQuizSetInfo } from "@/lib/last-quiz-set";

const STORAGE_KEY = "quizai:sessionLectureLabels";
const SCHEMA_V = 1 as const;
const MAX_ROWS = 80;

type Row = { v: typeof SCHEMA_V; session_id: string; label: string; savedAt: string };

function readRows(): Row[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (r): r is Row =>
        r &&
        typeof r === "object" &&
        (r as Row).v === SCHEMA_V &&
        typeof (r as Row).session_id === "string" &&
        typeof (r as Row).label === "string",
    );
  } catch {
    return [];
  }
}

function writeRows(rows: Row[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, MAX_ROWS)));
  } catch {
    // quota
  }
}

/** 라이브 방을 열 때 등 — 대시보드 `lecture_title`이 비었을 때 쓸 강의/세션 표시 이름 */
export function rememberSessionLectureLabel(sessionId: string, label: string): void {
  const id = sessionId.trim();
  const text = label.trim();
  if (!id || !text) {
    return;
  }
  const rows = readRows().filter((r) => r.session_id !== id);
  rows.unshift({
    v: SCHEMA_V,
    session_id: id,
    label: text,
    savedAt: new Date().toISOString(),
  });
  writeRows(rows);
}

export function readSessionLectureLabel(sessionId: string): string | null {
  const id = sessionId.trim();
  if (!id) {
    return null;
  }
  const hit = readRows().find((r) => r.session_id === id);
  return hit?.label?.trim() || null;
}

/** 퀴즈 세트·빌더 힌트·로컬 히스토리로 강의/세션에 붙일 이름 추론 */
export function inferSessionListTitle(opts: {
  quizSetId: string;
  lastQuizHint: LastQuizSetInfo | null;
  useCustomQuizSetId: boolean;
}): string | null {
  const id = opts.quizSetId.trim();
  if (!id) {
    return null;
  }
  if (!opts.useCustomQuizSetId && opts.lastQuizHint?.quizSetId === id) {
    const t = opts.lastQuizHint.lectureTitle?.trim();
    if (t) {
      return t;
    }
  }
  const entry = getInstructorQuizHistoryByQuizSetId(id);
  const fromHistory = entry?.lectureTitle?.trim();
  if (fromHistory) {
    return fromHistory;
  }
  return null;
}
