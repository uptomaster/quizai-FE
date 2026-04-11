import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://quizai-fe.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "QuizAI — 실시간 AI 퀴즈 · 학습 피드백",
  description:
    "강의 자료로 퀴즈를 만들고, 참여 코드로 라이브 수업을 진행하세요. 교강사·수강생·운영자가 함께 쓰는 플랫폼입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
