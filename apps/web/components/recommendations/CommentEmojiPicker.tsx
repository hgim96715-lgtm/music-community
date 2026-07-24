'use client';
import { Smile } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

/** Smile 탭 → 카테고리 그리드 (댓글·방 채팅 공용) */
const EMOJI_GROUPS = [
  {
    label: '표정',
    emojis: [
      '😀',
      '😃',
      '😄',
      '😁',
      '😆',
      '😅',
      '🤣',
      '😂',
      '🙂',
      '🙃',
      '😉',
      '😊',
      '😇',
      '🥰',
      '😍',
      '🤩',
      '😘',
      '😗',
      '😚',
      '😙',
      '🥲',
      '😋',
      '😛',
      '😜',
      '🤪',
      '😝',
      '🤑',
      '🤗',
      '🤭',
      '🤫',
      '🤔',
      '🤐',
      '🤨',
      '😐',
      '😑',
      '😶',
      '😏',
      '😒',
      '🙄',
      '😬',
      '😮‍💨',
      '🤥',
      '😌',
      '😔',
      '😪',
      '🤤',
      '😴',
      '😷',
      '🤒',
      '🤕',
      '🤢',
      '🤮',
      '🥵',
      '🥶',
      '🥴',
      '😵',
      '🤯',
      '🤠',
      '🥳',
      '🥸',
      '😎',
      '🤓',
      '🧐',
      '😕',
      '😟',
      '🙁',
      '☹️',
      '😮',
      '😯',
      '😲',
      '😳',
      '🥺',
      '😦',
      '😧',
      '😨',
      '😰',
      '😥',
      '😢',
      '😭',
      '😱',
      '😖',
      '😣',
      '😞',
      '😓',
      '😩',
      '😫',
      '🥱',
      '😤',
      '😡',
      '😠',
      '🤬',
      '😈',
      '👿',
      '💀',
      '☠️',
      '💩',
      '🤡',
      '👹',
      '👺',
      '👻',
      '👽',
      '👾',
      '🤖',
    ],
  },
  {
    label: '손·사람',
    emojis: [
      '👋',
      '🤚',
      '🖐️',
      '✋',
      '🖖',
      '👌',
      '🤌',
      '🤏',
      '✌️',
      '🤞',
      '🤟',
      '🤘',
      '🤙',
      '👈',
      '👉',
      '👆',
      '🖕',
      '👇',
      '☝️',
      '👍',
      '👎',
      '✊',
      '👊',
      '🤛',
      '🤜',
      '👏',
      '🙌',
      '🫶',
      '👐',
      '🤲',
      '🤝',
      '🙏',
      '💪',
      '🫂',
      '👶',
      '🧒',
      '👦',
      '👧',
      '🧑',
      '👨',
      '👩',
      '🧓',
      '👀',
      '🧠',
      '🗣️',
    ],
  },
  {
    label: '하트·감정',
    emojis: [
      '❤️',
      '🧡',
      '💛',
      '💚',
      '💙',
      '💜',
      '🖤',
      '🤍',
      '🤎',
      '💔',
      '❣️',
      '💕',
      '💞',
      '💓',
      '💗',
      '💖',
      '💘',
      '💝',
      '💟',
      '💌',
      '💋',
      '💯',
      '💢',
      '💥',
      '💫',
      '💦',
      '💨',
      '🕳️',
      '💬',
      '💭',
      '💤',
    ],
  },
  {
    label: '음악',
    emojis: [
      '🎵',
      '🎶',
      '🎼',
      '🎹',
      '🥁',
      '🎷',
      '🎺',
      '🎸',
      '🪕',
      '🎻',
      '🎤',
      '🎧',
      '📻',
      '🎙️',
      '🎚️',
      '🎛️',
      '📢',
      '🔈',
      '🔊',
      '🔇',
      '🔔',
      '🔕',
      '💿',
      '📀',
      '📱',
      '💻',
      '🖥️',
      '⌨️',
    ],
  },
  {
    label: '활동·물건',
    emojis: [
      '🔥',
      '✨',
      '⭐',
      '🌟',
      '⚡',
      '☀️',
      '🌙',
      '☁️',
      '🌈',
      '❄️',
      '🌊',
      '🌸',
      '🌺',
      '🌻',
      '🌹',
      '🌷',
      '🍀',
      '🍃',
      '🍂',
      '🍁',
      '🎉',
      '🎊',
      '🎈',
      '🎁',
      '🏆',
      '🥇',
      '🎯',
      '🎮',
      '🎲',
      '☕',
      '🧋',
      '🍺',
      '🍷',
      '🍰',
      '🍕',
      '🍔',
      '🍟',
      '🍿',
      '🏠',
      '🚗',
      '✈️',
      '🚀',
      '⏰',
      '💡',
      '📚',
      '✏️',
      '📷',
      '📸',
      '🎬',
      '📺',
    ],
  },
  {
    label: '동물',
    emojis: [
      '🐶',
      '🐱',
      '🐭',
      '🐹',
      '🐰',
      '🦊',
      '🐻',
      '🐼',
      '🐨',
      '🐯',
      '🦁',
      '🐮',
      '🐷',
      '🐸',
      '🐵',
      '🐔',
      '🐧',
      '🐦',
      '🐤',
      '🦆',
      '🦅',
      '🦉',
      '🦇',
      '🐺',
      '🐗',
      '🐴',
      '🦄',
      '🐝',
      '🐛',
      '🦋',
      '🐌',
      '🐞',
      '🐜',
      '🪲',
      '🪳',
      '🦟',
      '🦗',
      '🕷️',
      '🐢',
      '🐍',
      '🦎',
      '🐙',
      '🦑',
      '🦐',
      '🦞',
      '🦀',
      '🐡',
      '🐠',
      '🐟',
      '🐬',
      '🐳',
      '🐋',
      '🦈',
    ],
  },
] as const;

type CommentEmojiPickerProps = {
  onPick: (emoji: string) => void;
  disabled?: boolean;
  /** 제어 모드 — 키보드 열릴 때 부모가 닫을 때 사용 */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type PanelPos = { left: number; bottom: number; maxHeight: number };

export function CommentEmojiPicker({
  onPick,
  disabled,
  open: openProp,
  onOpenChange,
}: CommentEmojiPickerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : uncontrolledOpen;
  const rootRef = useRef<HTMLDivElement>(null);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!controlled) setUncontrolledOpen(next);
      onOpenChangeRef.current?.(next);
    },
    [controlled],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePos = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const gap = 8;
    const bottom = window.innerHeight - rect.top + gap;
    const maxHeight = Math.max(
      160,
      Math.min(288, rect.top - gap - 12),
    );
    // 패널이 화면 왼쪽을 벗어나지 않게
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.min(
      Math.max(12, rect.left),
      window.innerWidth - width - 12,
    );
    setPos({ left, bottom, maxHeight });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    updatePos();
    window.addEventListener('resize', updatePos);
    window.visualViewport?.addEventListener('resize', updatePos);
    window.visualViewport?.addEventListener('scroll', updatePos);
    return () => {
      window.removeEventListener('resize', updatePos);
      window.visualViewport?.removeEventListener('resize', updatePos);
      window.visualViewport?.removeEventListener('scroll', updatePos);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        const panel = document.getElementById('mc-emoji-picker-panel');
        if (panel?.contains(e.target as Node)) return;
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, setOpen]);

  /** OS 키보드가 올라오면 피커 닫기 — 겹침 방지 */
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    function onViewport() {
      const keyboard = window.innerHeight - vv!.height - vv!.offsetTop;
      if (keyboard > 64) setOpen(false);
    }
    vv.addEventListener('resize', onViewport);
    vv.addEventListener('scroll', onViewport);
    return () => {
      vv.removeEventListener('resize', onViewport);
      vv.removeEventListener('scroll', onViewport);
    };
  }, [open, setOpen]);

  function pick(emoji: string) {
    onPick(emoji);
    setOpen(false);
  }

  function toggle() {
    if (disabled) return;
    if (!open) {
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    }
    setOpen(!open);
  }

  const panel =
    open && mounted && pos
      ? createPortal(
          <div
            id="mc-emoji-picker-panel"
            role="listbox"
            aria-label="이모지"
            className="fixed z-[80] flex w-[min(20rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[rgb(201_166_107/0.22)] bg-[rgb(28_24_20/0.98)] shadow-[0_8px_28px_rgb(0_0_0/0.4)]"
            style={{
              left: pos.left,
              bottom: pos.bottom,
              height: pos.maxHeight,
              maxHeight: pos.maxHeight,
            }}>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
              {EMOJI_GROUPS.map((group) => (
                <div key={group.label} className="mb-3 last:mb-0">
                  <p className="px-1.5 pb-1.5 pt-0.5 text-[10px] font-medium text-[#a89880]">
                    {group.label}
                  </p>
                  <div className="grid grid-cols-8 gap-0.5">
                    {group.emojis.map((emoji, i) => (
                      <button
                        key={`${group.label}-${i}-${emoji}`}
                        type="button"
                        role="option"
                        onClick={() => pick(emoji)}
                        className="flex aspect-square items-center justify-center rounded-lg text-xl transition-colors hover:bg-[rgb(201_166_107/0.12)] active:bg-[rgb(201_166_107/0.2)]">
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        aria-label="이모지 선택"
        aria-expanded={open}
        className="flex size-9 items-center justify-center rounded-full text-[#a89880] transition-colors hover:bg-[rgb(201_166_107/0.12)] hover:text-[#ebe3d8] disabled:opacity-40">
        <Smile className="size-5" strokeWidth={1.75} aria-hidden />
      </button>
      {panel}
    </div>
  );
}
