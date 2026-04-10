"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { sessionService } from "@/services/session-service";

export const useSessionResultQuery = (sessionId: string) =>
  useQuery({
    queryKey: queryKeys.sessions.result(sessionId),
    queryFn: () => sessionService.getResult(sessionId),
    enabled: sessionId.trim().length > 0,
  });
