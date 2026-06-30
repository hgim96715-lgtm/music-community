const KST = 'Asia/Seoul';

/** KST 달력 일 키 YYYY-MM-DD */
export function toKstDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: KST,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** KST 그날 00:00:00.000 — DB timestamptz 비교용 Date */
export function startOfKstDay(reference = new Date()): Date {
  const key = toKstDateKey(reference);
  return new Date(`${key}T00:00:00+09:00`);
}

export function getKstHour(date: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: KST,
      hour: 'numeric',
      hour12: false,
    }).format(date),
  );
}

export function getKstMonthKey(date: Date): string {
  return toKstDateKey(date).slice(0, 7);
}

export function getKstYear(date: Date): number {
  return Number(toKstDateKey(date).slice(0, 4));
}
