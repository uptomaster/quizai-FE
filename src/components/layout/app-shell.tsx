"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getStoredRole } from "@/lib/auth-storage";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/api";

interface AppShellProps {
  children: ReactNode;
}

interface NavItem {
  href: string;
  label: string;
}

const NAV_MAP: Record<UserRole, NavItem[]> = {
  instructor: [
    { href: "/instructor/dashboard", label: "대시보드" },
    { href: "/instructor/lectures", label: "강의 자료" },
    { href: "/instructor/sessions", label: "세션 관리" },
  ],
  student: [
    { href: "/student/dashboard", label: "내 진행현황" },
    { href: "/student/join", label: "세션 참여" },
    { href: "/student/sessions", label: "응답 기록" },
  ],
  admin: [
    { href: "/admin/dashboard", label: "관리자 대시보드" },
    { href: "/admin/lectures", label: "강의 관리" },
    { href: "/admin/sessions", label: "세션 모니터링" },
    { href: "/admin/users", label: "사용자 관리" },
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
            "block rounded-lg px-3 py-2 text-sm transition-colors",
            active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      );
    })}
  </nav>
);

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [role] = useState<UserRole>(() => getStoredRole() ?? "student");

  const navItems = useMemo(() => NAV_MAP[role], [role]);

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 border-r bg-card px-4 py-6 md:block">
        <h1 className="mb-6 text-lg font-semibold">QuizAI</h1>
        <SidebarLinks items={navItems} pathname={pathname} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-14 items-center border-b px-4 md:px-6">
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
