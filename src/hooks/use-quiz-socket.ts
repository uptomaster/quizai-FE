"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  initialLiveSessionState,
  reduceLiveSessionState,
  tryParseQuizWsEvent,
  type LiveSessionState,
  type QuizWsEvent,
} from "@/lib/quiz-ws-live-state";
import { logQuizWs, redactWsUrlForLog, truncateForLog } from "@/lib/quiz-ws-debug";

interface UseQuizSocketOptions {
  sessionId: string;
  directWsUrl?: string;
  enabled?: boolean;
  wsBaseUrl?: string;
  nickname?: string;
  token?: string;
  /** 콘솔 로그에 표시 (예: instructor, student). `NEXT_PUBLIC_DEBUG_QUIZ_WS` 또는 dev 에서 상세 로그 */
  debugLabel?: string;
  onQuizStarted?: (payload: QuizWsEvent & { type: "quiz_started" }) => void;
  onAnswerUpdate?: (payload: QuizWsEvent & { type: "answer_update" }) => void;
  onSessionEnded?: (payload: QuizWsEvent & { type: "session_ended" }) => void;
}

interface UseQuizSocketResult {
  isConnected: boolean;
  lastEvent: QuizWsEvent | null;
  liveSession: LiveSessionState;
  sendAnswer: (quizId: string, selectedOption: number) => void;
  /** 교강사: 세션에 연 퀴즈 세트 기준 다음 문항(서버가 순서·내용 결정, `quiz_started` 브로드캐스트). */
  startNextQuestion: () => void;
  disconnect: () => void;
  connectionAttempt: number;
}

const DEFAULT_WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL?.trim() || "wss://quizai-be.onrender.com";

const MAX_RECONNECT_ATTEMPTS = 12;
const INITIAL_BACKOFF_MS = 800;

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
  debugLabel = "client",
}: UseQuizSocketOptions): UseQuizSocketResult {
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownConnectToastRef = useRef(false);
  const shownFailToastRef = useRef(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<QuizWsEvent | null>(null);
  const [liveSession, setLiveSession] = useState<LiveSessionState>(initialLiveSessionState);
  const [connectionAttempt, setConnectionAttempt] = useState(0);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (nickname) {
      params.set("nickname", nickname);
    }
    if (token) {
      params.set("token", token);
    }
    const query = params.toString();

    if (directWsUrl?.trim()) {
      try {
        const u = new URL(directWsUrl.trim());
        if (nickname) {
          u.searchParams.set("nickname", nickname);
        }
        if (token) {
          u.searchParams.set("token", token);
        }
        return u.toString();
      } catch {
        return query ? `${directWsUrl.trim()}?${query}` : directWsUrl.trim();
      }
    }

    return `${wsBaseUrl}/sessions/${encodeURIComponent(sessionId)}/join${query ? `?${query}` : ""}`;
  }, [directWsUrl, nickname, sessionId, token, wsBaseUrl]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    socketRef.current?.close();
    socketRef.current = null;
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) {
      setLiveSession(initialLiveSessionState());
      setLastEvent(null);
      setConnectionAttempt(0);
      shownConnectToastRef.current = false;
      shownFailToastRef.current = false;
      return;
    }

    setLiveSession(initialLiveSessionState());
    setLastEvent(null);
    shownConnectToastRef.current = false;
    shownFailToastRef.current = false;
    setConnectionAttempt(0);

    let cancelled = false;
    let attempt = 0;

    const attachHandlers = (socket: WebSocket) => {
      socket.onmessage = (event) => {
        try {
          const rawStr = typeof event.data === "string" ? event.data : String(event.data);
          logQuizWs(debugLabel, "← 수신(원문)", truncateForLog(rawStr));

          let raw: unknown;
          try {
            raw = JSON.parse(rawStr) as unknown;
          } catch (e) {
            logQuizWs(debugLabel, "← JSON 파싱 실패 (서버가 JSON 이 아님?)", e);
            toast.error("실시간 알림을 읽는 데 문제가 있었습니다.");
            return;
          }

          const parsed = tryParseQuizWsEvent(raw);
          if (parsed) {
            logQuizWs(
              debugLabel,
              "← 파싱 성공",
              `type=${parsed.type}`,
              parsed.type === "quiz_started"
                ? { quiz_id: parsed.payload.quiz_id, time_limit: parsed.payload.time_limit }
                : parsed.type === "session_joined"
                  ? { nickname: parsed.payload.nickname, participant_count: parsed.payload.participant_count }
                  : parsed.type,
            );
            setLastEvent(parsed);
            setLiveSession((prev) => reduceLiveSessionState(prev, parsed));

            if (parsed.type === "quiz_started") {
              onQuizStarted?.(parsed);
            }
            if (parsed.type === "answer_update") {
              onAnswerUpdate?.(parsed);
            }
            if (parsed.type === "session_ended") {
              onSessionEnded?.(parsed);
              toast.info("이번 퀴즈가 종료되었습니다.");
            }
          } else {
            logQuizWs(
              debugLabel,
              "← 파싱 스킵",
              "프론트가 아는 type/payload 형식이 아닙니다. 백엔드 이벤트명·필드가 다를 수 있습니다.",
              raw,
            );
          }
        } catch (err) {
          logQuizWs(debugLabel, "onmessage 처리 중 예외", err);
          toast.error("실시간 알림을 읽는 데 문제가 있었습니다.");
        }
      };

      socket.onerror = (ev) => {
        logQuizWs(debugLabel, "socket error", ev);
      };

      socket.onclose = (ev) => {
        logQuizWs(debugLabel, "연결 종료", { code: ev.code, reason: ev.reason || "(없음)", wasClean: ev.wasClean });
        setIsConnected(false);
        socketRef.current = null;
        if (cancelled) {
          return;
        }
        attempt += 1;
        setConnectionAttempt(attempt);
        if (attempt > MAX_RECONNECT_ATTEMPTS) {
          if (!shownFailToastRef.current) {
            shownFailToastRef.current = true;
            toast.error(
              "실시간 퀴즈 서버에 연결하지 못했습니다. Render가 깨어나는 중이면 잠시 후 새로고침하세요. (WebSocket 허용·같은 세션 ID인지 백엔드에서 확인)",
            );
          }
          return;
        }
        const delay = Math.min(INITIAL_BACKOFF_MS * 2 ** (attempt - 1), 15000);
        reconnectTimerRef.current = setTimeout(() => {
          reconnectTimerRef.current = null;
          openSocket();
        }, delay);
      };
    };

    const openSocket = () => {
      if (cancelled) {
        return;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      try {
        logQuizWs(debugLabel, "연결 시도", {
          sessionId,
          url: redactWsUrlForLog(url),
          hint: "교강사·수강생 이 sessionId 가 동일해야 같은 방입니다. join/start 응답의 session_id 와 비교하세요.",
        });
        const socket = new WebSocket(url);
        socketRef.current = socket;
        socket.onopen = () => {
          if (cancelled) {
            return;
          }
          attempt = 0;
          setConnectionAttempt(0);
          setIsConnected(true);
          logQuizWs(debugLabel, "연결됨 (OPEN)", { sessionId, url: redactWsUrlForLog(url) });
          if (!shownConnectToastRef.current) {
            shownConnectToastRef.current = true;
            toast.success("실시간 퀴즈방에 연결되었습니다.");
          }
        };
        attachHandlers(socket);
      } catch {
        setIsConnected(false);
        if (!cancelled && attempt <= MAX_RECONNECT_ATTEMPTS) {
          attempt += 1;
          setConnectionAttempt(attempt);
          reconnectTimerRef.current = setTimeout(openSocket, INITIAL_BACKOFF_MS);
        }
      }
    };

    openSocket();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      const s = socketRef.current;
      if (s) {
        s.onopen = null;
        s.onmessage = null;
        s.onerror = null;
        s.onclose = null;
        s.close();
      }
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
    debugLabel,
  ]);

  const sendAnswer = useCallback(
    (quizId: string, selectedOption: number) => {
      const socket = socketRef.current;

      if (!socket || socket.readyState !== WebSocket.OPEN) {
        toast.error("아직 퀴즈방에 완전히 연결되지 않았어요. 잠시 후 다시 눌러주세요.");
        return;
      }

      const payload = {
        type: "submit_answer",
        quiz_id: quizId,
        selected_option: selectedOption,
      };
      logQuizWs(debugLabel, "→ 송신", payload);
      socket.send(JSON.stringify(payload));
    },
    [debugLabel],
  );

  const startNextQuestion = useCallback(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      toast.error("실시간 연결 후 다시 시도해 주세요.");
      return;
    }
    const payload = {
      type: "next_question",
      session_id: sessionId,
    };
    logQuizWs(debugLabel, "→ 송신", payload);
    socket.send(JSON.stringify(payload));
    toast.success("다음 문항을 보냈어요.");
  }, [sessionId, debugLabel]);

  return {
    isConnected,
    lastEvent,
    liveSession,
    sendAnswer,
    startNextQuestion,
    disconnect,
    connectionAttempt,
  };
}
