'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import {
  fetchFriendRequests,
  removeFriend,
  respondFriendRequest,
} from '@/lib/api';
import type { ApiFriendRequests } from '@/lib/apiTypes';
import {
  appNavLinkClassName,
  authPageClassName,
  authSubmitClassName,
  authTitleClassName,
} from '@/lib/form';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const outlineBtn =
  'shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50';

export default function FriendRequestsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [requests, setRequests] = useState<ApiFriendRequests>({
    received: [],
    sent: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await fetchFriendRequests());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '요청을 불러오지 못했어요.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/friends/requests');
      return;
    }
    void load();
  }, [authLoading, user, router, load]);

  async function run(key: string, action: () => Promise<unknown>) {
    setBusyId(key);
    setError('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리에 실패했어요.');
    } finally {
      setBusyId(null);
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
    <main className={`${authPageClassName} gap-6`}>
      <Link
        href="/friends"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
        <ChevronLeft className="size-4" aria-hidden />
        친구
      </Link>

      <h1 className={authTitleClassName}>친구 요청</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-700">받은 요청</h2>
        {requests.received.length === 0 ? (
          <p className="text-sm text-neutral-500">받은 요청이 없어요.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
            {requests.received.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 px-4 py-3">
                <Link
                  href={`/users/${f.requester.id}`}
                  className="min-w-0 truncate text-sm font-semibold hover:underline">
                  @{f.requester.nickname}
                </Link>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === f.id}
                    className={`${authSubmitClassName} !w-auto !px-3 !py-1.5 !text-xs`}
                    onClick={() =>
                      void run(f.id, () => respondFriendRequest(f.id, 'accept'))
                    }>
                    수락
                  </button>
                  <button
                    type="button"
                    disabled={busyId === f.id}
                    className={outlineBtn}
                    onClick={() =>
                      void run(f.id, () =>
                        respondFriendRequest(f.id, 'decline'),
                      )
                    }>
                    거절
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-neutral-700">보낸 요청</h2>
        {requests.sent.length === 0 ? (
          <p className="text-sm text-neutral-500">보낸 요청이 없어요.</p>
        ) : (
          <ul className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
            {requests.sent.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 px-4 py-3">
                <Link
                  href={`/users/${f.addressee.id}`}
                  className="min-w-0 truncate text-sm font-semibold hover:underline">
                  @{f.addressee.nickname}
                </Link>
                <button
                  type="button"
                  disabled={busyId === f.id}
                  className={outlineBtn}
                  onClick={() =>
                    void run(f.id, () => removeFriend(f.addresseeId))
                  }>
                  취소
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
