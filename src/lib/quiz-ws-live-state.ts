import { coerceOptionText, coerceQuestionText, coerceRenderableText } from "@/lib/normalize-quiz-shape";

export type QuizWsEvent =
  | { type: "session_joined"; payload: { participant_count: number; nickname: string } }
  | {
      type: "quiz_started";
      payload: { quiz_id: string; question: string; options: string[]; time_limit: number };
    }
  | {
      type: "answer_update";
      payload: { total: number; answered: number; rate: number; distribution: number[] };
    }
  | { type: "answer_revealed"; payload: { correct_option: number; explanation?: string | null } }
  | { type: "session_ended"; payload: { session_id: string } }
  | { type: "participant_answer"; payload: { nickname: string; quiz_id: string; submitted: boolean } }
  | { type: "error"; payload: { message: string } };

export type LiveParticipantRow = {
  nickname: string;
  joinedAt: number;
  answeredCurrent: boolean;
};

export type LiveSessionState = {
  participantCount: number | null;
  participants: LiveParticipantRow[];
  activeQuiz: {
    quiz_id: string;
    question: string;
    options: string[];
    time_limit: number;
    startedAt: number;
  } | null;
  answerProgress: { answered: number; total: number; rate: number } | null;
};

export const initialLiveSessionState = (): LiveSessionState => ({
  participantCount: null,
  participants: [],
  activeQuiz: null,
  answerProgress: null,
});

export const reduceLiveSessionState = (
  prev: LiveSessionState,
  event: QuizWsEvent,
): LiveSessionState => {
  switch (event.type) {
    case "session_joined": {
      const { nickname, participant_count } = event.payload;
      const exists = prev.participants.some((p) => p.nickname === nickname);
      const participants = exists
        ? prev.participants.map((p) =>
            p.nickname === nickname ? { ...p, joinedAt: Date.now() } : p,
          )
        : [...prev.participants, { nickname, joinedAt: Date.now(), answeredCurrent: false }];
      return {
        ...prev,
        participantCount: participant_count,
        participants,
      };
    }
    case "quiz_started": {
      const { quiz_id, question, options, time_limit } = event.payload;
      const safeOptions = Array.isArray(options) ? options : [];
      return {
        ...prev,
        activeQuiz: {
          quiz_id,
          question,
          options: safeOptions,
          time_limit,
          startedAt: Date.now(),
        },
        answerProgress: null,
        participants: prev.participants.map((p) => ({ ...p, answeredCurrent: false })),
      };
    }
    case "answer_update":
      return {
        ...prev,
        answerProgress: {
          answered: event.payload.answered,
          total: event.payload.total,
          rate: event.payload.rate,
        },
      };
    case "participant_answer": {
      const { nickname, submitted } = event.payload;
      const exists = prev.participants.some((p) => p.nickname === nickname);
      const participants = exists
        ? prev.participants.map((p) =>
            p.nickname === nickname ? { ...p, answeredCurrent: submitted } : p,
          )
        : [...prev.participants, { nickname, joinedAt: Date.now(), answeredCurrent: submitted }];
      return {
        ...prev,
        participants,
      };
    }
    case "session_ended":
      return {
        ...prev,
        activeQuiz: null,
        answerProgress: null,
      };
    case "answer_revealed":
    case "error":
    default:
      return prev;
  }
};

/** Lenient parse: unknown shapes fall back to null (caller may still use last raw message). */
export const tryParseQuizWsEvent = (raw: unknown): QuizWsEvent | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as { type?: string; payload?: unknown };
  const t = o.type;
  const p = o.payload;
  if (typeof t !== "string" || !p || typeof p !== "object") {
    return null;
  }
  switch (t) {
    case "session_joined": {
      const pl = p as { participant_count?: number; nickname?: unknown };
      if (typeof pl.participant_count !== "number") {
        return null;
      }
      const nickname = coerceRenderableText(pl.nickname).trim() || "참여자";
      return { type: "session_joined", payload: { participant_count: pl.participant_count, nickname } };
    }
    case "quiz_started": {
      const pl = p as {
        quiz_id?: string;
        question?: unknown;
        options?: unknown;
        time_limit?: number;
      };
      if (typeof pl.quiz_id !== "string" || typeof pl.time_limit !== "number" || !Array.isArray(pl.options)) {
        return null;
      }
      const question = coerceQuestionText(pl.question);
      const options = pl.options.map(coerceOptionText);
      if (options.length === 0) {
        return null;
      }
      return {
        type: "quiz_started",
        payload: {
          quiz_id: pl.quiz_id,
          question,
          options,
          time_limit: pl.time_limit,
        },
      };
    }
    case "answer_update": {
      const pl = p as {
        total?: number;
        answered?: number;
        rate?: number;
        distribution?: number[];
      };
      if (
        typeof pl.total !== "number" ||
        typeof pl.answered !== "number" ||
        typeof pl.rate !== "number" ||
        !Array.isArray(pl.distribution)
      ) {
        return null;
      }
      return {
        type: "answer_update",
        payload: {
          total: pl.total,
          answered: pl.answered,
          rate: pl.rate,
          distribution: pl.distribution as number[],
        },
      };
    }
    case "participant_answer": {
      const pl = p as { nickname?: unknown; quiz_id?: string; submitted?: boolean };
      if (typeof pl.quiz_id !== "string" || typeof pl.submitted !== "boolean") {
        return null;
      }
      const nickname = coerceRenderableText(pl.nickname).trim() || "참여자";
      return { type: "participant_answer", payload: { nickname, quiz_id: pl.quiz_id, submitted: pl.submitted } };
    }
    case "answer_revealed": {
      const pl = p as { correct_option?: number; explanation?: unknown };
      if (typeof pl.correct_option !== "number") {
        return null;
      }
      const explanation =
        pl.explanation === null || pl.explanation === undefined
          ? null
          : coerceRenderableText(pl.explanation) || null;
      return {
        type: "answer_revealed",
        payload: { correct_option: pl.correct_option, explanation },
      };
    }
    case "session_ended": {
      const pl = p as { session_id?: string };
      if (typeof pl.session_id !== "string") {
        return null;
      }
      return { type: "session_ended", payload: { session_id: pl.session_id } };
    }
    case "error": {
      const pl = p as { message?: unknown };
      const message = coerceRenderableText(pl.message).trim() || "오류가 발생했습니다.";
      return { type: "error", payload: { message } };
    }
    default:
      return null;
  }
};
