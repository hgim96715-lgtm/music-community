/** FeedList.tsx — 피드 목록 · 헤더(올리기)는 빈 목록에도 표시 */
import type { Recommendation } from '@/lib/types';
import { FeedCard } from './FeedCard';
import Link from 'next/link';
import { PlusIcon } from 'lucide-react';

type FeedListProps = {
  items: Recommendation[];
};

function FeedHeader() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold">추천</h1>
      <Link
        href="/recommendations/new"
        className="inline-flex items-center gap-1 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white">
        <PlusIcon className="h-4 w-4" aria-hidden />
        올리기
      </Link>
    </header>
  );
}

export function FeedList({ items }: FeedListProps) {
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
      <ul className="flex flex-col gap-6">
        {items.map((item) => (
          <li key={item.id}>
            <FeedCard recommendation={item} />
          </li>
        ))}
      </ul>
    </>
  );
}
