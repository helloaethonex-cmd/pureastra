# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: deps
# Install ALL dependencies (dev + prod) for building.
# Layer-cached by pnpm store mount — unchanged lock = instant re-use.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter backend...

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: builder
# Compile TypeScript → JS. Runs prisma generate first (required for tsc).
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/tsconfig.base.json ./
COPY --from=deps /app/apps/backend/package.json ./apps/backend/package.json

COPY apps/backend ./apps/backend

RUN pnpm --filter backend exec prisma generate
RUN pnpm --filter backend run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: prod-deps
# Install ONLY production dependencies — no devDependencies in runtime image.
# puppeteer-core is included (it's a prod dep) but it will NOT download
# Chromium because we use system Chromium installed in Stage 4.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS prod-deps

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json

# PUPPETEER_SKIP_DOWNLOAD=true: prevents puppeteer-core from downloading Chromium
# (it won't anyway since it's puppeteer-core, but this is an explicit safeguard)
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter backend...

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4: runtime
# Minimal Alpine image with:
#   - System Chromium from apk (not bundled) – saves ~300MB vs puppeteer
#   - Only production node_modules
#   - Only compiled dist/
#   - Non-root user for security
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
# Alpine's Chromium binary is /usr/bin/chromium (NOT chromium-browser)
ENV CHROMIUM_PATH=/usr/bin/chromium
# Prevent any accidental Chromium download attempt
ENV PUPPETEER_SKIP_DOWNLOAD=true
# Limit Node.js heap to prevent memory spikes in containers
ENV NODE_OPTIONS="--max-old-space-size=512"

# Install system Chromium + required fonts/libs for PDF generation.
# These are the minimum packages needed on Alpine for Chromium to run headless.
# chromium: the browser itself (Alpine-maintained, kept in apk security feed)
# nss/freetype/harfbuzz/ttf-freefont: font rendering for PDFs
# ca-certificates: for HTTPS inside Chromium (invoice template may load nothing,
#   but good practice for future use)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ttf-freefont \
    ca-certificates \
  && addgroup -g 1001 -S nodejs \
  && adduser -S nodejs -u 1001

# Enable pnpm (needed for workspace symlinks to resolve correctly)
RUN corepack enable

# Workspace manifests (needed for pnpm workspace symlink resolution at runtime)
COPY package.json pnpm-lock.yaml ./
COPY apps/backend/package.json apps/backend/package.json

# Production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Compiled app + Prisma artefacts
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.mjs ./apps/backend/prisma.config.mjs
COPY --from=builder /app/apps/backend/src/generated ./apps/backend/src/generated

RUN chown -R nodejs:nodejs /app

WORKDIR /app/apps/backend

USER nodejs

EXPOSE 5050

# Docker healthcheck — restarts container if app becomes unhealthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5050/api/v1/health || exit 1

CMD ["node", "dist/server.js"]
