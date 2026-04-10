import { apiRequest } from "@/lib/api-client";
import type { Session, SessionResult, StartSessionRequest } from "@/types/api";

export interface JoinSessionRequest {
  joinCode: string;
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
    return apiRequest<Session, { session_code: string }>({
      method: "POST",
      url: "/sessions/join",
      data: { session_code: payload.joinCode },
    });
  },
  getResult(sessionId: string) {
    return apiRequest<SessionResult>({
      method: "GET",
      url: `/sessions/${sessionId}/result`,
    });
  },
};
