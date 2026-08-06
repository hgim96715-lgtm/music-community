'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import type { ApiNotification } from '@/lib/apiTypes';
import { formatCommentDate } from '@/lib/date';
import { authPageClassName, authTitleClassName } from '@/lib/form';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

function replyHref(n: ApiNotification) {
  return `/recommendations?id=${n.recommendationId}&commentId=${n.commentId}`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  /** 「모두 읽음」요청 진행 중 — 중복 클릭 방지 */
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchNotifications());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '알림을 불러오지 못했어요.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/notifications');
      return;
    }
    void load();
  }, [authLoading, user, load, router]);

  async function onOpen(n: ApiNotification) {
    try {
      if (!n.readAt) {
        await markNotificationRead(n.id);
        setItems((prev) =>
          prev.map((row) =>
            row.id === n.id
              ? { ...row, readAt: new Date().toISOString() }
              : row,
          ),
        );
      }
    } catch {
      // 읽음 실패해도 이동
    }
    router.push(replyHref(n));
  }

  async function onMarkAll() {
    setMarkingAllRead(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) =>
        prev.map((row) => ({ ...row, readAt: new Date().toISOString() })),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '읽음 처리에 실패했어요.',
      );
    } finally {
      setMarkingAllRead(false);
    }
  }

  if (authLoading || !user || loading) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }
  return (
    <main className={authPageClassName}>
      <div className="mb-6 flex items-center gap-2">
        <Link
          href="/recommendations"
          className="rounded-full p-1 text-[color:var(--color-lp-muted)] hover:bg-brand-primary-soft hover:text-brand-primary"
          aria-label="뒤로">
          <ChevronLeft className="size-5" />
        </Link>
        <h1 className={authTitleClassName}>알림</h1>
        <button
          type="button"
          disabled={markingAllRead || items.every((n) => n.readAt)}
          onClick={() => void onMarkAll()}
          className="ml-auto text-xs font-medium text-brand-primary disabled:opacity-40">
          모두 읽음
        </button>
      </div>
      {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-center text-sm text-[color:var(--color-lp-muted)]">
          아직 알림이 없어요
        </p>
      ) : (
        <ul className="divide-y divide-[rgb(201_166_107/0.12)] rounded-2xl border border-[rgb(201_166_107/0.18)] bg-[rgb(42_36_30/0.45)]">
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => void onOpen(n)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[rgb(201_166_107/0.06)]">
                <span
                  className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                    n.readAt ? 'bg-transparent' : 'bg-brand-primary'
                  }`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-[color:var(--color-lp-cream)]">
                    <span className="font-semibold">@{n.actor.nickname}</span>
                    님이 답글을 남겼어요
                  </span>
                  <time
                    dateTime={n.createdAt}
                    className="mt-0.5 block text-xs text-[color:var(--color-lp-muted)]">
                    {formatCommentDate(n.createdAt)}
                  </time>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
