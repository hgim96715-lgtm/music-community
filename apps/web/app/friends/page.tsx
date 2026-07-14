'use client';
import { useAuth } from '@/components/auth/AuthProvider';
import { fetchFriends, removeFriend } from '@/lib/api';
import type { ApiFriendship } from '@/lib/apiTypes';
import { otherUser } from '@/lib/friendsUtils';
import {
  appNavLinkClassName,
  authPageClassName,
  authTitleClassName,
} from '@/lib/form';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FeedDialog } from '@/components/recommendations/FeedDialog';

export default function FriendsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [friends, setFriends] = useState<ApiFriendship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setFriends(await fetchFriends());
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : '친구 목록을 불러오는데 실패했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login?next=/friends');
      return;
    }
    void load();
  }, [authLoading, user, router, load]);

  function handleRemove(otherId: string) {
    setRemoveTargetId(otherId);
  }

  async function confirmRemove() {
    if (!removeTargetId) return;
    setRemoving(true);
    setError('');
    try {
      await removeFriend(removeTargetId);
      setRemoveTargetId(null);
      await load();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '친구 끊기에 실패했습니다.',
      );
    } finally {
      setRemoving(false);
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
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/users/me"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          마이페이지
        </Link>
        <Link href="/friends/requests" className={appNavLinkClassName}>
          요청 →
        </Link>
      </div>
      <h1 className={authTitleClassName}>친구</h1>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {friends.length === 0 ? (
        <p className="text-sm text-neutral-500">아직 친구가 없어요.</p>
      ) : (
        <ul className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white">
          {friends.map((f) => {
            const other = otherUser(f, user.id);
            return (
              <li
                key={f.id}
                className="flex items-center justify-between gap-3 px-4 py-3">
                <Link
                  href={`/users/${other.id}`}
                  className="min-w-0 truncate text-sm font-semibold text-neutral-800 hover:underline">
                  @{other.nickname}
                </Link>
                <button
                  type="button"
                  disabled={removing}
                  className="shrink-0 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-neutral-50 disabled:opacity-50"
                  onClick={() => handleRemove(other.id)}>
                  친구 끊기
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <FeedDialog
        open={removeTargetId !== null}
        title="친구를 끊을까요?"
        description="다시 만나려면 친구 요청이 필요해요."
        confirmLabel="친구 끊기"
        pendingLabel="끊는 중…"
        isPending={removing}
        onClose={() => !removing && setRemoveTargetId(null)}
        onConfirm={() => void confirmRemove()}
      />
    </main>
  );
}
