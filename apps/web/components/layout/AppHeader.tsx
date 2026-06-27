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

export default function AppHeader() {
  const { user, isLoading, clearSession } = useAuth();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  return (
    <header className={appHeaderClassName}>
      <div className={appHeaderInnerClassName}>
        <Link href="/recommendations" className={appLogoClassName}>
          Music Community
        </Link>
        <nav className="flex items-center gap-2">
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
