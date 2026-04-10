import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";

import { clearAuthSession } from "@/lib/auth-storage";
import type { ApiErrorPayload } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "https://quizai-api.onrender.com";

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

export const apiRequest = async <TResponse, TRequest = undefined>(
  config: AxiosRequestConfig<TRequest>,
): Promise<TResponse> => {
  try {
    const response = await apiClient.request<TResponse, { data: TResponse }>(
      config,
    );
    return response.data;
  } catch (error) {
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
