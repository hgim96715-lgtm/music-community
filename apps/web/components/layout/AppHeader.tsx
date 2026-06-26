'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../auth/AuthProvider';

export default function AppHeader() {
  const { user, isLoading, clearSession } = useAuth();
  const router = useRouter();

  function handleLogout() {
    clearSession();
    router.push('/login');
  }
  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-lg items-center justify-between px-8 py-4">
        <Link href="/recommendations" className="text-sm font-semibold">
          Music Community
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {isLoading ? null : user ? (
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
