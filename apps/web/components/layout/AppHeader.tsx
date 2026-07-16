'use client';

import {
  appHeaderClassName,
  appHeaderInnerClassName,
  appLogoClassName,
  appNavLinkClassName,
  authLinkClassName,
} from '@/lib/form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';
import { useEffect, useState } from 'react';

export default function AppHeader() {
  const { user, isLoading, clearSession } = useAuth();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  /** user가 변경될 때마다 loggedIn 상태를 업데이트 */
  useEffect(() => {
    setLoggedIn(user !== null);
  }, [user]);

  return (
    <header className={appHeaderClassName}>
      <div className={`${appHeaderInnerClassName} gap-2`}>
        <Link
          href="/recommendations"
          className={`${appLogoClassName} shrink-0`}>
          Music Community
        </Link>
        <nav className="flex min-w-0 shrink items-center gap-0.5 sm:gap-1.5">
          {loggedIn ? (
            <span className="hidden max-w-[6rem] truncate text-sm text-neutral-500 md:inline">
              @{user?.nickname}
            </span>
          ) : null}
          {loggedIn ? (
            <Link href="/rooms" className={appNavLinkClassName}>
              방
            </Link>
          ) : null}
          {loggedIn && user?.role === 'user' ? (
            <Link href="/users/me" className={appNavLinkClassName}>
              <span className="md:hidden">마이</span>
              <span className="hidden md:inline">마이페이지</span>
            </Link>
          ) : user?.role === 'admin' ? (
            <Link href="/admin" className={appNavLinkClassName}>
              관리자
            </Link>
          ) : null}
          {isLoading ? null : user ? (
            <button
              type="button"
              onClick={handleLogout}
              className={appNavLinkClassName}>
              로그아웃
            </button>
          ) : (
            <Link href="/login" className={`${authLinkClassName} text-sm`}>
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
