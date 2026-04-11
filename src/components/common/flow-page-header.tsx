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
    <div className={cn("space-y-3", className)}>
      {rail}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
          {description ? <p className="max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
