import HealthCheck from './HealthCheck';
import { FeedList } from '@/components/recommendations/FeedList';
import { mockRecommendations } from '@/lib/mockRecommendations';

export default function Home() {
  return (
    <main className="mx-auto max-w-lg p-8">
      {/* <HealthCheck /> */}
      <FeedList items={mockRecommendations} />
    </main>
  );
}
