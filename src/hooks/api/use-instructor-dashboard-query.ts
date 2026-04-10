"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { dashboardService } from "@/services/dashboard-service";

export const useInstructorDashboardQuery = () =>
  useQuery({
    queryKey: queryKeys.dashboard.instructor,
    queryFn: () => dashboardService.getInstructorDashboard(),
  });
