"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, LayoutDashboard, Menu, Shield, User, Users } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/api";

interface AppShellProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const NAV_MAP: Record<UserRole, NavItem[]> = {
  instructor: [
    { href: "/instructor/dashboard", label: "대시보드", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/instructor/lectures", label: "강의 자료", icon: <BookOpen className="h-4 w-4" /> },
    { href: "/instructor/sessions", label: "세션 관리", icon: <BarChart3 className="h-4 w-4" /> },
  ],
  student: [
    { href: "/student/dashboard", label: "내 진행현황", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/student/join", label: "세션 참여", icon: <BookOpen className="h-4 w-4" /> },
    { href: "/student/sessions", label: "응답 기록", icon: <BarChart3 className="h-4 w-4" /> },
  ],
  admin: [
    { href: "/admin/dashboard", label: "관리자 대시보드", icon: <LayoutDashboard className="h-4 w-4" /> },
    { href: "/admin/lectures", label: "강의 관리", icon: <BookOpen className="h-4 w-4" /> },
    { href: "/admin/sessions", label: "세션 모니터링", icon: <BarChart3 className="h-4 w-4" /> },
    { href: "/admin/users", label: "사용자 관리", icon: <Users className="h-4 w-4" /> },
  ],
};

const SidebarLinks = ({
  items,
  pathname,
  onSelect,
}: {
  items: NavItem[];
  pathname: string;
  onSelect?: () => void;
}) => (
  <nav className="space-y-2">
    {items.map((item) => {
      const active = pathname.startsWith(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onSelect}
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
            active
              ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {item.icon}
          {item.label}
        </Link>
      );
    })}
  </nav>
);

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const role = useMemo<UserRole>(() => {
    if (pathname.startsWith("/instructor")) {
      return "instructor";
    }
    if (pathname.startsWith("/admin")) {
      return "admin";
    }
    return "student";
  }, [pathname]);

  const navItems = useMemo(() => NAV_MAP[role], [role]);
  const roleLabel = role === "instructor" ? "교강사" : role === "admin" ? "운영자" : "수강생";
  const roleIcon =
    role === "instructor" ? <Users className="h-4 w-4" /> : role === "admin" ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />;

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 border-r bg-card/60 px-4 py-6 backdrop-blur md:block">
        <h1 className="mb-2 bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 bg-clip-text text-lg font-bold text-transparent">
          QuizAI
        </h1>
        <div className="mb-6 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
          {roleIcon}
          {roleLabel} 모드
        </div>
        <SidebarLinks items={navItems} pathname={pathname} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
              render={<Button variant="outline" size="icon" className="md:hidden" />}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">메뉴 열기</span>
            </DialogTrigger>
            <DialogContent className="w-[280px] p-4 sm:max-w-[280px]">
              <DialogTitle className="mb-3">QuizAI 메뉴</DialogTitle>
              <SidebarLinks
                items={navItems}
                pathname={pathname}
                onSelect={() => setOpen(false)}
              />
            </DialogContent>
          </Dialog>
          <p className="ml-3 text-sm font-medium text-muted-foreground">
            AI 기반 실시간 교육 피드백 플랫폼
          </p>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
