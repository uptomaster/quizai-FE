"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full max-w-lg border-border">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-lg leading-snug md:text-xl">{coerceRenderableText(question)}</CardTitle>
        <CardDescription>
          제한 {timeLimitSec}초
          {remainingSec !== undefined && remainingSec !== null ? ` · 남은 ${formatQuizClock(remainingSec)}` : null}
          {isInstructor ? " · 학생 화면과 동일" : " · 선택 후 제출"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {options.map((option, index) => (
          <button
            key={`opt-${index}`}
            type="button"
            disabled={isInstructor}
            onClick={() => onSelectOption?.(index)}
            className={cn(
              "w-full rounded-2xl border px-4 py-3.5 text-left text-sm transition-all",
              isInstructor && "cursor-default opacity-95",
              !isInstructor && selectedOption === index
                ? "border-primary bg-primary/10 font-medium text-primary ring-2 ring-primary/20"
                : "border-border bg-card hover:border-primary/30 hover:bg-muted/50",
              !isInstructor && selectedOption !== index && "active:scale-[0.99]",
            )}
          >
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">
              {index + 1}
            </span>
            {coerceRenderableText(option)}
          </button>
        ))}
        {!isInstructor && onSubmit ? (
          <>
            <Button
              type="button"
              onClick={onSubmit}
              className="mt-2 h-12 w-full text-base"
              size="lg"
              disabled={submitDisabled}
            >
              답안 제출
            </Button>
            {footerNote ? <p className="text-center text-xs text-muted-foreground">{footerNote}</p> : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
