import FeedList from "@/components/feed/FeedList";
import { fetchRecommendation } from "@/lib/api";
import { formatTodayLine } from "@/lib/date";


export default async function Home() {
    const items=await fetchRecommendation();
  return(
    <main className="min-h-full flex-1 bg-neutral-50">
        <header className="border-b border-neutral-200 bg-white px-4 py-4">
            <h1 className="text-lg font-semibold text-neutral-900">Music Community 🎧</h1>
            <p className="mt-1 text-sm text-neutral-600">{formatTodayLine()}</p>
        </header>
        <FeedList items={items}/>
    </main>
  )
}