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
    upload: ["lectures", "upload"] as const,
  },
  sessions: {
    all: ["sessions"] as const,
    start: ["sessions", "start"] as const,
    join: ["sessions", "join"] as const,
  },
};
