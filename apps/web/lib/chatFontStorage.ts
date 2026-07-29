/** 채팅 글꼴·크기 — 전역(유저) · 방마다 ❌ · Room-Theme-Font */

const PREFIX = 'chat-font:';

export const CHAT_FONT_IDS = [
  'default',
  'gothic',
  'serif',
  'hand', // napkin-hand
] as const;

export type ChatFontId = (typeof CHAT_FONT_IDS)[number];

export const CHAT_FONT_SCALES = ['S', 'M', 'L'] as const;
export type ChatFontScale = (typeof CHAT_FONT_SCALES)[number];

export type ChatFontPrefs = {
  fontId: ChatFontId;
  scale: ChatFontScale;
};

export const CHAT_FONT_LABELS: Record<ChatFontId, string> = {
  default: '기본',
  gothic: '고딕',
  serif: '세리프',
  hand: '손글씨',
};

export const CHAT_FONT_SCALE_LABELS: Record<ChatFontScale, string> = {
  S: '작게',
  M: '보통',
  L: '크게',
};

/** CSS에 쓸 배율 */
export const CHAT_FONT_SCALE_VALUE: Record<ChatFontScale, number> = {
  S: 0.88,
  M: 1,
  L: 1.2,
};

/** CSS font-family (hand는 Nanum Pen · napkin-hand와 동일 계열) */
export const CHAT_FONT_FAMILY: Record<ChatFontId, string> = {
  default: 'inherit',
  gothic: '"Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif',
  serif: '"Noto Serif KR", "Apple Myungjo", serif',
  hand: '"Nanum Pen Script", "Apple SD Gothic Neo", cursive',
};

function storageKey(userId: string) {
  return `${PREFIX}${userId}`;
}

function isFontId(value: string): value is ChatFontId {
  return (CHAT_FONT_IDS as readonly string[]).includes(value);
}

function isScale(value: string): value is ChatFontScale {
  return (CHAT_FONT_SCALES as readonly string[]).includes(value);
}

function defaultPrefs(): ChatFontPrefs {
  return { fontId: 'default', scale: 'M' };
}

export function getChatFontPrefs(userId: string): ChatFontPrefs {
  if (typeof window === 'undefined') return defaultPrefs();
  const raw = localStorage.getItem(storageKey(userId));
  if (!raw) return defaultPrefs();
  try {
    const parsed = JSON.parse(raw) as Partial<ChatFontPrefs>;
    return {
      fontId: isFontId(parsed.fontId ?? '') ? parsed.fontId! : 'default',
      scale: isScale(parsed.scale ?? '') ? parsed.scale! : 'M',
    };
  } catch {
    return defaultPrefs();
  }
}

export function setChatFontPrefs(userId: string, prefs: ChatFontPrefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(
    storageKey(userId),
    JSON.stringify({
      fontId: isFontId(prefs.fontId) ? prefs.fontId : 'default',
      scale: isScale(prefs.scale) ? prefs.scale : 'M',
    }),
  );
}
