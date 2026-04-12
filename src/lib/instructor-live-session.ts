import type { Session } from "@/types/api";

const STORAGE_KEY = "quizai:instructorLiveSession";
const SCHEMA_V = 1 as const;

const defaultJoinWsUrl = (sessionId: string): string => {
  const base =
    typeof process !== "undefined" && process.env.NEXT_PUBLIC_WS_URL?.trim()
      ? process.env.NEXT_PUBLIC_WS_URL.trim()
      : "wss://quizai-be.onrender.com";
  return `${base.replace(/\/$/, "")}/sessions/${encodeURIComponent(sessionId.trim())}/join`;
};

/** 저장·복구 시 ws_url 이 비어도 세션을 살립니다(새로고침 후 소켓 연결용). */
export function withInstructorSessionWsFallback(session: Session): Session {
  const ws = typeof session.ws_url === "string" ? session.ws_url.trim() : "";
  if (ws) {
    return session;
  }
  return { ...session, ws_url: defaultJoinWsUrl(session.session_id) };
}

export type PersistedInstructorLiveSession = {
  v: typeof SCHEMA_V;
  session: Session;
  quizSetId: string;
  timeLimit: string;
  useCustomQuizSetId: boolean;
  savedAt: string;
};

function isSessionShape(x: unknown): x is Session {
  if (!x || typeof x !== "object") {
    return false;
  }
  const o = x as Session;
  return (
    typeof o.session_id === "string" &&
    o.session_id.trim().length > 0 &&
    typeof o.session_code === "string" &&
    o.session_code.trim().length > 0 &&
    typeof o.status === "string"
  );
}

export function readPersistedInstructorLiveSession(): PersistedInstructorLiveSession | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const row = parsed as Partial<PersistedInstructorLiveSession>;
    if (row.v !== SCHEMA_V || !isSessionShape(row.session)) {
      return null;
    }
    return {
      v: SCHEMA_V,
      session: withInstructorSessionWsFallback(row.session),
      quizSetId: typeof row.quizSetId === "string" ? row.quizSetId : "",
      timeLimit: typeof row.timeLimit === "string" ? row.timeLimit : "30",
      useCustomQuizSetId: Boolean(row.useCustomQuizSetId),
      savedAt: typeof row.savedAt === "string" ? row.savedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function writePersistedInstructorLiveSession(entry: Omit<PersistedInstructorLiveSession, "v" | "savedAt">): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload: PersistedInstructorLiveSession = {
      v: SCHEMA_V,
      ...entry,
      session: withInstructorSessionWsFallback(entry.session),
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota
  }
}

export function clearPersistedInstructorLiveSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
