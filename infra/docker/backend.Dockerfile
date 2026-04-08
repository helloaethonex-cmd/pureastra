FROM node:20-alpine AS deps
# Install dependencies in a cached layer
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter backend...

FROM node:20-alpine AS builder
# Build the application
WORKDIR /app

RUN corepack enable

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=deps /app/apps/backend/package.json ./apps/backend/package.json

# Copy source code
COPY apps/backend ./apps/backend

# Generate Prisma client and build
RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend run build

FROM node:20-alpine AS prod-deps
# Install only production dependencies
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter backend...

FROM node:20-alpine AS runtime
# Final runtime image
WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy built application and Prisma files
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.mjs ./apps/backend/prisma.config.mjs
COPY --from=builder /app/apps/backend/src/generated ./apps/backend/src/generated

# Set ownership to non-root user
RUN chown -R nodejs:nodejs /app

WORKDIR /app/apps/backend

USER nodejs

EXPOSE 5050

CMD ["node", "dist/server.js"]
