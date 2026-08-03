'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import {
  AvatarActionProvider,
  useAvatarAction,
} from '@/components/friends/AvatarActionContext';
import { FriendIdsProvider } from '@/components/friends/FriendIdsContext';
import { FeedDialog } from '@/components/recommendations/FeedDialog';
import {
  fetchFriendRequests,
  fetchFriends,
  removeFriend,
  respondFriendRequest,
  searchUsers,
} from '@/lib/api';
import type { ApiFriendship, ApiUserSearchHit } from '@/lib/apiTypes';
import { otherUser } from '@/lib/friendsUtils';
import {
  authPageClassName,
  authSubmitClassName,
  authTitleClassName,
} from '@/lib/form';
import { ChevronLeft, Loader2, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

type FriendsTab = 'friends' | 'find';

const outlineBtn =
  'shrink-0 rounded-full border border-[rgb(201_166_107/0.22)] px-3 py-1.5 text-xs font-semibold text-[color:var(--color-lp-cream)] transition-colors hover:bg-[rgb(42_36_30/0.65)] disabled:opacity-50';

export default function FriendsPage() {
  return (
    <FriendIdsProvider>
      <AvatarActionProvider>
        <FriendsPageInner />
      </AvatarActionProvider>
    </FriendIdsProvider>
  );
}

function FriendsPageInner() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { openSheet } = useAvatarAction();
  const [tab, setTab] = useState<FriendsTab>('friends');
  const [friends, setFriends] = useState<ApiFriendship[]>([]);
  const [received, setReceived] = useState<ApiFriendship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeTargetId, setRemoveTargetId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const [findQuery, setFindQuery] = useState('');
  const [findHits, setFindHits] = useState<ApiUserSearchHit[]>([]);
  const [findLoading, setFindLoading] = useState(false);
  const [findError, setFindError] = useState('');
  const findReqId = useRef(0);

  useEffect(() => {
    const q = findQuery.trim().replace(/^@+/, '');
    if (q.length < 2) {
      setFindHits([]);
      setFindError('');
      setFindLoading(false);
      return;
    }
    const reqId = ++findReqId.current;
    let cancelled = false;
    const t = window.setTimeout(() => {
      async function run() {
        setFindLoading(true);
        setFindError('');
        try {
          const page = await searchUsers({ q });
          if (cancelled || reqId !== findReqId.current) return;
          setFindHits(page.items);
        } catch (error) {
          if (cancelled || reqId !== findReqId.current) return;
          setFindError(
            error instanceof Error
              ? error.message
              : '검색 중 오류가 발생했습니다.',
          );
        } finally {
          if (!cancelled && reqId === findReqId.current) {
            setFindLoading(false);
          }
        }
      }
      void run();
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [findQuery]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, requests] = await Promise.all([
        fetchFriends(),
        fetchFriendRequests(),
      ]);
      setFriends(list);
      setReceived(requests.received);
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

  async function runRequest(id: string, action: () => Promise<unknown>) {
    setBusyId(id);
    setError('');
    try {
      await action();
      await load();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : '요청 처리에 실패했습니다.',
      );
    } finally {
      setBusyId(null);
    }
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

  if (authLoading || !user) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }

  const findQ = findQuery.trim().replace(/^@+/, '');

  return (
    <main className={`${authPageClassName} gap-6`}>
      <Link
        href="/users/me"
        className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary/80">
        <ChevronLeft className="size-4" aria-hidden />
        마이페이지
      </Link>

      <h1 className={authTitleClassName}>친구</h1>

      <div
        role="tablist"
        aria-label="친구"
        className="flex rounded-full border border-[rgb(201_166_107/0.18)] bg-[rgb(42_36_30/0.45)] p-1">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'friends'}
          onClick={() => setTab('friends')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
            tab === 'friends'
              ? 'bg-brand-primary text-[color:var(--color-lp-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.25)]'
              : 'text-[color:var(--color-lp-muted)] hover:text-brand-primary'
          }`}>
          친구
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'find'}
          onClick={() => setTab('find')}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
            tab === 'find'
              ? 'bg-brand-primary text-[color:var(--color-lp-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.25)]'
              : 'text-[color:var(--color-lp-muted)] hover:text-brand-primary'
          }`}>
          찾기
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {tab === 'friends' ? (
        <div role="tabpanel" className="flex flex-col gap-6">
          {loading ? (
            <Loader2 className="mx-auto size-6 animate-spin text-brand-primary" />
          ) : (
            <>
              {received.length > 0 ? (
                <section className="flex flex-col gap-2">
                  <h2 className="text-sm font-semibold text-brand-primary">
                    받은 요청
                  </h2>
                  <ul className="divide-y divide-[rgb(201_166_107/0.12)] rounded-2xl border border-[rgb(201_166_107/0.18)] bg-[rgb(42_36_30/0.45)]">
                    {received.map((f) => (
                      <li
                        key={f.id}
                        className="flex items-center justify-between gap-3 px-4 py-3">
                        <Link
                          href={`/users/${f.requester.id}`}
                          className="min-w-0 truncate text-sm font-semibold text-[color:var(--color-lp-cream)] transition-colors hover:text-brand-primary">
                          @{f.requester.nickname}
                        </Link>
                        <div className="flex shrink-0 gap-1.5">
                          <button
                            type="button"
                            disabled={busyId === f.id}
                            className={`${authSubmitClassName} !w-auto !px-3 !py-1.5 !text-xs`}
                            onClick={() =>
                              void runRequest(f.id, () =>
                                respondFriendRequest(f.id, 'accept'),
                              )
                            }>
                            수락
                          </button>
                          <button
                            type="button"
                            disabled={busyId === f.id}
                            className={outlineBtn}
                            onClick={() =>
                              void runRequest(f.id, () =>
                                respondFriendRequest(f.id, 'decline'),
                              )
                            }>
                            거절
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="flex flex-col gap-2">
                {received.length > 0 ? (
                  <h2 className="text-sm font-semibold text-brand-primary">
                    친구
                  </h2>
                ) : null}
                {friends.length === 0 ? (
                  <p className="text-sm text-[color:var(--color-lp-muted)]">
                    아직 친구가 없어요.
                  </p>
                ) : (
                  <ul className="divide-y divide-[rgb(201_166_107/0.12)] rounded-2xl border border-[rgb(201_166_107/0.18)] bg-[rgb(42_36_30/0.45)]">
                    {friends.map((f) => {
                      const other = otherUser(f, user.id);
                      return (
                        <li
                          key={f.id}
                          className="flex items-center justify-between gap-3 px-4 py-3">
                          <Link
                            href={`/users/${other.id}`}
                            className="min-w-0 truncate text-sm font-semibold text-[color:var(--color-lp-cream)] transition-colors hover:text-brand-primary">
                            @{other.nickname}
                          </Link>
                          <button
                            type="button"
                            disabled={removing}
                            className="shrink-0 rounded-full border border-[rgb(201_166_107/0.22)] px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-[rgb(42_36_30/0.65)] disabled:opacity-50 "
                            onClick={() => setRemoveTargetId(other.id)}>
                            친구 끊기
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      ) : (
        <div role="tabpanel" className="flex flex-col gap-3">
          <div className="flex h-10 items-center gap-2 rounded-full border border-[rgb(201_166_107/0.22)] bg-[rgb(42_36_30/0.65)] px-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.2)] focus-within:ring-2 focus-within:ring-brand-primary/30">
            <Search
              className="size-3.5 shrink-0 text-[color:var(--color-lp-muted)]"
              aria-hidden
            />
            <input
              type="text"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="닉네임 검색"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[#ebe3d8] outline-none placeholder:text-[color:var(--color-lp-muted)]"
            />
            {findQuery ? (
              <button
                type="button"
                onClick={() => setFindQuery('')}
                className="cursor-pointer rounded-full p-1 text-[color:var(--color-lp-muted)] transition-colors hover:bg-brand-primary-soft hover:text-brand-primary"
                aria-label="검색어 지우기">
                <X className="size-4" strokeWidth={2} aria-hidden />
              </button>
            ) : null}
          </div>
          {findQ.length < 2 ? (
            <p className="text-sm text-[color:var(--color-lp-muted)]">
              2글자 이상 입력해 주세요.
            </p>
          ) : findLoading ? (
            <Loader2 className="mx-auto size-6 animate-spin text-brand-primary" />
          ) : findError ? (
            <p className="text-sm text-red-600">{findError}</p>
          ) : findHits.length === 0 ? (
            <p className="text-sm text-[color:var(--color-lp-muted)]">
              검색 결과가 없어요.
            </p>
          ) : (
            <ul className="divide-y divide-[rgb(201_166_107/0.12)] rounded-2xl border border-[rgb(201_166_107/0.18)] bg-[rgb(42_36_30/0.45)]">
              {findHits.map((hit) => (
                <li key={hit.id}>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center px-4 py-3 text-left text-sm font-semibold text-[color:var(--color-lp-cream)] transition-colors hover:text-brand-primary"
                    onClick={() =>
                      openSheet({ id: hit.id, nickname: hit.nickname })
                    }>
                    @{hit.nickname}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
