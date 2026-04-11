"use client";

import { useQuery } from "@tanstack/react-query";

import { getStoredRole } from "@/lib/auth-storage";
import { queryKeys } from "@/lib/query-keys";
import { dashboardService } from "@/services/dashboard-service";

export const useAdminDashboardQuery = () =>
  useQuery({
    queryKey: queryKeys.dashboard.admin,
    queryFn: () => dashboardService.getAdminDashboard(),
    enabled: typeof window !== "undefined" && getStoredRole() === "admin",
  });
