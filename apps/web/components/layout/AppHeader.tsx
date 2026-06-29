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
      <div className={appHeaderInnerClassName}>
        <Link href="/recommendations" className={appLogoClassName}>
          Music Community
        </Link>
        <nav className="flex items-center gap-2">
          {loggedIn ? `@${user?.nickname}` : null}
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
          {loggedIn ? (
            <Link href="/users/me" className={appNavLinkClassName}>
              마이페이지
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
