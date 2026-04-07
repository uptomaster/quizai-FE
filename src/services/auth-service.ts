import { apiRequest } from "@/lib/api-client";
import type { AuthRequest, AuthResponse } from "@/types/api";

export const authService = {
  login(payload: AuthRequest) {
    return apiRequest<AuthResponse, AuthRequest>({
      method: "POST",
      url: "/auth/login",
      data: payload,
    });
  },
  register(payload: AuthRequest) {
    return apiRequest<AuthResponse, AuthRequest>({
      method: "POST",
      url: "/auth/register",
      data: payload,
    });
  },
};
