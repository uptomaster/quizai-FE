"use client";

import { useMutation } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { authService } from "@/services/auth-service";
import type { AuthRequest } from "@/types/api";

export const useRegisterMutation = () =>
  useMutation({
    mutationKey: queryKeys.auth.all,
    mutationFn: (payload: AuthRequest) => authService.register(payload),
  });
