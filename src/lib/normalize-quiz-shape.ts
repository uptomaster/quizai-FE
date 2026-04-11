import type { GenerateQuizResponse, QuizQuestion } from "@/types/api";

/**
 * 백엔드가 문자열 대신 `{ label, text }` 등으로 줄 때 UI/React #31 방지.
 * 질문·선택지 공통으로 사용합니다.
 */
export const coerceRenderableText = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(coerceRenderableText).filter(Boolean).join(" ");
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (typeof o.label === "string" && typeof o.text === "string") {
      return `${o.label}. ${o.text}`;
    }
    if (typeof o.text === "string") {
      return o.text;
    }
    if (typeof o.label === "string") {
      return o.label;
    }
    if (typeof o.question === "string") {
      return o.question;
    }
  }
  return "";
};

export const coerceOptionText = coerceRenderableText;
export const coerceQuestionText = coerceRenderableText;

const OPTION_KEYS = ["options", "choices", "alternatives", "option_list"] as const;

const extractOptionsArray = (r: Record<string, unknown>): unknown[] => {
  for (const key of OPTION_KEYS) {
    const v = r[key];
    if (Array.isArray(v)) {
      return v;
    }
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const vals = Object.values(v as Record<string, unknown>);
      if (vals.length > 0) {
        return vals;
      }
    }
  }
  return [];
};

/** 일부 백엔드가 `{ data: { quiz_set_id, quizzes } }` 처럼 한 겹 싸는 경우 병합 */
const unwrapGeneratePayload = (data: unknown): unknown => {
  if (!data || typeof data !== "object") {
    return data;
  }
  const d = data as Record<string, unknown>;
  const inner = d.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return { ...d, ...(inner as Record<string, unknown>) };
  }
  return data;
};

export const normalizeQuizQuestion = (raw: unknown): QuizQuestion => {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const id = typeof r.id === "string" ? r.id : String(r.id ?? "");
  const question = coerceRenderableText(r.question ?? r.text ?? r.stem ?? r.prompt);
  const optionsRaw = extractOptionsArray(r);
  const options = optionsRaw.map(coerceRenderableText);
  const answerRaw = r.answer ?? r.correct_index ?? r.correct_option;
  const answer =
    typeof answerRaw === "number"
      ? answerRaw
      : typeof answerRaw === "string"
        ? Number.parseInt(answerRaw, 10)
        : Number(answerRaw);
  const explanation =
    r.explanation === null || r.explanation === undefined
      ? null
      : typeof r.explanation === "string"
        ? r.explanation
        : coerceRenderableText(r.explanation);

  return {
    id,
    question,
    options,
    answer: Number.isFinite(answer) ? answer : 0,
    explanation,
  };
};

const QUIZ_LIST_KEYS = ["quizzes", "quiz_items", "questions", "items"] as const;

const extractQuizzesArray = (d: Record<string, unknown>): unknown[] => {
  for (const key of QUIZ_LIST_KEYS) {
    const v = d[key];
    if (Array.isArray(v)) {
      return v;
    }
  }
  return [];
};

const asIdString = (v: unknown): string => {
  if (typeof v === "string" && v.trim().length > 0) {
    return v.trim();
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return String(v);
  }
  return "";
};

export const normalizeGenerateQuizResponse = (data: unknown): GenerateQuizResponse => {
  const unwrapped = unwrapGeneratePayload(data);
  const d = unwrapped && typeof unwrapped === "object" ? (unwrapped as Record<string, unknown>) : {};
  const rawSet =
    d.quiz_set_id ?? d.quizSetId ?? (d as { quiz_set?: unknown }).quiz_set;
  const quiz_set_id = asIdString(rawSet);
  const rawLec = d.lecture_id ?? d.lectureId;
  const lecture_id = asIdString(rawLec);
  const quizzesRaw = extractQuizzesArray(d);
  const quizzes = quizzesRaw.map(normalizeQuizQuestion);
  return { quiz_set_id, lecture_id, quizzes };
};
