'use client';
import { Smile } from 'lucide-react';
import { useState } from 'react';

/**재사용 늘면 lib/commentEmojis.ts 분리 */
const EMOJI_GROUPS = [
  { label: '공감', emojis: ['😢', '🫂', '💜', '🥺'] },
  { label: '음악', emojis: ['🎵', '🎧', '🔥', '✨'] },
  { label: '가벼움', emojis: ['❤️', '😂', '🙌', '👍'] },
] as const;

type CommentEmojiPickerProps = {
  onPick: (emoji: string) => void;
  disabled?: boolean;
};

export function CommentEmojiPicker({
  onPick,
  disabled,
}: CommentEmojiPickerProps) {
  const [open, setOpen] = useState(false);
  function pick(emoji: string) {
    onPick(emoji);
    setOpen(false);
  }
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="이모지 선택"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40">
        <Smile className="size-5" strokeWidth={1.75} aria-hidden />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="이모지"
          className="absolute bottom-full left-0 z-10 mb-2 w-44 rounded-2xl border border-neutral-200/80 bg-white p-2 shadow-lg">
          {EMOJI_GROUPS.map((group) => (
            <div key={group.label} className="mb-1 last:mb-0">
              <p className="px-1 pb-1 font-sans text-[10px] text-neutral-400">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-0.5">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    role="option"
                    onClick={() => pick(emoji)}
                    className="flex size-8 items-center justify-center rounded-lg text-lg hover:bg-neutral-100">
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
