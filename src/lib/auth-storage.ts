import type { AppUser, UserRole } from "@/types/api";

const USER_KEY = "quizai_user";

export const AUTH_KEYS = {
  accessToken: "access_token",
  refreshToken: "refresh_token",
  user: USER_KEY,
} as const;

export const saveUser = (user: AppUser): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getStoredUser = (): AppUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = localStorage.getItem(USER_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AppUser;
  } catch {
    return null;
  }
};

export const getStoredRole = (): UserRole | null => {
  const user = getStoredUser();
  return user?.role ?? null;
};

export const getRoleHomePath = (role: UserRole): string => {
  const roleHomePathMap: Record<UserRole, string> = {
    instructor: "/instructor/dashboard",
    student: "/student/dashboard",
    admin: "/admin/dashboard",
  };

  return roleHomePathMap[role];
};
