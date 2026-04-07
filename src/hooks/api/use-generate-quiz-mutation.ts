"use client";

import { useMutation } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { quizService } from "@/services/quiz-service";
import type { GenerateQuizRequest } from "@/types/api";

export const useGenerateQuizMutation = () =>
  useMutation({
    mutationKey: queryKeys.quizzes.generate,
    mutationFn: (payload: GenerateQuizRequest) => quizService.generate(payload),
  });
