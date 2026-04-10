"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type QuizSocketEventType =
  | "session_joined"
  | "quiz_started"
  | "answer_update"
  | "answer_revealed"
  | "session_ended"
  | "error";

interface QuizSocketEventMap {
  session_joined: {
    participant_count: number;
    nickname: string;
  };
  quiz_started: {
    quiz_id: string;
    question: string;
    options: string[];
    time_limit: number;
  };
  answer_update: {
    total: number;
    answered: number;
    rate: number;
    distribution: number[];
  };
  answer_revealed: {
    correct_option: number;
    explanation?: string | null;
  };
  session_ended: {
    session_id: string;
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
  nickname?: string;
  token?: string;
  onQuizStarted?: (payload: QuizSocketEventMap["quiz_started"]) => void;
  onAnswerUpdate?: (payload: QuizSocketEventMap["answer_update"]) => void;
  onSessionEnded?: (payload: QuizSocketEventMap["session_ended"]) => void;
}

interface UseQuizSocketResult {
  isConnected: boolean;
  lastEvent: QuizSocketEvent | null;
  sendAnswer: (quizId: string, selectedOption: number) => void;
  disconnect: () => void;
}

const DEFAULT_WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL?.trim() || "wss://quizai-api.onrender.com";

export function useQuizSocket({
  sessionId,
  directWsUrl,
  enabled = true,
  wsBaseUrl = DEFAULT_WS_BASE_URL,
  nickname,
  token,
  onQuizStarted,
  onAnswerUpdate,
  onSessionEnded,
}: UseQuizSocketOptions): UseQuizSocketResult {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<QuizSocketEvent | null>(null);

  const url = useMemo(() => {
    if (directWsUrl) {
      return directWsUrl;
    }

    const params = new URLSearchParams();
    if (nickname) {
      params.set("nickname", nickname);
    }
    if (token) {
      params.set("token", token);
    }
    const query = params.toString();
    return `${wsBaseUrl}/sessions/${sessionId}/join${query ? `?${query}` : ""}`;
  }, [directWsUrl, nickname, sessionId, token, wsBaseUrl]);

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

        if (data.type === "answer_update") {
          onAnswerUpdate?.(data.payload);
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
    onAnswerUpdate,
    onQuizStarted,
    onSessionEnded,
    sessionId,
    url,
  ]);

  const sendAnswer = useCallback((quizId: string, selectedOption: number) => {
    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      toast.error("연결이 준비되지 않았습니다.");
      return;
    }

    socket.send(
      JSON.stringify({
        type: "submit_answer",
        quiz_id: quizId,
        selected_option: selectedOption,
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
