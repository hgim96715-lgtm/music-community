'use client';

import { createRecommendation } from "@/lib/api";
import { getMoodPalette } from "@/lib/moods";
import { Mood, MOODS } from "@/lib/types";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SubmitEventHandler, useState } from "react";

export default function NewPage(){
    const router=useRouter();
    const [embedUrl,setEmbedURL]=useState("");
    const [title,setTitle]=useState("");
    const [artist,setArtist]=useState("");
    const [reason,setReason]=useState("");
    const [moods,setMoods]=useState<Mood[]>([]);
    const [submitting,setSubmitting]=useState(false);
    const [error,setError]=useState<string|null>(null);

    function toggleMood(mood: Mood) {
        if (moods.includes(mood)) {
            setError(null);
            setMoods((prev) => prev.filter((m) => m !== mood));
            return;
        }
        if (moods.length >= 3) {
            setError("분위기 태그는 1~3개까지 선택할 수 있습니다!!");
            return;
        }
        setError(null);
        setMoods((prev) => [...prev, mood]);
    }

    const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        setError(null);
        if (moods.length === 0) {
            setError("분위기 태그를 1~3개 선택해주세요.");
            return;
        }

        setSubmitting(true);
        try{
            await createRecommendation({
                title,
                artist,
                embedUrl,
                reason,
                moods
            });
            router.push("/");
            router.refresh();
        }catch(error:unknown){
            setError(error instanceof Error ? error.message:"알 수 없는 오류가 발생했습니다.");
        }finally{
            setSubmitting(false);
        }
    }
    return(
        <main className="min-h-full flex-1 bg-neutral-50">
            <header className="border-b border-neutral-200 bg-white px-4 py-4">
                <Link href="/" className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700">
                    <ArrowLeftIcon className="size-4" /> 피드
                </Link>
                <h1 className="mt-2 text-lg font-semibold text-neutral-900">오늘의 한곡 올리기</h1>
            </header>

            <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-6">
                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-neutral-900">Embed URL</span>
                    <span className="text-xs text-neutral-500">YouTube, Spotify, Apple Music 등의 외부 서비스 링크를 입력해주세요.</span>
                    <input type="url" required value={embedUrl} onChange={(e)=>setEmbedURL(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none" placeholder="예시:https://www.youtube.com/embed/..." />

                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-neutral-900">곡 제목</span>
                    <input type="text" required value={title} onChange={(e)=>setTitle(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none" placeholder="곡 제목을 입력하세요" />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-neutral-900">아티스트</span>
                    <input type="text" required value={artist} onChange={(e)=>setArtist(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none" placeholder="아티스트를 입력하세요" />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-neutral-900">추천 이유</span>
                    <textarea required value={reason} rows={4} onChange={(e)=>setReason(e.target.value)} className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none" placeholder="추천 이유를 입력하세요" />
                </label>

                <div className="flex flex-col gap-3 pt-1">
                    <div>
                        <p className="text-sm font-medium text-neutral-900">분위기 태그</p>
                        <p className="mt-1 text-xs text-neutral-500">1~3개 선택</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {MOODS.map((mood)=>{
                            const selected=moods.includes(mood);
                            const pill=getMoodPalette(mood).pillClass
                            return(
                                <button
                                    key={mood}
                                    type="button"
                                    onClick={()=>toggleMood(mood)}
                                    className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                                        selected
                                          ? `${pill} border-transparent`
                                          : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                                    }`}
                                >
                                    {mood}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button type="submit" disabled={submitting} className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
                    {submitting ? "업로드 중..." : "업로드"}
                </button>
            </form>
        </main>
    )
}