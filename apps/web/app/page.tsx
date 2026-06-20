import FeedList from "@/components/feed/FeedList";
import AppHeader from "@/components/layout/AppHeader";
import { fetchRecommendation } from "@/lib/api";


export default async function Home() {
    const items=await fetchRecommendation();
  return(
    <main className="min-h-full flex-1 bg-neutral-50">
        <AppHeader/>
        <FeedList items={items}/>
    </main>
  )
}