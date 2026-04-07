import { apiRequest } from "@/lib/api-client";
import { createLocalSession, findSessionByJoinCode } from "@/lib/session-code-store";
import type { Session, StartSessionRequest } from "@/types/api";

export interface JoinSessionRequest {
  joinCode: string;
}

export const sessionService = {
  async start(payload: StartSessionRequest) {
    try {
      return await apiRequest<Session, StartSessionRequest>({
        method: "POST",
        url: "/sessions/start",
        data: payload,
      });
    } catch {
      return createLocalSession(payload.lectureId, payload.quizId);
    }
  },
  join(payload: JoinSessionRequest) {
    const localSession = findSessionByJoinCode(payload.joinCode);
    if (localSession) {
      return Promise.resolve(localSession);
    }

    return apiRequest<Session, JoinSessionRequest>({
      method: "POST",
      url: "/sessions/join",
      data: payload,
    });
  },
};
