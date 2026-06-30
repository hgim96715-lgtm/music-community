FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile --filter api

WORKDIR /app/apps/api
# prisma.config.ts가 env('DATABASE_URL')을 읽음 — generate는 DB 접속 안 함 · 빌드용 더미만 필요
RUN DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build?schema=public" \
    pnpm exec prisma generate && pnpm build

ENV NODE_ENV=production
EXPOSE 3030

CMD ["pnpm", "run", "start:deploy"]
