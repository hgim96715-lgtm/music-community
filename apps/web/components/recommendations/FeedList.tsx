/** FeedList.tsx — 피드 목록 · 헤더(올리기)는 빈 목록에도 표시 */
import type { Recommendation } from '@/lib/types';
import { FeedCard } from './FeedCard';
import { FeedHeader } from './FeedHeader';

type FeedListProps = {
  items: Recommendation[];
};

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
