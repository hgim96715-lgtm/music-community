const KST = 'Asia/Seoul';
export type WelcomeCopy = {
  greeting: string;
  wish: string;
};

function kstHour(date = new Date()): number {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: KST,
      hour: 'numeric',
      hour12: false,
    }).format(date),
  );
  return hour === 24 ? 0 : hour;
}

function pickOne<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const MORNING_WISHES = [
  '오늘 하루도 행복한 하루 되세요💪',
  '가벼운 한 곡으로 시작해 볼까요?',
  '오늘도 좋은 일만 가득하길.',
] as const;
const AFTERNOON_WISHES = [
  '잠깐 쉬어갈 한 곡 어때요?👀',
  '오후에 듣기 좋은 한 곡, 골라볼까요?',
  '나른할 때일수록 음악 한 소절.',
] as const;
const EVENING_WISHES = [
  '오늘도 수고했어요.😊',
  '저녁엔 맘 편한 한 곡이 좋겠어요.',
  '하루 마감에 어울리는 곡 들을까요?',
] as const;
const NIGHT_WISHES = [
  '자기 전에 한 곡 들어보세요.😴',
  '늦은 밤, 잔잔한 한 곡 어때요?',
  '편히 쉬다가 음악으로 하루를 접어봐요.',
] as const;

export function getWelcomeCopy(date = new Date()): WelcomeCopy {
  const hour = kstHour(date);

  if (hour >= 5 && hour < 11) {
    return { greeting: '좋은 아침이에요.', wish: pickOne(MORNING_WISHES) };
  }
  if (hour >= 11 && hour < 17) {
    return { greeting: '좋은 오후예요.', wish: pickOne(AFTERNOON_WISHES) };
  }
  if (hour >= 17 && hour < 22) {
    return { greeting: '좋은 저녁이에요.', wish: pickOne(EVENING_WISHES) };
  }
  return { greeting: '늦은 밤이네요.', wish: pickOne(NIGHT_WISHES) };
}
