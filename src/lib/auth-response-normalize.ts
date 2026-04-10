import type { AppUser, AuthTokens, UserRole } from "@/types/api";

export interface AuthSessionPayload {
  user: AppUser;
  tokens: AuthTokens;
}

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
};

const unwrapAuthBody = (raw: unknown): Record<string, unknown> => {
  const root = asRecord(raw);
  if (!root) {
    return {};
  }
  const nested = asRecord(root.data);
  return nested ?? root;
};

const normalizeUserRole = (value: unknown): UserRole => {
  if (typeof value !== "string") {
    return "student";
  }
  const v = value.toLowerCase().trim();
  if (v === "instructor" || v === "teacher" || v === "professor") {
    return "instructor";
  }
  if (v === "admin" || v === "administrator") {
    return "admin";
  }
  if (v === "student" || v === "learner") {
    return "student";
  }
  return "student";
};

const normalizeUser = (raw: unknown): AppUser => {
  const o = asRecord(raw) ?? {};
  const id = String(o.id ?? o.user_id ?? o.userId ?? o.sub ?? "");
  const email = String(o.email ?? "");
  const nameRaw = o.name ?? o.full_name ?? o.fullName ?? o.username ?? (email ? email.split("@")[0] : "");
  const name =
    typeof nameRaw === "string" && nameRaw.trim().length > 0 ? nameRaw.trim() : "User";
  const role = normalizeUserRole(o.role ?? o.user_role ?? o.userRole);
  return { id, email, name, role };
};

/** Maps backend / proxy variants to our AuthSessionPayload (snake_case, camelCase, field aliases). */
export const normalizeAuthSessionPayload = (raw: unknown): AuthSessionPayload => {
  const body = unwrapAuthBody(raw);
  const accessToken = String(body.access_token ?? body.accessToken ?? "");
  const tokenType = String(body.token_type ?? body.tokenType ?? "bearer");
  const user = normalizeUser(body.user ?? body.profile ?? body.account);

  if (!accessToken.trim()) {
    throw new Error("로그인 응답에 access token이 없습니다.");
  }

  return {
    user,
    tokens: { accessToken, tokenType },
  };
};
