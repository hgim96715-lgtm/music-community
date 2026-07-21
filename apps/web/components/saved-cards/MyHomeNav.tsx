'use client';

import { Home, Settings, UserRound, Users } from 'lucide-react';
import Link from 'next/link';

export type MyHomeNavKey = 'home' | 'profile' | 'friends' | 'settings';

type MyHomeNavProps = {
  /** 없으면 하이라이트 없음 (앨범·가사 안쪽) */
  active?: MyHomeNavKey | null;
  requestCount?: number;
};

const ITEMS: {
  key: MyHomeNavKey;
  href: string;
  label: string;
  icon: typeof Home;
}[] = [
  { key: 'home', href: '/users/me', label: '홈', icon: Home },
  { key: 'profile', href: '/users/me/profile', label: '프로필', icon: UserRound },
  { key: 'friends', href: '/friends', label: '친구', icon: Users },
  { key: 'settings', href: '/users/me/settings', label: '설정', icon: Settings },
];

/** 마이 홈 — 가로 chip nav (앨범·가사는 아래 문 · 탭 중복 ❌) */
export function MyHomeNav({ active = null, requestCount = 0 }: MyHomeNavProps) {
  return (
    <nav className="my-home-nav" aria-label="마이 홈 메뉴">
      {ITEMS.map(({ key, href, label, icon: Icon }) => {
        const isActive = active === key;
        const showBadge = key === 'friends' && requestCount > 0;
        return (
          <Link
            key={key}
            href={href}
            className={`my-home-nav-item${isActive ? ' is-active' : ''}`}
            aria-current={isActive ? 'page' : undefined}>
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span>{label}</span>
            {showBadge ? (
              <span className="my-home-nav-badge">{requestCount}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
