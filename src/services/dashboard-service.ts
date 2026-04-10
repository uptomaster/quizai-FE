import { apiRequest } from "@/lib/api-client";
import type { AdminDashboardResponse, InstructorDashboardResponse } from "@/types/api";

export const dashboardService = {
  getInstructorDashboard() {
    return apiRequest<InstructorDashboardResponse>({
      method: "GET",
      url: "/dashboard/instructor",
    });
  },
  getAdminDashboard() {
    return apiRequest<AdminDashboardResponse>({
      method: "GET",
      url: "/dashboard/admin",
    });
  },
};
