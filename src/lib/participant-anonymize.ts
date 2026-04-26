/**
 * 순위·명단 UI에서 실명/닉네임 대신 쓰는 **세션 내 안정적인** 익명 라벨.
 * 같은 `seed`(예: student_id, user_id, 닉네임 해시 입력)면 항상 같은 문자열이 나옵니다.
 */
export function stableParticipantAlias(seed: string): string {
  const s = (seed ?? "").trim();
  if (!s) {
    return "익명";
  }
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = Math.abs(h) % 90000;
  return `익명-${String(u).padStart(4, "0")}`;
}
