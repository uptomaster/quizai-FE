"use client";

import { useMutation } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { sessionService } from "@/services/session-service";
import type { StartSessionRequest } from "@/types/api";

export const useStartSessionMutation = () =>
  useMutation({
    mutationKey: queryKeys.sessions.start,
    mutationFn: (payload: StartSessionRequest) => sessionService.start(payload),
  });
