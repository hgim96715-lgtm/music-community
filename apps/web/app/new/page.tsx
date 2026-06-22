"use client";

import {
  createRecommendationAction,
  type NewRecommendationFormState,
} from "./action";
import { getMoodPalette } from "@/lib/moods";
import { Mood, MOODS } from "@/lib/types";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

const initialState: NewRecommendationFormState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "업로드 중..." : "업로드"}
    </button>
  );
}

export default function NewPage() {
  const [state, formAction] = useActionState(
    createRecommendationAction,
    initialState,
  );
  const [moods, setMoods] = useState<Mood[]>([]);
  const [tagError, setTagError] = useState<string | null>(null);

  function toggleMood(mood: Mood) {
    if (moods.includes(mood)) {
      setTagError(null);
      setMoods((prev) => prev.filter((m) => m !== mood));
      return;
    }
    if (moods.length >= 3) {
      setTagError("분위기 태그는 1~3개까지 선택할 수 있습니다!!");
      return;
    }
    setTagError(null);
    setMoods((prev) => [...prev, mood]);
  }

  const error = tagError ?? state.error;

  return (
    <main className="min-h-full flex-1 bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white px-4 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeftIcon className="size-4" /> 피드
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-neutral-900">
          오늘의 한곡 올리기
        </h1>
      </header>

      <form
        action={formAction}
        className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-6"
      >
        <input type="hidden" name="moods" value={moods.join(",")} />

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-900">Embed URL</span>
          <span className="text-xs text-neutral-500">
            YouTube, Spotify, Apple Music 등의 외부 서비스 링크를 입력해주세요.
          </span>
          <input
            type="url"
            name="embedUrl"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none"
            placeholder="예시:https://www.youtube.com/embed/..."
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-900">곡 제목</span>
          <input
            type="text"
            name="title"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none"
            placeholder="곡 제목을 입력하세요"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-900">아티스트</span>
          <input
            type="text"
            name="artist"
            required
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none"
            placeholder="아티스트를 입력하세요"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-neutral-900">추천 이유</span>
          <textarea
            name="reason"
            required
            rows={4}
            className="rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-blue-500 focus:outline-none"
            placeholder="추천 이유를 입력하세요"
          />
        </label>

        <div className="flex flex-col gap-3 pt-1">
          <div>
            <p className="text-sm font-medium text-neutral-900">분위기 태그</p>
            <p className="mt-1 text-xs text-neutral-500">1~3개 선택</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => {
              const selected = moods.includes(mood);
              const pill = getMoodPalette(mood).pillClass;
              return (
                <button
                  key={mood}
                  type="button"
                  onClick={() => toggleMood(mood)}
                  className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? `${pill} border-transparent`
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                  }`}
                >
                  {mood}
                </button>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <SubmitButton />
      </form>
    </main>
  );
}
