/** 무드 태그 */
export const MOODS = [
  '새벽',
  '운전',
  '출퇴근',
  '비',
  '설렘',
  '운동',
  '우울',
  '코딩',
  '독서',
  '파티',
  '취침',
] as const;

export type Mood = (typeof MOODS)[number];

export const MIN_MOODS = 1;
export const MAX_MOODS = 3;

/** free-text 한 칸 최대 글자 (공백 trim 후) */
export const MAX_MOOD_LEN = 8;

export function isValidMood(value: string): boolean {
  const t = value.trim();
  return t.length >= 1 && t.length <= MAX_MOOD_LEN;
}
