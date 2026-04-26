"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type Phase = "join" | "play" | "dashboard" | "lectures" | "other";

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

  const steps: { id: string; label: string; href: string; match: Phase[] }[] = [
    { id: "code", label: "코드", href: "/student/join", match: ["join"] },
    { id: "quiz", label: "퀴즈", href: "/student/play", match: ["play"] },
    { id: "result", label: "결과", href: "/student/dashboard", match: ["dashboard"] },
  ];

  const isActive = (s: (typeof steps)[number]) => s.match.includes(phase);

  return (
    <nav
      aria-label="진행 순서"
      className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-border/60 bg-muted/30 p-1 text-[13px] backdrop-blur-sm dark:bg-muted/20"
    >
      {steps.map((s) => {
        const on = isActive(s);
        return (
          <Link
            key={s.id}
            href={s.href}
            className={cn(
              "rounded-xl px-3 py-1.5 font-semibold transition-all",
              on
                ? "bg-card text-primary shadow-sm ring-1 ring-black/[0.04] dark:bg-card/80 dark:ring-white/[0.08]"
                : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
            )}
          >
            {s.label}
          </Link>
        );
      })}
      <Link
        href="/student/lectures"
        className={cn(
          "rounded-xl px-3 py-1.5 text-[12px] font-semibold transition-all",
          phase === "lectures"
            ? "bg-card text-primary shadow-sm ring-1 ring-black/[0.04] dark:bg-card/80 dark:ring-white/[0.08]"
            : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
        )}
      >
        강의
      </Link>
    </nav>
  );
}
