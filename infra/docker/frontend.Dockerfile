# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: deps
# Install all dependencies required to build the Next.js app.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/frontend/package.json apps/frontend/package.json

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter frontend...

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: builder
# Build the standalone Next.js server.
# NEXT_PUBLIC_* values are baked into the browser bundle at build time.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

ARG NEXT_PUBLIC_BACKEND_URL=""
ARG NEXT_PUBLIC_SHIPPING_GST_RATE=""
ARG NEXT_PUBLIC_FLAT_SHIPPING_CHARGE_INCLUSIVE=""

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL}
ENV NEXT_PUBLIC_SHIPPING_GST_RATE=${NEXT_PUBLIC_SHIPPING_GST_RATE}
ENV NEXT_PUBLIC_FLAT_SHIPPING_CHARGE_INCLUSIVE=${NEXT_PUBLIC_FLAT_SHIPPING_CHARGE_INCLUSIVE}

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/frontend/node_modules ./apps/frontend/node_modules
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=deps /app/apps/frontend/package.json ./apps/frontend/package.json

COPY apps/frontend ./apps/frontend

RUN pnpm --filter frontend run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: runtime
# Minimal runtime image for the standalone Next.js server.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs \
  && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/public ./apps/frontend/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./apps/frontend/.next/static

WORKDIR /app/apps/frontend

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
