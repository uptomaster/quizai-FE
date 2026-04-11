"use client";

import { useQuery } from "@tanstack/react-query";

import { getStoredRole } from "@/lib/auth-storage";
import { queryKeys } from "@/lib/query-keys";
import { studentService } from "@/services/student-service";

export const useStudentQuizResultsQuery = () =>
  useQuery({
    queryKey: queryKeys.student.myQuizResults,
    queryFn: () => studentService.listMyQuizResults(),
    enabled: typeof window !== "undefined" && getStoredRole() === "student",
  });
