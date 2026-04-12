/**
 * 교강사 탭 → 수강생 탭(같은 origin)으로 현재 문항을 넘깁니다.
 * 백엔드가 수강생에게만 quiz_started 를 안 주는 경우에도 같은 PC에서 시연·테스트가 됩니다.
 * (다른 기기의 수강생은 반드시 서버 브로드캐스트가 필요합니다.)
 */
export const liveQuizBroadcastChannelId = (sessionId: string): string =>
  `quizai:liveQuiz:${sessionId.trim()}`;

export type LiveQuizBroadcastPayload = {
  activeQuiz: {
    quiz_id: string;
    question: string;
    options: string[];
    time_limit: number;
    startedAt: number;
    /** 0-based. 있으면 수강생 쪽에서 마지막 문항 제출 후 완료 UI를 띄울 수 있음 */
    question_index?: number;
    question_total?: number;
  } | null;
};

/** 수강생 탭이 늦게 열려도 현재 문항을 다시 달라고 할 때 */
export type LiveQuizBroadcastRequestSync = { type: "request_sync" };

export type LiveQuizBroadcastMessage = LiveQuizBroadcastPayload | LiveQuizBroadcastRequestSync;
