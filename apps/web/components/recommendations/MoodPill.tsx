import { getMoodColors } from '@/lib/moodColors';

type MoodPillProps = {
  mood: string;
  selected?: boolean;
  size?: 'sm' | 'md';
};

export function MoodPill({ mood, selected, size = 'sm' }: MoodPillProps) {
  const colors = getMoodColors(mood);
  const sizeClass =
    size === 'md'
      ? 'rounded-xl px-3 py-1.5 text-sm'
      : 'rounded-xl px-2.5 py-1 text-xs';

  if (selected) {
    return (
      <span
        className={`mood-pill-depth inline-block font-medium ${sizeClass} ${colors.pillSelectedBg} ${colors.pillSelectedText}`}>
        {mood}
      </span>
    );
  }

  return (
    <span
      className={`mood-pill-depth inline-block border font-medium ${sizeClass} ${colors.pillBg} ${colors.pillText} ${colors.pillBorder}`}>
      {mood}
    </span>
  );
}
