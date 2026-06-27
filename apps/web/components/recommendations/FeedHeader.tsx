import { authTitleClassName } from '@/lib/form';
import { PostButton } from './PostButton';

export function FeedHeader() {
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <h1 className={`${authTitleClassName} text-xl`}>추천</h1>
      <PostButton />
    </header>
  );
}
