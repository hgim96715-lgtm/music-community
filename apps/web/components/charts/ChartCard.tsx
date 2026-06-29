'use client';

import type { ReactNode } from 'react';
import { postCard } from '@/lib/neobrutal';

type ChartCardProps = {
  title: string;
  children?: ReactNode;
  /** true면 children 대신 emptyMessage 표시 */
  empty?: boolean;
  emptyMessage?: string;
  /** 차트 영역 높이 — 기본 `h-48` */
  heightClassName?: string;
};

export function ChartCard({
  title,
  children,
  empty = false,
  emptyMessage = '이 기간에 작성된 추천이 없어요.',
  heightClassName = 'h-48',
}: ChartCardProps) {
  if (empty) {
    return (
      <div
        className={`${postCard} flex ${heightClassName} items-center justify-center p-4`}
        aria-label={`${title} — 데이터 없음`}>
        <p className="text-sm text-neutral-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`${postCard} p-4`}>
      <p className="mb-2 text-sm font-medium text-brand-primary">{title}</p>
      <div
        className={`${heightClassName} w-full min-w-0`}
        role="img"
        aria-label={title}>
        {children}
      </div>
    </div>
  );
}
