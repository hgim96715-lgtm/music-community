'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import {
  authPageClassName,
  authSubmitClassName,
  authTitleClassName,
} from '@/lib/form';
import {
  acceptDm,
  declineDm,
  fetchDmRequests,
  type ApiDmRequestItem,
} from '@/lib/dms';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const outlineBtn =
  'shrink-0 rounded-full border border-[rgb(201_166_107/0.28)] bg-[rgb(42_36_30/0.55)] px-3 py-1.5 text-xs font-semibold text-[#ebe3d8] hover:bg-[rgb(201_166_107/0.12)] disabled:opacity-50';

export default function MessageRequestsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<ApiDmRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchDmRequests());
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '요청을 불러오지 못했어요.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/messages/requests');
      return;
    }
    void load();
  }, [authLoading, user, router, load]);

  async function run(dmId: string, action: () => Promise<unknown>) {
    setBusyId(dmId);
    setError('');
    try {
      await action();
      await load();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '요청을 처리하지 못했어요.',
      );
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
        href="/messages"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
        <ChevronLeft className="size-4" aria-hidden />
        메시지
      </Link>
      <h1 className={authTitleClassName}>메시지 요청</h1>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {items.length === 0 ? (
        <p className="text-sm text-[#a89880]">받은 요청이 없어요.</p>
      ) : (
        <ul className="divide-y divide-[rgb(201_166_107/0.14)] rounded-2xl border border-[rgb(201_166_107/0.22)] bg-[rgb(42_36_30/0.55)]">
          {items.map((dm) => {
            const name = dm.other?.nickname ?? '알 수 없음';
            const otherId = dm.other?.id;
            return (
              <li
                key={dm.id}
                className="flex items-center justify-between gap-3 px-4 py-3">
                {otherId ? (
                  <Link
                    href={`/users/${otherId}`}
                    className="min-w-0 truncate text-sm font-semibold text-[#ebe3d8] hover:text-brand-primary hover:underline">
                    @{name}
                  </Link>
                ) : (
                  <span className="min-w-0 truncate text-sm font-semibold text-[#ebe3d8]">
                    @{name}
                  </span>
                )}
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    disabled={busyId === dm.id}
                    className={`${authSubmitClassName} !w-auto !px-3 !py-1.5 !text-xs`}
                    onClick={() =>
                      void run(dm.id, async () => {
                        await acceptDm(dm.id);
                        router.push(`/messages/${dm.id}`);
                      })
                    }>
                    수락
                  </button>
                  <button
                    type="button"
                    disabled={busyId === dm.id}
                    className={outlineBtn}
                    onClick={() => void run(dm.id, () => declineDm(dm.id))}>
                    거절
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
