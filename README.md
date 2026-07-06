<div align="center">

# Pureastra

**A modern, production-grade ecommerce platform**

[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Redis](https://img.shields.io/badge/Redis%2FBullMQ-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Razorpay](https://img.shields.io/badge/Razorpay-0C2451?logo=razorpay&logoColor=white)](https://razorpay.com)
[![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)](https://pnpm.io)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-lightgrey)](#license)

</div>

---

## Overview

Pureastra is a full-stack ecommerce platform built as a pnpm monorepo, sharing types, validation schemas, and utilities between a Next.js storefront and an Express API. It handles the complete commerce lifecycle — catalog, cart, checkout, payments, inventory, invoicing, shipping, and post-purchase workflows — alongside an admin dashboard and influencer referral tracking.

**Core capabilities**

- Storefront with product catalog, cart, wishlist, and reviews
- Two-phase checkout (`preview` → `confirm`) with idempotent payment handling via Razorpay
- Inventory reservation with automatic release on expiry via background workers
- GST-compliant invoice and shipping label generation (Puppeteer + EJS)
- Authentication via [better-auth](https://better-auth.com/) — email/password with verification, Google OAuth
- Influencer referral attribution and vendor management
- Admin dashboard for products, orders, reports, influencers, and vendors
- Transactional email delivery queued through BullMQ/Redis

---

## Repository layout

```
pureastra/
├─ apps/
│  ├─ backend/            Express 5 + TypeScript API           → :5050
│  └─ frontend/           Next.js 16 (App Router) storefront    → :3000
│
├─ packages/
│  ├─ shared-types/       TypeScript interfaces shared across apps
│  ├─ shared-utils/       Common helpers and constants
│  └─ validation/         Zod schemas shared across apps
│
├─ infra/
│  ├─ docker/             Dockerfiles and nginx config
│  ├─ docker-compose.yml
│  └─ scripts/            Deployment scripts
│
├─ .github/workflows/     CI/CD (deploy-backend.yml)
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
```

Path aliases `@shared-types/*`, `@shared-utils/*`, and `@validation/*` are declared in `tsconfig.base.json` and extended by each app.

---

## Backend

`apps/backend` — Express 5 API on **port 5050**.

**Entry points**

| File | Responsibility |
|---|---|
| `src/server.ts` | Starts the HTTP server, checks DB connectivity, handles graceful shutdown |
| `src/app.ts` | Middleware stack — CORS, Sentry, request logging, Razorpay raw-body handling, better-auth mount, Swagger UI, API routes |
| `src/routes.ts` | Mounts every module router (`/admin/*` for admin, unprefixed for customer-facing) |

**Module pattern** — every feature under `src/modules/<name>/` follows the same shape:

```
<name>.route.ts        Express router + Swagger JSDoc
<name>.admin.route.ts  Admin-only routes (where applicable)
<name>.controller.ts   Thin request/response handling
<name>.service.ts      Business logic
<name>.repository.ts   All Prisma queries
<name>.types.ts        Local types
```

Current modules: `auth`, `users`, `products`, `orders`, `cart`, `checkout`, `payments`, `inventory`, `invoices`, `shipping`, `feedback`, `reviews`, `influencers`, `vendors`, `wishlist`, `address`, `reports`, `upload`.

**Background workers** (separate processes, BullMQ + Redis):

| Worker | Purpose |
|---|---|
| `src/jobs/email/email.worker.ts` | Sends transactional email via Nodemailer/Zoho SMTP |
| `src/jobs/orders/inventory-reservation.worker.ts` | Releases inventory reservations on expired/cancelled orders |

**Notable internals**

- **Auth** — fully delegated to better-auth, mounted at `/api/auth/*splat`. New users get the `customer` role via a DB hook. Reference at `/docs/auth`.
- **Prisma** — a single `PrismaClient` in `src/lib/prisma.ts` using `@prisma/adapter-pg` for pooling. Generated client lives in `src/generated/prisma/client/` — always import from there, never from `@prisma/client` directly.
- **Errors** — throw `AppError` (`src/lib/errors/app-error.ts`) for expected failures; `ZodError` and known Prisma error codes (`P2002`, `P2034`) are mapped automatically by `src/middlewares/error-handler.ts`. Every response includes a `requestId`.
- **Env validation** — `src/config/env.ts` validates all environment variables with Zod at startup; the server refuses to start if anything required is missing or malformed. `SELLER_GSTIN` is required and GSTIN-validated in production.
- **File storage** — images upload to Cloudflare R2 via the S3 SDK; `src/modules/upload/` resizes with Sharp into original/hero/thumbnail variants.
- **Payments** — Razorpay is the provider. Checkout is two-phase: `POST /checkout/preview` returns a `previewToken` (TTL via `CHECKOUT_PREVIEW_TTL_SECONDS`), then `POST /checkout/confirm` requires an `Idempotency-Key` header.

---

## Frontend

`apps/frontend` — Next.js 16 App Router storefront + admin dashboard on **port 3000**.

- **Routing** — pages under `src/app/`; `src/app/admin/` is the admin dashboard (products, orders, reports, influencers, vendors).
- **API client** — `src/services/api.ts` is the single source of truth for backend calls and response types, via a thin `apiFetch` wrapper (`credentials: "include"` on every request). Base URL is `NEXT_PUBLIC_BACKEND_URL + "/api/v1"`.
- **Auth** — `src/lib/auth-client.ts` wraps better-auth's React client; session state lives in Zustand (`src/store/auth.store.ts`), exposed via the `useAuth` hook.
- **Server-side auth** — `src/lib/server-auth.ts` / `src/lib/server-api.ts` for Server Components and Route Handlers.
- **Data fetching** — TanStack Query, with per-entity hooks (`useProducts.ts`, `useOrders.ts`, ...) in `src/hooks/`.
- **State** — Zustand stores in `src/store/` (auth, cart, ...).
- **Referral tracking** — `ReferralAttributionHydrator.tsx` captures a `ref` query param on load; `src/lib/referral.ts` persists it for checkout attribution.
- **Guest cart** — a UUID session ID in `localStorage` (`pureastra_guest_cart_session_id`), sent as `x-session-id`. `POST /cart/merge` merges it into the user's cart on login.

---

## Shared packages

| Package | Contents |
|---|---|
| `packages/shared-types` | TypeScript interfaces used by both apps (`Product`, `Order`, `User`, `APIResponse`, ...) |
| `packages/validation` | Zod schemas shared across frontend and backend |
| `packages/shared-utils` | Formatting helpers, date utilities, shared constants |

---

## Getting started

**Prerequisites:** Node.js, [pnpm](https://pnpm.io), Docker, Git, PostgreSQL, Redis.

```bash
# Install all workspace dependencies
pnpm install

# Copy env templates and fill in values
cp .env.example apps/backend/.env
```

### Backend

```bash
pnpm --filter backend dev         # API server only
pnpm --filter backend worker:email   # Email worker only
pnpm --filter backend worker:orders  # Inventory-reservation worker only
pnpm --filter backend dev:all     # API + both workers concurrently

pnpm --filter backend build
pnpm --filter backend start
```

### Frontend

```bash
pnpm --filter frontend dev
pnpm --filter frontend build
pnpm --filter frontend lint
```

### Database (run from `apps/backend`)

```bash
pnpm prisma migrate dev          # apply pending migrations
pnpm prisma migrate deploy       # production migrations
pnpm prisma generate             # regenerate the Prisma client
pnpm prisma studio               # GUI browser for data
npx ts-node prisma/seed.ts       # seed database
```

---

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Frontend | API base URL |
| `DATABASE_URL` | Backend | Pooled PostgreSQL connection |
| `DIRECT_URL` | Backend | Direct PostgreSQL connection (Prisma migrations) |
| `REDIS_HOST` / `REDIS_PORT` or `REDIS_URL` | Backend | BullMQ queues |
| `BETTER_AUTH_SECRET` | Backend | Auth session signing (≥32 chars) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | Backend | Payment processing |
| `R2_*` | Backend | Cloudflare R2 image storage |
| `SELLER_GSTIN` | Backend | Required in production for GST invoices |
| `SENTRY_DSN` | Backend | Error tracking (optional) |

See `.env.example` at the repo root for the full list.

---

## API

All backend routes are prefixed `/api/v1`. Interactive Swagger docs are served at `/docs` (auth reference at `/docs/auth`) when the API is running.

```
POST  /api/v1/auth/sign-in
POST  /api/v1/auth/sign-up
GET   /api/v1/products
POST  /api/v1/cart
POST  /api/v1/checkout/preview
POST  /api/v1/checkout/confirm
GET   /admin/orders
```

---

## Deployment

The platform is designed to run on a VPS via Docker Compose (`infra/docker-compose.yml`, `infra/docker/`), fronted by Nginx:

```
Internet → Nginx → Frontend container
                  → Backend API container → PostgreSQL
                                           → Redis
```

CI/CD runs through GitHub Actions (`.github/workflows/deploy-backend.yml`), which builds images, ships them to the server, and restarts the stack via docker-compose.

---

## Contributing

1. Branch from `main` (e.g. `feature/orders`, `fix/checkout-webhook`)
2. Make your changes, following the module pattern above
3. Ensure `pnpm --filter backend build`, `pnpm --filter frontend lint`, and relevant tests pass
4. Open a pull request

---

## License

Private and proprietary — maintained for the Pureastra platform.
