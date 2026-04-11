/**
 * 이 프로젝트는 Socket.io `emit("이벤트명")` 이 아니라 **WebSocket 텍스트 프레임 + JSON** 입니다.
 * 서버 → 클라이언트: `{ "type": "quiz_started", "payload": { "quiz_id", "question", "options", "time_limit" } }` 등
 * (`tryParseQuizWsEvent` 가 아는 type 만 상태로 반영됨)
 *
 * Network 탭 WS Messages 와 함께 콘솔에서 세션 ID·이벤트 type·파싱 여부를 확인할 때 사용합니다.
 *
 * - 로컬 `npm run dev`: 기본 ON (끄려면 `NEXT_PUBLIC_DEBUG_QUIZ_WS=false`)
 * - 프로덕션: `NEXT_PUBLIC_DEBUG_QUIZ_WS=true` 일 때만 ON
 */
export function quizWsDebugEnabled(): boolean {
  if (typeof process === "undefined") {
    return false;
  }
  const flag = process.env.NEXT_PUBLIC_DEBUG_QUIZ_WS;
  if (flag === "false") {
    return false;
  }
  if (flag === "true") {
    return true;
  }
  return process.env.NODE_ENV === "development";
}

/** 쿼리의 token 만 가린 연결 URL (콘솔 노출용) */
export function redactWsUrlForLog(url: string): string {
  try {
    const u = new URL(url);
    if (u.searchParams.has("token")) {
      u.searchParams.set("token", "***");
    }
    return u.toString();
  } catch {
    return url.replace(/([?&]token=)[^&]*/gi, "$1***");
  }
}

const MAX_LOG_LEN = 1200;

export function truncateForLog(s: string, max = MAX_LOG_LEN): string {
  if (s.length <= max) {
    return s;
  }
  return `${s.slice(0, max)}… (${s.length} chars)`;
}

export function logQuizWs(debugLabel: string, ...args: unknown[]): void {
  if (!quizWsDebugEnabled()) {
    return;
  }
  const tag = `[Quiz WS][${debugLabel}]`;
  console.log(tag, ...args);
}
