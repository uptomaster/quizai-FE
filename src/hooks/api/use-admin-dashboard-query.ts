"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-keys";
import { dashboardService } from "@/services/dashboard-service";

export const useAdminDashboardQuery = () =>
  useQuery({
    queryKey: queryKeys.dashboard.admin,
    queryFn: () => dashboardService.getAdminDashboard(),
  });
