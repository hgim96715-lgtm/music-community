/**
 * 로컬 테스트용 — 방에 가짜 멤버 N명 추가 (가짜 유저는 로그인 불필요 · DB 직접).
 *
 * 이메일 항상 `*@seed.local` → cleanup-seed-users.ts 로 되돌리기.
 * 정본 문서: apps/docs/dev-seed.md
 *
 *   cd apps/api
 *   npx tsx scripts/seed-room-members.ts
 *   ROOM_ID=<uuid> npx tsx scripts/seed-room-members.ts
 *   ROOM_ID=<uuid> COUNT=50 PREFIX=bot npx tsx scripts/seed-room-members.ts
 *
 * ROOM_ID 없으면 활성 방 목록만 출력.
 * 멤버 시트 조회는 본인 로그인 필요 (API 멤버만).
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { RoomMemberRole } from '../src/generated/prisma/enums';

const roomId = process.env.ROOM_ID?.trim();
const count = Math.min(Math.max(Number(process.env.COUNT ?? 50), 1), 200);
const prefix = (process.env.PREFIX ?? 'seed').trim() || 'seed';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function listRooms() {
  const rooms = await prisma.room.findMany({
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      name: true,
      memberCount: true,
      owner: { select: { nickname: true } },
    },
  });
  console.log('활성 방 (최근 20). ROOM_ID=… 로 다시 실행:\n');
  for (const r of rooms) {
    console.log(
      `  ${r.id}  ·  ${r.name}  ·  ${r.memberCount}명  ·  @${r.owner.nickname}`,
    );
  }
}

async function seed() {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, name: true, memberCount: true },
  });
  if (!room) {
    console.error(`방 없음: ${roomId}`);
    process.exitCode = 1;
    return;
  }

  const stamp = Date.now().toString(36);
  const users = Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(3, '0');
    return {
      email: `${prefix}_${stamp}_${n}@seed.local`,
      nickname: `${prefix}_${n}_${stamp.slice(-4)}`,
      passwordHash: null as string | null,
    };
  });

  const created = await prisma.$transaction(async (tx) => {
    const inserted: string[] = [];
    for (const u of users) {
      const user = await tx.user.create({ data: u });
      await tx.roomMember.create({
        data: {
          roomId: room.id,
          userId: user.id,
          role: RoomMemberRole.member,
        },
      });
      inserted.push(user.nickname);
    }
    const total = await tx.roomMember.count({ where: { roomId: room.id } });
    await tx.room.update({
      where: { id: room.id },
      data: { memberCount: total },
    });
    return { inserted, total };
  });

  console.log(
    `✅ 「${room.name}」에 ${created.inserted.length}명 추가 · memberCount=${created.total}`,
  );
  console.log(
    `닉 예: @${created.inserted[0]} … @${created.inserted[created.inserted.length - 1]}`,
  );
  console.log('본인 계정으로 로그인 → 그 방 멤버 시트에서 검색·더 보기 테스트');
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL 없음 (.env)');
    process.exitCode = 1;
    return;
  }
  if (!roomId) {
    await listRooms();
    return;
  }
  await seed();
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
