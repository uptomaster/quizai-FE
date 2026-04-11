"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorPlay,
  Radio,
  School,
  Shield,
  User,
  Users,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { SiteLogo } from "@/components/common/site-logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { clearAuthSession, getStoredRole, getStoredUser } from "@/lib/auth-storage";
import { roleHomeHint } from "@/lib/session-user-copy";
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
    { href: "/instructor/lectures", label: "강의·퀴즈", icon: <BookOpen className="h-4 w-4" /> },
    { href: "/instructor/sessions", label: "라이브 방", icon: <Radio className="h-4 w-4" /> },
    { href: "/instructor/dashboard", label: "결과", icon: <LayoutDashboard className="h-4 w-4" /> },
  ],
  student: [
    { href: "/student/join", label: "참여 코드", icon: <KeyRound className="h-4 w-4" /> },
    { href: "/student/play", label: "퀴즈", icon: <MonitorPlay className="h-4 w-4" /> },
    { href: "/student/dashboard", label: "결과", icon: <BarChart3 className="h-4 w-4" /> },
    { href: "/student/lectures", label: "강의", icon: <School className="h-4 w-4" /> },
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
  <nav className="space-y-1">
    {items.map((item) => {
      const active = pathname.startsWith(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={onSelect}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            active
              ? "bg-primary/[0.09] text-primary dark:bg-primary/15"
              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
              active ? "bg-primary/15 text-primary" : "bg-muted/80 text-muted-foreground",
            )}
          >
            {item.icon}
          </span>
          <span className="leading-snug">{item.label}</span>
        </Link>
      );
    })}
  </nav>
);

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const pathnameRole = useMemo<UserRole>(() => {
    if (pathname.startsWith("/instructor")) {
      return "instructor";
    }
    if (pathname.startsWith("/admin")) {
      return "admin";
    }
    return "student";
  }, [pathname]);

  const [storedRole, setStoredRole] = useState<UserRole | null>(null);
  const [accountLine, setAccountLine] = useState<{ primary: string; secondary?: string } | null>(null);
  useEffect(() => {
    setStoredRole(getStoredRole());
    const user = getStoredUser();
    if (user) {
      const primary = user.name?.trim() || user.email;
      const secondary = user.name?.trim() && user.email !== primary ? user.email : undefined;
      setAccountLine({ primary, secondary });
    } else {
      setAccountLine(null);
    }
  }, [pathname]);

  const role = storedRole ?? pathnameRole;

  const navItems = useMemo(() => NAV_MAP[role], [role]);
  const roleLabel = role === "instructor" ? "교강사" : role === "admin" ? "운영자" : "수강생";
  const roleIcon =
    role === "instructor" ? <Users className="h-4 w-4" /> : role === "admin" ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />;
  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-3 p-3 md:gap-5 md:p-5">
        <aside className="hidden w-[248px] shrink-0 md:block">
          <div className="sticky top-5 flex max-h-[calc(100dvh-2.5rem)] flex-col gap-5 overflow-y-auto rounded-[1.25rem] border border-border/55 bg-card/95 p-4 shadow-[0_8px_36px_-14px_rgba(15,23,42,0.14)] backdrop-blur-md dark:bg-card/90 dark:shadow-[0_10px_40px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-2.5">
              <SiteLogo size={48} decorative className="rounded-xl" />
              <div className="min-w-0">
                <h1 className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-base font-bold tracking-tight text-transparent">
                  QuizAI
                </h1>
                <p className="text-[10px] font-medium text-muted-foreground">실시간 퀴즈</p>
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{roleHomeHint(role)}</p>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/90">역할</span>
              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-border/60 bg-muted/50 px-3 py-2 text-xs font-semibold text-foreground">
                {roleIcon}
                {roleLabel}
              </div>
            </div>
            <SidebarLinks items={navItems} pathname={pathname} />
          </div>
        </aside>

        <div className="flex min-h-[calc(100dvh-1.5rem)] min-w-0 flex-1 flex-col gap-3 md:gap-4">
          <header className="sticky top-3 z-20 md:top-5">
            <div className="flex h-[52px] items-center justify-between gap-3 rounded-2xl border border-border/55 bg-card/90 px-3 shadow-[0_4px_24px_-10px_rgba(15,23,42,0.1)] backdrop-blur-md dark:bg-card/85 dark:shadow-[0_6px_28px_-10px_rgba(0,0,0,0.45)] md:h-14 md:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none md:min-w-0">
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger
                    render={<Button variant="outline" size="icon" className="md:hidden" />}
                  >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">메뉴 열기</span>
                  </DialogTrigger>
                  <DialogContent className="w-[min(100%,320px)] gap-5 p-5 sm:max-w-[320px]">
                    <DialogTitle className="text-base font-semibold">메뉴</DialogTitle>
                    <SidebarLinks
                      items={navItems}
                      pathname={pathname}
                      onSelect={() => setOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
                <Link
                  href="/"
                  className="flex shrink-0 items-center gap-2 rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring md:hidden"
                >
                  <SiteLogo size={40} className="rounded-lg" />
                  <span className="sr-only">QuizAI 홈</span>
                </Link>
              </div>
              <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
                {accountLine ? (
                  <div className="min-w-0 max-w-[min(100%,200px)] text-right sm:max-w-[min(100%,240px)]">
                    <p className="truncate text-sm font-semibold text-foreground">{accountLine.primary}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {accountLine.secondary ? `${accountLine.secondary} · ` : ""}
                      {roleLabel}
                    </p>
                  </div>
                ) : (
                  <p className="hidden text-sm text-muted-foreground sm:block">{roleLabel}</p>
                )}
                <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-1 h-4 w-4" />
                  로그아웃
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 pb-6 md:pb-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
