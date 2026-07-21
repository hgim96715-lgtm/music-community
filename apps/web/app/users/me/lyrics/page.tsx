'use client';

import { MyHomeSubShell } from '@/components/saved-cards/MyHomeSubShell';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchFriendRequests } from '@/lib/api';
import { authPageClassName } from '@/lib/form';
import { ChevronLeft, Loader2, Quote } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/** 내 가사 모음 — 자리만 */
export default function MyLyricsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [requestCount, setRequestCount] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?next=/users/me/lyrics');
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
        title="내 가사 모음"
        subtitle="좋아하는 소절을 모아 두는 자리"
        active={null}
        requestCount={requestCount}>
        <div className="rounded-xl border border-dashed border-[rgb(31_26_22/0.2)] bg-[rgb(255_255_255/0.35)] px-4 py-12 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#4a3728] text-[#f7f1e8] shadow-[3px_3px_0_rgb(46_38_31/0.35)]">
            <Quote className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-medium text-[#3d342c]">곧 열릴 예정</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#6b5c4c]">
            방에서 공유한 가사 카드를
            <br />
            여기에 담을 수 있게 만들 거예요
          </p>
        </div>
      </MyHomeSubShell>
    </main>
  );
}
