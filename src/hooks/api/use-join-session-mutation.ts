"use client";

import { useMutation } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { sessionService, type JoinSessionRequest } from "@/services/session-service";

export const useJoinSessionMutation = () =>
  useMutation({
    mutationKey: queryKeys.sessions.join,
    mutationFn: (payload: JoinSessionRequest) => sessionService.join(payload),
  });
