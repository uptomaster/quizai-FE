"use client";

import { useMutation } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { lectureService } from "@/services/lecture-service";
import type { UploadLectureRequest } from "@/types/api";

export const useUploadLectureMutation = () =>
  useMutation({
    mutationKey: queryKeys.lectures.upload,
    mutationFn: (payload: UploadLectureRequest) => lectureService.uploadPdf(payload),
  });
