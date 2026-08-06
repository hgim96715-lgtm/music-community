'use client';

import { fetchRecommendationsPage } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Recommendation } from '@/lib/types';
import { useEffect, useState } from 'react';
import { FriendIdsProvider } from '@/components/friends/FriendIdsContext';
import { FeedCard } from './FeedCard';
import { FeedHeader } from './FeedHeader';
import { FeedNoteDivider } from './FeedNoteDivider';
import { SavedCardsFeedProvider } from '@/components/saved-cards/SavedCardsFeedContext';
import { AvatarActionProvider } from '../friends/AvatarActionContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

type FeedFilter = 'all' | 'friends';

export function FeedList() {
  const { user, isLoading: authLoading } = useAuth();
  const [feed, setFeed] = useState<FeedFilter>('all');
  const [items, setItems] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [olderCursor, setOlderCursor] = useState<string | null>(null);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const searchParams = useSearchParams();
  const focusId = searchParams.get('id')?.trim() || null;
  const focusCommentId = searchParams.get('commentId')?.trim() || null;

  useEffect(() => {
    if (!focusId || isLoading) return;
    document
      .getElementById(`feed-card-${focusId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [focusId, isLoading, items]);

  const handleDeleted = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  useEffect(() => {
    if (authLoading) return;
    if (feed === 'friends' && !user) {
      setItems([]);
      setHasOlder(false);
      setOlderCursor(null);
      setLoadError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setLoadError(null);
      setOlderCursor(null);
      try {
        const recent = await fetchRecommendationsPage({
          currentUserId: user?.id,
          scope: 'recent',
          feed,
        });
        if (cancelled) return;
        setItems(recent.items);

        const peek = await fetchRecommendationsPage({
          currentUserId: user?.id,
          scope: 'older',
          feed,
          limit: 1,
        });
        if (!cancelled) setHasOlder(peek.items.length > 0);
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : '피드를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, feed]);

  async function loadMoreOlder() {
    if (loadingMore || !hasOlder) return;
    if (feed === 'friends' && !user) return;
    setLoadingMore(true);
    try {
      const page = await fetchRecommendationsPage({
        currentUserId: user?.id,
        scope: 'older',
        feed,
        limit: 20,
        cursor: olderCursor ?? undefined,
      });
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...page.items.filter((i) => !seen.has(i.id))];
      });
      setOlderCursor(page.nextCursor);
      if (!page.nextCursor) setHasOlder(false);
    } catch {
      /* 하단만 실패 — 조용히 */
    } finally {
      setLoadingMore(false);
    }
  }

  const feedTabs = (
    <div
      role="tablist"
      aria-label="피드"
      className="mb-6 flex rounded-full border border-[rgb(201_166_107/0.18)] bg-[rgb(42_36_30/0.45)] p-1">
      <button
        type="button"
        role="tab"
        aria-selected={feed === 'all'}
        onClick={() => setFeed('all')}
        className={`flex-1 cursor-pointer rounded-full py-2 text-sm font-semibold transition-colors ${
          feed === 'all'
            ? 'bg-brand-primary text-[color:var(--color-lp-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.25)]'
            : 'text-[color:var(--color-lp-muted)] hover:text-brand-primary'
        }`}>
        전체
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={feed === 'friends'}
        onClick={() => setFeed('friends')}
        className={`flex-1 cursor-pointer rounded-full py-2 text-sm font-semibold transition-colors ${
          feed === 'friends'
            ? 'bg-brand-primary text-[color:var(--color-lp-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.25)]'
            : 'text-[color:var(--color-lp-muted)] hover:text-brand-primary'
        }`}>
        친구
      </button>
    </div>
  );

  if (authLoading || isLoading) {
    return (
      <>
        <FeedHeader />
        {feedTabs}
        <p className="text-center text-brand-primary/60">
          불러오는 중입니다...
        </p>
      </>
    );
  }

  if (feed === 'friends' && !user) {
    return (
      <>
        <FeedHeader />
        {feedTabs}
        <div
          className="mt-10 flex flex-col items-center gap-3 px-4 text-center"
          role="status">
          <p className="text-base font-medium text-brand-primary">
            친구 피드는 로그인이 필요해요
          </p>
          <Link
            href="/login?next=/"
            className="text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary/80">
            로그인하기 →
          </Link>
        </div>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <FeedHeader />
        {feedTabs}
        <p className="text-center text-sm text-red-500" role="alert">
          {loadError}
        </p>
        <p className="mt-2 text-center text-xs text-neutral-500">
          {typeof window !== 'undefined' &&
          window.location.hostname === 'localhost'
            ? '로컬: pnpm dev:api · NEXT_PUBLIC_API_URL=http://localhost:3030'
            : '배포: Vercel NEXT_PUBLIC_API_URL · Railway FRONTEND_URL은 경로 없이 앱 주소만 (예: https://xxx.vercel.app)'}
        </p>
      </>
    );
  }

  if (items.length === 0 && !hasOlder) {
    return (
      <>
        <FeedHeader />
        {feedTabs}
        <div
          className="mt-16 flex flex-col items-center gap-2 px-4 text-center"
          role="status">
          <p className="text-base font-medium text-brand-primary">
            {feed === 'friends'
              ? '친구들이 올린 곡이 아직 없어요'
              : '아직 올라온 곡이 없어요'}
          </p>
          <p className="text-sm leading-relaxed text-brand-primary/55">
            {feed === 'friends'
              ? '친구를 추가하면 여기 모여요.'
              : user?.role === 'admin'
                ? '관리자는 글을 작성할 수 없습니다.'
                : user
                  ? '올리기 버튼으로 첫 추천을 남겨보세요.'
                  : '로그인하고 분위기에 맞는 곡을 추천해 보세요.'}
          </p>
          {feed === 'friends' ? (
            <Link
              href="/friends"
              className="mt-1 text-sm font-semibold text-brand-primary transition-colors hover:text-brand-primary/80">
              친구 · 찾기로 →
            </Link>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <FriendIdsProvider>
      <AvatarActionProvider>
        <SavedCardsFeedProvider>
          <FeedHeader />
          {feedTabs}
          {items.length === 0 ? (
            <p className="mb-6 text-center text-sm text-brand-primary/55">
              {feed === 'friends'
                ? '요즘 친구 추천이 없어요. 아래에서 지난 글을 볼 수 있어요.'
                : '요즘 올라온 곡이 없어요. 아래에서 지난 추천을 볼 수 있어요.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-5 pb-2">
              {items.map((item, index) => (
                <li key={item.id} className="flex flex-col gap-5">
                  {index > 0 ? <FeedNoteDivider /> : null}
                  <div id={`feed-card-${item.id}`}>
                    <FeedCard
                      recommendation={item}
                      onDeleted={handleDeleted}
                      focusCommentId={
                        item.id === focusId ? focusCommentId : null
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {hasOlder ? (
            <div className="mt-8 flex justify-center pb-4">
              <button
                type="button"
                onClick={() => void loadMoreOlder()}
                disabled={loadingMore}
                className="cursor-pointer text-sm font-medium text-brand-primary transition-colors hover:text-brand-primary/80 disabled:opacity-50">
                {loadingMore ? '불러오는 중…' : '더 보기 · 지난 추천'}
              </button>
            </div>
          ) : null}
        </SavedCardsFeedProvider>
      </AvatarActionProvider>
    </FriendIdsProvider>
  );
}
