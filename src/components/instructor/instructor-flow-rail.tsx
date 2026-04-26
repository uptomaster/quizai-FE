"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function InstructorFlowRail() {
  const pathname = usePathname();

  const steps: { id: string; label: string; href: string }[] = [
    { id: "lectures", label: "강의", href: "/instructor/lectures" },
    { id: "sessions", label: "라이브", href: "/instructor/sessions" },
    { id: "dashboard", label: "결과", href: "/instructor/dashboard" },
  ];

  const active = (href: string) =>
    pathname === href || (href !== "/instructor/dashboard" && pathname.startsWith(href));

  return (
    <nav
      aria-label="진행 순서"
      className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-border/60 bg-muted/30 p-1 text-[13px] backdrop-blur-sm dark:bg-muted/20"
    >
      {steps.map((s) => {
        const on = active(s.href);
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
    </nav>
  );
}
