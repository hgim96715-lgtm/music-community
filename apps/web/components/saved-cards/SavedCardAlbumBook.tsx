import type { ApiSavedCard } from '@/lib/apiTypes';
import { SavedCardThumb } from './SavedCardThumb';

type SavedCardAlbumBookProps = {
  cards: ApiSavedCard[];
  loading: boolean;
  error: string;
  onSelectCard: (card: ApiSavedCard) => void;
};

/** 마이페이지 — 포토 스트립 앨범 페이지 (2열 · 살짝 기울임) */
export function SavedCardAlbumBook({
  cards,
  loading,
  error,
  onSelectCard,
}: SavedCardAlbumBookProps) {
  const singleCard = cards.length === 1;

  return (
    <section className="w-full">
      <div className="overflow-hidden rounded-2xl border-2 border-brand-border bg-[linear-gradient(165deg,#fdf9f4_0%,#f5ebe0_48%,#efe3d6_100%)] shadow-[4px_4px_0_var(--color-brand-shadow-soft)]">
        <div className="border-b border-brand-border/10 bg-brand-primary/90 px-4 py-3 text-white">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold tracking-wide">내 앨범</h2>
              <p className="mt-0.5 text-[11px] text-white/75">
                하루 한곡 포토 스트립
              </p>
            </div>
            {!loading && cards.length > 0 ? (
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold">
                {cards.length}곡
              </span>
            ) : null}
          </div>
        </div>

        <div className="relative px-4 py-5">
          <div
            className="pointer-events-none absolute inset-3 rounded-xl border border-dashed border-brand-border/10"
            aria-hidden
          />

          {loading ? (
            <div className="relative grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className={`aspect-[9/14] animate-pulse rounded-2xl border-2 border-dashed border-brand-border/15 bg-white/40 ${
                    i % 2 === 0 ? '-rotate-1' : 'rotate-1'
                  }`}
                />
              ))}
            </div>
          ) : error ? (
            <p className="relative text-sm text-red-600">{error}</p>
          ) : cards.length === 0 ? (
            <div className="relative rounded-xl border-2 border-dashed border-brand-border/20 bg-white/50 px-3 py-12 text-center">
              <p className="text-sm font-medium text-neutral-600">
                아직 붙인 포토 스트립이 없어요
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                피드에서 내 글의 저장 버튼을 눌러 보세요
              </p>
            </div>
          ) : (
            <ul
              className={`relative grid gap-4 ${
                singleCard
                  ? 'grid-cols-1 place-items-center'
                  : 'grid-cols-2'
              }`}>
              {cards.map((card, index) => (
                <li
                  key={card.id}
                  className={`w-full max-w-[10.5rem] ${
                    !singleCard
                      ? index % 2 === 0
                        ? '-rotate-[1.5deg]'
                        : 'rotate-[1.5deg]'
                      : ''
                  }`}>
                  <button
                    type="button"
                    onClick={() => onSelectCard(card)}
                    className="block w-full transition-transform hover:-translate-y-1 hover:rotate-0 active:translate-y-0"
                    aria-label={`${card.recommendation.title} 포토 스트립 보기`}>
                    <SavedCardThumb card={card} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
