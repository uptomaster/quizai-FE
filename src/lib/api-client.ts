import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import { toast } from "sonner";

import type { ApiErrorPayload } from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:8000";

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
    const fallbackMessage = "잠시 후 다시 시도해주세요.";
    const message =
      axios.isAxiosError<ApiErrorPayload>(error) &&
      (error.response?.data?.detail || error.response?.data?.message)
        ? (error.response?.data?.detail || error.response?.data?.message)!
        : fallbackMessage;

    toast.error(message);
    throw error;
  }
};
