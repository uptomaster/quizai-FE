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
  Users,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import { SiteLogo } from "@/components/common/site-logo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { clearAuthSession, getStoredRole, getStoredUser } from "@/lib/auth-storage";
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
            "flex items-center gap-2.5 rounded-xl border border-transparent px-3 py-2 text-[15px] font-medium transition-all",
            active
              ? "border-primary/15 bg-primary/[0.08] text-primary shadow-sm"
              : "text-muted-foreground hover:border-border/60 hover:bg-muted/50 hover:text-foreground",
          )}
        >
          <span className={cn("opacity-90", active && "text-primary")}>{item.icon}</span>
          <span>{item.label}</span>
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
  const handleLogout = () => {
    clearAuthSession();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1200px] gap-4 p-3 md:gap-6 md:p-6">
        <aside className="hidden w-[220px] shrink-0 md:block">
          <div className="sticky top-6 flex max-h-[calc(100dvh-3rem)] flex-col gap-6 overflow-y-auto rounded-3xl border border-border/70 bg-card/85 p-4 shadow-none ring-1 ring-black/[0.04] backdrop-blur-md dark:bg-card/50 dark:ring-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <SiteLogo size={44} decorative className="rounded-xl" />
              <div className="min-w-0">
                <h1 className="text-base font-semibold tracking-tight text-foreground">QuizAI</h1>
              </div>
            </div>
            <SidebarLinks items={navItems} pathname={pathname} />
          </div>
        </aside>

        <div className="flex min-h-[calc(100dvh-1.5rem)] min-w-0 flex-1 flex-col gap-4">
          <header className="sticky top-3 z-20 md:top-6">
            <div className="flex h-12 items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/90 px-3 shadow-none ring-1 ring-black/[0.04] backdrop-blur-md dark:bg-card/55 dark:ring-white/[0.06] md:h-12 md:px-4">
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

          <main className="relative flex-1 pb-6 md:pb-8">
            <div
              className="pointer-events-none absolute inset-0 -z-10 mesh-page-bg rounded-[1.75rem] opacity-80 md:rounded-[2rem]"
              aria-hidden
            />
            <div className="relative">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
