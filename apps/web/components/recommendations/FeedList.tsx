/** FeedList.tsx , 피드 목록들을 표시하는 컴포넌트 */
import type { Recommendation } from '@/lib/types';
import { FeedCard } from './FeedCard';

type FeedListProps = {
  items: Recommendation[];
};

export function FeedList({ items }: FeedListProps) {
  if (items.length === 0) {
    return (
      <p className="px-4 text-center text-neutral-500">
        아직 올라온 곡이 없어요.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-6">
      {items.map((item) => (
        <li key={item.id}>
          <FeedCard recommendation={item} />
        </li>
      ))}
    </ul>
  );
}
