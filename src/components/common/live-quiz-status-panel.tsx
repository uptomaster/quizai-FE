"use client";

import { ConnectionStatus } from "@/components/common/connection-status";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import { cn } from "@/lib/utils";
import type { LiveSessionState } from "@/lib/quiz-ws-live-state";

interface LiveQuizStatusPanelProps {
  live: LiveSessionState;
  remainingSec: number | null;
  isConnected: boolean;
  /** 수강생 본인이 현재 문항을 제출했는지 (서버 개별 이벤트 없을 때 UI용) */
  selfSubmitted?: boolean;
  variant: "student" | "instructor" | "admin";
  className?: string;
}

function formatClock(sec: number | null): string {
  if (sec === null) {
    return "—";
  }
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function LiveQuizStatusPanel({
  live,
  remainingSec,
  isConnected,
  selfSubmitted,
  variant,
  className,
}: LiveQuizStatusPanelProps) {
  const roster = live.participants ?? [];
  const headcount =
    live.participantCount ?? (roster.length > 0 ? roster.length : null);
  const ap = live.answerProgress;
  const pct =
    ap && ap.total > 0 ? Math.min(100, Math.round((ap.answered / ap.total) * 100)) : null;
  const showRoster = variant !== "student";

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/30 p-4 shadow-sm md:p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">실시간 현황</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {variant === "student"
              ? "강사가 연 퀴즈방 기준으로 갱신됩니다."
              : "같은 퀴즈방에 연결된 모든 클라이언트가 같은 수치를 봅니다."}
          </p>
        </div>
        <ConnectionStatus isConnected={isConnected} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card/90 px-3 py-3 text-center shadow-sm">
          <p className="text-[11px] font-medium text-muted-foreground">남은 시간</p>
          <p
            className={cn(
              "mt-1 font-mono text-2xl font-bold tracking-tight",
              remainingSec !== null && remainingSec <= 5 ? "text-destructive" : "text-foreground",
            )}
          >
            {live.activeQuiz ? formatClock(remainingSec) : "대기"}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {live.activeQuiz ? `제한 ${live.activeQuiz.time_limit}초` : "문항 시작 시 타이머 작동"}
          </p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/90 px-3 py-3 text-center shadow-sm">
          <p className="text-[11px] font-medium text-muted-foreground">참여 인원</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{headcount ?? "—"}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">퀴즈방 입장 기준</p>
        </div>

        <div className="rounded-xl border border-border/70 bg-card/90 px-3 py-3 text-center shadow-sm">
          <p className="text-[11px] font-medium text-muted-foreground">답안 제출</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {ap ? `${ap.answered}/${ap.total}` : "—"}
          </p>
          {pct !== null ? (
            <div className="mx-auto mt-2 h-1.5 max-w-[120px] overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          ) : (
            <p className="mt-0.5 text-[10px] text-muted-foreground">서버 집계</p>
          )}
        </div>
      </div>

      {variant === "student" && selfSubmitted !== undefined ? (
        <p className="mt-3 text-center text-sm font-medium text-primary">
          {selfSubmitted ? "이 문항은 제출했어요. 집계는 강사·운영 화면에서 확인됩니다." : "답을 고른 뒤 제출하면 여기에 반영돼요."}
        </p>
      ) : null}

      {showRoster ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">개별 참여 현황</p>
          <div className="max-h-48 overflow-auto rounded-xl border border-border/70">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-2 font-semibold">표시 이름</th>
                  <th className="px-3 py-2 font-semibold">입장</th>
                  <th className="px-3 py-2 font-semibold">이번 문항</th>
                </tr>
              </thead>
              <tbody>
                {roster.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                      아직 표시할 참여자가 없습니다.
                    </td>
                  </tr>
                ) : (
                  roster.map((p, idx) => (
                    <tr
                      key={`${idx}-${coerceRenderableText(p.nickname) || "u"}`}
                      className="border-t border-border/50"
                    >
                      <td className="px-3 py-2 font-medium">{coerceRenderableText(p.nickname) || "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {new Date(p.joinedAt).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="px-3 py-2">
                        {live.activeQuiz ? (
                          p.answeredCurrent ? (
                            <span className="text-emerald-700">제출함</span>
                          ) : (
                            <span className="text-amber-800">대기</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
