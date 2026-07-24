'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { RoomSongPlaySheet } from '@/components/rooms/RoomSongPlaySheet';
import { MyHomeSubShell } from '@/components/saved-cards/MyHomeSubShell';
import {
  SavedLyricPreset,
  SavedLyricSaveSheet,
} from '@/components/saved-cards/SavedLyricSaveSheet';
import { SavedLyricSticky } from '@/components/saved-cards/SavedLyricSticky';
import {
  createSavedLyric,
  deleteSavedLyric,
  fetchFriendRequests,
  fetchSavedLyrics,
  patchSavedLyric,
} from '@/lib/api';
import type { ApiSavedLyric, ApiSavedLyricBody } from '@/lib/apiTypes';
import { authPageClassName } from '@/lib/form';
import { ChevronLeft, Loader2, Plus, Quote } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MyLyricsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [requestCount, setRequestCount] = useState(0);
  const [items, setItems] = useState<ApiSavedLyric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [play, setPlay] = useState<ApiSavedLyric | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [savePreset, setSavePreset] = useState<SavedLyricPreset | null>(null);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login?next=/users/me/lyrics');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    fetchSavedLyrics()
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : '불러오지 못했어요');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    fetchFriendRequests()
      .then((r) => {
        if (!cancelled) setRequestCount(r.received.length + r.sent.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleCreate(body: ApiSavedLyricBody) {
    setSaving(true);
    try {
      const row = await createSavedLyric(body);
      setItems((prev) => [row, ...prev]);
      setSheetOpen(false);
      setSavePreset(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : '저장에 실패했어요');
    } finally {
      setSaving(false);
    }
  }

  function openSaveFromPlay() {
    if (!play) return;
    setSavePreset({
      recommendationId: play.recommendationId,
      title: play.recommendation.title,
      artist: play.recommendation.artist,
      embedUrl: play.recommendation.embedUrl,
      startSec: play.startSec ?? undefined,
    });
    setPlay(null);
    setSheetOpen(true);
  }

  if (isLoading || !user) {
    return (
      <main className={authPageClassName}>
        <Loader2 className="mx-auto mt-20 size-6 animate-spin text-brand-primary" />
      </main>
    );
  }

  return (
    <main className={`${authPageClassName} gap-5`}>
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/users/me"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary hover:underline">
          <ChevronLeft className="size-4" aria-hidden />
          마이 홈
        </Link>
        <button
          type="button"
          onClick={() => {
            setSavePreset(null);
            setSheetOpen(true);
          }}
          className="inline-flex items-center gap-1 rounded-full bg-[#3d342c] px-3 py-1.5 text-[12px] font-semibold text-[#f7f1e8]">
          <Plus className="size-3.5" aria-hidden />
          새로 저장
        </button>
      </div>

      <MyHomeSubShell
        nickname={user.nickname}
        title="내 가사 모음"
        subtitle="쪽지처럼 모으고 · 뒤집으면 메모"
        active={null}
        requestCount={requestCount}>
        {loading ? (
          <Loader2 className="mx-auto my-10 size-5 animate-spin text-[#8a7048]" />
        ) : error ? (
          <p className="py-8 text-center text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[rgb(201_166_107/0.28)] bg-[rgb(42_36_30/0.45)] px-4 py-12 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-xl border border-[rgb(201_166_107/0.28)] bg-[rgb(26_22_18/0.55)] text-brand-primary">
              <Quote className="size-5" aria-hidden />
            </span>
            <p className="mt-4 text-sm font-medium text-[#ebe3d8]">
              아직 쪽지가 없어요
            </p>
            <p className="mt-1.5 text-[12px] text-[#a89880]">
              듣다가 꽂힌 소절을 여기에 붙여 두세요
            </p>
          </div>
        ) : (
          <ul className="lyric-sticky-grid">
            {items.map((item, i) => (
              <li key={item.id}>
                <SavedLyricSticky
                  item={item}
                  tiltIndex={i}
                  onPlay={() => setPlay(item)}
                  onPatch={async (body) => {
                    const row = await patchSavedLyric(item.id, body);
                    setItems((prev) =>
                      prev.map((x) => (x.id === row.id ? row : x)),
                    );
                  }}
                  onDelete={() => {
                    if (!confirm('이 쪽지를 삭제할까요?')) return;
                    void deleteSavedLyric(item.id).then(() =>
                      setItems((prev) => prev.filter((x) => x.id !== item.id)),
                    );
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </MyHomeSubShell>

      <SavedLyricSaveSheet
        open={sheetOpen}
        userId={user.id}
        saving={saving}
        preset={savePreset}
        onClose={() => {
          setSheetOpen(false);
          setSavePreset(null);
        }}
        onSubmit={(body) => void handleCreate(body)}
      />

      <RoomSongPlaySheet
        song={
          play
            ? {
                title: play.recommendation.title,
                artist: play.recommendation.artist,
                embedUrl: play.recommendation.embedUrl,
              }
            : null
        }
        startSec={play?.startSec ?? undefined}
        onSaveLyric={play ? openSaveFromPlay : undefined}
        onClose={() => setPlay(null)}
      />
    </main>
  );
}
