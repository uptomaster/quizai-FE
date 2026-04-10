"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { lectureService } from "@/services/lecture-service";

export const useEnrollLectureMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: queryKeys.lectures.enroll,
    mutationFn: (lectureId: string) => lectureService.enroll(lectureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lectures.all });
    },
  });
};
