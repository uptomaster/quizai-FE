import { apiRequest } from "@/lib/api-client";
import { normalizeAuthSessionPayload, type AuthSessionPayload } from "@/lib/auth-response-normalize";
import type { AuthRequest } from "@/types/api";

export type { AuthSessionPayload };

export const authService = {
  /** 로그인은 이메일·비밀번호만 전달합니다(역할은 서버·JWT가 기준). */
  async login(payload: AuthRequest): Promise<AuthSessionPayload> {
    const raw = await apiRequest<unknown, { email: string; password: string }>({
      method: "POST",
      url: "/auth/login",
      data: { email: payload.email, password: payload.password },
    });
    return normalizeAuthSessionPayload(raw);
  },
  async register(payload: AuthRequest): Promise<AuthSessionPayload> {
    const raw = await apiRequest<unknown, AuthRequest>({
      method: "POST",
      url: "/auth/register",
      data: payload,
    });
    return normalizeAuthSessionPayload(raw);
  },
};
