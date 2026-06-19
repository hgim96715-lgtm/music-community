import FeedList from "@/components/feed/FeedList";
import { formatTodayLine } from "@/lib/date";
import { mockRecommendations } from "@/lib/mockRecommendations";


export default function Home() {
  return(
    <main className="min-h-full flex-1 bg-neutral-50">
        <header className="border-b border-neutral-200 bg-white px-4 py-4">
            <h1 className="text-lg font-semibold text-neutral-900">Music Community 🎧</h1>
            <p className="mt-1 text-sm text-neutral-600">{formatTodayLine()}</p>
        </header>

        <FeedList items={mockRecommendations}/>


    </main>
  )
}