"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo } from "react";

import { AUTH_KEYS, getRoleHomePath, getStoredRole } from "@/lib/auth-storage";
import type { UserRole } from "@/types/api";

interface AuthGuardProps {
  children: ReactNode;
}

const PUBLIC_ROUTES = ["/login", "/register"];

const ROLE_ROUTES: Record<UserRole, string[]> = {
  instructor: ["/instructor"],
  student: ["/student"],
  admin: ["/admin"],
};

const canAccessPath = (role: UserRole, pathname: string): boolean => {
  const prefixes = ROLE_ROUTES[role];
  return prefixes.some((prefix) => pathname.startsWith(prefix));
};

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isPublicRoute = useMemo(
    () => PUBLIC_ROUTES.some((route) => pathname.startsWith(route)),
    [pathname],
  );

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEYS.accessToken);
    const role = getStoredRole();

    if (!token && !isPublicRoute) {
      router.replace("/login");
      return;
    }

    if (isPublicRoute && token) {
      if (role) {
        router.replace(getRoleHomePath(role));
      }
      return;
    }

    if (!role || isPublicRoute) {
      return;
    }

    if (!canAccessPath(role, pathname)) {
      router.replace(getRoleHomePath(role));
    }
  }, [isPublicRoute, pathname, router]);

  return <>{children}</>;
}
