import { apiClient } from "@/lib/api-client";
import type { Lecture, UploadLectureRequest } from "@/types/api";

export const lectureService = {
  async uploadPdf(payload: UploadLectureRequest): Promise<Lecture> {
    const formData = new FormData();
    formData.append("file", payload.file);
    if (payload.title) {
      formData.append("title", payload.title);
    }
    if (payload.description) {
      formData.append("description", payload.description);
    }

    const response = await apiClient.post<Lecture>("/lectures/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
};
