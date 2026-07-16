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

/** 댓글·방 메시지 — 닉네임 옆 짧은 표기  */
export function formatCommentDate(iso: string): string {
  const days = differenceInCalendarDays(new Date(), new Date(iso));
  if (days >= 7) return formatDisplayDate(iso);
  if (days <= 0) return `오늘`;
  if (days === 1) return `어제`;
  return `${days}일 전`;
}

/** Apple Messages식 — 가운데 시간 구분 `(오늘) 오전 8:42` */
export function formatMessageTimeDivider(iso: string): string {
  const date = new Date(iso);
  const time = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 0) return `(오늘) ${time}`;
  if (days === 1) return `(어제) ${time}`;
  if (days < 7) return `(${days}일 전) ${time}`;
  const day = new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    month: 'long',
    day: 'numeric',
  }).format(date);
  return `(${day}) ${time}`;
}

/** 첫 메시지 · 날짜 바뀜 · 직전 대비 45분+ 공백이면 구분선 */
export function shouldInsertMessageDivider(
  previousIso: string | null | undefined,
  nextIso: string,
): boolean {
  if (!previousIso) return true;
  const prev = new Date(previousIso);
  const next = new Date(nextIso);
  if (kstDateKey(prev) !== kstDateKey(next)) return true;
  return Math.abs(next.getTime() - prev.getTime()) >= 45 * 60 * 1000;
}

