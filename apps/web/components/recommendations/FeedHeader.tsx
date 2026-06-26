import { PostButton } from './PostButton';

export function FeedHeader() {
  return (
    <header className="mb-6 flex items-center justify-between">
      <h1 className="text-xl font-semibold">추천</h1>
      <PostButton />
    </header>
  );
}
