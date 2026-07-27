/**
 * 로컬 테스트용 — seed 가짜 유저 삭제 + 방 memberCount 재계산.
 *
 *   cd apps/api
 *   npx tsx scripts/cleanup-seed-users.ts              # 전체 @seed.local
 *   PREFIX=seed npx tsx scripts/cleanup-seed-users.ts  # 닉/이메일이 seed_ 로 시작
 *   ROOM_ID=<uuid> npx tsx scripts/cleanup-seed-users.ts  # 그 방 멤버인 seed만
 *
 * DRY_RUN=1 이면 삭제 없이 대상만 출력.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const roomId = process.env.ROOM_ID?.trim();
const prefix = process.env.PREFIX?.trim();
const dryRun = process.env.DRY_RUN === '1' || process.env.DRY_RUN === 'true';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL 없음 (.env)');
    process.exitCode = 1;
    return;
  }

  const where = {
    email: { endsWith: '@seed.local' },
    ...(prefix
      ? {
          OR: [
            { email: { startsWith: `${prefix}_` } },
            { nickname: { startsWith: `${prefix}_` } },
          ],
        }
      : {}),
    ...(roomId
      ? { roomMembers: { some: { roomId } } }
      : {}),
  };

  const targets = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      nickname: true,
      roomMembers: { select: { roomId: true } },
    },
  });

  if (targets.length === 0) {
    console.log('삭제할 seed 유저 없음');
    return;
  }

  console.log(
    `${dryRun ? '[DRY_RUN] ' : ''}${targets.length}명 대상` +
      (prefix ? ` · PREFIX=${prefix}` : '') +
      (roomId ? ` · ROOM_ID=${roomId}` : ''),
  );
  console.log(
    `예: @${targets[0].nickname} … @${targets[targets.length - 1].nickname}`,
  );

  if (dryRun) return;

  const roomIds = new Set<string>();
  for (const u of targets) {
    for (const m of u.roomMembers) roomIds.add(m.roomId);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.deleteMany({
      where: { id: { in: targets.map((u) => u.id) } },
    });
    for (const id of roomIds) {
      const total = await tx.roomMember.count({ where: { roomId: id } });
      await tx.room.update({
        where: { id },
        data: { memberCount: total },
      });
      console.log(`  room ${id} memberCount → ${total}`);
    }
  });

  console.log(`✅ ${targets.length}명 삭제 · 관련 방 memberCount 갱신`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
