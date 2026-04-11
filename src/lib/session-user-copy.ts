import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import type { UserRole } from "@/types/api";

/** 수강생·강사 화면에 노출할 실시간 연결 상태 (기술 용어 대체). */
export const liveConnectionLabel = (isConnected: boolean): string =>
  isConnected ? "실시간 연결됨" : "입장 대기 중";

/** API `Session.status` 등을 사람이 읽는 짧은 문장으로. */
export const liveRoomPhaseLabel = (apiStatus: string | undefined): string => {
  const s = (apiStatus ?? "").toLowerCase();
  if (s === "waiting" || s === "pending") {
    return "학생 입장 대기";
  }
  if (s === "active" || s === "live" || s === "running") {
    return "진행 중";
  }
  if (s === "ended" || s === "closed" || s === "completed") {
    return "종료됨";
  }
  if (!s) {
    return "준비 중";
  }
  return "진행 중";
};

/** 결과 화면 등에서 성적 등급 표시용. */
export const gradeLabelKo = (grade: unknown): string => {
  if (typeof grade !== "string") {
    return coerceRenderableText(grade) || "—";
  }
  switch (grade) {
    case "excellent":
      return "우수";
    case "needs_practice":
      return "복습 권장";
    case "needs_review":
      return "개념 다시 보기";
    default:
      return grade;
  }
};

export const roleHomeHint = (role: UserRole): string => {
  switch (role) {
    case "instructor":
      return "강의·퀴즈 → 라이브 방 → 결과";
    case "admin":
      return "운영 지표 및 계정";
    default:
      return "코드 입력 → 퀴즈 → 결과";
  }
};
