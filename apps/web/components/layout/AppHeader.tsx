'use client';
import { getApiAccessToken, removeApiAccessToken } from '@/lib/authToken';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!getApiAccessToken());
  }, [pathname]);

  function handleLogout() {
    removeApiAccessToken();
    router.push('/login');
  }
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-lg items-center justify-between px-8 py-4">
        <Link href="/recommendations" className="text-sm font-semibold">
          Music Community
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {loggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              className="text-neutral-600 hover:text-neutral-900">
              로그아웃
            </button>
          ) : (
            <Link
              href="/login"
              className="text-neutral-600 hover:text-neutral-900">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
