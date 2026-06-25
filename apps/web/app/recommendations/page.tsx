import { fetchRecommendations } from '@/lib/api';
import { FeedList } from '@/components/recommendations/FeedList';

export default async function RecommendationPage() {
  const recommendations = await fetchRecommendations();

  return (
    <main className="mx-auto max-w-lg p-8">
      <FeedList items={recommendations} />
    </main>
  );
}
