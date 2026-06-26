'use client';

import { fetchRecommendations } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';
import type { Recommendation } from '@/lib/types';
import { useEffect, useState } from 'react';
import { FeedCard } from './FeedCard';
import { FeedHeader } from './FeedHeader';

export function FeedList() {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const data = await fetchRecommendations(user?.id);
        if (!cancelled) setItems(data);
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

  if (items.length === 0) {
    return (
      <>
        <FeedHeader />
        <p className="text-center text-neutral-500">아직 올라온 곡이 없어요.</p>
      </>
    );
  }

  return (
    <>
      <FeedHeader />
      <ul className="flex flex-col gap-10 pb-2">
        {items.map((item) => (
          <li key={item.id}>
            <FeedCard recommendation={item} />
          </li>
        ))}
      </ul>
    </>
  );
}
