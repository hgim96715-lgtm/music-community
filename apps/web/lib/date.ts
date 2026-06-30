/** 피드 날짜 표시 — 정본: apps/docs/date.md */

const KST = 'Asia/Seoul';

function kstDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function startOfKstDay(date: Date): Date {
  const key = kstDateKey(date);
  return new Date(`${key}T00:00:00+09:00`);
}

function differenceInCalendarDays(latter: Date, earlier: Date): number {
  const ms = startOfKstDay(latter).getTime() - startOfKstDay(earlier).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatDisplayDate(iso: string): string {
  const key = kstDateKey(new Date(iso));
  const [y, m, d] = key.split('-');
  return `${y}.${m}.${d}`;
}

export function formatFeedDate(iso: string): string {
  const absolute = formatDisplayDate(iso);
  const days = differenceInCalendarDays(new Date(), new Date(iso));

  if (days >= 7) return absolute;
  if (days <= 0) return `오늘 · ${absolute}`;
  if (days === 1) return `어제 · ${absolute}`;
  return `${days}일 전 · ${absolute}`;
}
