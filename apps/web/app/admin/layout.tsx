'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import {
  adminHeaderInnerClassName,
  adminMainClassName,
  adminShellClassName,
  appHeaderClassName,
  appNavLinkClassName,
  authTitleClassName,
} from '@/lib/form';
import { buildLoginHref } from '@/lib/redirect';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

const ADMIN_BASE = '/admin';

const NAV = [
  { href: `${ADMIN_BASE}/recommendations`, label: '추천' },
  { href: `${ADMIN_BASE}/users`, label: '사용자' },
  { href: `${ADMIN_BASE}/rooms`, label: '방' },
  { href: `${ADMIN_BASE}/notices`, label: '공지' },
] as const;

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

  function navClass(href: string) {
    const active =
      pathname === href ||
      (href !== ADMIN_BASE && pathname.startsWith(`${href}/`));
    return active
      ? `${appNavLinkClassName} bg-brand-primary-soft !text-brand-primary`
      : appNavLinkClassName;
  }

  return (
    <div className={adminShellClassName}>
      <header className={appHeaderClassName}>
        <div className={adminHeaderInnerClassName}>
          <Link
            href={ADMIN_BASE}
            className={`${authTitleClassName} text-base tracking-tight`}>
            Admin
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navClass(item.href)}>
                {item.label}
              </Link>
            ))}
            <Link href="/recommendations" className={appNavLinkClassName}>
              피드
            </Link>
          </nav>
        </div>
      </header>
      <main className={adminMainClassName}>{children}</main>
    </div>
  );
}
