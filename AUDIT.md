# PureAstra Backend — Static Audit Report

> Generated: 2026-07-02  
> Auditor: Fable (claude-fable-5)  
> Scope: `apps/backend/src/` — full static analysis  
> Findings: 21 total — 0 CRITICAL · 6 HIGH · 8 MEDIUM · 7 LOW

---

## Legend

| Severity | Meaning |
|---|---|
| **CRITICAL** | Security vulnerability, data loss risk, or crash that stops the application |
| **HIGH** | Significant bug that will surface in production or break core functionality |
| **MEDIUM** | Performance bottleneck or maintainability flaw |
| **LOW** | Minor edge case, inconsistency, or refactoring opportunity |

---

## CRITICAL

*No critical findings.*

---

## HIGH

### H-01 — Late webhook re-pays expired inventory reservations, causing oversell and permanent inventory drift

**File:** `modules/payments/payments.service.ts` · `modules/orders/orders.service.ts` · `modules/orders/orders.repository.ts`  
**Lines:** `payments.service.ts:401-412`, `orders.service.ts:404-439`

**Root cause:**  
Reservations expire after `ORDER_RESERVATION_TTL_MINUTES` (default 15 min). The sweeper sets `status=EXPIRED` and decrements `stockReserved`. If a Razorpay success webhook arrives *after* the TTL, `confirmPaymentAttempt` still marks the order `CONFIRMED` and calls `confirmReservationsByOrder` — which only updates reservations with `status=ACTIVE (0)`. Expired (`status=3`) reservations are untouched; `stockReserved` is never re-incremented. Meanwhile, the stock has been returned to the pool and may have been sold to another customer.

When an admin later marks the order `SHIPPED`, `updateOrderStatusInTx` only decrements `stockQuantity` for reservations with `ACTIVE/CONFIRMED` status. Since all reservations are `EXPIRED`, `variantQuantities` is empty, the length-equality guard passes vacuously, and `stockQuantity` is never decremented — **permanent inventory drift** with no error surfaced.

**Fix:**  
In `confirmPaymentAttempt`, after confirming the payment, fetch all reservations for the order. For any with `status=EXPIRED`, atomically re-reserve (verify available stock still exists, increment `stockReserved`, set status back to `CONFIRMED`) — or if stock is no longer available, flag the order for manual review and do not proceed to `CONFIRMED`. For the `SHIPPED` handler, consider decrementing `stockQuantity` from `orderItems.quantity` (the true source of truth) rather than relying solely on surviving reservations.

---

### H-02 — `setImmediate` inside an open Serializable transaction fires before commit and on rollback

**File:** `modules/payments/payments.service.ts`  
**Lines:** `545–614`

**Root cause:**  
`confirmPaymentAttempt` runs inside `prisma.$transaction(..., Serializable)`. The `setImmediate` callbacks for `generateInvoicePdf` and `enqueueEmail` (order-confirmation) are registered while the transaction is still uncommitted. `setImmediate` fires as soon as the current macrotask yields — which can precede the actual commit, and **will fire even if the transaction rolls back** (P2034 serialization conflicts are routine at this isolation level and are retried).

Consequences:
1. `generateInvoicePdf` reads via the global Prisma client, finds nothing pre-commit, and returns silently → PDF is never generated.
2. The customer receives a confirmation email for a TX that ultimately rolled back.
3. On TX retry the callbacks are registered again → **duplicate emails**.

**Fix:**  
Return the side-effect data (invoiceId, email payload) as the resolved value of `prisma.$transaction(...)`. Execute `generateInvoicePdf` and `enqueueEmail` only after the transaction fully resolves:

```ts
const { updatedPayment, invoiceId, emailPayload } = await prisma.$transaction(
  async (tx) => { /* ... return { updatedPayment, invoiceId, emailPayload } */ },
  TX_OPTIONS,
);

// Safe: TX has committed
generateInvoicePdf(invoiceId).catch(/* log */);
enqueueEmail(emailPayload).catch(/* log */);
```

---

### H-03 — `costPriceAtPurchase` hardcoded to zero on every checkout order item

**File:** `modules/checkout/checkout.service.ts`  
**Lines:** `568–587` (specifically line ~585)

**Root cause:**  
`createOrderAndPaymentInTx` hardcodes `costPriceAtPurchase: ZERO_DECIMAL` for all order items. The variant's `costPrice` is available in the DB and is correctly snapshotted in `orders.service.ts:placeOrder`, but the checkout code path (the only one customers actually hit in the two-phase preview→confirm flow) never reads it. Every real order has zero cost of goods recorded — **COGS and margin data are permanently corrupted** and cannot be reconstructed if variant `costPrice` changes.

**Fix:**  
Include `costPrice` in the variant select used by `findActiveCartForCheckout` / `findVariantForBuyNowCheckout`, carry it through `PreparedLineItem`, and set:

```ts
costPriceAtPurchase: item.costPrice ?? ZERO_DECIMAL,
```

---

### H-04 — Product list `sortBy=price` sorts by variant count, not price

**File:** `modules/products/products.repository.ts`  
**Lines:** `78–81`

**Root cause:**  
```ts
const orderBy = sortBy === "price"
  ? { variants: { _count: sortOrder } }
  : ...
```
`_count` aggregates the *number of variants*, not price. A customer requesting products sorted by price gets products ordered by how many variants they have — completely wrong storefront behaviour.

**Fix:**  
Denormalise a `minPrice` column onto the `Product` model (kept in sync on variant writes) and use `orderBy: { minPrice: sortOrder }`. Alternatively use `prisma.$queryRaw` with `ORDER BY MIN(pv.price)`. At minimum, remove the misleading branch and return an error if `sortBy=price` is passed.

---

### H-05 — Payout completion marks all `APPROVED` sales as `PAID`, including ones approved after payout was initiated

**File:** `modules/influencers/influencers.service.ts`  
**Lines:** `390–434` (blanket update: `413–423`) and `298–355`

**Root cause:**  
`adminRecordPayout` computes payable amount as `SUM(APPROVED sales) - SUM(COMPLETED payouts)` at initiation time. `adminUpdatePayoutStatus(COMPLETED)` then blanket-updates **every sale with `status=APPROVED`** to `PAID` — with no link between the payout record and the specific sales it covered. Any sale approved between payout initiation and completion is flipped to `PAID` without being included in the payout amount → **the influencer is never paid for it** and it disappears from all future payable calculations. Additionally, nothing prevents two concurrent `INITIATED` payouts for the same influencer, enabling double payout.

**Fix:**  
At payout creation, snapshot the covered sale IDs (join table `influencer_payout_sales`, or set covered sales to a `LOCKED` intermediate status in the same TX). On `COMPLETED`, transition only those snapshotted/locked sales to `PAID`. Reject creating a new payout while another `INITIATED` payout exists for the same influencer.

---

### H-06 — Preview token consumed before order TX; failed TX permanently strands the checkout session

**File:** `modules/checkout/checkout.service.ts`  
**Lines:** `834–925`

**Root cause:**  
`confirmCheckoutByFlow` consumes the preview token in Redis (`consumePreviewAtomic`) **before** the order-creation transaction runs, and the idempotency record is only written **after** the transaction commits. If the Serializable transaction fails (P2034 serialization conflict is routine, or any transient DB error), the client retries with the same `Idempotency-Key`, finds no idempotency record, then hits `PREVIEW_TOKEN_CONSUMED` — the user **cannot retry** and must restart the entire checkout flow from preview, despite nothing having been created.

There is also a crash window between TX commit and `saveIdempotencyRecord` that creates an orphan order invisible to the idempotency retry path.

**Fix:**  
Consume the preview token inside the order-creation transaction (or immediately after, with a compensating restore on failure):

```ts
try {
  await consumePreviewAtomic(token);
  const result = await prisma.$transaction(..., TX_OPTIONS);
  await saveIdempotencyRecord(key, result);
  return result;
} catch (err) {
  await restorePreviewToken(token); // un-consume on TX failure
  throw err;
}
```

---

## MEDIUM

### M-01 — Zod validation errors surface as `500 Internal Server Error` in products/address controllers

**File:** `modules/products/products.controller.ts`  
**Lines:** `48–52`

**Root cause:**  
The local `handleError` only recognises objects with a `.status` property. `ZodError` thrown by `productQuerySchema.parse(req.query)` has no `.status`, so invalid client input (e.g. `?page=abc`) is logged as a controller error and returns HTTP 500. The same pattern exists in `address.service.ts` (lines `37–40`) which throws plain object literals (`{ status: 404, message: ... }`) — not `AppError` instances — bypassing the central `globalErrorHandler`.

**Fix:**  
In `handleError` add a `ZodError` branch, or — better — throw `AppError` from services, drop the per-controller `try/catch`, and let `globalErrorHandler` handle all mapping uniformly.

---

### M-02 — TOCTOU race in `adminUpdateSaleStatus` allows double earnings decrement

**File:** `modules/influencers/influencers.service.ts`  
**Lines:** `244–292`

**Root cause:**  
The sale's current status is read **outside** the transaction (`prisma.influencerSale.findUnique`); the transition-validity check is performed on that stale value. Two concurrent CANCELLED requests (or a concurrent order-cancel in `orders.service.ts`) both read `status=APPROVED`, both pass the guard, and both execute `decrementInfluencerEarningsSafe` — total earnings decremented twice for one sale. The `GREATEST(..., 0)` floor only prevents going negative, not double-decrement.

**Fix:**  
Move the read + guard inside the transaction and make the update conditional:

```ts
const { count } = await tx.influencerSale.updateMany({
  where: { id, status: { in: ['PENDING', 'APPROVED'] } },
  data: { status: 'CANCELLED' },
});
if (count === 1) await decrementInfluencerEarningsSafe(tx, ...);
```

---

### M-03 — Product-detail cache is in-process `Map` — stale on multi-instance deployments

**File:** `lib/cache/product-detail.cache.ts`  
**Lines:** `1–86`

**Root cause:**  
The product-detail cache is a module-level `Map`. Under multiple API instances (the infra includes nginx/docker-compose, implying horizontal scale), an admin product update on instance A invalidates only instance A's map. Instances B and C serve stale price, stock flags, and deletions for up to the 300 s TTL. The project already has Redis available.

**Fix:**  
Back the cache with the existing `redisClient` (`GET`/`SET EX`/`DEL`) on the same key pattern, or publish invalidation events over Redis pub/sub.

---

### M-04 — `requireRole` performs an uncached DB query on every admin request

**File:** `modules/auth/auth.middleware.ts`  
**Lines:** `44–65`

**Root cause:**  
Every admin-guarded request executes `prisma.user.findUnique({ include: { role: true } })` after the session lookup — two DB round-trips per request on high-frequency admin paths (order lists, dashboard polls). The role is effectively static per user.

**Fix:**  
Store the role name in the better-auth session payload (`customSession` / `additionalFields`) so `requireRole` can read `req.user.role` without a query, or add a short-TTL Redis cache keyed by `userId`.

---

### M-05 — Expired-reservation sweeper leaves zombie `PLACED` orders payable forever

**File:** `modules/orders/orders.service.ts`  
**Lines:** `292–347`

**Root cause:**  
`expireInventoryReservations` flips reservations to `EXPIRED` and returns stock, but never transitions the owning order — it remains `PLACED` / `paymentStatus=PENDING` indefinitely, and the Razorpay payment order remains callable. This is the exact mechanism that enables **H-01** above, and the admin order list accumulates zombie orders indistinguishable from live checkouts.

**Fix:**  
In the same sweep transaction, move orders whose reservations have all expired (and which have no successful payment) to `CANCELLED` with a status-history row, and mark their `PENDING` payment attempts `FAILED`.

---

### M-06 — Review image upload accepts client-controlled content-type and extension

**File:** `modules/upload/upload.controller.ts`  
**Lines:** `20–30`, `133–147`

**Root cause:**  
`uploadRawImageToR2` trusts `file.mimetype` (client-supplied; multer's `fileFilter` allowlist is trivially spoofed) and derives the object key extension from `file.originalname`. Unlike product uploads, review uploads are available to any authenticated customer. A non-image payload sent with `mimetype: image/png` and `filename: x.svg` is stored publicly on the R2 domain with a spoofed Content-Type, creating a stored XSS/content-injection vector.

**Fix:**  
Re-encode review images through Sharp (like `processAndUploadProductImage` does), and derive the extension and `Content-Type` from the Sharp output format — not from the client-supplied filename or mimetype.

---

### M-07 — Duplicated order-creation pipeline between `checkout.service` and `orders.service`

**File:** `modules/checkout/checkout.service.ts`  
**Lines:** `696–742`, `744–795`

**Root cause:**  
The order-creation logic in `createOrderAndPaymentInTx` is a near-verbatim duplicate of `orders.service.ts:createOrderInTx` (order number sequence, line items, reservations, status history). The two paths have already silently diverged (`costPriceAtPurchase` — see **H-03**) and will continue to diverge. `previewCheckoutFromCart` also calls `buildPreparedLineItems` twice (once for the hash source, once for the response).

**Fix:**  
Extract a single shared `createOrderCore(tx, input)` function consumed by both services. Compute prepared items once and pass to both consumers.

---

### M-08 — Serializable isolation used on read-only preview and webhook lookup transactions

**File:** `modules/checkout/checkout.service.ts` · `modules/payments/payments.service.ts`  
**Lines:** `checkout.service.ts:700–741`, `payments.service.ts:725–749`

**Root cause:**  
Preview checkout and webhook payment lookups wrap pure reads in `TX_OPTIONS` (Serializable isolation). Serializable read transactions take `SIReadLock`s in Postgres, materially increasing `P2034` serialization failure rates for the concurrent write transactions on the same rows (carts, variants, payments) — causing avoidable retries during peak checkout load.

**Fix:**  
Use plain (non-transactional or `ReadCommitted`) reads for preview and lookup paths. Reserve Serializable only for actual order-creation and payment-confirmation writes.

---

## LOW

### L-01 — Dead code: `getCartById` with no ownership check and unused single-row repository helpers

**File:** `modules/cart/cart.service.ts` · `modules/orders/orders.repository.ts`  
**Lines:** `cart.service.ts:41–45`, `orders.repository.ts:93–102`, `175–189`, `206–215`, `271–285`

**Root cause:**  
`getCartById` fetches any cart by numeric ID with no user/session ownership check — currently unrouted but an IDOR footgun if ever wired. `orders.repository.ts` exports `incrementVariantStockReserved`, `decrementVariantStockQuantity`, `updateInventoryReservationStatus`, `decrementVariantStockReservedSafe` — all superseded by their `*Bulk` variants and currently unused. `orders.service.ts` also imports `CART_STATUS` without using it.

**Fix:**  
Delete unused functions and the dead import. Add a `userId`/`sessionId` ownership predicate to `getCartById` before it is ever exposed via a route.

---

### L-02 — Magic-number status literals bypass named constants in repository queries

**File:** `modules/checkout/checkout.repository.ts` · `modules/payments/payments.repository.ts` · `modules/orders/orders.repository.ts`  
**Lines:** `checkout.repository.ts:7,92–95`, `payments.repository.ts:23,92–95`, `orders.repository.ts:26,135`

**Root cause:**  
Cart status (`0`/`1`), payment status (`1`), and reservation status (`0`/`1`) are hardcoded as integer literals in repository `where` clauses even though `CART_STATUS`, `PAYMENT_STATUS`, and `INVENTORY_RESERVATION_STATUS` constants exist in `orders.types.ts`. A renumbering or new status silently breaks these queries.

**Fix:**  
Import and use the named constants in all repository files.

---

### L-03 — `sendMail` discards the underlying SMTP error

**File:** `lib/mailer/mailer.ts`  
**Lines:** `21–28`

**Root cause:**  
The catch block logs and then throws `new Error("MAIL_SEND_FAILED")` without a `cause`. BullMQ job records and Sentry captures in `email.worker.ts` only ever show the generic message — hiding the actual SMTP failure (auth error, TLS, recipient rejection) from retry diagnostics.

**Fix:**  
```ts
throw new Error("MAIL_SEND_FAILED", { cause: error });
```

---

### L-04 — `uncaughtException` handler exits with code `0`; DB failure at boot is non-fatal

**File:** `server.ts`  
**Lines:** `44–53`, `68–72`

**Root cause:**  
`shutdown()` calls `process.exit(0)` on all paths. A crash from `uncaughtException` reports a clean exit to Docker/systemd — restart policies keyed on non-zero exit codes will not classify it as a failure. Separately, the startup DB connectivity check only logs on failure; the server continues accepting traffic against a dead database.

**Fix:**  
Accept an exit code argument in `shutdown(code: number)` — pass `0` for signals, `1` for `uncaughtException`. Make the boot DB check fail-fast (`process.exit(1)`) or gate the `/health` route on a live Prisma ping.

---

### L-05 — `BigInt.prototype.toJSON` monkey-patch is absent from worker entrypoints

**File:** `server.ts`  
**Lines:** `1–3`

**Root cause:**  
`BigInt.prototype.toJSON = function() { return this.toString(); }` is applied in `server.ts` but not in `email.worker.ts` or `inventory-reservation.worker.ts`. Serialization behaviour for `BigInt` values (structured logs, Sentry payloads, BullMQ job data) silently differs between the API process and workers.

**Fix:**  
Move the patch to a shared bootstrap module imported by all three entrypoints, or replace it with explicit `.toString()` at serialization sites (which the services mostly already do).

---

### L-06 — Cart item quantity has no upper bound; repeated adds accumulate unbounded integers

**File:** `modules/cart/cart.types.ts`  
**Lines:** `10–14`

**Root cause:**  
`addCartItem`/`updateCartItem` schemas validate `quantity` as `int().min(1)` with no upper bound. `upsertCartItem` also increments existing quantity without a cap. A client can set quantity to extremely large values; the checkout stock check rejects it later, but the cart accepts it — and repeated add-to-cart calls accumulate a value that can overflow a Postgres `integer` column on pathological input.

**Fix:**  
Add `.max(99)` (or a configurable constant) to both schemas and clamp the incremented total in `upsertCartItem`.

---

### L-07 — `moveWishlistItemToCart` swallows specific error codes and is non-atomic

**File:** `modules/wishlist/wishlist.service.ts`  
**Lines:** `76–93`

**Root cause:**  
The catch block matches any object with `status` + `message` — including `AppError` instances thrown by `addItemToCart` (e.g., `PRODUCT_VARIANT_NOT_FOUND`) — and re-throws them with the generic code `MOVE_TO_CART_FAILED`, discarding the specific machine-readable error code. Additionally, the cart insert and wishlist delete are separate operations: a failure after the cart insert leaves the item in both places.

**Fix:**  
Re-throw `AppError` instances unchanged:
```ts
if (err instanceof AppError) throw err;
```
Wrap the add + delete in `prisma.$transaction` if atomicity is required.

---

### L-08 — Review summary `refreshSummary` is fire-and-forget with no reconciliation and is prone to write races

**File:** `modules/reviews/reviews.service.ts`  
**Lines:** `103–108`, `181–190`, `233–238`

**Root cause:**  
`refreshSummary` after submit/moderate/delete is fire-and-forget. If it fails, the pre-aggregated `review_summaries` row stays stale indefinitely with no reconciliation job. Two concurrent refreshes can also interleave (compute A → compute B → write B → write A), leaving the older aggregate persisted.

**Fix:**  
Compute and upsert the aggregate in a single transaction with an `updatedAt`/version guard, or enqueue the refresh as a BullMQ job (deduped by `productId`) so concurrent triggers collapse into one.

---

## Summary Table

| ID | Severity | Title | Status |
|---|---|---|---|
| H-01 | HIGH | Late webhook + expired reservations → oversell + inventory drift | ✅ Fixed |
| H-02 | HIGH | `setImmediate` inside open Serializable TX → PDF missing, duplicate emails | ✅ Fixed |
| H-03 | HIGH | `costPriceAtPurchase` hardcoded to zero on all checkout orders | ✅ Fixed |
| H-04 | HIGH | `sortBy=price` sorts by variant count, not price | ✅ Fixed |
| H-05 | HIGH | Payout completion blanket-marks unrelated approved sales as PAID | ✅ Fixed |
| H-06 | HIGH | Preview token consumed before TX → failed TX strands checkout permanently | ✅ Fixed |
| M-01 | MEDIUM | Zod errors surface as HTTP 500 in products/address controllers | ✅ Fixed |
| M-02 | MEDIUM | TOCTOU race in `adminUpdateSaleStatus` → double earnings decrement | ✅ Fixed |
| M-03 | MEDIUM | Product-detail cache is in-process `Map` → stale across instances | ✅ Fixed |
| M-04 | MEDIUM | `requireRole` does uncached DB query on every admin request | ✅ Fixed |
| M-05 | MEDIUM | Expired reservations leave zombie `PLACED` orders payable forever | ✅ Fixed |
| M-06 | MEDIUM | Review image upload accepts client-controlled content-type/extension | ✅ Fixed |
| M-07 | MEDIUM | Duplicated order-creation pipeline → silent divergence (already: H-03) | ⏭ Deferred |
| M-08 | MEDIUM | Serializable isolation on read-only preview/webhook transactions | ✅ Fixed |
| L-01 | LOW | Dead code: `getCartById` (no auth check), unused repository helpers | ⏭ Deferred |
| L-02 | LOW | Magic-number status literals bypass named constants | ⏭ Deferred |
| L-03 | LOW | `sendMail` discards underlying SMTP error (no `cause`) | ✅ Fixed |
| L-04 | LOW | `uncaughtException` exits with code 0; DB boot failure is non-fatal | ✅ Fixed |
| L-05 | LOW | `BigInt.prototype.toJSON` patch absent from worker entrypoints | ✅ Fixed |
| L-06 | LOW | Cart item quantity has no max bound | ✅ Fixed |
| L-07 | LOW | `moveWishlistItemToCart` swallows error codes, non-atomic | ✅ Fixed |
| L-08 | LOW | Review summary refresh is fire-and-forget with write races | ✅ Fixed |

---

## Remediation Log

> Fixed: 2026-07-03 · Engineer: Sujal Kumar Ghosh  
> All commits on branch `main`, pushed to origin.

### H-01 — Late webhook + expired reservations ✅
**Commit:** `ac7ebb7`  
**Files:** `payments.service.ts`, `orders.repository.ts`  
After `confirmReservationsByOrder` (which only touches `ACTIVE` reservations), fetch all `EXPIRED` reservations for the order. For each, run an atomic conditional `UPDATE product_variants SET stock_reserved = stock_reserved + qty WHERE stock_quantity - stock_reserved >= qty RETURNING id`. If the row is returned, flip the reservation to `CONFIRMED`. If not (stock was resold), log a warning and write a status-history note for manual admin review. Payment confirmation still proceeds — the admin must resolve oversell manually.

### H-02 — `setImmediate` inside open Serializable TX ✅
**Commit:** `0d04fb3`  
**Files:** `payments.service.ts`  
Declared `let invoiceId = null as bigint | null` and `let emailCtx = null as ... | null` outside the `prisma.$transaction(...)` call. Inside the TX the values are set; outside (after the TX resolves) they are read. The `as` cast on initialization prevents TypeScript's closure-narrowing from collapsing the type to the literal `null`. PDF generation and order-confirmation email are now only triggered after commit, never on rollback.

### H-03 — `costPriceAtPurchase` hardcoded zero ✅
**Commit:** `0373838`  
**Files:** `checkout.service.ts`  
Added `costPrice: Prisma.Decimal | null` to `PreparedLineItem`. Updated both `buildPreparedLineItems` (cart path) and `buildBuyNowPreparedLineItem` (buy-now path) to carry `variant.costPrice` through. Replaced `costPriceAtPurchase: ZERO_DECIMAL` with `item.costPrice ?? ZERO_DECIMAL` when creating order items.

### H-04 — `sortBy=price` sorted by variant count ✅
**Commit:** `8bbf758`  
**Files:** `products.repository.ts`  
Prisma 7's `findMany` `orderBy` only exposes `_count` on to-many relations — not `_min`/`_max`. For the `price` sort path: fetch all matching product IDs with their variant prices (lightweight two-field select), sort by min variant price in JS, slice the page, then load the full page with `productFullInclude`. All other sort options retain DB-level `orderBy`.

### H-05 — Payout blanket-marks unrelated APPROVED sales ✅
**Commit:** `5c1e486`  
**Files:** `influencers.service.ts`  
Two changes:  
1. `adminRecordPayout`: added check for existing `INITIATED` payout — rejects with `PAYOUT_ALREADY_INITIATED` if one exists, preventing double-payout.  
2. `adminUpdatePayoutStatus` COMPLETED path: changed the `updateMany` filter from `status: "APPROVED"` to `status: "APPROVED", createdAt: { lte: payout.createdAt }` — only marks sales that existed at payout creation time; post-initiation sales roll into the next cycle.

### H-06 — Preview token consumed before order TX ✅
**Commit:** `b322881`  
**Files:** `checkout.service.ts`  
Added `restorePreviewToken(token, record)` which writes the record back to Redis with `consumedAt: null` (if TTL still has time remaining). Wrapped the order-creation `prisma.$transaction(...)` call in a try/catch: on any TX failure, `restorePreviewToken` is called before re-throwing, allowing the client to retry with the same preview token without restarting checkout from scratch.

### M-01 — Zod errors surface as HTTP 500 ✅
**Commit:** `cf2d98f`  
**Files:** `products.controller.ts`, `address.service.ts`  
Products controller: added `import { ZodError } from "zod"` and a `ZodError` branch to the local `handleError` function, returning `400 VALIDATION_ERROR` with `err.issues`. Address service: replaced two plain object `throw { status, message }` calls with `throw new AppError(...)` so they reach `globalErrorHandler` correctly.

### M-02 — TOCTOU race in `adminUpdateSaleStatus` ✅
**Commit:** `8230230`  
**Files:** `influencers.service.ts`  
Moved the `findUnique` status read inside the transaction. Added `isolationLevel: Prisma.TransactionIsolationLevel.Serializable` so concurrent status transitions get a P2034 (only one succeeds, the other retries). Also fixed the decrement: only fires for `APPROVED → CANCELLED`, not `PENDING → CANCELLED` (PENDING sales never had earnings incremented).

### M-03 — Product-detail cache in-process Map ✅
**Commit:** `55228cf`  
**Files:** `lib/cache/product-detail.cache.ts`  
Replaced the in-process `Map<string, CacheEntry>` with Redis `GET`/`SET EX`/`DEL` using the existing `redisClient` singleton. The public API (`getCachedJson`, `setCachedJson`, `deleteCachedKey`, `buildProductDetailCacheKey`) is unchanged — no callers modified.

### M-04 — `requireRole` uncached DB query per request ✅
**Commit:** `66dfb20`  
**Files:** `auth.middleware.ts`  
Added a module-level `Map<userId, { roleName, expiresAt }>` with a 60-second TTL. `requireRole` checks the cache first; on miss it hits the DB and writes back. Admin role changes take effect within 60 seconds. Cache is per-process (not shared across instances), but role changes are rare and the staleness window is acceptable.

### M-05 — Zombie PLACED orders after reservation expiry ✅
**Commit:** `ff78e29`  
**Files:** `orders.service.ts`, `orders.repository.ts`  
Added `orderId: true` to `findExpiredReservationsBatch` select. After `decrementVariantStockReservedSafeBulk`, collect the unique order IDs from the batch and run `tx.order.updateMany({ where: { id: { in: uniqueOrderIds }, orderStatus: ORDER_STATUS.PLACED, inventoryReservations: { none: { status: ACTIVE } } }, data: { orderStatus: CANCELLED } })`. The `none` filter preserves multi-item orders that still have live reservations.

### M-06 — Review images uploaded raw without sanitization ✅
**Commit:** `fa7db65`  
**Files:** `upload.controller.ts`  
Added `processAndUploadReviewImage`: runs the upload through `sharp().rotate().resize(1200, 1200, { fit: inside }).webp({ quality: 82 }).toBuffer()`, then uploads with `Content-Type: image/webp` and a UUID key. Eliminates EXIF data, normalizes dimensions and format, and removes the client-controlled content-type/extension vector.

### M-07 — Duplicated order-creation pipeline ⏭
**Status:** Deferred — requires refactoring without test coverage.  
The most dangerous divergence (H-03, zero cost price) was fixed independently. The two pipelines differ structurally: `createOrderInTx` fetches cart from DB; `createOrderAndPaymentInTx` receives pre-built line items from the preview phase. Safe deduplication requires extracting a shared `buildOrderPayload` layer and end-to-end tests. Track as tech debt.

### M-08 — Serializable isolation on read-only TXs ✅
**Commit:** `d8cdaca`  
**Files:** `checkout.service.ts`  
Added `const READ_TX_OPTIONS = {}` (ReadCommitted, the Postgres default). Applied it to `previewCheckoutFromCart`, `previewCheckoutBuyNow`, and the `hashPayloadSource` re-validation TX inside `confirmCheckoutByFlow` — all are pure DB reads. Write TXs (`createOrderAndPaymentInTx`) retain `TX_OPTIONS` (Serializable).

### L-01 — Dead code / missing auth check ⏭
**Status:** Deferred — requires audit of callers before deletion.

### L-02 — Magic-number status literals ⏭
**Status:** Deferred — cosmetic; constants already exist and are used in service layer. Low regression risk.

### L-03 — `sendMail` discards SMTP error cause ✅
**Commit:** `9b8498d`  
**Files:** `lib/mailer/mailer.ts`  
Changed `throw new Error("MAIL_SEND_FAILED")` to `throw new Error("MAIL_SEND_FAILED", { cause: error })`.

### L-04 — `uncaughtException` exits with code 0 ✅
**Commit:** `9b8498d`  
**Files:** `server.ts`  
Added optional `exitCode = 0` parameter to `shutdown()`. Changed `shutdown("uncaughtException")` call to `shutdown("uncaughtException", 1)`. SIGINT/SIGTERM callers unchanged (code 0).

### L-05 — `BigInt.toJSON` absent from workers ✅
**Commit:** `9b8498d`  
**Files:** `jobs/email/email.worker.ts`, `jobs/orders/inventory-reservation.worker.ts`  
Added `(BigInt.prototype as any).toJSON = function () { return this.toString(); }` as the first statement in both worker entrypoints, matching the patch already in `server.ts`.

### L-06 — Cart quantity unbounded ✅
**Commit:** `ad0e740`  
**Files:** `modules/cart/cart.types.ts`  
Added `.max(100, "Quantity cannot exceed 100")` to both `addCartItemSchema` and `updateCartItemSchema`.

### L-07 — `moveWishlistItemToCart` swallows error codes ✅
**Commit:** `ad0e740`  
**Files:** `modules/wishlist/wishlist.service.ts`  
Replaced the plain-object instanceof check with `if (err instanceof AppError) throw err` — original code and status pass through. Unknown errors re-throw as `AppError(500, ..., "MOVE_TO_CART_FAILED")`.

### L-08 — Review summary write race ✅
**Commit:** `fa7db65`  
**Files:** `reviews.service.ts`, `reviews.repository.ts`  
Added `conditionalUpsertReviewSummary(productId, data, startedAt)` using a raw SQL `INSERT ... ON CONFLICT DO UPDATE ... WHERE updated_at < $startedAt`. `refreshSummary` captures `const startedAt = new Date()` before `computeReviewAggregates` and passes it to the conditional upsert. A slower concurrent refresh cannot overwrite fresher data.
