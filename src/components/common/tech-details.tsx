"use client";

import { type ReactNode, useId, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

interface TechDetailsProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/** 접어 두는 부가 정보(식별 번호 등). */
export function TechDetails({ title = "추가 정보", children, className }: TechDetailsProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn("rounded-xl border border-border bg-muted/20", className)}>
      <button
        type="button"
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-xs font-medium text-muted-foreground transition hover:text-foreground"
      >
        {title}
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-btn`} className="border-t border-border/60 px-3 py-3 text-xs">
          {children}
        </div>
      ) : null}
    </div>
  );
}
