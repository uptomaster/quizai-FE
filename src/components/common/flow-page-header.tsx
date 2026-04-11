import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FlowPageHeaderProps {
  rail: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/** 플로우 레일 + 짧은 제목 한 덩어리(긴 PageHero 대신). */
export function FlowPageHeader({ rail, title, description, actions, className }: FlowPageHeaderProps) {
  return (
    <div className={cn("space-y-2.5", className)}>
      {rail}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">{title}</h1>
          {description ? (
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
