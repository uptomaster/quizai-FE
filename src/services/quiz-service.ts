import { apiRequest } from "@/lib/api-client";
import type { GenerateQuizRequest, QuizQuestion } from "@/types/api";

export const quizService = {
  generate(payload: GenerateQuizRequest) {
    return apiRequest<QuizQuestion[], GenerateQuizRequest>({
      method: "POST",
      url: "/quizzes/generate",
      data: payload,
    });
  },
};
