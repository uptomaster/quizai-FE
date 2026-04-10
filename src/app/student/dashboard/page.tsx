"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HelperTip } from "@/components/common/helper-tip";
import { PageHero } from "@/components/common/page-hero";
import { StatTile } from "@/components/common/stat-tile";

export default function StudentDashboardPage() {
  return (
    <section className="space-y-6">
      <PageHero
        title="수강생 대시보드"
        description="참여코드로 세션에 입장하고, 결과를 바로 확인하세요."
        className="from-violet-500/10 via-pink-500/10 to-amber-500/10"
        actions={
          <Button onClick={() => window.location.assign("/student/join")}>세션 참여하기</Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile title="참여 세션 수" description="누적 퀴즈 세션 참여 횟수" value="0" delta="+0" />
        <StatTile title="평균 점수" description="최근 응답 결과 기반" value="0점" delta="+0점" />
        <StatTile title="정답률" description="전체 문제 대비" value="0%" delta="+0.0%" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-violet-500/10 to-transparent">
          <CardHeader>
            <CardTitle>오늘의 추천 학습</CardTitle>
            <CardDescription>학습 패턴을 기준으로 추천된 복습 경로입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• 데이터베이스 정규화 개념 복습</p>
            <p>• 최근 오답 5문항 다시 풀기</p>
            <p>• AI 생성 심화 문제 10문항 도전</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-transparent">
          <CardHeader>
            <CardTitle>성취 배지 진행률</CardTitle>
            <CardDescription>퀴즈 참여와 정답률로 획득 가능한 배지</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span>참여왕 배지</span>
                <span>60%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-3/5 rounded-full bg-gradient-to-r from-amber-500 to-pink-500" />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span>정답률 마스터</span>
                <span>25%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <HelperTip
        title="학습 효율 올리기"
        steps={[
          "세션 참여 후 바로 오답 복습을 진행하세요.",
          "주 3회 이상 짧은 퀴즈로 기억을 고정하세요.",
          "점수보다 정답 근거를 설명하는 연습을 해보세요.",
        ]}
      />
    </section>
  );
}
