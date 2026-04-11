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
      className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[13px] text-muted-foreground"
    >
      {steps.map((s, i) => (
        <span key={s.id} className="flex items-center gap-1">
          {i > 0 ? <span className="text-border">/</span> : null}
          <Link
            href={s.href}
            className={cn(
              "rounded-md px-1.5 py-0.5 font-medium transition-colors",
              isActive(s) ? "text-primary" : "hover:text-foreground",
            )}
          >
            {s.label}
          </Link>
        </span>
      ))}
      <span className="text-border">·</span>
      <Link
        href="/student/lectures"
        className={cn(
          "rounded-md px-1.5 py-0.5 text-[12px] transition-colors",
          phase === "lectures" ? "font-medium text-foreground" : "hover:text-foreground",
        )}
      >
        강의
      </Link>
    </nav>
  );
}
