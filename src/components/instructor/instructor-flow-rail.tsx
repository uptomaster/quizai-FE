"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * 교강사 핵심 여정: 강의·PDF·퀴즈 → 라이브 방(코드·실시간) → 결과
 */
export function InstructorFlowRail() {
  const pathname = usePathname();

  const steps: { id: string; label: string; href: string }[] = [
    { id: "lectures", label: "강의·PDF·퀴즈", href: "/instructor/lectures" },
    { id: "sessions", label: "라이브 방·코드", href: "/instructor/sessions" },
    { id: "dashboard", label: "결과", href: "/instructor/dashboard" },
  ];

  const active = (href: string) => pathname === href || (href !== "/instructor/dashboard" && pathname.startsWith(href));

  return (
    <nav
      aria-label="수업 진행 순서"
      className="flex flex-wrap items-center gap-1 rounded-2xl border border-border/70 bg-muted/20 px-3 py-2.5 text-xs md:text-sm"
    >
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1">
          {i > 0 ? <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden /> : null}
          <Link
            href={s.href}
            className={cn(
              "rounded-lg px-2 py-1 font-medium transition-colors",
              active(s.href)
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {s.label}
          </Link>
        </div>
      ))}
    </nav>
  );
}
