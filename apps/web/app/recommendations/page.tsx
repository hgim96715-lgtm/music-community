import { FeedList } from '@/components/recommendations/FeedList';

export default function RecommendationPage() {
  return (
    <main className="lp-bar-main mx-auto min-h-[calc(100vh-3.5rem)] max-w-lg px-5 py-8">
      <FeedList />
    </main>
  );
}
