export const queryKeys = {
  auth: {
    all: ["auth"] as const,
  },
  quizzes: {
    all: ["quizzes"] as const,
    generate: ["quizzes", "generate"] as const,
  },
  lectures: {
    all: ["lectures"] as const,
    list: (page: number, limit: number) => ["lectures", "list", page, limit] as const,
    upload: ["lectures", "upload"] as const,
    enroll: ["lectures", "enroll"] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    start: ["sessions", "start"] as const,
    join: ["sessions", "join"] as const,
    result: (sessionId: string) => ["sessions", "result", sessionId] as const,
  },
  dashboard: {
    instructor: ["dashboard", "instructor"] as const,
    admin: ["dashboard", "admin"] as const,
  },
};
