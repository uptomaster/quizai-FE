import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FlowPageHeaderProps {
  rail: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** 플로우 레일 + 제목 — 페이지 상단 ‘히어로 밴드’ 역할. */
export function FlowPageHeader({ rail, title, description, actions, className }: FlowPageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {rail}
      <div className="relative overflow-hidden rounded-[1.25rem] border border-border/60 bg-gradient-to-br from-card/90 via-background to-primary/[0.06] px-4 py-5 shadow-none ring-1 ring-black/[0.04] dark:from-card/40 dark:to-primary/[0.08] dark:ring-white/[0.06] md:rounded-3xl md:px-6 md:py-6">
        <div
          className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-primary/[0.12] blur-3xl dark:bg-primary/[0.16]"
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{actions}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
