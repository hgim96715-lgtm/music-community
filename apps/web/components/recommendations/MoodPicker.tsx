'use client';

import { getMoodColors } from '@/lib/moodColors';

type MoodPickerProps = {
  mood: string;
  selected: boolean;
  onToggle: () => void;
};

export function MoodPicker({ mood, selected, onToggle }: MoodPickerProps) {
  const colors = getMoodColors(mood);

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? `border-transparent ${colors.pillSelectedBg} ${colors.pillSelectedText}`
          : `bg-transparent ${colors.pillBorder} ${colors.pillText} ${colors.pickerHover}`
      }`}>
      {mood}
    </button>
  );
}
