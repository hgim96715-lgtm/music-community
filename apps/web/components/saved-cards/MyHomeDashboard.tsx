'use client';

import type { ApiSavedCard } from '@/lib/apiTypes';
import { ChevronRight, Disc3, Quote } from 'lucide-react';
import Link from 'next/link';
import { LpAlbumJacket, TOP3_JACKET_CLASS, TOP3_TITLE_MAX_CLASS } from './LpAlbumJacket';
import { LpAlbumDisc } from './LpAlbumDisc';
import { MyHomeNav } from './MyHomeNav';

type MyHomeDashboardProps = {
  nickname: string;
  bio: string | null;
  cards: ApiSavedCard[];
  lyricCount?: number;
  /** 가장 최근 소절 한 줄 미리보기 */
  lyricPreview?: string | null;
  loading: boolean;
  requestCount?: number;
};

function topCards(cards: ApiSavedCard[]): ApiSavedCard[] {
  const byRank = new Map<number, ApiSavedCard>();
  for (const c of cards) {
    if (c.shelfRank === 1 || c.shelfRank === 2 || c.shelfRank === 3) {
      byRank.set(c.shelfRank, c);
    }
  }
  return ([1, 2, 3] as const)
    .map((r) => byRank.get(r))
    .filter((c): c is ApiSavedCard => Boolean(c));
}

function albumPreview(cards: ApiSavedCard[]): ApiSavedCard[] {
  const top = topCards(cards);
  if (top.length >= 3) return top.slice(0, 3);
  const rest = cards.filter((c) => !top.some((t) => t.id === c.id));
  return [...top, ...rest].slice(0, 3);
}

function greetingLabel() {
  const h = new Date().getHours();
  if (h < 5) return '늦은 밤이에요';
  if (h < 12) return '좋은 아침';
  if (h < 18) return '좋은 오후';
  return '좋은 저녁';
}

const doorClassName =
  'group flex min-h-[7.5rem] flex-col gap-1.5 rounded-xl border border-[rgb(201_166_107/0.22)] bg-[rgb(42_36_30/0.65)] p-2.5 text-left shadow-[0_2px_8px_rgb(0_0_0/0.28)] transition-[transform,box-shadow,border-color] duration-150 hover:-translate-y-0.5 hover:border-[rgb(201_166_107/0.38)] hover:shadow-[0_4px_12px_rgb(0_0_0/0.35)] active:translate-y-px';

/** 마이 홈 대시보드 — 가로 nav · Top3 시그니처 · 컬렉션 문 (통계 자리 여유) */
export function MyHomeDashboard({
  nickname,
  bio,
  cards,
  lyricCount = 0,
  lyricPreview = null,
  loading,
  requestCount = 0,
}: MyHomeDashboardProps) {
  const preview = albumPreview(cards);
  const tops = topCards(cards);

  return (
    <div className="my-home-shell">
      <header className="my-home-hero">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[#cbbba0] uppercase">
          My home
        </p>
        <p className="mt-1 text-[15px] font-medium text-[#ebe3d8]">
          {greetingLabel()},{' '}
          <span className="font-bold text-brand-primary">@{nickname}</span>
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#a89880]">
          {bio?.trim() ? bio : '한 줄 소개를 적어 두면 홈이 더 나답게 보여요'}
        </p>
        <MyHomeNav active="home" requestCount={requestCount} />
      </header>

      <div className="my-home-body">
        {/* Top 3 — 꽂힌 LP만 (빈 자리·꽂기 CTA ❌ · 편집은 /album) */}
        <section className="my-home-top3" aria-label="Top 3">
          <div className="mb-2.5">
            <h2 className="text-[12px] font-bold tracking-wide text-[#ebe3d8]">
              Top 3
            </h2>
            <p className="mt-0.5 text-[10px] text-[#a89880]">
              프로필에 꽂아 둔 애정곡
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center gap-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="size-16 animate-pulse rounded-md bg-[rgb(201_166_107/0.12)]"
                />
              ))}
            </div>
          ) : tops.length === 0 ? (
            <Link
              href="/users/me/album"
              className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-[rgb(201_166_107/0.28)] bg-[rgb(26_22_18/0.45)] px-3 py-5 text-center">
              <Disc3 className="size-5 text-brand-primary" aria-hidden />
              <span className="text-[12px] font-medium text-[#ebe3d8]">
                아직 Top LP가 없어요
              </span>
              <span className="text-[11px] text-[#a89880]">
                내 앨범에서 최대 3장 꽂을 수 있어요
              </span>
            </Link>
          ) : (
            <ul className="my-home-top3-slots">
              {tops.map((card) => (
                <li key={card.id} className="my-home-top3-slot">
                  <LpAlbumJacket
                    embedUrl={card.recommendation.embedUrl}
                    title={card.recommendation.title}
                    artist={card.recommendation.artist}
                    reason={card.recommendation.reason}
                    moods={card.recommendation.moods}
                    postedAt={card.recommendation.createdAt}
                    savedAt={card.createdAt}
                    customization={card.customization}
                    size="sm"
                    className={TOP3_JACKET_CLASS}
                  />
                  <span
                    className={`mt-1 truncate text-[10px] font-medium text-[#cbbba0] ${TOP3_TITLE_MAX_CLASS}`}>
                    {card.recommendation.title}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 나중 통계 자리 힌트 — 공간 확보 */}
        <div
          className="my-home-stats-slot"
          aria-hidden
          title="나중에 주·월 저장 통계">
          <span>통계 · 곧</span>
        </div>

        <section className="mt-4" aria-label="컬렉션">
          <h2 className="mb-2.5 text-[12px] font-bold tracking-wide text-[#ebe3d8]">
            컬렉션
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/users/me/album" className={doorClassName}>
              <span className="flex items-center justify-between gap-1">
                <span className="text-[13px] font-bold text-[#ebe3d8]">
                  내 앨범
                </span>
                <ChevronRight
                  className="size-4 text-brand-primary transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="flex flex-1 items-center justify-center gap-1 py-0.5">
                {loading ? (
                  <span className="text-[11px] text-[#a89880]">…</span>
                ) : preview.length === 0 ? (
                  <span className="text-center text-[11px] text-[#a89880]">
                    LP 책장
                  </span>
                ) : (
                  preview.map((card, i) => (
                    <span
                      key={card.id}
                      className="relative"
                      style={{
                        zIndex: preview.length - i,
                        marginLeft: i ? -8 : 0,
                      }}>
                      <LpAlbumDisc
                        embedUrl={card.recommendation.embedUrl}
                        title={card.recommendation.title}
                        size="sm"
                      />
                    </span>
                  ))
                )}
              </span>
              <span className="text-[11px] font-medium text-[#cbbba0]">
                {loading
                  ? '…'
                  : cards.length > 0
                    ? `${cards.length}장 →`
                    : '비어 있음 →'}
              </span>
            </Link>

            <Link href="/users/me/lyrics" className={doorClassName}>
              <span className="flex items-center justify-between gap-1">
                <span className="text-[13px] font-bold text-[#ebe3d8]">
                  내 가사
                </span>
                <ChevronRight
                  className="size-4 text-brand-primary transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              <span className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 overflow-hidden py-0.5">
                {loading ? (
                  <span className="text-[11px] text-[#a89880]">…</span>
                ) : lyricPreview ? (
                  <span className="napkin-hand line-clamp-2 w-full px-0.5 text-center text-[0.95rem] leading-[1.15] text-[#ebe3d8]">
                    “{lyricPreview}”
                  </span>
                ) : (
                  <>
                    <span className="grid size-9 place-items-center rounded-lg border border-[rgb(201_166_107/0.28)] bg-[rgb(26_22_18/0.55)] text-brand-primary">
                      <Quote className="size-3.5" aria-hidden />
                    </span>
                    <span className="text-center text-[10px] leading-snug text-[#a89880]">
                      소절 모음
                    </span>
                  </>
                )}
              </span>
              <span className="text-[11px] font-medium text-[#cbbba0]">
                {loading
                  ? '…'
                  : lyricCount > 0
                    ? `${lyricCount}쪽 →`
                    : '비어 있음 →'}
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
