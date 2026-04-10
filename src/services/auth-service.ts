import { apiRequest } from "@/lib/api-client";
import { normalizeAuthSessionPayload, type AuthSessionPayload } from "@/lib/auth-response-normalize";
import type { AuthRequest } from "@/types/api";

export type { AuthSessionPayload };

export const authService = {
  async login(payload: AuthRequest): Promise<AuthSessionPayload> {
    const raw = await apiRequest<unknown, AuthRequest>({
      method: "POST",
      url: "/auth/login",
      data: payload,
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
