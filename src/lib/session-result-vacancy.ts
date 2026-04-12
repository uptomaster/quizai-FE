import type { SessionResult } from "@/types/api";
import { toFiniteNumber } from "@/lib/utils";

/**
 * 집계 API가 200이지만 인원·평균·등급이 모두 0이고 students 가 비어 있는 경우.
 * (세션 미종료, 집계 미실행, 또는 백엔드 버그로 흔히 나타남)
 */
export function isSessionResultVacantShell(r: SessionResult): boolean {
  const rows = r.students?.length ?? 0;
  if (rows > 0) {
    return false;
  }
  const total = toFiniteNumber(r.total_students) ?? 0;
  const avg = toFiniteNumber(r.avg_score);
  const g = r.grade_distribution;
  const gx = toFiniteNumber(g?.excellent) ?? 0;
  const gm = toFiniteNumber(g?.needs_practice) ?? 0;
  const gl = toFiniteNumber(g?.needs_review) ?? 0;
  const gradesAllZero = gx === 0 && gm === 0 && gl === 0;
  const summaryEmpty = total === 0 && (avg === null || avg === 0);
  return summaryEmpty && gradesAllZero;
}

/** total_students 만 양수인데 students 가 비어 있을 때 */
export function sessionResultMissingDetailRows(r: SessionResult): boolean {
  return (r.students?.length ?? 0) === 0 && (toFiniteNumber(r.total_students) ?? 0) > 0;
}
