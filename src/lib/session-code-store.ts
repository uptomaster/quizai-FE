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

export const createLocalSession = (quizSetId: string, timeLimit: number): Session => {
  const joinCode = generateJoinCode();
  const session: Session = {
    session_id: `local-session-${crypto.randomUUID()}`,
    session_code: joinCode,
    ws_url: `${
      process.env.NEXT_PUBLIC_WS_URL?.trim() || "wss://quizai-be.onrender.com"
    }/sessions/${quizSetId}/join?time_limit=${timeLimit}`,
    status: "active",
  };

  const sessions = readSessions();
  writeSessions([session, ...sessions]);
  return session;
};

export const findSessionByJoinCode = (joinCode: string): Session | null => {
  const sessions = readSessions();
  const matched = sessions.find(
    (session) => session.session_code.toUpperCase() === joinCode.toUpperCase(),
  );
  return matched ?? null;
};
