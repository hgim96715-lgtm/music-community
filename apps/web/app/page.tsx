import FeedList from "@/components/feed/FeedList";
import { fetchRecommendation } from "@/lib/api";
import { formatTodayLine } from "@/lib/date";
import Link from "next/link";


export default async function Home() {
    const items=await fetchRecommendation();
  return(
    <main className="min-h-full flex-1 bg-neutral-50">
        <header className="border-b border-neutral-200 bg-white px-4 py-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold text-neutral-900">Music Community 🎧</h1>
                    <p className="mt-1 text-sm text-neutral-600">{formatTodayLine()}</p>
                </div>
                <Link
                    href="/new" className="shrink-0 rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                    올리기
                </Link>
            </div>
        </header>
        <FeedList items={items}/>
    </main>
  )
}