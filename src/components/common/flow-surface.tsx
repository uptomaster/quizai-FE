import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type FlowSurfaceVariant = "default" | "accent" | "ghost";

interface FlowSurfaceProps {
  id?: string;
  /** 작은 눈에 띄는 라벨 (예: LIVE, 시작) */
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  variant?: FlowSurfaceVariant;
  children?: ReactNode;
  className?: string;
}

const variantClass: Record<FlowSurfaceVariant, string> = {
  default:
    "border-border/70 bg-card/75 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-[8px] dark:bg-card/50 dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]",
  accent:
    "border-primary/20 bg-gradient-to-br from-primary/[0.09] via-card/80 to-background dark:from-primary/15 dark:via-card/40",
  ghost: "border-border/40 bg-muted/25 backdrop-blur-sm dark:bg-muted/15",
};

/** 카드 대신 쓰는 ‘에디토리얼’ 섹션 셸 — 색 토큰은 그대로 두고 형태만 바꿉니다. */
export function FlowSurface({
  id,
  kicker,
  title,
  description,
  actions,
  variant = "default",
  children,
  className,
}: FlowSurfaceProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden rounded-[1.35rem] border p-5 md:rounded-3xl md:p-6",
        "ring-1 ring-black/[0.03] dark:ring-white/[0.05]",
        variantClass[variant],
        className,
      )}
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/[0.11] blur-3xl dark:bg-primary/[0.14]"
        aria-hidden
      />
      <div className="relative flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            {kicker ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">{kicker}</p>
            ) : null}
            <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">{title}</h2>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {children ? <div className="relative min-w-0">{children}</div> : null}
      </div>
    </section>
  );
}
