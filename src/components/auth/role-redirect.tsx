"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AUTH_KEYS, getRoleHomePath, getStoredRole } from "@/lib/auth-storage";

export function RoleRedirect() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEYS.accessToken);
    const role = getStoredRole();

    if (!token || !role) {
      router.replace("/login");
      return;
    }

    router.replace(getRoleHomePath(role));
  }, [router]);

  return null;
}
