import type { Session } from "@/types/api";

const STORAGE_KEY = "quizai:instructorLiveSession";
const SCHEMA_V = 1 as const;

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
    typeof o.ws_url === "string" &&
    o.ws_url.trim().length > 0 &&
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
      session: row.session,
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
