"use client";

import { useQuery } from "@tanstack/react-query";

import { getStoredRole } from "@/lib/auth-storage";
import { queryKeys } from "@/lib/query-keys";
import { dashboardService } from "@/services/dashboard-service";

export const useInstructorDashboardQuery = () =>
  useQuery({
    queryKey: queryKeys.dashboard.instructor,
    queryFn: () => dashboardService.getInstructorDashboard(),
    enabled:
      typeof window !== "undefined" && getStoredRole() === "instructor",
  });
