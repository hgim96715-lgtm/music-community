import type { Mood } from './moods';

/**
 * ideas.md 후보 1 (저채도) · P0: 피드에서는 pill만 사용
 * cardBack — 포토카드·나중용 (FeedCard 헤더/뒤판 ❌)
 */
export type MoodColorSet = {
  pillBg: string;
  pillText: string;
  pillBorder: string;
  pillSelectedBg: string;
  pillSelectedText: string;
  /** MoodPicker hover — pillBg 와 동일 색 (Tailwind 스캔용) */
  pickerHover: string;
  /** post-card-shell 뒤 레이어 (::before) */
  cardBack: string;
};

const DEFAULT: MoodColorSet = {
  pillBg: 'bg-neutral-50',
  pillText: 'text-neutral-600',
  pillBorder: 'border-neutral-200',
  pillSelectedBg: 'bg-neutral-800',
  pillSelectedText: 'text-white',
  pickerHover: 'hover:bg-neutral-50',
  cardBack: '#5a4636',
};

export const MOOD_COLORS: Record<Mood, MoodColorSet> = {
  새벽: {
    pillBg: 'bg-[#EEF2F6]',
    pillText: 'text-[#4A5568]',
    pillBorder: 'border-[#B8C4D4]',
    pillSelectedBg: 'bg-[#7C8DA6]',
    pillSelectedText: 'text-white',
    pickerHover: 'hover:bg-[#EEF2F6]',
    cardBack: '#cdd8e8',
  },
  운전: {
    pillBg: 'bg-[#FAF0EA]',
    pillText: 'text-[#7A4E32]',
    pillBorder: 'border-[#E0C4B0]',
    pillSelectedBg: 'bg-[#C17F59]',
    pillSelectedText: 'text-white',
    pickerHover: 'hover:bg-[#FAF0EA]',
    cardBack: '#edd8c8',
  },
  출퇴근: {
    pillBg: 'bg-[#E8F0F6]',
    pillText: 'text-[#2F4F66]',
    pillBorder: 'border-[#A8C0D4]',
    pillSelectedBg: 'bg-[#5B7C99]',
    pillSelectedText: 'text-white',
    pickerHover: 'hover:bg-[#E8F0F6]',
    cardBack: '#c5dae8',
  },
  비: {
    pillBg: 'bg-[#EAF1F3]',
    pillText: 'text-[#3D5A63]',
    pillBorder: 'border-[#A8BFC8]',
    pillSelectedBg: 'bg-[#6B8F9C]',
    pillSelectedText: 'text-white',
    pickerHover: 'hover:bg-[#EAF1F3]',
    cardBack: '#c2d8e0',
  },
  설렘: {
    pillBg: 'bg-[#F9EBF1]',
    pillText: 'text-[#7A3D58]',
    pillBorder: 'border-[#E0B8CA]',
    pillSelectedBg: 'bg-[#C97B9A]',
    pillSelectedText: 'text-white',
    pickerHover: 'hover:bg-[#F9EBF1]',
    cardBack: '#e5ccd6',
  },
  운동: {
    pillBg: 'bg-[#F9ECEC]',
    pillText: 'text-[#7A3333]',
    pillBorder: 'border-[#E0B0B0]',
    pillSelectedBg: 'bg-[#C45C5C]',
    pillSelectedText: 'text-white',
    pickerHover: 'hover:bg-[#F9ECEC]',
    cardBack: '#e0c4c4',
  },
  우울: {
    pillBg: 'bg-[#ECECF6]',
    pillText: 'text-[#3D4070]',
    pillBorder: 'border-[#B8B8D8]',
    pillSelectedBg: 'bg-[#6B6FAD]',
    pillSelectedText: 'text-white',
    pickerHover: 'hover:bg-[#ECECF6]',
    cardBack: '#c8c8e0',
  },
  코딩: {
    pillBg: 'bg-[#E8F0F6]',
    pillText: 'text-[#2F4F66]',
    pillBorder: 'border-[#A8C0D4]',
    pillSelectedBg: 'bg-[#5B7C99]',
    pillSelectedText: 'text-white',
    pickerHover: 'hover:bg-[#E8F0F6]',
    cardBack: '#c5dae8',
  },
  독서: {
    pillBg: 'bg-[#F3EFEB]',
    pillText: 'text-[#5C4F42]',
    pillBorder: 'border-[#D4C8BC]',
    pillSelectedBg: 'bg-[#9A8B7A]',
    pillSelectedText: 'text-white',
    pickerHover: 'hover:bg-[#F3EFEB]',
    cardBack: '#dcd2c6',
  },
  파티: {
    pillBg: 'bg-[#F9F3E3]',
    pillText: 'text-[#6B5718]',
    pillBorder: 'border-[#E0D4A0]',
    pillSelectedBg: 'bg-[#C9A227]',
    pillSelectedText: 'text-white',
    pickerHover: 'hover:bg-[#F9F3E3]',
    cardBack: '#e5dcc0',
  },
  취침: {
    pillBg: 'bg-[#EDEBF6]',
    pillText: 'text-[#443D70]',
    pillBorder: 'border-[#B8B0D8]',
    pillSelectedBg: 'bg-[#7B6FAD]',
    pillSelectedText: 'text-white',
    pickerHover: 'hover:bg-[#EDEBF6]',
    cardBack: '#ccc6e4',
  },
};

export function getMoodColors(mood: string): MoodColorSet {
  return (MOOD_COLORS as Record<string, MoodColorSet>)[mood] ?? DEFAULT;
}
