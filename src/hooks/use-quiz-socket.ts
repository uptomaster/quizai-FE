"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type QuizSocketEventType =
  | "quiz_started"
  | "answer_submitted"
  | "session_ended"
  | "connected"
  | "error";

interface QuizSocketEventMap {
  quiz_started: {
    sessionId: string;
    startedAt: string;
    questionId: string;
  };
  answer_submitted: {
    sessionId: string;
    studentId: string;
    questionId: string;
    isCorrect?: boolean;
  };
  session_ended: {
    sessionId: string;
    endedAt: string;
  };
  connected: {
    sessionId: string;
    participantId: string;
  };
  error: {
    message: string;
  };
}

type QuizSocketEvent = {
  [K in QuizSocketEventType]: { type: K; payload: QuizSocketEventMap[K] };
}[QuizSocketEventType];

interface UseQuizSocketOptions {
  sessionId: string;
  directWsUrl?: string;
  enabled?: boolean;
  wsBaseUrl?: string;
  onQuizStarted?: (payload: QuizSocketEventMap["quiz_started"]) => void;
  onAnswerSubmitted?: (payload: QuizSocketEventMap["answer_submitted"]) => void;
  onSessionEnded?: (payload: QuizSocketEventMap["session_ended"]) => void;
}

interface UseQuizSocketResult {
  isConnected: boolean;
  lastEvent: QuizSocketEvent | null;
  sendAnswer: (questionId: string, answer: string) => void;
  disconnect: () => void;
}

const DEFAULT_WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL?.trim() || "wss://quizai-be.onrender.com";

export function useQuizSocket({
  sessionId,
  directWsUrl,
  enabled = true,
  wsBaseUrl = DEFAULT_WS_BASE_URL,
  onQuizStarted,
  onAnswerSubmitted,
  onSessionEnded,
}: UseQuizSocketOptions): UseQuizSocketResult {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<QuizSocketEvent | null>(null);

  const url = useMemo(() => directWsUrl || `${wsBaseUrl}/sessions/${sessionId}/join`, [directWsUrl, sessionId, wsBaseUrl]);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) {
      return;
    }

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onopen = () => {
      setIsConnected(true);
      toast.success("퀴즈 세션에 연결되었습니다.");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as QuizSocketEvent;
        setLastEvent(data);

        if (data.type === "quiz_started") {
          onQuizStarted?.(data.payload);
        }

        if (data.type === "answer_submitted") {
          onAnswerSubmitted?.(data.payload);
        }

        if (data.type === "session_ended") {
          onSessionEnded?.(data.payload);
          toast.info("세션이 종료되었습니다.");
        }
      } catch {
        toast.error("실시간 이벤트 파싱에 실패했습니다.");
      }
    };

    socket.onerror = () => {
      toast.error("웹소켓 연결 오류가 발생했습니다.");
    };

    socket.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      socket.close();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [
    enabled,
    onAnswerSubmitted,
    onQuizStarted,
    onSessionEnded,
    sessionId,
    url,
  ]);

  const sendAnswer = useCallback((questionId: string, answer: string) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      toast.error("연결이 준비되지 않았습니다.");
      return;
    }

    socket.send(
      JSON.stringify({
        type: "submit_answer",
        payload: {
          questionId,
          answer,
        },
      }),
    );
  }, []);

  return {
    isConnected,
    lastEvent,
    sendAnswer,
    disconnect,
  };
}
