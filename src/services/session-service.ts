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
      return createLocalSession(payload.quiz_set_id, payload.time_limit);
    }
  },
  join(payload: JoinSessionRequest) {
    const localSession = findSessionByJoinCode(payload.joinCode);
    if (localSession) {
      return Promise.resolve(localSession);
    }

    return Promise.reject(
      new Error("Swagger 스펙에 /sessions/join 엔드포인트가 없어 로컬 세션 코드만 지원됩니다."),
    );
  },
};
