FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json

RUN pnpm install --frozen-lockfile --filter backend...

COPY apps/backend ./apps/backend

RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend run build

FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json

RUN pnpm install --frozen-lockfile --prod --filter backend...

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.mjs ./apps/backend/prisma.config.mjs
COPY --from=builder /app/apps/backend/src/generated ./apps/backend/src/generated

WORKDIR /app/apps/backend

EXPOSE 5050

CMD ["node", "dist/server.js"]
