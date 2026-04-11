import { apiRequest } from "@/lib/api-client";
import type { StudentMyQuizResultsResponse } from "@/types/api";

export const studentService = {
  /** 백엔드에 해당 GET이 없으면 404 → 빈 목록 (콘솔 네트워크 404는 브라우저에 남을 수 있음). */
  listMyQuizResults() {
    return apiRequest<StudentMyQuizResultsResponse>({
      method: "GET",
      url: "/students/me/quiz-results",
      emptyOn404: { results: [] },
    });
  },
};
