"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

type Phase = "join" | "play" | "dashboard" | "lectures" | "other";

/**
 * 수강생 핵심 여정: 참여 코드 → 퀴즈방·풀이 → 결과 (강의는 선택).
 */
export function StudentFlowRail() {
  const pathname = usePathname();

  const phase: Phase = pathname.startsWith("/student/lectures")
    ? "lectures"
    : pathname.startsWith("/student/join")
      ? "join"
      : pathname.startsWith("/student/play")
        ? "play"
        : pathname.startsWith("/student/dashboard")
          ? "dashboard"
          : "other";

  const steps: {
    id: string;
    label: string;
    href: string;
    /** 이 단계에 해당하는 phase */
    match: Phase[];
  }[] = [
    { id: "code", label: "참여 코드", href: "/student/join", match: ["join"] },
    { id: "room", label: "퀴즈방 입장", href: "/student/play", match: ["play"] },
    { id: "solve", label: "문제 풀이", href: "/student/play", match: ["play"] },
    { id: "result", label: "결과", href: "/student/dashboard", match: ["dashboard"] },
  ];

  const isActive = (s: (typeof steps)[number]) => s.match.includes(phase);

  return (
    <nav
      aria-label="학습 진행 순서"
      className="flex flex-wrap items-center gap-1 rounded-2xl border border-border/70 bg-muted/20 px-3 py-2.5 text-xs md:text-sm"
    >
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center gap-1">
          {i > 0 ? (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
          ) : null}
          <Link
            href={s.href}
            className={cn(
              "rounded-lg px-2 py-1 font-medium transition-colors",
              isActive(s)
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {s.label}
          </Link>
        </div>
      ))}
      <span className="ml-1 hidden text-muted-foreground/80 sm:inline">·</span>
      <Link
        href="/student/lectures"
        className={cn(
          "ml-0 rounded-lg px-2 py-1 text-xs font-medium transition-colors sm:ml-0",
          phase === "lectures"
            ? "bg-muted/80 text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )}
      >
        강의 신청(선택)
      </Link>
    </nav>
  );
}
