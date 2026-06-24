/** 분위기 태그 — DTO @IsIn · DB moods[] 와 동일 문자열 (단일 소스) */
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

/** class-validator @IsIn 용 */
export const MOOD_VALUES: readonly string[] = MOODS;
