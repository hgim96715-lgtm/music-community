import { napkinHandClassName } from '@/lib/napkinFont';

const TILTS = [-2.8, 1.6, -1.2] as const;
const DEFAULT_COLOR = '#c9a66b';

type MoodNapkinProps = {
  moods: string[];
  /** feed = 카드 본문 · jacket = 자켓/프리뷰 오버레이 */
  size?: 'feed' | 'jacket' | 'jacketThumb';
  /** 자켓 꾸미기 `textColors.moods` — 없으면 brass 기본 */
  color?: string;
  className?: string;
};

const SIZE_CLASS = {
  feed: 'mt-1.5 gap-x-3 gap-y-1 pl-0.5 text-[1.125rem]',
  jacket:
    'gap-x-2 gap-y-0.5 text-[13px] [text-shadow:0_1px_2px_rgb(20_17_14/0.75)]',
  jacketThumb:
    'gap-x-1 gap-y-0 text-[9px] [text-shadow:0_1px_1px_rgb(20_17_14/0.8)]',
} as const;

/** U1 — 바 냅킨에 연필로 적은 듯한 분위기 낙서 */
export function MoodNapkin({
  moods,
  size = 'feed',
  color = DEFAULT_COLOR,
  className = '',
}: MoodNapkinProps) {
  if (moods.length === 0) return null;

  return (
    <p
      className={`${napkinHandClassName} flex flex-wrap items-baseline leading-none ${SIZE_CLASS[size]} ${className}`}
      style={{ color }}
      aria-label={`분위기 ${moods.join(', ')}`}>
      {moods.map((mood, i) => (
        <span
          key={mood}
          className="inline-block motion-safe:origin-left"
          style={{
            transform: `rotate(${TILTS[i] ?? -1}deg)`,
          }}>
          {mood}
        </span>
      ))}
    </p>
  );
}
