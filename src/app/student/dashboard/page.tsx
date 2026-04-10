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
        title="오늘 학습 리포트"
        description="오늘 강의의 85%를 이해했어요! 오답 개념만 빠르게 복습하면 완벽합니다."
        actions={
          <Button onClick={() => window.location.assign("/student/join")}>세션 참여하기</Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile title="이해도 점수" description="오늘 학습 기준" value="85%" delta="+7%" />
        <StatTile title="평균 점수" description="최근 3회 기준" value="78점" delta="+4점" />
        <StatTile title="정답률" description="전체 문제 대비" value="82%" delta="+6.5%" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>오답 노트 (AI 요약)</CardTitle>
            <CardDescription>오늘 놓친 핵심 개념을 AI가 정리했습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• 과적합: 학습 데이터에 지나치게 맞춰 일반화 성능이 낮아진 상태</p>
            <p>• 정규화: 모델 복잡도를 제한해 과적합을 줄이는 기법</p>
            <p>• 실전 팁: 오답 문항의 정답 근거를 한 줄로 다시 써보기</p>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardHeader>
            <CardTitle>플레이 성장 트랙</CardTitle>
            <CardDescription>게임처럼 진행되는 학습 성장 지표</CardDescription>
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
