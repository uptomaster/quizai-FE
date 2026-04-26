"use client";

import { Button } from "@/components/ui/button";
import { coerceRenderableText } from "@/lib/normalize-quiz-shape";
import { cn } from "@/lib/utils";

export function formatQuizClock(sec: number | null): string {
  if (sec === null) {
    return "—";
  }
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface QuizQuestionViewProps {
  question: string;
  options: string[];
  timeLimitSec: number;
  /** 있으면 설명 줄에 남은 시간을 함께 표시합니다. */
  remainingSec?: number | null;
  variant: "student" | "instructor";
  selectedOption?: number | null;
  onSelectOption?: (index: number) => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  footerNote?: string;
}

export function QuizQuestionView({
  question,
  options,
  timeLimitSec,
  remainingSec,
  variant,
  selectedOption,
  onSelectOption,
  onSubmit,
  submitDisabled,
  footerNote,
}: QuizQuestionViewProps) {
  const isInstructor = variant === "instructor";

  return (
    <div
      className={cn(
        "w-full max-w-3xl overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/80 shadow-none ring-1 ring-black/[0.04] dark:bg-card/45 dark:ring-white/[0.06] md:rounded-3xl",
        "md:grid md:min-h-[280px] md:grid-cols-[minmax(0,42%)_1fr]",
      )}
    >
      <div className="relative border-b border-border/60 bg-gradient-to-br from-primary/[0.08] via-card/90 to-background p-5 md:border-b-0 md:border-r md:p-6 dark:from-primary/12">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/15 blur-2xl"
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              {isInstructor ? "강사 미리보기" : "문항"}
            </p>
            <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight text-foreground md:text-xl">
              {coerceRenderableText(question)}
            </h3>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">제한 시간</p>
              <p className="mt-0.5 font-mono text-2xl font-bold tabular-nums text-foreground">{timeLimitSec}초</p>
            </div>
            {remainingSec !== undefined && remainingSec !== null ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">남은 시간</p>
                <p
                  className={cn(
                    "mt-0.5 font-mono text-2xl font-bold tabular-nums",
                    remainingSec <= 5 ? "text-destructive" : "text-primary",
                  )}
                >
                  {formatQuizClock(remainingSec)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-3 p-4 md:p-6">
        <div className="space-y-2.5">
          {options.map((option, index) => (
            <button
              key={`opt-${index}`}
              type="button"
              disabled={isInstructor}
              onClick={() => onSelectOption?.(index)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition-all md:px-4 md:py-3.5",
                isInstructor && "cursor-default border-border/50 bg-muted/20 opacity-90",
                !isInstructor && selectedOption === index
                  ? "border-primary bg-primary/12 font-semibold text-primary shadow-[inset_0_0_0_1px_rgba(255,111,15,0.25)]"
                  : "border-border/70 bg-background/60 hover:border-primary/35 hover:bg-primary/[0.04]",
                !isInstructor && selectedOption !== index && "active:scale-[0.99]",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                  !isInstructor && selectedOption === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 leading-snug">{coerceRenderableText(option)}</span>
            </button>
          ))}
        </div>
        {!isInstructor && onSubmit ? (
          <div className="mt-1 space-y-2 border-t border-border/50 pt-4">
            <Button type="button" onClick={onSubmit} className="h-12 w-full text-base" size="lg" disabled={submitDisabled}>
              답안 제출
            </Button>
            {footerNote ? <p className="text-center text-xs text-muted-foreground">{footerNote}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
