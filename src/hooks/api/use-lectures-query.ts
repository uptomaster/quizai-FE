"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { lectureService } from "@/services/lecture-service";

export const useLecturesQuery = (page = 1, limit = 20) =>
  useQuery({
    queryKey: queryKeys.lectures.list(page, limit),
    queryFn: () => lectureService.list(page, limit),
  });
