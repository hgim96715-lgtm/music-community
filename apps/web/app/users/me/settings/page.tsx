'use client';

import { MyHomeSubShell } from '@/components/saved-cards/MyHomeSubShell';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchFriendRequests } from '@/lib/api';
import { appNavLinkClassName, authPageClassName } from '@/lib/form';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** 설정 — 계정·약관 자리 · 로그아웃 (프로필 수정 ❌) */
export default function MySettingsPage() {
  const router = useRouter();
  const { user, isLoading, clearSession } = useAuth();
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?next=/users/me/settings');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchFriendRequests()
      .then((requests) => {
        if (!cancelled) {
          setRequestCount(requests.received.length + requests.sent.length);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (isLoading || !user) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }

  return (
    <main className={`${authPageClassName} gap-5`}>
      <div>
        <Link
          href="/users/me"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          마이 홈
        </Link>
      </div>

      <MyHomeSubShell
        nickname={user.nickname}
        title="설정"
        subtitle="계정 · 약관 · 로그아웃"
        active="settings"
        requestCount={requestCount}>
        <ul className="flex flex-col gap-1.5">
          <li>
            <span className="flex items-center justify-between rounded-xl border border-dashed border-[rgb(31_26_22/0.12)] px-3.5 py-3 text-sm text-[#a89880]">
              이용약관
              <span className="text-[11px] font-medium">곧</span>
            </span>
          </li>
          <li>
            <span className="flex items-center justify-between rounded-xl border border-dashed border-[rgb(31_26_22/0.12)] px-3.5 py-3 text-sm text-[#a89880]">
              개인정보 처리방침
              <span className="text-[11px] font-medium">곧</span>
            </span>
          </li>
        </ul>

        <div className="mt-6 border-t border-[rgb(31_26_22/0.12)] pt-4">
          <button
            type="button"
            onClick={() => {
              clearSession();
              router.push('/login');
            }}
            className={`${appNavLinkClassName} w-full border border-red-200/80 bg-white py-2.5 text-center text-red-600 shadow-[2px_2px_0_rgb(46_38_31/0.12)]`}>
            로그아웃
          </button>
        </div>
      </MyHomeSubShell>
    </main>
  );
}
