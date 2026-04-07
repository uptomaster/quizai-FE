import type { Session } from "@/types/api";

const STORE_KEY = "quizai_sessions";

const readSessions = (): Session[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Session[];
  } catch {
    return [];
  }
};

const writeSessions = (sessions: Session[]): void => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(sessions));
};

export const generateJoinCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    "",
  );
};

export const createLocalSession = (lectureId: string, quizId: string): Session => {
  const session: Session = {
    id: `local-session-${crypto.randomUUID()}`,
    lectureId,
    quizId,
    hostInstructorId: "local-instructor",
    status: "waiting",
    joinCode: generateJoinCode(),
    startedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  const sessions = readSessions();
  writeSessions([session, ...sessions]);
  return session;
};

export const findSessionByJoinCode = (joinCode: string): Session | null => {
  const sessions = readSessions();
  const matched = sessions.find((session) => session.joinCode.toUpperCase() === joinCode.toUpperCase());
  return matched ?? null;
};
