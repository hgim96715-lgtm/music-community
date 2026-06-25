/** date.md
 * 피드·Admin 날짜 표시 (MVP: formatDisplayDate · formatFeedDate만)
 */

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function differenceInCalendarDays(latter: Date, earlier: Date): number {
  const ms = startOfDay(latter).getTime() - startOfDay(earlier).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function formatFeedDate(iso: string): string {
  const absolute = formatDisplayDate(iso);
  const days = differenceInCalendarDays(new Date(), new Date(iso));

  if (days >= 7) return absolute;
  if (days <= 0) return `오늘 · ${absolute}`;
  if (days === 1) return `어제 · ${absolute}`;
  return `${days}일 전 · ${absolute}`;
}
