import { apiRequest } from "@/lib/api-client";
import type { GenerateQuizRequest, GenerateQuizResponse } from "@/types/api";

export const quizService = {
  generate(payload: GenerateQuizRequest) {
    return apiRequest<GenerateQuizResponse, GenerateQuizRequest>({
      method: "POST",
      url: "/quizzes/generate",
      data: payload,
    });
  },
};
