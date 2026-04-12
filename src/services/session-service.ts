import { apiRequest } from "@/lib/api-client";
import type { Session, SessionResult, StartSessionRequest } from "@/types/api";

function normalizeSessionResult(raw: SessionResult): SessionResult {
  return {
    ...raw,
    students: Array.isArray(raw.students) ? raw.students : [],
    weak_concepts: Array.isArray(raw.weak_concepts) ? raw.weak_concepts : [],
    quiz_stats: Array.isArray(raw.quiz_stats) ? raw.quiz_stats : [],
    grade_distribution: raw.grade_distribution ?? {
      excellent: 0,
      needs_practice: 0,
      needs_review: 0,
    },
  };
}

export interface JoinSessionRequest {
  joinCode: string;
  /** 입장 시 표시 이름(백엔드 필수에 맞춤). */
  nickname: string;
}

export const sessionService = {
  start(payload: StartSessionRequest) {
    return apiRequest<Session, StartSessionRequest>({
      method: "POST",
      url: "/sessions/start",
      data: payload,
    });
  },
  join(payload: JoinSessionRequest) {
    return apiRequest<Session, { session_code: string; nickname: string }>({
      method: "POST",
      url: "/sessions/join",
      data: { session_code: payload.joinCode, nickname: payload.nickname.trim() },
    });
  },
  getResult(sessionId: string) {
    return apiRequest<SessionResult>({
      method: "GET",
      url: `/sessions/${sessionId}/result`,
    }).then(normalizeSessionResult);
  },
};
