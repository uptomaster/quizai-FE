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
    <nav aria-label="진행 순서" className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[13px] text-muted-foreground">
      {steps.map((s, i) => (
        <span key={s.id} className="flex items-center gap-1">
          {i > 0 ? <span className="text-border">/</span> : null}
          <Link
            href={s.href}
            className={cn(
              "rounded-md px-1.5 py-0.5 font-medium transition-colors",
              active(s.href) ? "text-primary" : "hover:text-foreground",
            )}
          >
            {s.label}
          </Link>
        </span>
      ))}
    </nav>
  );
}
