# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Install dependencies (root, installs all workspaces)
```
pnpm install
```

### Backend development
```
# API server only
pnpm --filter backend dev

# Email worker only
pnpm --filter backend worker:email

# Orders inventory-reservation worker only
pnpm --filter backend worker:orders

# All three concurrently
pnpm --filter backend dev:all
```

### Backend build & production start
```
pnpm --filter backend build
pnpm --filter backend start
```

### Frontend development
```
pnpm --filter frontend dev
pnpm --filter frontend build
pnpm --filter frontend lint
```

### Database (run from `apps/backend`)
```
pnpm prisma migrate dev          # apply pending migrations
pnpm prisma migrate deploy       # production migrations
pnpm prisma generate             # regenerate the Prisma client
pnpm prisma studio               # GUI browser for data
npx ts-node prisma/seed.ts       # seed database
```

## Architecture

### Monorepo layout
- `apps/backend` — Express 5 + TypeScript API, runs on port 5050
- `apps/frontend` — Next.js 16 (App Router) + TypeScript, runs on port 3000
- `packages/shared-types` — TypeScript interfaces shared across apps
- `packages/shared-utils` — Helper utilities and constants
- `packages/validation` — Zod schemas shared across apps
- `infra/` — Dockerfiles, nginx config, docker-compose, deploy scripts

Path aliases (`@shared-types/*`, `@shared-utils/*`, `@validation/*`) are defined in `tsconfig.base.json` and extended by each app's own `tsconfig.json`.

### Backend internals (`apps/backend/src/`)

**Entry points**
- `server.ts` — starts the HTTP server, runs a DB connectivity check, handles graceful shutdown
- `app.ts` — assembles Express middleware stack (CORS, Sentry, request logger, raw body for Razorpay webhooks, `better-auth` handler at `/api/auth/*`, Swagger UI at `/docs`, routes at `/api/v1/`)
- `routes.ts` — mounts all module routers; admin routes are prefixed `/admin/`, customer routes are unprefixed

**Module pattern** — every feature lives in `src/modules/<name>/` with the files:
- `*.route.ts` / `*.admin.route.ts` — Express router, JSDoc Swagger annotations
- `*.controller.ts` — thin handler that calls the service and sends the response
- `*.service.ts` — business logic
- `*.repository.ts` — all Prisma queries
- `*.types.ts` — local TypeScript types

**Authentication** — handled entirely by [better-auth](https://better-auth.com/) (`src/modules/auth/better-auth.ts`). The library mounts at `/api/auth/*splat` via `toNodeHandler`. On new user creation a DB hook assigns the `customer` role. Google OAuth and email/password (with required email verification) are both enabled. Auth OpenAPI reference is at `/docs/auth`.

**Prisma client** — `src/lib/prisma.ts` creates a single `PrismaClient` using `@prisma/adapter-pg` (connection pooling via `pg.Pool`). Generated client lives in `src/generated/prisma/client/`. Always import from there, not from `@prisma/client` directly.

**Background workers** (run as separate processes via BullMQ + Redis):
- `src/jobs/email/email.worker.ts` — processes the email queue; sends via Nodemailer/Zoho SMTP
- `src/jobs/orders/inventory-reservation.worker.ts` — releases inventory reservations on expired/cancelled orders

Enqueue emails via `src/jobs/email/email.queue.ts` (used throughout the codebase for transactional emails).

**Error handling** — throw `AppError` from `src/lib/errors/app-error.ts` for expected failures (it carries an HTTP status + machine-readable `code`). `ZodError` and known `PrismaClientKnownRequestError` codes (P2002 duplicate, P2034 concurrency) are caught and mapped automatically in `src/middlewares/error-handler.ts`. All responses include a `requestId`.

**Environment** — `src/config/env.ts` validates every env var at startup using Zod. The server will throw and refuse to start if any required var is missing or invalid. In production, `SELLER_GSTIN` is required and validated as a legal Indian GSTIN. Copy `.env.example` to `.env` in `apps/backend/`.

**Invoice & PDF generation** — `src/modules/invoices/` generates GST-compliant customer invoices (Puppeteer + EJS templates). `src/modules/shipping/` generates shipping labels similarly. Template files (`*.ejs`) are copied into `dist/` during the build step.

**File storage** — images are uploaded to Cloudflare R2 via the AWS S3 SDK. The upload module at `src/modules/upload/` handles image resizing (Sharp) and produces three variants: original, hero, and thumbnail. R2 credentials come from `R2_*` env vars.

**Payments** — Razorpay is the default payment provider. The checkout flow is two-phase: `POST /checkout/preview` → receive a `previewToken` (TTL: `CHECKOUT_PREVIEW_TTL_SECONDS`) → `POST /checkout/confirm` (idempotency key required via `Idempotency-Key` header).

### Frontend internals (`apps/frontend/src/`)

**Routing** — Next.js App Router. Pages live under `src/app/`. The `src/app/admin/` subtree is the admin dashboard (product management, order management, reports, influencers, vendors).

**API client** — `src/services/api.ts` is the single source of truth for all backend API calls and shared TypeScript types for API responses. It uses a thin `apiFetch` wrapper that sets `credentials: "include"` on all requests. The base URL is `NEXT_PUBLIC_BACKEND_URL + "/api/v1"`.

**Auth on frontend** — `src/lib/auth-client.ts` wraps better-auth's React client. Session state is kept in Zustand (`src/store/auth.store.ts`). The `useAuth` hook (`src/hooks/useAuth.ts`) is the primary way to access auth state in components.

**Server-side auth** — `src/lib/server-auth.ts` and `src/lib/server-api.ts` are used in Next.js Server Components / Route Handlers where `fetch` credentials aren't available via the browser cookie.

**Data fetching** — TanStack Query (`@tanstack/react-query`) is used for all client-side data fetching. Per-entity hooks (`useProducts.ts`, `useOrders.ts`, etc.) live directly in `src/hooks/`.

**State management** — Zustand for global client state (auth, cart). `src/store/` contains store definitions.

**Influencer referral tracking** — `src/components/ReferralAttributionHydrator.tsx` reads a `ref` query param on page load and persists the referral code (used at checkout). `src/lib/referral.ts` encapsulates the storage logic.

**Guest cart** — a UUID session ID is stored in `localStorage` under `pureastra_guest_cart_session_id` and sent as the `x-session-id` header (or `?sessionId=` query param). On login, `POST /cart/merge` merges the guest cart into the user cart.

### Key environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Frontend | API base URL |
| `DATABASE_URL` | Backend | PostgreSQL connection (pooled) |
| `DIRECT_URL` | Backend | Direct PostgreSQL connection (Prisma migrations) |
| `REDIS_HOST` / `REDIS_PORT` or `REDIS_URL` | Backend | BullMQ queues |
| `BETTER_AUTH_SECRET` | Backend | Auth session signing (≥32 chars) |
| `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` | Backend | Payment processing |
| `R2_*` | Backend | Cloudflare R2 image storage |
| `SELLER_GSTIN` | Backend | Required in production for GST invoices |
| `SENTRY_DSN` | Backend | Error tracking (optional) |
