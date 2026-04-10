import { apiClient, apiRequest } from "@/lib/api-client";
import type { Lecture, LectureEnrollResponse, LecturesListResponse, UploadLectureRequest } from "@/types/api";

interface LectureUploadResponse {
  lecture_id: string;
  title: string;
  file_url: string;
  text_length: number;
  created_at: string;
}

export const lectureService = {
  list(page = 1, limit = 20) {
    return apiRequest<LecturesListResponse>({
      method: "GET",
      url: "/lectures",
      params: { page, limit },
    });
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
    const response = await apiClient.post<LectureUploadResponse>("/lectures/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      lecture_id: response.data.lecture_id,
      title: response.data.title,
      file_url: response.data.file_url,
      text_length: response.data.text_length,
      created_at: response.data.created_at,
    };
  },
};
