'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import {
  appNavLinkClassName,
  authPageClassName,
  authTitleClassName,
} from '@/lib/form';
import { formatFeedDate } from '@/lib/date';
import { fetchMyDms, type ApiDmListItem } from '@/lib/dms';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MessagesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<ApiDmListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/messages');
      return;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchMyDms();
        if (!cancelled) setItems(data);
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : '메시지 목록을 불러오지 못했어요.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router]);

  if (authLoading || !user || loading) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }

  return (
    <main className={`${authPageClassName} gap-6`}>
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/users/me"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary/80">
          <ChevronLeft className="size-4" aria-hidden />
          마이페이지
        </Link>
        <Link href="/messages/requests" className={appNavLinkClassName}>
          요청 →
        </Link>
      </div>
      <h1 className={authTitleClassName}>메시지</h1>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-sm text-[#a89880]">아직 대화가 없어요.</p>
      ) : (
        <ul className="divide-y divide-[rgb(201_166_107/0.14)] rounded-2xl border border-[rgb(201_166_107/0.22)] bg-[rgb(42_36_30/0.55)]">
          {items.map((dm) => {
            const name = dm.other?.nickname ?? '알 수 없음';
            const preview = dm.lastMessage?.body ?? '대화를 시작해 보세요';
            return (
              <li key={dm.id}>
                <Link
                  href={`/messages/${dm.id}`}
                  className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-[rgb(201_166_107/0.08)]">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#ebe3d8]">
                      @{name}
                      {dm.unread ? (
                        <span
                          className="ml-1.5 inline-block size-1.5 rounded-full bg-brand-primary align-middle"
                          aria-label="안 읽음"
                        />
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#a89880]">
                      {preview}
                    </p>
                  </div>
                  <time className="shrink-0 text-[11px] text-[#8a8070]">
                    {formatFeedDate(dm.lastMessage?.createdAt ?? dm.updatedAt)}
                  </time>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
