'use client';

import { napkinHandClassName } from '@/lib/napkinFont';

type MoodPickerProps = {
  mood: string;
  selected: boolean;
  onToggle: () => void;
};

/** U1 — 고를 때도 냅킨 손글씨 (파스텔 pill ❌) */
export function MoodPicker({ mood, selected, onToggle }: MoodPickerProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`${napkinHandClassName} rounded-sm px-1.5 py-0.5 text-[1.2rem] leading-none transition-[color,transform,opacity] ${
        selected
          ? 'text-[#c9a66b] underline decoration-[#c9a66b]/60 decoration-wavy underline-offset-4'
          : 'text-[#a89880]/55 hover:text-[#c9a66b]/80'
      }`}
      style={{
        transform: selected ? 'rotate(-2deg)' : undefined,
      }}>
      {mood}
    </button>
  );
}
