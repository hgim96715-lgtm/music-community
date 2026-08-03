/**
 * 로컬 — 친구·가입자 seed (`@seed.local`).
 *
 * 본인 계정과 accepted 친구 + 검색용 비친구 + (선택) 받은 요청 + 친구 글.
 * 되돌리기: npm run seed:cleanup
 *
 *   cd apps/api
 *   ME_EMAIL=you@example.com npm run seed:friends
 *   ME_EMAIL=you@example.com COUNT=8 EXTRA=5 PENDING=2 POSTS=1 npm run seed:friends
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { FriendshipStatus } from '../src/generated/prisma/enums';

const meEmail = (
  process.env.ME_EMAIL ??
  process.env.AUTHOR_EMAIL ??
  ''
)
  .trim()
  .toLowerCase();
const friendCount = Math.min(Math.max(Number(process.env.COUNT ?? 8), 1), 50);
const extraCount = Math.min(Math.max(Number(process.env.EXTRA ?? 5), 0), 50);
const pendingCount = Math.min(
  Math.max(Number(process.env.PENDING ?? 2), 0),
  20,
);
const postsPerFriend = Math.min(
  Math.max(Number(process.env.POSTS ?? 1), 0),
  5,
);
const prefix = (process.env.PREFIX ?? 'seed').trim() || 'seed';

const TRACKS = [
  {
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    videoId: '4NRXx6U8ABQ',
    moods: ['신남', '밤'],
  },
  {
    title: 'Levitating',
    artist: 'Dua Lipa',
    videoId: 'TUHc6yb-W4M',
    moods: ['신남'],
  },
  {
    title: 'As It Was',
    artist: 'Harry Styles',
    videoId: 'H5v3k9tZtX8',
    moods: ['잔잔'],
  },
  {
    title: 'Heat Waves',
    artist: 'Glass Animals',
    videoId: 'mRD0-GxqHVo',
    moods: ['잔잔'],
  },
  {
    title: 'Anti-Hero',
    artist: 'Taylor Swift',
    videoId: 'b1kbLwvqugk',
    moods: ['감성'],
  },
] as const;

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

function makeUsers(kind: string, count: number, stamp: string) {
  return Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(3, '0');
    return {
      email: `${prefix}_${kind}_${stamp}_${n}@seed.local`,
      nickname: `${prefix}_${kind}_${n}_${stamp.slice(-4)}`,
      passwordHash: null as string | null,
      bio: kind === 'friend' ? 'seed 친구' : kind === 'pending' ? 'seed 요청' : 'seed 검색용',
    };
  });
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL 없음 (.env)');
    process.exitCode = 1;
    return;
  }
  if (!meEmail) {
    console.error('ME_EMAIL=로그인이메일 필요 (또는 AUTHOR_EMAIL)');
    process.exitCode = 1;
    return;
  }

  const me = await prisma.user.findFirst({
    where: { email: { equals: meEmail, mode: 'insensitive' }, deletedAt: null },
    select: { id: true, email: true, nickname: true },
  });
  if (!me) {
    console.error(`유저 없음: ${meEmail}`);
    process.exitCode = 1;
    return;
  }

  const stamp = Date.now().toString(36);
  const friendSpecs = makeUsers('friend', friendCount, stamp);
  const extraSpecs = makeUsers('find', extraCount, stamp);
  const pendingSpecs = makeUsers('pending', pendingCount, stamp);

  const result = await prisma.$transaction(async (tx) => {
    const friends: { id: string; nickname: string }[] = [];
    for (const u of friendSpecs) {
      const user = await tx.user.create({ data: u });
      await tx.friendship.create({
        data: {
          requesterId: me.id,
          addresseeId: user.id,
          status: FriendshipStatus.accepted,
          respondedAt: new Date(),
        },
      });
      friends.push({ id: user.id, nickname: user.nickname });
    }

    const finds: string[] = [];
    for (const u of extraSpecs) {
      const user = await tx.user.create({ data: u });
      finds.push(user.nickname);
    }

    const pendings: string[] = [];
    for (const u of pendingSpecs) {
      const user = await tx.user.create({ data: u });
      await tx.friendship.create({
        data: {
          requesterId: user.id,
          addresseeId: me.id,
          status: FriendshipStatus.pending,
        },
      });
      pendings.push(user.nickname);
    }

    let posts = 0;
    if (postsPerFriend > 0) {
      for (const [fi, friend] of friends.entries()) {
        for (let p = 0; p < postsPerFriend; p++) {
          const track = TRACKS[(fi + p) % TRACKS.length]!;
          await tx.recommendation.create({
            data: {
              title: `[seed] ${track.title}`,
              artist: track.artist,
              embedUrl: `https://www.youtube.com/embed/${track.videoId}`,
              reason: `seed · @${friend.nickname}`,
              moods: [...track.moods],
              authorId: friend.id,
            },
          });
          posts += 1;
        }
      }
    }

    return { friends, finds, pendings, posts };
  });

  console.log(`✅ me=@${me.nickname} (${me.email})`);
  console.log(`   맞친구 ${result.friends.length} · 예: @${result.friends[0]?.nickname}`);
  console.log(
    `   찾기용(비친구) ${result.finds.length}` +
      (result.finds[0] ? ` · 예: @${result.finds[0]}` : ''),
  );
  console.log(
    `   받은 요청 ${result.pendings.length}` +
      (result.pendings[0] ? ` · 예: @${result.pendings[0]}` : ''),
  );
  console.log(`   친구 글(feed) ${result.posts} · 제목 [seed]`);
  console.log('확인: /friends · /friends 찾기 · 피드「친구」탭');
  console.log('되돌리기: npm run seed:cleanup');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
