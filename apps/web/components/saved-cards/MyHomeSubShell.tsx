'use client';

import type { ReactNode } from 'react';
import type { MyHomeNavKey } from './MyHomeNav';
import { MyHomeNav } from './MyHomeNav';

type MyHomeSubShellProps = {
  nickname: string;
  title: string;
  subtitle?: string;
  active?: MyHomeNavKey | null;
  requestCount?: number;
  children: ReactNode;
};

/** 프로필·설정·앨범·가사 — 같은 가로 nav 셸 */
export function MyHomeSubShell({
  nickname,
  title,
  subtitle,
  active = null,
  requestCount = 0,
  children,
}: MyHomeSubShellProps) {
  return (
    <div className="my-home-shell">
      <header className="my-home-hero">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[#cbbba0] uppercase">
          My home
        </p>
        <p className="mt-1 text-[15px] font-medium text-[#ebe3d8]">
          <span className="font-bold text-brand-primary">@{nickname}</span>
          <span className="text-[#a89880]"> · {title}</span>
        </p>
        {subtitle ? (
          <p className="mt-1 text-[12px] leading-relaxed text-[#a89880]">
            {subtitle}
          </p>
        ) : null}
        <MyHomeNav active={active} requestCount={requestCount} />
      </header>
      <div className="my-home-body">{children}</div>
    </div>
  );
}
