import { ApiRecommendation } from "@/lib/apiTypes";
import { formatDisplayDate } from "@/lib/date";
import { getApiAccessToken } from "@/lib/getApiAccessToken";
import { setRecommendationHidden } from "./actions";
import { adminFetchJson } from "@/lib/adminFetch";
import DeleteRecommendationButton from "./DeletRecommendationButton";



export default async function AdminRecommendationsPage(){
    const items = await adminFetchJson<ApiRecommendation[]>(
        "/admin/recommendations",
        { cache: "no-store" },
      );

  return (
    <div>
      <h1 className="text-lg font-semibold text-neutral-900">추천 관리</h1>
      <p className="mt-1 text-sm text-neutral-600">
        전체 {items.length}건 (숨김 포함)
      </p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">제목</th>
              <th className="px-4 py-3 font-medium">아티스트</th>
              <th className="px-4 py-3 font-medium">숨김</th>
              <th className="px-4 py-3 font-medium">좋아요</th>
              <th className="px-4 py-3 font-medium">작성일</th>
              <th className="px-4 py-3 font-medium">관리</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 text-neutral-900">{item.title}</td>
                <td className="px-4 py-3 text-neutral-700">{item.artist}</td>
                <td className="px-4 py-3">
                  {item.hidden ? (
                    <span className="text-amber-600">숨김</span>
                  ) : (
                    <span className="text-neutral-500">공개</span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-700">
                  {item.reactions.filter((r) => r.type === "like").length}
                </td>
                <td className="px-4 py-3 text-neutral-500">
                  {formatDisplayDate(item.createdAt)}
                </td>
                
                <td className="px-4 py-3">
                    <div  className="flex items-center gap-2">
                    <form action={setRecommendationHidden.bind(null, item.id, !item.hidden)}>
    <button
      type="submit"
      className={
        item.hidden
          ? "rounded-md border border-neutral-300 px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
          : "rounded-md border border-amber-300 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
      }
    >
      {item.hidden ? "복구" : "숨김"}
    </button>
  </form>
  <DeleteRecommendationButton id={item.id} title={item.title} />
                    </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

    
}