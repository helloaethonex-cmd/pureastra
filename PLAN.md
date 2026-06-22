# Pureastra — Project Plan & Audit

> Working reference for the Pureastra dev team. Generated from a full read of the
> backend (`apps/backend`) and frontend (`apps/frontend`) on 2026-06-22.
> File paths are absolute-from-repo-root where useful. Line numbers reflect the
> state of the code at audit time and may drift after edits.

---

## Project Status Summary

Pureastra is a **well-architected, largely production-ready D2C commerce platform**. The
backend follows a clean and consistent module pattern (route → controller → service →
repository), uses serializable transactions for the money-critical paths (order placement,
payment success, commission, invoice creation), and has genuinely careful inventory-reservation
logic with atomic stock counters. Payments, GST-compliant invoicing, the influencer commission
system, and order lifecycle management are the strongest parts and feel finished. The platform
is in a **"core commerce complete, growth/retention features missing"** phase. The three
remaining contract deliverables (automated feedback, buffer stock control, analytics dashboard)
are all **not started** — `modules/feedback/` and `modules/inventory/` are empty `.gitkeep`
directories with no Prisma models. The single biggest structural gap is that **there is no
transactional email being sent anywhere in the business flow** — `enqueueEmail` is only ever
called from `better-auth.ts` (verification/reset). No order-confirmation, shipping, delivery, or
feedback email exists, and there are no email templates beyond the two PDF templates. This
directly blocks the feedback feature and is also a customer-experience gap in its own right.

---

## Contract Completion Tracker

| Deliverable | Status | Notes |
|---|---|---|
| Product catalog (CRUD, variants, images, categories, content sections) | Done | `modules/products` — full, with Redis caching on detail reads |
| Shopping cart (guest session, merge on login, reservations) | Done | `modules/cart`, `InventoryReservation` model |
| Checkout (2-phase preview→confirm, idempotency, Razorpay) | Done | `modules/checkout` |
| Order management (lifecycle, status history, admin controls) | Done | `modules/orders`, `STATUS_TRANSITIONS` enforced |
| Payments (Razorpay webhook, reconciliation) | Done | `modules/payments` — verify + webhook, idempotent |
| Auth (better-auth, email/pw + Google, email verification) | Done | `modules/auth` |
| Addresses / Wishlist / Reviews (images + metrics) | Done | Review metric system is unusually thorough |
| Influencer system (codes, sales, payouts, admin) | Done | Commission locked at order, cancelled on order-cancel |
| Invoice generation (GST customer + vendor, Puppeteer/EJS) | Done | `modules/invoices`, `modules/vendors`, manual invoices in `modules/reports` |
| Shipping label PDF | Done | `modules/shipping` |
| Image upload (R2, Sharp, 3 variants) | Done | `modules/upload` |
| GST / financial reports | Done | `modules/reports` — summary, detailed, CSV export, profit overview |
| **Automated feedback system** | **Not Started** | Empty `modules/feedback/.gitkeep`, no model, no email infra |
| **Buffer stock control** | **Not Started** | No `bufferStock` field on `ProductVariant`, no low-stock alerts |
| **Analytics / customer insights dashboard** | **Not Started** | Only single-number profit overview exists; no time-series, top products, acquisition |
| RBAC admin API (roles/permissions) | Partial | Models exist (`Role`/`Permission`/`RolePermission`), assigned manually via DB; no admin API |
| Product search endpoint | Partial | No dedicated `/products/search`; `GET /products?search=` does substring OR-match (works, not optimised) |

---

## 1. Missing Features (Contract Obligations)

### 1.1 Automated Feedback System — Complexity: **Medium**

**What it is:** After an order is marked DELIVERED, auto-send a feedback-request email. Customer
submits a star rating + satisfaction + optional message. Admin views collected feedback.

**Critical prerequisite — there is no transactional email pipeline.** `enqueueEmail`
(`apps/backend/src/jobs/email/email.queue.ts`) is fully wired to BullMQ and the worker
(`apps/backend/src/jobs/email/email.worker.ts` → `sendMail`) works, but the only caller is
`modules/auth/better-auth.ts`. There are **no EJS/HTML email templates** anywhere
(`find *.ejs` returns only the invoice + shipping-label PDF templates). This must be built first.

**Implementation plan:**

1. **Email template infra (shared prerequisite, see also §6):**
   - Create `apps/backend/src/lib/email/templates/` with a small render helper (EJS, mirroring
     the invoice template loader) and a `dist`-copy step in the build (the invoice/shipping
     templates already do this — replicate that copy rule).
   - Add templates: `feedback-request.ejs`, plus (recommended) `order-confirmation.ejs`,
     `order-shipped.ejs`.

2. **Schema** — add to `apps/backend/prisma/schema.prisma`:
   ```prisma
   model Feedback {
     id        BigInt   @id @default(autoincrement())
     orderId   BigInt   @unique @map("order_id")   // one feedback per order
     userId    BigInt   @map("user_id")
     rating    Int                                  // 1-5
     satisfaction Int?                              // e.g. 1-5 or enum-coded
     message   String?
     token     String   @unique                     // signed link token for email CTA
     submittedAt DateTime? @map("submitted_at")
     createdAt DateTime @default(now()) @map("created_at")
     order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
     user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
     @@index([userId])
     @@map("feedback")
   }
   ```
   Add the back-relations on `Order` and `User`. Then `pnpm prisma migrate dev` + `generate`.

3. **Trigger point** — `apps/backend/src/modules/orders/orders.service.ts`,
   `updateOrderStatusInTx` (~line 392). There is currently **no handling for
   `ORDER_STATUS.DELIVERED` (4)** — only SHIPPED and CANCELLED branches exist. Add a
   `newStatus === ORDER_STATUS.DELIVERED` branch that, **after** the TX commits (do not enqueue
   inside the serializable TX — enqueue from the outer `updateOrderStatusByOrderNumber` wrapper
   after success), creates the `Feedback` row with a token and calls
   `enqueueEmail({...feedback-request, optionally with a `delay` of N hours via JobsOptions})`.
   Use the existing `emailQueue` delay support.

4. **Module `modules/feedback/`** (currently empty):
   - `feedback.types.ts` — Zod: `submitFeedbackSchema { rating 1-5, satisfaction?, message? }`.
   - `feedback.repository.ts` — `findByToken`, `markSubmitted`, `listForAdmin(page, filters)`.
   - `feedback.service.ts` — `submitFeedback(token, input)` (validate token, not already
     submitted), `getAdminFeedback`.
   - `feedback.controller.ts` + `feedback.route.ts`:
     `POST /feedback/:token` (public, token-gated), `GET /admin/feedback` (admin).
   - Mount in `apps/backend/src/routes.ts` (`/feedback` and `/admin/feedback`).

5. **Frontend:**
   - Public page `apps/frontend/src/app/feedback/[token]/page.tsx` — star widget + textarea.
   - Admin page `apps/frontend/src/app/admin/feedback/page.tsx` + nav entry in `AdminClient`.
   - Hook `apps/frontend/src/hooks/useFeedback.ts`, API calls in `src/services/api.ts`.

---

### 1.2 Buffer Stock Control — Complexity: **Low–Medium**

**What it is:** A `bufferStock` reserve on each variant. Customers see "out of stock" when
`stockQuantity - stockReserved ≤ bufferStock`. Admin gets low-stock alert emails.

**Current state:** `ProductVariant` (`schema.prisma` line 234) has `stockQuantity`,
`stockReserved` but **no `bufferStock`**. Availability is computed raw as
`stockQuantity - stockReserved` in `orders.service.ts` `buildPreparedItems` (line 109). The
product list/detail responses expose raw `stockQuantity` with no derived availability flag.

**Implementation plan:**

1. **Schema:** add `bufferStock Int @default(0) @map("buffer_stock")` to `ProductVariant`. Migrate.

2. **Availability logic — single source of truth.** Introduce a helper, e.g.
   `getAvailableStock(variant) = (stockQuantity ?? 0) - stockReserved - bufferStock` and an
   `isOutOfStock` boolean. Apply it in:
   - `apps/backend/src/modules/products/products.repository.ts` response shaping (the detail and
     list serializers currently return raw variants — derive `available`/`inStock` per variant,
     and **stop leaking raw `stockQuantity`** to the public storefront — see §5).
   - `apps/backend/src/modules/orders/orders.service.ts` `buildPreparedItems` (line 109) — change
     the guard to respect `bufferStock` so customers cannot consume the buffer at checkout.
   - `apps/backend/src/modules/cart/cart.service.ts` add-to-cart validation (verify it uses the
     same helper).

3. **Low-stock alert emails:** when admin stock adjustment (`adjustVariantStock`,
   `products.repository.ts` line 212) or order shipping decrement pushes
   `available ≤ bufferStock`, enqueue an admin alert email (needs the email infra from §1.1).
   Add `ADMIN_ALERT_EMAIL` to `apps/backend/src/config/env.ts`. A `low-stock-alert.ejs` template.
   Guard against alert spam (e.g. only alert on the transition into low-stock, or dedupe via a
   short Redis key per variant).

4. **Frontend:** `ProductCard.tsx` and `product/[slug]/page.tsx` should render an "Out of stock"
   / disabled add-to-cart state from the new `inStock` flag rather than `stockQuantity > 0`.

---

### 1.3 Analytics / Customer Insights Dashboard — Complexity: **Medium–High**

**What it is:** Revenue over time, top products, order trends, customer acquisition. Currently
`modules/reports/reports.service.ts` only provides GST summary/detailed/CSV and a
**single-row** `getProfitOverviewReport` (one aggregate set of numbers, no time dimension).

**Implementation plan:**

1. **Backend — new analytics endpoints.** Either extend `modules/reports` or create a dedicated
   `modules/analytics`. Add to `reports.repository.ts` (raw SQL via `prisma.$queryRaw` is fine
   and likely necessary for `date_trunc` time-bucketing):
   - `GET /admin/analytics/revenue?from&to&interval=day|week|month` — `SUM(total_paid)` /
     order count bucketed by `date_trunc`, filtered to `paymentStatus = SUCCESS`.
   - `GET /admin/analytics/top-products?from&to&limit` — group `OrderItem` by
     `productVariantId` / `productName`, `SUM(quantity)` and `SUM(lineTotal)`.
   - `GET /admin/analytics/order-trends?from&to` — counts by `orderStatus` over time.
   - `GET /admin/analytics/customers?from&to` — new customers (`User.createdAt`) per bucket,
     repeat-vs-new order ratio.
   - Reuse the existing `withReportCache` + `buildUtcDateRange` helpers (already in
     `reports.service.ts`, lines 38-74) for caching and date handling.

2. **Frontend:** `apps/frontend/src/app/admin/analytics/page.tsx` (or extend
   `admin/reports/page.tsx`) with a charting lib (e.g. Recharts), date-range picker, and the
   four widgets above. Hook `useAnalytics.ts`, API calls in `services/api.ts`.

3. **Indexing:** ensure indexes support the time-bucketed scans — `Order.placedAt` /
   `Order.createdAt` are not currently indexed for range queries (see §3 Database).

---

## 2. Bugs & Broken Pieces

1. **No order-confirmation / shipping / delivery emails sent — broken customer comms.**
   `apps/backend/src/modules/payments/payments.service.ts` successfully creates the invoice
   (line ~539) and influencer sale (line ~467) inside the payment-success TX but **never enqueues
   a confirmation email**. The customer receives nothing after paying. *Fix:* after the success
   TX commits, `enqueueEmail` an order-confirmation (requires §1.1 infra).

2. **`requireRole` runs a DB query on every admin request.**
   `apps/backend/src/modules/auth/auth.middleware.ts` line 53 — `prisma.user.findUnique({ include: { role: true } })`
   on every admin route hit, and many admin routes already pass through `requireAuth`
   (a second `auth.api.getSession`). Two round-trips per admin request. *Fix:* include the role
   in the session (better-auth `customSession` / additional fields) or cache role-by-userId in
   Redis with a short TTL.

3. **Payments router mounted at `/` (router-level namespace smell).**
   `apps/backend/src/routes.ts` line 67 — `router.use("/", paymentsRoute)`. The individual
   routes hardcode full paths (`/orders/:id/payments`, `/payments/...`), so the webhook resolves
   to `/api/v1/payments/webhooks/razorpay` correctly — **not broken at runtime**, but it
   collides conceptually with other root mounts and is fragile. *Fix:* split into the
   order-scoped payment route (mount under `/orders` or keep) and a `/payments` router, removing
   the `/` mount.

4. **`updateOrderStatusByOrderNumber` allows DELIVERED but does nothing on it.**
   `orders.service.ts` — the only post-SHIPPED transition is `SHIPPED → DELIVERED`
   (`STATUS_TRANSITIONS`, `orders.types.ts` line 41), but `updateOrderStatusInTx` has no
   DELIVERED branch. Delivery is a no-op beyond the status write — no feedback trigger, no
   "delivered" email, no `deliveredAt` timestamp. *Fix:* add the branch (ties into §1.1). Also
   consider adding a `deliveredAt` column for analytics/SLA reporting.

5. **No DB-level stock floor — overselling possible via the buffer gap (once buffer ships).**
   Until §1.2 lands, `stockReserved` can in principle exceed `stockQuantity` only if the bulk
   decrement helpers aren't strict everywhere. `decrementVariantStockQuantityBulkStrict` (used on
   SHIPPED) is strict, but `adjustVariantStock` (`products.repository.ts` line 212) uses a raw
   `increment` with no floor — an admin entering a large negative quantity can drive
   `stockQuantity` negative. *Fix:* clamp at 0 or reject if it would go below `stockReserved`.

6. **`force-dynamic` on the entire admin shell.**
   `apps/frontend/src/app/admin/page.tsx` line 3 — `export const dynamic = "force-dynamic"`.
   Fine for correctness, but means zero caching on the admin entry. Acceptable; flagged for
   awareness.

7. **Reports module mixes two concerns (GST reports + manual invoices).**
   `modules/reports/` now *does* have `manual-invoices.controller/service/types.ts` and they are
   mounted inside `reports.route.ts` (lines 20-22) — the prior-audit "no manual-invoices.route"
   note is **stale**. Still, manual invoices are an invoicing concern, not a reporting one.
   *Fix (low priority):* relocate manual-invoice files to `modules/invoices/` for cohesion.

8. **`shipping` and `vendors` modules lack a repository layer.**
   `modules/shipping/` has no `*.repository.ts` (Prisma calls live in the service), and
   `modules/vendors/` likewise has only controller/service/types. Violates the stated module
   pattern; not a runtime bug but a consistency/maintainability gap.

---

## 3. Performance Optimisations

### Backend
- **Eliminate the per-request role DB lookup** in `requireRole` (see §2.2) — highest-traffic
  backend win for the admin app.
- **Cache the product *list* endpoint.** `products.service.ts` `getAllProducts` (line 61) is a
  passthrough with **no caching**, while detail reads are cached. Storefront listing/category
  pages are the hottest read path. Add a short-TTL Redis cache keyed by the query params
  (mirror `withReportCache`).
- **Invoice PDF generation uses Puppeteer per invoice.** Confirm a single shared browser
  instance is reused across PDF jobs rather than launching Chromium per call — launching per
  invoice is expensive. (Verify in `modules/invoices/invoices.service.ts` `generateInvoicePdf`.)

### Frontend
- **`useProducts` query key includes the full `params` object** (`useProducts.ts` line 46) — fine,
  but ensure callers memoize `params` or identical re-renders refetch. Pass `keepPreviousData`
  on paginated/category views (already supported) to avoid list flicker.
- **Image optimisation:** the upload pipeline already produces hero/thumb/placeholder variants
  (`ProductImage.placeholder`, `thumbnailImageUrl`). Confirm `ProductCard.tsx` actually renders
  the **thumbnail** + blur placeholder, not the full `imageUrl`. Use `next/image` with the
  stored `width`/`height` to prevent CLS.
- **Carousels** (`BestProductsCarousel.tsx`, `ConcernSlider.tsx`) — verify they lazy-mount
  offscreen slides and don't all fetch eagerly on the homepage.

### Database / Queries
- **Add range indexes for analytics & order lists:** `Order.placedAt` and `Order.createdAt` are
  unindexed (only `userId`/`influencerId` are). The admin order list (`findOrdersForAdmin`)
  sorts by date; analytics will `date_trunc` over `placedAt`. Add `@@index([createdAt])` /
  `@@index([placedAt])`.
- **Product list price sort is wrong.** `products.repository.ts` line 80 —
  `sortBy === "price"` maps to `{ variants: { _count: sortOrder } }`, i.e. it sorts by **variant
  count, not price**. This is a correctness bug *and* a perf concern (counts every variant).
  Sorting by price requires either a denormalised `minPrice` column on `Product` or an
  aggregate/raw query.
- **`findAllProducts` substring search** (`ILIKE %term%` via `contains`, lines 55-61) cannot use
  an index. For the contracted/expected search, add a Postgres `pg_trgm` GIN index or a
  `tsvector` full-text column and a real `GET /products/search` endpoint.
- **`findCategoryById` eager-loads products** (`take: 10`, line 320) on every category fetch —
  fine, just be aware it's a join on a hot path.

---

## 4. UX & Smoothness Improvements

- **Post-payment confirmation experience.** With no confirmation email (§2.1), the only feedback
  is the on-screen success state. Add the email and a polished order-confirmation screen on
  `checkout/page.tsx` success.
- **Out-of-stock states.** Once §1.2 lands, `ProductCard.tsx` and `product/[slug]/page.tsx` need
  proper disabled "Out of stock" / "Notify me" affordances instead of a dead add-to-cart button.
- **Order tracking page** (`app/order-track/page.tsx`) — ensure it renders the full
  `statusHistory` timeline (the API already returns it in `getOrderDetailForUser`) as a visual
  stepper (PLACED → CONFIRMED → PACKED → SHIPPED → DELIVERED), which reads as premium.
- **Loading states.** A single `ui/Skeleton.tsx` exists — confirm it's actually used on the
  product grid, cart, and order-history pages rather than spinners/blank flashes.
- **Wishlist / cart feedback.** Add optimistic toasts on add-to-cart / add-to-wishlist
  (`useCart.ts`, `useWishlist.ts`) for snappiness.
- **Admin nav.** As feedback (§1.1) and analytics (§1.3) pages land, add them to the admin
  sidebar in `AdminClient` so they're discoverable.
- **Empty states.** Ensure `wishlist/page.tsx`, `order-history/page.tsx`, and an empty
  `cart/page.tsx` have branded empty states, not bare "no items".

---

## 5. Security & Reliability

- **Raw `stockQuantity` leaks to the public storefront.** `products.repository.ts`
  `productFullInclude` / `productDetailInclude` return full variant rows (including
  `stockQuantity`, `stockReserved`, **`costPrice`**) and the public list/detail endpoints are
  unauthenticated. **`costPrice` is sensitive margin data and must never reach the storefront.**
  *Fix:* add a public serializer that strips `costPrice`, `stockReserved`, and raw
  `stockQuantity` (replace with a derived `inStock`/`available`).
- **RBAC is single-role and manual.** `requireRole("admin")` checks one role name; roles are
  assigned by hand in the DB. The `Permission`/`RolePermission` tables are unused. For a growing
  team, build the contracted RBAC admin API and switch guards to permission checks. Until then,
  document the manual role-assignment process.
- **`optionalAuth` swallows all errors silently** (`auth.middleware.ts` line 37) — acceptable for
  mixed guest/auth routes, but ensure genuinely auth-required routes never rely on it.
- **Webhook reliability is good** — raw-body signature verification + `providerEventId` dedupe
  index on `Payment`. Confirm the raw-body middleware is scoped only to the webhook path (it is,
  per CLAUDE.md) and not globally, to avoid breaking JSON parsing elsewhere.
- **Email worker `removeOnFail: 5050`** (`email.queue.ts` line 21) is an odd magic number
  (looks like a copy of the port). Set it intentionally (e.g. keep last 1000 failures) — minor.
- **`SELLER_GSTIN` optional in dev, required in prod** — good. Ensure CI/staging runs with
  `NODE_ENV=production`-equivalent validation before go-live so a missing GSTIN can't ship.

---

## 6. Recommended Build Order

1. **Email template infrastructure** (`lib/email/templates/` + render helper + build copy step).
   *Why first:* it is the hard dependency for the feedback feature (§1.1), low-stock alerts
   (§1.2), and fixes the missing order-confirmation bug (§2.1). One foundation unlocks three
   things.
2. **Order-confirmation + shipped emails** (§2.1). *Why:* immediate customer-facing value, small
   once the infra exists, and validates the email pipeline end-to-end before feedback depends on it.
3. **Automated Feedback System** (§1.1) — schema, DELIVERED trigger, module, public + admin pages.
   *Why:* highest-value remaining **contract** deliverable; now unblocked.
4. **Buffer Stock Control** (§1.2). *Why:* protects revenue/operations (no overselling), small
   schema change, and the public serializer fix (§5) is bundled here naturally.
5. **Public product serializer hardening** (§5 — strip `costPrice`/stock). *Why:* security; do it
   alongside §4 since you're already touching variant response shaping. (Can be pulled earlier as
   a Quick Win — see §7.)
6. **Analytics Dashboard** (§1.3). *Why:* last contract deliverable; larger surface area, benefits
   from the date-range/index work and can be built incrementally widget-by-widget.
7. **Performance pass** (§3): role-lookup caching, product-list caching, price-sort fix,
   analytics indexes.
8. **RBAC admin API** (§5) and module-consistency cleanups (§2.7, §2.8). *Why:* lower urgency,
   quality/scaling work.

---

## 7. Quick Wins (< 2 hours each, high impact)

- **Strip `costPrice` from public product responses** (§5) — pure margin-data leak; small
  serializer change in `products.repository.ts`. **Do this immediately.**
- **Fix product price-sort bug** (`products.repository.ts` line 80) — currently sorts by variant
  count. At minimum, drop the broken option or sort by a derived field.
- **Clamp `adjustVariantStock` at 0** (`products.repository.ts` line 212) to prevent negative
  stock from admin typos (§2.5).
- **Cache the product list endpoint** with a short TTL (§3) — reuse the existing cache helper.
- **Add `@@index([createdAt])` to `Order`** — one-line migration, speeds the admin order list and
  future analytics.
- **Set `email.queue.ts` `removeOnFail` to an intentional value** (§5) — trivial.
- **Add a `deliveredAt` column to `Order`** — one migration; needed for feedback timing and SLA
  analytics later.
- **Remove the `/debug-sentry` exposure assumptions** — already dev-gated in `routes.ts`
  (line 54); just confirm it stays gated. (No change if correct.)

---

### Appendix — Notes on stale prior-audit items

- `modules/reports/manual-invoices.*` **do exist** (controller/service/types) and are mounted in
  `reports.route.ts`. The "no manual-invoices.route.ts" note is outdated (they share the reports
  router intentionally).
- A dedicated `GET /products/search` does not exist, but `GET /products?search=` already performs
  a name/description/brand substring search — search is *functional*, just not optimised.
- `modules/feedback/` and `modules/inventory/` are confirmed empty (`.gitkeep` only).
