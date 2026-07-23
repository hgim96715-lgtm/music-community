'use client';

import { patchSavedCardShelf } from '@/lib/api';
import type { ApiSavedCard } from '@/lib/apiTypes';
import {
  cardIdAtRank,
  firstEmptyShelfRank,
  type ShelfRank,
} from '@/lib/albumShelfStorage';
import { useCallback, useMemo, useState } from 'react';
import { LpAlbumDisc } from './LpAlbumDisc';
import { LpAlbumJacket } from './LpAlbumJacket';

type SavedCardAlbumBookProps = {
  cards: ApiSavedCard[];
  loading: boolean;
  error: string;
  onSelectCard: (card: ApiSavedCard) => void;
  onCardsChange: (cards: ApiSavedCard[]) => void;
  /** 본인 앨범만 Top 꽂기 · 기본 true */
  editable?: boolean;
  /** 마이 홈 셸 안 — 바깥 lp-album-shell 생략 */
  embedded?: boolean;
};

const SHELF_PER_ROW = 6;

function mergeShelfResponse(
  cards: ApiSavedCard[],
  updated: ApiSavedCard,
): ApiSavedCard[] {
  return cards.map((c) => {
    if (c.id === updated.id) return updated;
    if (
      updated.shelfRank !== null &&
      c.shelfRank === updated.shelfRank
    ) {
      return { ...c, shelfRank: null };
    }
    return c;
  });
}

/** 마이페이지 — LP Top 3 + 책장 (ideas 「LP 책장 앨범」) */
export function SavedCardAlbumBook({
  cards,
  loading,
  error,
  onSelectCard,
  onCardsChange,
  editable = true,
  embedded = false,
}: SavedCardAlbumBookProps) {
  const [pulledId, setPulledId] = useState<string | null>(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [hint, setHint] = useState('');
  const [shelfBusy, setShelfBusy] = useState(false);

  const ranks = useMemo(() => {
    const out: Record<string, ShelfRank> = {};
    for (const c of cards) {
      if (c.shelfRank === 1 || c.shelfRank === 2 || c.shelfRank === 3) {
        out[c.id] = c.shelfRank;
      }
    }
    return out;
  }, [cards]);

  const cardById = useMemo(() => {
    const map = new Map<string, ApiSavedCard>();
    for (const card of cards) map.set(card.id, card);
    return map;
  }, [cards]);

  const topSlots = useMemo(() => {
    return ([1, 2, 3] as const).map((rank) => {
      const id = cardIdAtRank(ranks, rank);
      return id ? (cardById.get(id) ?? null) : null;
    });
  }, [ranks, cardById]);

  const shelfCards = useMemo(
    () => cards.filter((c) => c.shelfRank !== 1 && c.shelfRank !== 2 && c.shelfRank !== 3),
    [cards],
  );

  const shelfRows = useMemo(() => {
    const rows: ApiSavedCard[][] = [];
    for (let i = 0; i < shelfCards.length; i += SHELF_PER_ROW) {
      rows.push(shelfCards.slice(i, i + SHELF_PER_ROW));
    }
    return rows;
  }, [shelfCards]);

  const promoteToRank = useCallback(
    async (cardId: string, rank: ShelfRank) => {
      if (shelfBusy) return;
      setShelfBusy(true);
      setHint('');
      try {
        const updated = await patchSavedCardShelf(cardId, rank);
        onCardsChange(mergeShelfResponse(cards, updated));
        setPulledId(null);
        setReplaceMode(false);
        setHint(`Top ${rank}에 꽂았어요`);
      } catch (e) {
        setHint(e instanceof Error ? e.message : '저장에 실패했어요');
      } finally {
        setShelfBusy(false);
      }
    },
    [cards, onCardsChange, shelfBusy],
  );

  const demoteFromTop = useCallback(
    async (cardId: string) => {
      if (shelfBusy) return;
      setShelfBusy(true);
      setHint('');
      try {
        const updated = await patchSavedCardShelf(cardId, null);
        onCardsChange(cards.map((c) => (c.id === updated.id ? updated : c)));
        setHint('책장으로 내렸어요');
      } catch (e) {
        setHint(e instanceof Error ? e.message : '저장에 실패했어요');
      } finally {
        setShelfBusy(false);
      }
    },
    [cards, onCardsChange, shelfBusy],
  );

  const handleShelfClick = (card: ApiSavedCard) => {
    if (!editable || shelfBusy) {
      if (!editable) onSelectCard(card);
      return;
    }
    if (replaceMode) {
      setReplaceMode(false);
      setPulledId(card.id);
      setHint('');
      return;
    }
    if (pulledId === card.id) {
      const empty = firstEmptyShelfRank(ranks);
      if (empty) {
        void promoteToRank(card.id, empty);
        return;
      }
      setReplaceMode(true);
      setHint('어느 자리랑 바꿀까요? Top LP를 눌러 주세요');
      return;
    }
    setPulledId(card.id);
    setReplaceMode(false);
    setHint('한 번 더 누르면 Top에 꽂혀요 · 자세히 보기도 있어요');
  };

  const handleTopClick = (rank: ShelfRank, card: ApiSavedCard | null) => {
    if (!editable || shelfBusy) {
      if (card) onSelectCard(card);
      return;
    }
    if (replaceMode && pulledId) {
      void promoteToRank(pulledId, rank);
      return;
    }
    if (card) onSelectCard(card);
  };

  const pulledCard = pulledId ? cardById.get(pulledId) : null;

  const body = (
    <>
      {embedded && !loading && cards.length > 0 ? (
        <p className="mb-3 text-right text-[11px] font-bold text-[#6b5428]">
          {cards.length}장
        </p>
      ) : null}
      {loading ? (
        <AlbumSkeleton />
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : cards.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[rgb(31_26_22/0.2)] bg-[rgb(255_255_255/0.35)] px-3 py-12 text-center">
          <p className="text-sm font-medium text-[#3d342c]">
            아직 꽂은 LP가 없어요
          </p>
          <p className="mt-1 text-xs text-[#6b5c4c]">
            피드에서 내 글의 저장 버튼을 눌러 보세요
          </p>
        </div>
      ) : (
        <>
          <div
            className={`lp-album-top ${replaceMode ? 'is-replace' : ''}`}
            aria-label="Top 3">
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-[#6b5c4c]">
              TOP 3
              {replaceMode ? (
                <span className="ml-2 font-medium text-[#8a7048]">
                  · 바꿀 자리 선택
                </span>
              ) : null}
            </p>
            <ul className="flex items-end justify-center gap-4 sm:gap-6">
              {([1, 2, 3] as const).map((rank, index) => {
                const card = topSlots[index];
                return (
                  <li key={rank} className="flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTopClick(rank, card)}
                      onContextMenu={
                        editable && card
                          ? (e) => {
                              e.preventDefault();
                              void demoteFromTop(card.id);
                            }
                          : undefined
                      }
                      disabled={shelfBusy}
                      className={`lp-album-top-slot ${replaceMode ? 'is-pickable' : ''}`}
                      aria-label={
                        card
                          ? replaceMode
                            ? `Top ${rank}와 바꾸기 · ${card.recommendation.title}`
                            : `${card.recommendation.title} 보기`
                          : `Top ${rank} 비어 있음`
                      }>
                      {card ? (
                        <LpAlbumJacket
                          embedUrl={card.recommendation.embedUrl}
                          title={card.recommendation.title}
                          artist={card.recommendation.artist}
                          reason={card.recommendation.reason}
                          moods={card.recommendation.moods}
                          postedAt={card.recommendation.createdAt}
                          savedAt={card.createdAt}
                          customization={card.customization}
                          size="md"
                          className="w-[6.5rem] shadow-[0_3px_12px_rgba(0,0,0,0.2)] sm:w-[7.5rem]"
                        />
                      ) : (
                        <LpAlbumDisc size="lg" empty label={`#${rank}`} />
                      )}
                    </button>
                    <span className="max-w-[5.5rem] truncate text-center text-[10px] font-medium text-[#5c4a38]">
                      {card ? card.recommendation.title : `빈 자리`}
                    </span>
                    {editable && card && !replaceMode ? (
                      <button
                        type="button"
                        disabled={shelfBusy}
                        onClick={() => void demoteFromTop(card.id)}
                        className="text-[10px] text-[#8a7048] underline-offset-2 hover:underline disabled:opacity-50">
                        책장으로
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="lp-album-shelf-block" aria-label="LP 책장">
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-[#6b5c4c]">
              책장
              {editable ? (
                <span className="ml-2 font-normal text-[#8a8070]">
                  · 눌러서 뽑기
                </span>
              ) : null}
            </p>

            {shelfCards.length === 0 ? (
              <div className="lp-album-shelf lp-album-shelf-empty">
                <p className="py-6 text-center text-xs text-[#8a8070]">
                  Top에 다 꽂혀 있거나, 책장에 남은 LP가 없어요
                </p>
              </div>
            ) : (
              shelfRows.map((row, rowIndex) => (
                <div key={rowIndex} className="lp-album-shelf">
                  <ul className="lp-album-shelf-row">
                    {row.map((card) => {
                      const pulled = pulledId === card.id;
                      return (
                        <li key={card.id} className="lp-album-shelf-item">
                          <button
                            type="button"
                            disabled={shelfBusy}
                            onClick={() => handleShelfClick(card)}
                            className={`lp-album-shelf-btn ${pulled ? 'is-pulled' : ''}`}
                            aria-pressed={pulled}
                            aria-label={
                              pulled
                                ? `${card.recommendation.title} · 다시 누르면 Top`
                                : `${card.recommendation.title} 뽑기`
                            }>
                            <LpAlbumDisc
                              embedUrl={card.recommendation.embedUrl}
                              title={card.recommendation.title}
                              size="md"
                              pulled={pulled}
                              dimmed={Boolean(pulledId && !pulled)}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="lp-album-shelf-plank" aria-hidden />
                </div>
              ))
            )}
          </div>

          {pulledCard && editable ? (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => onSelectCard(pulledCard)}
                className="rounded-full border border-[rgb(31_26_22/0.18)] bg-[#f7f1e8] px-3 py-1.5 text-xs font-semibold text-[#3d342c]">
                자세히 · 꾸미기
              </button>
              <button
                type="button"
                onClick={() => {
                  setPulledId(null);
                  setReplaceMode(false);
                  setHint('');
                }}
                className="rounded-full px-3 py-1.5 text-xs font-medium text-[#6b5c4c]">
                다시 꽂기
              </button>
            </div>
          ) : null}

          {hint ? (
            <p
              className="mt-2 text-center text-[11px] text-[#8a7048]"
              role="status">
              {hint}
            </p>
          ) : null}
        </>
      )}
    </>
  );

  if (embedded) {
    return <section className="w-full">{body}</section>;
  }

  return (
    <section className="w-full">
      <div className="lp-album-shell">
        <div className="lp-album-header">
          <div>
            <h2 className="text-sm font-bold tracking-wide text-[#f3ebe3]">
              내 앨범
            </h2>
            <p className="mt-0.5 text-[11px] text-[#cbbba0]">
              LP Top 3 · 책장에 꽂아 두기
            </p>
          </div>
          {!loading && cards.length > 0 ? (
            <span className="rounded-full bg-[rgb(243_235_227/0.12)] px-2.5 py-1 text-xs font-bold text-[#ebe3d8]">
              {cards.length}장
            </span>
          ) : null}
        </div>
        <div className="lp-album-body">{body}</div>
      </div>
    </section>
  );
}

function AlbumSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-center gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="size-[4.75rem] animate-pulse rounded-full bg-[rgb(31_26_22/0.08)]"
          />
        ))}
      </div>
      <div className="h-20 animate-pulse rounded-lg bg-[rgb(31_26_22/0.06)]" />
    </div>
  );
}
