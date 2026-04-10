import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageHeroProps {
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHero({ title, description, actions, className }: PageHeroProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-5 md:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-blue-100 blur-3xl" />
      <div className="relative">
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground md:text-[15px]">{description}</p>
        {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
