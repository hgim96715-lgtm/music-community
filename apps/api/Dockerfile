FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api ./apps/api

RUN pnpm install --frozen-lockfile --filter api

WORKDIR /app/apps/api
RUN pnpm exec prisma generate && pnpm build

ENV NODE_ENV=production
EXPOSE 3030

CMD ["pnpm", "run", "start:deploy"]
