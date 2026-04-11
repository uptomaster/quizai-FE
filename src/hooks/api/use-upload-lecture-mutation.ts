"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { lectureService } from "@/services/lecture-service";
import type { UploadLectureRequest } from "@/types/api";

export const useUploadLectureMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: queryKeys.lectures.upload,
    mutationFn: (payload: UploadLectureRequest) => lectureService.uploadPdf(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lectures.all });
    },
  });
};
