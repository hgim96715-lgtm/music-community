/** ISO → YYYY.MM.DD (예: 2026.06.20) — 피드 카드·컴팩트용 으로 정함 */
export function formatDisplayDate(iso: string): string {
  const date = new Date(iso);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

/** 피드 카드 — formatDisplayDate 와 동일 (오늘 분기 없음) */
export function formatFeedDate(iso: string): string {
  return formatDisplayDate(iso);
}

/** 화면용 긴 날짜 — MMMM년 M월 D일 (월·일 앞 0 없음) */
export function formatLongDate(iso?: string): string {
  const date = iso ? new Date(iso) : new Date();
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}년 ${m}월 ${d}일`;
}

/** 화면 상단·배너 — 오늘은 MMMM년 M월 D일 */
export function formatTodayLine(): string {
  return `오늘은 ${formatLongDate()}`;
}
