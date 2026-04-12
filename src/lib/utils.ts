import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * API가 null·undefined·빈 문자열·비숫자 문자열을 줄 때 UI에서 NaN이 나지 않도록 합니다.
 */
export function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const t = value.trim();
    if (t === "") {
      return null;
    }
    const n = Number(t.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** 정수 + "점" (없으면 "—") */
export function formatQuizScorePoints(value: unknown): string {
  const n = toFiniteNumber(value);
  if (n === null) {
    return "—";
  }
  return `${Math.round(n)}점`;
}

/** 평균 점수 한 자리까지 (없으면 "—") */
export function formatAverageScoreOneDecimal(value: unknown): string {
  const n = toFiniteNumber(value);
  if (n === null) {
    return "—";
  }
  return String(Math.round(n * 10) / 10);
}
