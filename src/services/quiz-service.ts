import { apiRequest } from "@/lib/api-client";
import { normalizeGenerateQuizResponse } from "@/lib/normalize-quiz-shape";
import type { GenerateQuizRequest, GenerateQuizResponse } from "@/types/api";

export const quizService = {
  async generate(payload: GenerateQuizRequest): Promise<GenerateQuizResponse> {
    const res = await apiRequest<GenerateQuizResponse, GenerateQuizRequest>({
      method: "POST",
      url: "/quizzes/generate",
      data: payload,
    });
    return normalizeGenerateQuizResponse(res);
  },
};
