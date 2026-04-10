import { apiRequest } from "@/lib/api-client";
import type { AppUser, AuthRequest, AuthResponse, AuthTokens } from "@/types/api";

export interface AuthSessionPayload {
  user: AppUser;
  tokens: AuthTokens;
}

const mapAuthResponse = (response: AuthResponse): AuthSessionPayload => ({
  user: response.user,
  tokens: {
    accessToken: response.access_token,
    tokenType: response.token_type,
  },
});

export const authService = {
  async login(payload: AuthRequest): Promise<AuthSessionPayload> {
    const response = await apiRequest<AuthResponse, AuthRequest>({
      method: "POST",
      url: "/auth/login",
      data: payload,
    });
    return mapAuthResponse(response);
  },
  async register(payload: AuthRequest): Promise<AuthSessionPayload> {
    const response = await apiRequest<AuthResponse, AuthRequest>({
      method: "POST",
      url: "/auth/register",
      data: payload,
    });
    return mapAuthResponse(response);
  },
};
