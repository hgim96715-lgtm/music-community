import type { Mood } from './types';

/** `color.md` 태그별 팔레트 — 카드 틴트·액센트 바·pill */
export type MoodPalette = {
  accent: string;
  tint: string;
  accentClass: string;
  tintClass: string;
  pillClass: string;
  borderAccentClass: string;
};

/** 태그 없음 — `color.md` 카드 기본 */
export const DEFAULT_MOOD_PALETTE: MoodPalette = {
  accent: '#E5E7EB',
  tint: '#FFFFFF',
  accentClass: 'bg-neutral-200',
  tintClass: 'bg-white',
  pillClass: 'bg-neutral-100 text-neutral-700',
  borderAccentClass: 'border-l-neutral-200',
};

/** `color.md` § 태그별 팔레트 */
export const MOOD_PALETTES: Record<Mood, MoodPalette> = {
  새벽: {
    accent: '#64748B',
    tint: '#F1F5F9',
    accentClass: 'bg-slate-500',
    tintClass: 'bg-slate-100',
    pillClass: 'bg-slate-100 text-slate-700',
    borderAccentClass: 'border-l-slate-500',
  },
  운전: {
    accent: '#F97316',
    tint: '#FFF7ED',
    accentClass: 'bg-orange-500',
    tintClass: 'bg-orange-50',
    pillClass: 'bg-orange-50 text-orange-700',
    borderAccentClass: 'border-l-orange-500',
  },
  집중: {
    accent: '#3B82F6',
    tint: '#EFF6FF',
    accentClass: 'bg-blue-500',
    tintClass: 'bg-blue-50',
    pillClass: 'bg-blue-50 text-blue-700',
    borderAccentClass: 'border-l-blue-500',
  },
  운동: {
    accent: '#EF4444',
    tint: '#FEF2F2',
    accentClass: 'bg-red-500',
    tintClass: 'bg-red-50',
    pillClass: 'bg-red-50 text-red-700',
    borderAccentClass: 'border-l-red-500',
  },
  비: {
    accent: '#94A3B8',
    tint: '#F8FAFC',
    accentClass: 'bg-slate-400',
    tintClass: 'bg-slate-50',
    pillClass: 'bg-slate-50 text-slate-600',
    borderAccentClass: 'border-l-slate-400',
  },
  설렘: {
    accent: '#F472B6',
    tint: '#FDF2F8',
    accentClass: 'bg-pink-400',
    tintClass: 'bg-pink-50',
    pillClass: 'bg-pink-50 text-pink-700',
    borderAccentClass: 'border-l-pink-400',
  },
  우울: {
    accent: '#6366F1',
    tint: '#EEF2FF',
    accentClass: 'bg-indigo-500',
    tintClass: 'bg-indigo-50',
    pillClass: 'bg-indigo-50 text-indigo-700',
    borderAccentClass: 'border-l-indigo-500',
  },
  파티: {
    accent: '#EAB308',
    tint: '#FEFCE8',
    accentClass: 'bg-yellow-500',
    tintClass: 'bg-yellow-50',
    pillClass: 'bg-yellow-50 text-yellow-800',
    borderAccentClass: 'border-l-yellow-500',
  },
  힐링: {
    accent: '#22C55E',
    tint: '#F0FDF4',
    accentClass: 'bg-green-500',
    tintClass: 'bg-green-50',
    pillClass: 'bg-green-50 text-green-700',
    borderAccentClass: 'border-l-green-500',
  },
  그리움: {
    accent: '#A8A29E',
    tint: '#FAFAF9',
    accentClass: 'bg-stone-400',
    tintClass: 'bg-stone-50',
    pillClass: 'bg-stone-50 text-stone-600',
    borderAccentClass: 'border-l-stone-400',
  },
};

export function getMoodPalette(mood: Mood): MoodPalette {
  return MOOD_PALETTES[mood];
}

/** 카드 메인 컬러 — 첫 번째 태그 (`color.md` § 태그가 여러 개일 때) */
export function getPrimaryMoodPalette(moods: Mood[]): MoodPalette {
  const first = moods[0];
  return first ? getMoodPalette(first) : DEFAULT_MOOD_PALETTE;
}
