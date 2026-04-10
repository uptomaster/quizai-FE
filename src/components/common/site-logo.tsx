import Image from "next/image";

import { cn } from "@/lib/utils";

type SiteLogoProps = {
  className?: string;
  /** 표시 크기(px). `public/logo.png` 비율에 맞춰 정사각형 영역에 맞춥니다. */
  size?: number;
  priority?: boolean;
  /** 옆에 "QuizAI" 등 텍스트가 있으면 스크린 리더 중복을 피합니다. */
  decorative?: boolean;
};

export function SiteLogo({ className, size = 40, priority, decorative = false }: SiteLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={decorative ? "" : "QuizAI"}
      width={size}
      height={size}
      sizes="(max-width: 768px) 96px, 128px"
      className={cn("shrink-0 object-contain", className)}
      priority={priority}
    />
  );
}
