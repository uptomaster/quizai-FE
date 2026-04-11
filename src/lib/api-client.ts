import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";

import { clearAuthSession } from "@/lib/auth-storage";
import type { ApiErrorPayload } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "/api/proxy";

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("access_token");
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorPayload>) => Promise.reject(error),
);

type ApiRequestConfig<TRequest, TResponse> = AxiosRequestConfig<TRequest> & {
  /** 백엔드에 라우트가 아직 없을 때(404) 이 값을 반환하고 토스트하지 않습니다. */
  emptyOn404?: TResponse;
};

export const apiRequest = async <TResponse, TRequest = undefined>(
  config: ApiRequestConfig<TRequest, TResponse>,
): Promise<TResponse> => {
  const { emptyOn404, ...axiosConfig } = config;
  try {
    const response = await apiClient.request<TResponse, { data: TResponse }>(axiosConfig);
    return response.data;
  } catch (error) {
    if (
      emptyOn404 !== undefined &&
      axios.isAxiosError<ApiErrorPayload>(error) &&
      error.response?.status === 404
    ) {
      return emptyOn404;
    }
    if (axios.isAxiosError<ApiErrorPayload>(error) && error.response?.status === 401) {
      clearAuthSession();

      if (typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        const alreadyOnAuthPage =
          currentPath.startsWith("/login") || currentPath.startsWith("/register");

        if (!alreadyOnAuthPage) {
          window.location.assign("/login");
        }
      }

      toast.error("인증이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.");
      throw error;
    }

    const fallbackMessage = "잠시 후 다시 시도해주세요.";
    let message = fallbackMessage;

    if (axios.isAxiosError<ApiErrorPayload>(error)) {
      const detail = error.response?.data?.detail;

      if (typeof detail === "string" && detail.trim().length > 0) {
        message = detail;
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
    }

    toast.error(message);
    throw error;
  }
};
