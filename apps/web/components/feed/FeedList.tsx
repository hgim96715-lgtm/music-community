import { Recommendation } from '@/lib/types';
import FeedCard from './FeedCard';

type Props = {
  items: Recommendation[];
};

export default function FeedList({ items }: Props) {
  if (items.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-neutral-500">
        아직 올라온 곡이 없어요.
      </p>
    );
  }

  return (
    <ul className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6">
      {items.map((item) => (
        <li key={item.id}>
          <FeedCard recommendation={item} />
        </li>
      ))}
    </ul>
  );
}
