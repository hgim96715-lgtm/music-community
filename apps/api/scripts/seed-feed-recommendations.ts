/**
 * 로컬 테스트용 — 피드 추천 글 N개 (날짜 분산 · archive / 통계 스모크).
 *
 * 제목 항상 `[seed] …` → CLEANUP=1 로 글만 삭제.
 * AUTHOR_EMAIL 없으면 `@seed.local` 작성자 1명 생성 (cleanup-seed-users 로 유저+글 cascade).
 *
 * 정본 문서: apps/docs/dev-seed.md
 *
 *   cd apps/api
 *   npx tsx scripts/seed-feed-recommendations.ts
 *   COUNT=40 npx tsx scripts/seed-feed-recommendations.ts
 *   AUTHOR_EMAIL=you@example.com COUNT=30 npx tsx scripts/seed-feed-recommendations.ts
 *   CLEANUP=1 npx tsx scripts/seed-feed-recommendations.ts
 *   CLEANUP=1 AUTHOR_EMAIL=you@example.com npx tsx scripts/seed-feed-recommendations.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const count = Math.min(Math.max(Number(process.env.COUNT ?? 30), 1), 200);
const authorEmail = process.env.AUTHOR_EMAIL?.trim().toLowerCase();
const prefix = (process.env.PREFIX ?? 'seed').trim() || 'seed';
const cleanup =
  process.env.CLEANUP === '1' || process.env.CLEANUP === 'true';
const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

const TITLE_PREFIX = '[seed]';

/** embed만 되면 됨 · UI 스모크용 (실제 재생은 영상 정책에 따름) */
const TRACKS: { title: string; artist: string; videoId: string; moods: string[] }[] =
  [
    { title: 'Blinding Lights', artist: 'The Weeknd', videoId: '4NRXx6U8ABQ', moods: ['신남', '밤'] },
    { title: 'Levitating', artist: 'Dua Lipa', videoId: 'TUHc6yb-W4M', moods: ['신남'] },
    { title: 'good 4 u', artist: 'Olivia Rodrigo', videoId: 'gRl-m8S9vSs', moods: ['텐션'] },
    { title: 'As It Was', artist: 'Harry Styles', videoId: 'H5v3k9tZtX8', moods: ['잔잔'] },
    { title: 'Anti-Hero', artist: 'Taylor Swift', videoId: 'b1kbLwvqugk', moods: ['감성'] },
    { title: 'Flowers', artist: 'Miley Cyrus', videoId: 'G7KNmWhY0eY', moods: ['신남'] },
    { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', videoId: 'kTJczUoc26U', moods: ['감성'] },
    { title: 'Peaches', artist: 'Justin Bieber', videoId: 'tQ0yjYUFKAE', moods: ['편안'] },
    { title: 'drivers license', artist: 'Olivia Rodrigo', videoId: 'ZmDBbnmKpqQ', moods: ['감성'] },
    { title: 'Bad Habit', artist: 'Steve Lacy', videoId: '4VRfYhqVvYo', moods: ['나른'] },
    { title: 'Heat Waves', artist: 'Glass Animals', videoId: 'mRD0-GxqHVo', moods: ['잔잔'] },
    { title: 'About Damn Time', artist: 'Lizzo', videoId: '1PPdPyKUS7c', moods: ['신남'] },
  ];

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

/** KST 달력일 기준으로 daysAgo일 전 정오(대략) */
function createdAtDaysAgoKst(daysAgo: number, jitterMin: number): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setUTCHours(12, 0, 0, 0);
  kst.setUTCDate(kst.getUTCDate() - daysAgo);
  const utc = new Date(kst.getTime() - 9 * 60 * 60 * 1000);
  utc.setMinutes(utc.getMinutes() + (jitterMin % 50));
  return utc;
}

/** 오늘 / 최근7 / archive(8~45일) 비율 */
function daysAgoForIndex(i: number, total: number): number {
  const r = i / Math.max(total - 1, 1);
  if (r < 0.2) return 0;
  if (r < 0.55) return 1 + (i % 6);
  return 8 + (i % 38);
}

async function runCleanup() {
  const where = {
    title: { startsWith: TITLE_PREFIX },
    ...(authorEmail
      ? { author: { email: { equals: authorEmail, mode: 'insensitive' as const } } }
      : {}),
  };

  const rows = await prisma.recommendation.findMany({
    where,
    select: { id: true, title: true, author: { select: { email: true } } },
  });

  console.log(
    `${dryRun ? '[DRY_RUN] ' : ''}[seed] 추천 ${rows.length}건` +
      (authorEmail ? ` · AUTHOR=${authorEmail}` : ''),
  );
  if (rows.length === 0) return;
  console.log(`예: ${rows[0].title}`);

  if (dryRun) return;

  const result = await prisma.recommendation.deleteMany({ where });
  console.log(`삭제 ${result.count}건`);
}

async function resolveAuthorId(): Promise<{ id: string; label: string }> {
  if (authorEmail) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: authorEmail, mode: 'insensitive' } },
      select: { id: true, email: true, nickname: true },
    });
    if (!user) {
      console.error(`유저 없음: ${authorEmail}`);
      process.exitCode = 1;
      throw new Error('author missing');
    }
    return { id: user.id, label: `@${user.nickname} <${user.email}>` };
  }

  const stamp = Date.now().toString(36);
  const email = `${prefix}_feed_${stamp}@seed.local`;
  const nickname = `${prefix}_feed_${stamp.slice(-6)}`;
  const user = await prisma.user.create({
    data: {
      email,
      nickname,
      passwordHash: null,
      bio: 'feed seed (local)',
    },
    select: { id: true, email: true, nickname: true },
  });
  return { id: user.id, label: `@${user.nickname} <${user.email}>` };
}

async function seed() {
  if (dryRun) {
    console.log(
      authorEmail
        ? `작성자(예정): AUTHOR_EMAIL=${authorEmail}`
        : `작성자(예정): ${prefix}_feed_*@seed.local 신규`,
    );
    console.log(`넣을 글: ${count} · 제목 접두 ${TITLE_PREFIX}`);
    for (let i = 0; i < Math.min(count, 5); i++) {
      const days = daysAgoForIndex(i, count);
      console.log(
        `  [${i}] daysAgo≈${days} · ${TRACKS[i % TRACKS.length].title}`,
      );
    }
    if (count > 5) console.log(`  … 외 ${count - 5}`);
    return;
  }

  const author = await resolveAuthorId();
  console.log(`작성자: ${author.label}`);
  console.log(`넣을 글: ${count} · 제목 접두 ${TITLE_PREFIX}`);

  const data = Array.from({ length: count }, (_, i) => {
    const t = TRACKS[i % TRACKS.length];
    const days = daysAgoForIndex(i, count);
    return {
      title: `${TITLE_PREFIX} ${t.title} #${i + 1}`,
      artist: t.artist,
      embedUrl: `https://www.youtube.com/embed/${t.videoId}`,
      reason: `seed 테스트 글 ${i + 1} · ${days === 0 ? '오늘' : `${days}일 전`} (로컬 전용)`,
      moods: t.moods,
      authorId: author.id,
      createdAt: createdAtDaysAgoKst(days, i * 3),
      updatedAt: createdAtDaysAgoKst(days, i * 3),
    };
  });

  const created = await prisma.recommendation.createMany({ data });
  console.log(`생성 ${created.count}건`);

  const buckets = { today: 0, week: 0, older: 0 };
  for (let i = 0; i < count; i++) {
    const d = daysAgoForIndex(i, count);
    if (d === 0) buckets.today++;
    else if (d <= 6) buckets.week++;
    else buckets.older++;
  }
  console.log(
    `분포(대략): 오늘 ${buckets.today} · 최근7 ${buckets.week} · archive쪽 ${buckets.older}`,
  );
  if (!authorEmail) {
    console.log('되돌리기: npm run seed:cleanup  (작성자 @seed.local cascade)');
  } else {
    console.log(
      `되돌리기: CLEANUP=1 AUTHOR_EMAIL=${authorEmail} npm run seed:feed`,
    );
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL 없음 (.env)');
    process.exitCode = 1;
    return;
  }
  if (cleanup) await runCleanup();
  else await seed();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
