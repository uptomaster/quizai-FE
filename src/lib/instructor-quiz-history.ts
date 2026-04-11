import type { QuizQuestion } from "@/types/api";

const STORAGE_KEY = "quizai:instructorQuizHistory";
const MAX_ENTRIES = 50;

export type InstructorQuizHistoryEntry = {
  /** 클라이언트 목록용 고유 id */
  id: string;
  quizSetId: string;
  lectureId?: string;
  lectureTitle?: string;
  questions: QuizQuestion[];
  updatedAt: string;
};

function safeParse(raw: string | null): InstructorQuizHistoryEntry[] {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (row): row is InstructorQuizHistoryEntry =>
        typeof row === "object" &&
        row !== null &&
        typeof (row as InstructorQuizHistoryEntry).id === "string" &&
        typeof (row as InstructorQuizHistoryEntry).quizSetId === "string" &&
        Array.isArray((row as InstructorQuizHistoryEntry).questions),
    );
  } catch {
    return [];
  }
}

export function readInstructorQuizHistory(): InstructorQuizHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const list = safeParse(localStorage.getItem(STORAGE_KEY));
    return [...list].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  } catch {
    return [];
  }
}

function writeList(list: InstructorQuizHistoryEntry[]): void {
  try {
    const trimmed = list.slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // quota
  }
}

export function upsertInstructorQuizHistory(entry: {
  quizSetId: string;
  lectureId?: string;
  lectureTitle?: string;
  questions: QuizQuestion[];
}): InstructorQuizHistoryEntry {
  const now = new Date().toISOString();
  const list = readInstructorQuizHistory();
  const idx = list.findIndex((e) => e.quizSetId === entry.quizSetId);
  let row: InstructorQuizHistoryEntry;
  if (idx >= 0) {
    row = {
      ...list[idx],
      lectureId: entry.lectureId ?? list[idx].lectureId,
      lectureTitle: entry.lectureTitle ?? list[idx].lectureTitle,
      questions: entry.questions,
      updatedAt: now,
    };
    list.splice(idx, 1);
  } else {
    row = {
      id: crypto.randomUUID(),
      quizSetId: entry.quizSetId,
      lectureId: entry.lectureId,
      lectureTitle: entry.lectureTitle,
      questions: entry.questions,
      updatedAt: now,
    };
  }
  writeList([row, ...list.filter((e) => e.quizSetId !== entry.quizSetId)]);
  return row;
}

/** 편집 중인 문항을 같은 퀴즈 세트에 반영 (새로고침 대비). */
export function persistInstructorQuizDraft(entry: {
  quizSetId: string;
  lectureId?: string;
  lectureTitle?: string;
  questions: QuizQuestion[];
}): void {
  if (!entry.quizSetId.trim()) {
    return;
  }
  upsertInstructorQuizHistory(entry);
}

export function removeInstructorQuizHistoryEntry(clientId: string): void {
  const list = readInstructorQuizHistory().filter((e) => e.id !== clientId);
  writeList(list);
}

export function getInstructorQuizHistoryByQuizSetId(
  quizSetId: string,
): InstructorQuizHistoryEntry | null {
  if (!quizSetId.trim()) {
    return null;
  }
  return readInstructorQuizHistory().find((e) => e.quizSetId === quizSetId) ?? null;
}
