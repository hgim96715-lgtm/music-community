'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import {
  appHeaderClassName,
  appHeaderInnerClassName,
  appNavLinkClassName,
} from '@/lib/form';
import { buildLoginHref } from '@/lib/redirect';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

const ADMIN_BASE = '/admin';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace(buildLoginHref(pathname || ADMIN_BASE));
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/recommendations');
    }
  }, [isLoading, user, pathname, router]);

  if (isLoading || !user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className={appHeaderClassName}>
        <div className={appHeaderInnerClassName}>
          <Link
            href={ADMIN_BASE}
            className="text-sm font-semibold text-brand-primary">
            Admin
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href={`${ADMIN_BASE}/recommendations`}
              className={appNavLinkClassName}>
              추천 관리
            </Link>
            <Link href="/recommendations" className={appNavLinkClassName}>
              피드로
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-8">{children}</main>
    </div>
  );
}
