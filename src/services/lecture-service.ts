import { apiClient, apiRequest } from "@/lib/api-client";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import type { Lecture, LectureEnrollResponse, LecturesListResponse, UploadLectureRequest } from "@/types/api";

const normalizeLecture = (raw: unknown): Lecture => {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    lecture_id: coerceRenderableText(r.lecture_id) || String(r.lecture_id ?? ""),
    title: coerceRenderableText(r.title) || "강의",
    file_url: typeof r.file_url === "string" ? r.file_url : undefined,
    text_length: typeof r.text_length === "number" ? r.text_length : undefined,
    quiz_count: typeof r.quiz_count === "number" ? r.quiz_count : undefined,
    created_at: typeof r.created_at === "string" ? r.created_at : new Date().toISOString(),
    is_enrolled: typeof r.is_enrolled === "boolean" ? r.is_enrolled : undefined,
  };
};

interface LectureUploadResponse {
  lecture_id: string;
  title: string;
  file_url: string;
  text_length: number;
  created_at: string;
}

export const lectureService = {
  async list(page = 1, limit = 20): Promise<LecturesListResponse> {
    const res = await apiRequest<LecturesListResponse>({
      method: "GET",
      url: "/lectures",
      params: { page, limit },
    });
    const lectures = Array.isArray(res.lectures) ? res.lectures.map(normalizeLecture) : [];
    const total = typeof res.total === "number" ? res.total : lectures.length;
    return { lectures, total };
  },

  enroll(lectureId: string) {
    return apiRequest<LectureEnrollResponse, Record<string, never>>({
      method: "POST",
      url: `/lectures/${encodeURIComponent(lectureId)}/enroll`,
      data: {},
    });
  },

  async uploadPdf(payload: UploadLectureRequest): Promise<Lecture> {
    const formData = new FormData();
    formData.append("file", payload.file);
    if (payload.title) {
      formData.append("title", payload.title);
    }
    if (payload.lectureId) {
      formData.append("lecture_id", payload.lectureId);
    }
    const response = await apiClient.post<LectureUploadResponse>("/lectures/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return normalizeLecture(response.data as unknown);
  },
};
