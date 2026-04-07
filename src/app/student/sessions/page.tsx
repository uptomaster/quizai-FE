import { useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHero } from "@/components/common/page-hero";
import { cn } from "@/lib/utils";

type SessionResult = {
  id: string;
  date: string;
  subject: string;
  score: number;
  accuracy: number;
  status: "완료" | "복습 필요";
};

const MOCK_SESSIONS: SessionResult[] = [
  { id: "s-101", date: "2026-04-07", subject: "데이터베이스 기초", score: 82, accuracy: 78, status: "복습 필요" },
  { id: "s-102", date: "2026-04-06", subject: "웹 프론트엔드 실습", score: 91, accuracy: 88, status: "완료" },
  { id: "s-103", date: "2026-04-04", subject: "AI 기반 서비스 기획", score: 87, accuracy: 84, status: "완료" },
];

export default function StudentSessionsPage() {
  const [search, setSearch] = useState("");
  const [onlyReview, setOnlyReview] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_SESSIONS.filter((session) => {
      const matchesSearch =
        q.length === 0
          ? true
          : `${session.subject} ${session.id}`.toLowerCase().includes(q);
      const matchesReview = onlyReview ? session.status === "복습 필요" : true;
      return matchesSearch && matchesReview;
    });
  }, [onlyReview, search]);

  return (
    <section className="space-y-6">
      <PageHero
        title="응답 기록"
        description="세션별 점수와 정답률을 확인하고 필요한 항목을 빠르게 복습하세요."
        className="from-emerald-500/15 via-cyan-500/15 to-indigo-500/15"
      />
      <Card>
        <CardHeader>
          <CardTitle>최근 참여 세션</CardTitle>
          <CardDescription>검색/필터로 학습 데이터를 관리할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="과목명 또는 세션 ID 검색"
            />
            <Button
              type="button"
              variant={onlyReview ? "default" : "outline"}
              onClick={() => setOnlyReview((prev) => !prev)}
            >
              복습 필요만 보기
            </Button>
          </div>

          <div className="grid gap-3">
            {filtered.map((session) => (
              <article
                key={session.id}
                className="rounded-xl border bg-gradient-to-r from-white/80 to-white/30 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{session.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.date} | {session.id}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-1 text-xs font-medium",
                      session.status === "완료"
                        ? "bg-emerald-500/15 text-emerald-700"
                        : "bg-amber-500/15 text-amber-700",
                    )}
                  >
                    {session.status}
                  </span>
                </div>
                <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                  <p>
                    점수: <span className="font-semibold">{session.score}점</span>
                  </p>
                  <p>
                    정답률: <span className="font-semibold">{session.accuracy}%</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
