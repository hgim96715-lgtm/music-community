'use client';

import { fetchRecommendations } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Recommendation } from '@/lib/types';
import { useEffect, useState } from 'react';
import { FeedCard } from './FeedCard';
import { FeedHeader } from './FeedHeader';
import { SavedCardsFeedProvider } from '@/components/saved-cards/SavedCardsFeedContext';

export function FeedList() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const handleDeleted = (id: string) => {
    setItems((items) => items.filter((item) => item.id !== id));
  };

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await fetchRecommendations(user?.id);
        if (!cancelled) setItems(data);
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
    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

  if (authLoading || isLoading) {
    return (
      <>
        <FeedHeader />
        <p className="text-center text-neutral-500">불러오는 중입니다...</p>
      </>
    );
  }

  if (loadError) {
    return (
      <>
        <FeedHeader />
        <p className="text-center text-sm text-red-500" role="alert">
          {loadError}
        </p>
        <p className="mt-2 text-center text-xs text-neutral-500">
          API 서버(3030)가 켜져 있는지, 주소창이 localhost:3031 인지
          확인해주세요.
        </p>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <FeedHeader />
        <div
          className="mt-16 flex flex-col items-center gap-2 px-4 text-center"
          role="status">
          <p className="text-base font-medium text-brand-primary">
            아직 올라온 곡이 없어요
          </p>
          <p className="text-sm leading-relaxed text-neutral-500">
            {user
              ? '위 올리기 버튼으로 첫 추천을 남겨보세요.'
              : '로그인하고 분위기에 맞는 곡을 추천해 보세요.'}
          </p>
        </div>
      </>
    );
  }

  // 카드 있을때만 SavedCardsFeedProvider 제공
  return (
    <SavedCardsFeedProvider>
      <FeedHeader />
      <ul className="flex flex-col gap-10 pb-2">
        {items.map((item) => (
          <li key={item.id}>
            <FeedCard recommendation={item} onDeleted={handleDeleted} />
          </li>
        ))}
      </ul>
    </SavedCardsFeedProvider>
  );
}
