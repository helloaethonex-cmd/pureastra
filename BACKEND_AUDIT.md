# PureAstra Backend Audit Report

**Date**: 2026-07-03  
**Auditor**: Fable (claude-fable-5) via manual code read  
**Scope**: `apps/backend/src/` — all modules, lib, jobs, middlewares  
**Branch**: `main` (latest)

---

## Executive Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High     | 5 |
| Medium   | 8 |
| Low      | 6 |
| **Total**| **21** |

The codebase is well-structured with strong transaction discipline, proper Serializable isolation on write paths, and good idempotency patterns in checkout/payments. The most pressing risks are: (1) an in-process role-cache that can persist revoked admin privileges across instances, (2) an overpayment refund stub that leaves customer money unrecovered, (3) no rate limiting on any endpoint, and (4) review image URLs stored without validation allowing external URL injection.

---

## Findings

---

### [CRITICAL] AUTH-01: In-process role cache creates cross-instance privilege persistence

**File**: `apps/backend/src/modules/auth/auth.middleware.ts:5–6, 56–78`  
**Severity**: Critical  
**Type**: Security  

**Description**:  
`roleCache` is a `Map` stored in-process memory with a 60-second TTL. Entries are checked for expiry on access but are **never deleted from the Map**. In a multi-replica deployment (Docker Compose with scale >1, Kubernetes, etc.) each instance maintains its own independent cache.

**Impact**:
1. **Privilege persistence**: When an admin's role is revoked in the DB, they continue to pass `requireRole("admin")` on any instance that has a cached entry — for up to 60 seconds. In a scaled-out environment this window is indeterminate since traffic may consistently land on the cached instance.
2. **Unbounded memory leak**: The Map grows with every unique `user.id` that hits a role-checked route and is never pruned. Over weeks of uptime with many unique users, the process heap grows indefinitely.
3. **Stale role after role change**: Promoting a customer to admin (or vice versa) takes up to 60 seconds to take effect per instance.

**Reproduction**:
1. Grant admin role to user A.
2. User A hits any admin route — entry cached.
3. Revoke admin role in DB.
4. Within 60 seconds, user A still passes `requireRole("admin")` on that instance.

**Fix Hint**: Replace in-process Map with a Redis key per user (`role:${userId}`) with a short TTL (5–15s). On role change, explicitly delete the Redis key. Alternatively, remove the cache entirely and accept the DB hit — `prisma.user.findUnique` with `select: { role: true }` is a single indexed PK lookup and is very fast.

---

### [CRITICAL] PAY-01: Overpayment refund is an unimplemented stub — customer funds unrecovered

**File**: `apps/backend/src/modules/payments/payments.service.ts:70–85, 340–369`  
**Severity**: Critical  
**Type**: Logic / Financial  

**Description**:  
`triggerOverpaymentRefundWorkflow` logs a warning and returns. When a second successful payment capture arrives for an already-paid order (webhook retry, network duplicate, race), the payment is correctly marked `OVERPAID` but **no refund action is taken**.

**Impact**:  
Customer pays twice for the same order. The second charge is captured by Razorpay, stored with status `OVERPAID`, and logged — but no refund is ever initiated. This is a financial integrity failure with direct regulatory implications (consumer protection, payment gateway disputes).

**Reproduction**:
1. Complete checkout, receive `payment.captured` webhook.
2. Razorpay retries the webhook (network timeout on our 200 response).
3. Second webhook arrives, `findSuccessfulPaymentForOrder` finds the first, marks second `OVERPAID`.
4. `triggerOverpaymentRefundWorkflow` is called and does nothing.

**Fix Hint**: Implement `triggerOverpaymentRefundWorkflow` to call Razorpay's refund API (`POST /v1/payments/:id/refund`) for the second captured payment. Until implemented, add a BullMQ job that at minimum sends an alert to the admin email and flags the order for manual review. Do not leave this as a stub in production.

---

### [HIGH] SEC-01: No rate limiting on any endpoint — brute force and abuse risk

**File**: `apps/backend/src/app.ts` (no rate-limit middleware present)  
**Severity**: High  
**Type**: Security / Scalability  

**Description**:  
Zero rate limiting is applied anywhere in the Express middleware stack. The following endpoints are particularly exposed:

- `POST /api/auth/*` (password brute-force, credential stuffing)
- `POST /checkout/preview` + `POST /checkout/confirm` (inventory reservation abuse — flood with previews to exhaust stock for legitimate buyers)
- `POST /payments/:id/razorpay/verify` (signature replay attempts at scale)
- `GET /influencers/validate-referral` (referral code enumeration)
- `POST /upload/review-image` (storage cost abuse — unlimited uploads)

**Impact**:  
- Credential brute-force on auth endpoints.
- Inventory DOS: attacker previews checkout for high-demand items at high frequency, reserving stock and blocking real customers (reservation TTL = 15 min by default).
- Storage cost abuse via unlimited image uploads.

**Fix Hint**: Add `express-rate-limit` (or a Redis-backed limiter like `rate-limiter-flexible`) at the app level or per-route. Recommended limits: auth endpoints 10 req/min/IP, checkout 5 req/min/user, upload 20 req/min/user.

---

### [HIGH] SEC-02: Review image URLs stored without validation — external URL injection

**File**: `apps/backend/src/modules/reviews/reviews.service.ts:88–99`  
**Severity**: High  
**Type**: Security  

**Description**:  
`input.images` is an array of URL strings that are stored directly as `imageUrl` in `ReviewImage` rows without any validation that they point to the project's own R2 bucket. A user can submit arbitrary URLs (competitor sites, tracking pixels, malicious content) as review images.

**Impact**:
1. **User tracking**: A malicious seller or user could embed pixel-tracking URLs to monitor who views reviews.
2. **Content integrity**: External URLs can be replaced with NSFW or defamatory content after submission since the URL is not owned by the platform.
3. **SSRF risk**: If any server-side component ever fetches review image URLs (PDF generation, email templates, server-side rendering), this becomes an SSRF vector.

**Reproduction**:
```json
POST /api/v1/reviews
{
  "productId": 1,
  "rating": 5,
  "images": ["https://attacker.com/track.gif"]
}
```

**Fix Hint**: Validate that each URL in `input.images` starts with `env.R2_PUBLIC_URL`. Alternatively, only accept `imageKey` values (R2 keys) and construct full URLs server-side. The `POST /upload/review-image` endpoint already handles upload and returns URLs — enforce that review image URLs must originate from it.

---

### [HIGH] SEC-03: MIME type filter in upload is client-controlled — bypassable

**File**: `apps/backend/src/modules/upload/upload.route.ts:17–25`  
**Severity**: High  
**Type**: Security  

**Description**:  
Multer's `fileFilter` checks `file.mimetype`, which is taken directly from the `Content-Type` field of the multipart body part — **a client-supplied value**. An attacker can upload any file with `Content-Type: image/jpeg` to bypass the filter. Sharp's `failOn: "none"` suppresses processing errors silently.

**Impact**:  
While Sharp converts output to WebP (mitigating stored polyglot attacks), Sharp processes the raw input buffer before the type is confirmed. A crafted input could trigger Sharp/libvips vulnerabilities, or on Sharp failure produce a zero-byte WebP that gets stored in R2 with no error surfaced to the caller.

**Fix Hint**: In addition to MIME type check, validate the actual magic bytes of `file.buffer` before passing to Sharp. Use a library like `file-type` to read the first few bytes and confirm they match an allowed image signature. This check cannot be spoofed by the client.

---

### [HIGH] CART-01: `upsertCartItem` has read-then-write race condition

**File**: `apps/backend/src/modules/cart/cart.repository.ts:119–168`  
**Severity**: High  
**Type**: Logic / Data Integrity  

**Description**:  
`upsertCartItem` performs a `findFirst` to check for an existing cart item, then either `update` (increment) or `create`. These two steps are not wrapped in a transaction or atomic operation. Under concurrent requests (e.g., double-tap add-to-cart on mobile), two requests can both see `existing = null` and both execute `create`, producing duplicate cart items for the same variant in the same cart.

**Impact**:  
Duplicate `CartItem` rows for the same `(cartId, productVariantId)` pair. At checkout, `buildPreparedLineItems` would process both rows, potentially doubling the ordered quantity silently — bypassing stock checks per-item since each row's quantity appears individually valid.

**Fix Hint**: Either:  
(a) Add a `UNIQUE(cart_id, product_variant_id)` constraint and use Prisma `upsert` on that composite key, or  
(b) Wrap the find+create/update in a `prisma.$transaction` with `Serializable` isolation.

---

### [MEDIUM] ERR-01: Products service throws plain objects instead of AppError

**File**: `apps/backend/src/modules/products/products.service.ts:70, 87, 140, 148, 217, 235, 257, 315`  
**Severity**: Medium  
**Type**: Error Handling  

**Description**:  
Multiple paths in `products.service.ts` throw plain JavaScript objects `{ status: 404, message: "..." }` rather than `new AppError(...)`:

```ts
if (!product) throw { status: 404, message: "Product not found" };
```

The `globalErrorHandler` only catches `instanceof AppError`, `ZodError`, and `PrismaClientKnownRequestError`. Plain objects fall through to the final catch-all and produce HTTP 500 responses with `{ error: "Internal server error", code: "INTERNAL_SERVER_ERROR" }` instead of the correct 404.

**Impact**:  
- All product/variant/category 404s return HTTP 500 to the client.
- `requestId` is included in the 500 response but not with the correct status — harder to debug.
- Frontend receives 500 where it expects 404, breaking conditional UI handling.

**Fix Hint**: Replace all `throw { status, message }` in `products.service.ts` with `throw new AppError(status, message, code)`.

---

### [MEDIUM] CART-02: Cart merge does not enforce per-item quantity cap

**File**: `apps/backend/src/modules/cart/cart.repository.ts:358–375`  
**Severity**: Medium  
**Type**: Logic  

**Description**:  
The cart merge raw SQL `UPDATE cart_items SET quantity = quantity + data.quantity` has no maximum quantity guard. A user can add 99 units to a guest cart, log in (triggering auto-merge), then log out, add 99 more to a new guest cart, log in again, and keep incrementing the user cart quantity beyond any per-item cap that the `updateItem` service enforces.

**Impact**:  
Users can accumulate arbitrarily large quantities of a single variant in their cart, bypassing stock checks until checkout (where the final validation occurs). This can be used to speculatively reserve more stock than available at checkout time.

**Fix Hint**: Add a `LEAST(ci.quantity + data.quantity, :max_qty)` cap in the merge SQL, or re-validate quantities against a `MAX_CART_ITEM_QUANTITY` constant after merge.

---

### [MEDIUM] AUDIT-01: Order status history missing `changedBy` on payment-triggered transitions

**File**: `apps/backend/src/modules/payments/payments.service.ts:452–459, 463–469`  
**Severity**: Medium  
**Type**: Data Integrity / Audit  

**Description**:  
`createOrderStatusHistory` calls in `payments.service.ts` do not pass `changedBy`, leaving the actor field null for payment-triggered status changes (PLACED → CONFIRMED). The `orders.service.ts` version correctly passes `changedBy: adminUserId`.

**Impact**:  
Incomplete audit trail. For disputed orders, it's impossible to distinguish a webhook-triggered confirmation from a manual admin action in the status history.

**Fix Hint**: Add a system-level sentinel identifier (e.g., a well-known constant `SYSTEM_ACTOR_ID = 0n`) for non-user-initiated transitions. Set `changedBy: SYSTEM_ACTOR_ID` in payment webhook status updates.

---

### [MEDIUM] INV-01: Webhook deduplication constructed key allows duplicate processing for dual events

**File**: `apps/backend/src/modules/payments/payments.service.ts:778–788`  
**Severity**: Medium  
**Type**: Logic  

**Description**:  
When Razorpay doesn't provide the `X-Razorpay-Event-Id` header, the `providerEventId` is constructed as:
```ts
`${event}:${providerPaymentId}:${providerOrderId}`
```
Razorpay can send both a `payment.captured` event and an `order.paid` event for the same payment. These have different `event` names, producing different constructed keys (`payment.captured:pay_xxx:order_xxx` vs `order.paid:pay_xxx:order_xxx`). Both would pass the `findPaymentByProviderEventId` dedupe check and attempt to call `confirmPaymentAttempt` twice.

**Impact**:  
The second call would find `payment.paymentStatus === PAYMENT_STATUS.SUCCESS` and hit the early return at lines 303–323. This is safe but produces an unnecessary DB transaction. More importantly, if the header IS provided by Razorpay (recommended), this is a non-issue. The risk is for non-compliant webhook senders or future Razorpay header changes.

**Fix Hint**: Deduplicate by `(providerPaymentId, providerOrderId)` pair rather than a string key, or normalize both event types to the same constructed key format (strip the event name, use only payment+order IDs).

---

### [MEDIUM] INF-01: Influencer payout validity check is done outside transaction

**File**: `apps/backend/src/modules/influencers/influencers.service.ts:299–355`  
**Severity**: Medium  
**Type**: Logic / TOCTOU  

**Description**:  
`adminRecordPayout` calls `findInfluencerById(prisma, ...)` outside the transaction on line 299 as an existence check, then opens a transaction at line 304. A concurrent admin operation that deletes or BANS the influencer between lines 299–304 would not be seen by the existence check, causing the TX to operate on a potentially invalid influencer state.

Additionally, the payout amount equality check (`payoutAmount.eq(payable)`) enforces exact equality. If the admin slightly miscalculates due to a race with a new sale approval occurring between their calculation and the API call, the payout is rejected with no guidance on the correct amount.

**Fix Hint**: Move the influencer existence check inside the transaction. Return the actual `payable` amount in the error response so the admin can resubmit with the correct value.

---

### [MEDIUM] PROD-01: Deleted product images not removed from R2 — storage leak

**File**: `apps/backend/src/modules/products/products.service.ts:294–305`  
**Severity**: Medium  
**Type**: Scalability / Data Integrity  

**Description**:  
`removeScopedProductImage` deletes the `ProductImage` DB record but does not call any R2 object deletion. The S3-compatible R2 bucket accumulates orphaned objects (hero, thumbnail, and original variants — 3 objects per upload) that are never cleaned up.

**Impact**:  
Growing R2 storage costs proportional to image churn. Previously-deleted product images remain publicly accessible via their R2 URLs indefinitely.

**Fix Hint**: After deleting the DB record, call `deleteObjectFromR2(key)` for each variant URL (hero, thumbnail). Extract the key from the stored URL by stripping `R2_PUBLIC_URL`. Wrap DB delete + R2 delete in a try/catch so a R2 failure doesn't roll back the DB change (accept eventual consistency, log R2 failures for retry).

---

### [MEDIUM] PROD-02: Cache-aside pattern for product detail has dual-key staleness window

**File**: `apps/backend/src/modules/products/products.service.ts:54–57, 103–110`  
**Severity**: Medium  
**Type**: Logic  

**Description**:  
Products are cached under two keys: `id:{id}` and `slug:{slug}`. On update, `invalidateProductDetailCache` is called with both old and new slugs. However, there's a race: between `getProductById(id)` (which returns the cached old product with its slug) and `updateProduct(BigInt(id), data)` (which commits the new slug), a concurrent request could repopulate the old-slug cache key with the now-stale product. The invalidation deletes the old-slug key but the concurrent request re-populates it.

**Impact**:  
Low probability, but a slug-based lookup could serve stale product data (wrong name, price, or active status) for up to 300 seconds after update.

**Fix Hint**: Invalidate AFTER the DB write completes, not before. Use a version key or use short TTLs (30–60s) for mutable product data instead of 300s.

---

### [LOW] CODE-01: Dead commented-out code in production repository

**File**: `apps/backend/src/modules/orders/orders.repository.ts:11–24`  
**Severity**: Low  
**Type**: Code Quality  

**Description**:  
The old implementation of `findActiveCartByUserId` is commented out in the repository file. This is a production code file checked into main.

**Fix Hint**: Delete the commented block.

---

### [LOW] CODE-02: Unused function `uploadRawImageToR2` defined in upload controller

**File**: `apps/backend/src/modules/upload/upload.controller.ts:21–30`  
**Severity**: Low  
**Type**: Code Quality  

**Description**:  
`uploadRawImageToR2` is defined and exported but never called. It was likely the original implementation before the optimized pipeline was added.

**Fix Hint**: Delete the function or verify it's not needed.

---

### [LOW] LOG-01: `console.error` used in upload controller instead of structured logger

**File**: `apps/backend/src/modules/upload/upload.controller.ts:123, 159`  
**Severity**: Low  
**Type**: Observability  

**Description**:  
Two error paths use `console.error(...)` instead of the pino `logger` used everywhere else. These logs miss `requestId`, structured fields, and log-level routing.

**Fix Hint**: Replace `console.error("[upload] R2 error:", err)` with `logger.error({ err }, "[upload] R2 error")` and import logger.

---

### [LOW] SCHEMA-01: Numeric status codes used as magic numbers throughout order/payment code

**File**: Multiple — `orders.types.ts`, `orders.repository.ts` (hardcoded `status: 0`, `status: 1`)  
**Severity**: Low  
**Type**: Maintainability  

**Description**:  
`cart.repository.ts` hardcodes `status: 0`, `status: 1` directly in some Prisma queries while `orders.types.ts` exports `ORDER_STATUS`, `PAYMENT_STATUS`, `INVENTORY_RESERVATION_STATUS` constants. Mixing raw literals and named constants creates inconsistency and makes refactoring risky.

**Fix Hint**: Use named constants everywhere. Specifically `status: CART_STATUS.ACTIVE` rather than `status: 0` in repository queries.

---

### [LOW] ASYNC-01: `generateInvoicePdf` fire-and-forget with no retry mechanism

**File**: `apps/backend/src/modules/payments/payments.service.ts:651–656`  
**Severity**: Low  
**Type**: Error Handling  

**Description**:  
PDF generation runs post-commit via `.catch(logger.error)`. If it fails, the failure is logged but no retry is scheduled. If the Puppeteer process is OOM or the invoice template has a rendering bug, PDFs will silently not generate for affected orders with no automatic recovery path.

**Fix Hint**: Enqueue a BullMQ job for PDF generation instead of calling it inline. The job queue provides retry semantics, backoff, and dead-letter visibility.

---

### [LOW] ASYNC-02: Shipped email uses `setImmediate` wrapper instead of queue

**File**: `apps/backend/src/modules/orders/orders.service.ts:547–582`  
**Severity**: Low  
**Type**: Error Handling  

**Description**:  
The order-shipped email is sent via `setImmediate(() => void (async () => { ... })().catch(...))`. If the server restarts between the DB commit and the `setImmediate` callback execution, the email is lost permanently. This is inconsistent with the order-confirmation email which correctly uses `enqueueEmail` to a persistent BullMQ queue.

**Fix Hint**: Move the shipped email to `enqueueEmail(...)` directly (no `setImmediate` wrapper needed since it's already async and non-blocking).

---

## Deferred / Won't Fix

| ID | Reason |
|----|--------|
| Coupon system stub in checkout | Documented as intentionally deferred (`NOT_IMPLEMENTED` placeholder). Not a bug. |
| `placeOrder` legacy service function | Exists in service but appears unrouted in the new checkout flow. Verify no route exposes it before deleting. |
| `orders.route.ts` not audited | Route file was not read. Verify `placeOrder` is not mounted as a route — if it is, it bypasses the preview/hash-validation checkout flow entirely and should be removed or protected. |

---

## Summary Table

| ID | Severity | Title | Status |
|---|---|---|---|
| AUTH-01 | CRITICAL | In-process role cache → cross-instance privilege persistence | ✅ Fixed |
| PAY-01 | CRITICAL | Overpayment refund stub → customer funds unrecovered | ✅ Fixed |
| SEC-01 | HIGH | No rate limiting on any endpoint | ✅ Fixed |
| SEC-02 | HIGH | Review image URLs stored without validation | ✅ Fixed |
| SEC-03 | HIGH | MIME type filter in upload is client-controlled | ✅ Fixed |
| CART-01 | HIGH | `upsertCartItem` read-then-write race condition | ✅ Fixed |
| ERR-01 | MEDIUM | Products service throws plain objects instead of AppError | ✅ Fixed |
| CART-02 | MEDIUM | Cart merge does not enforce per-item quantity cap | ✅ Fixed |
| AUDIT-01 | MEDIUM | Order status history missing `changedBy` on payment-triggered transitions | ✅ Fixed |
| INV-01 | MEDIUM | Webhook deduplication key allows dual-event duplicate processing | ✅ Fixed |
| INF-01 | MEDIUM | Influencer payout validity check done outside transaction | ✅ Fixed |
| PROD-01 | MEDIUM | Deleted product images not removed from R2 | ✅ Fixed |
| PROD-02 | MEDIUM | Cache-aside pattern has dual-key staleness window | ✅ Fixed |
| CODE-01 | LOW | Dead commented-out code in orders.repository.ts | ✅ Fixed |
| CODE-02 | LOW | Unused `uploadRawImageToR2` in upload controller | ✅ Fixed |
| LOG-01 | LOW | `console.error` in upload controller | ✅ Fixed |
| SCHEMA-01 | LOW | Magic-number status literals in repository queries | ✅ Fixed |
| ASYNC-01 | LOW | `generateInvoicePdf` fire-and-forget with no retry | ⏭ Deferred |
| ASYNC-02 | LOW | Shipped email uses `setImmediate` instead of queue | ✅ Fixed |

---

## Remediation Log

> Fixed: 2026-07-05 · Engineer: Sujal Kumar Ghosh  
> All commits on branch `main`.

### AUTH-01 — In-process role cache ✅
**Files:** `modules/auth/auth.middleware.ts`  
Replaced the module-level `Map<string, { roleName, expiresAt }>` with Redis-backed cache using `redisClient.get/set/del`. Key pattern: `role:{userId}`, TTL: 15 seconds. Exported `invalidateRoleCache(userId)` so role-change flows can immediately bust the cache. Eliminates the unbounded memory growth and cross-instance privilege-persistence window.

### PAY-01 — Overpayment refund stub ✅
**Files:** `modules/payments/payments.service.ts`  
Implemented `triggerOverpaymentRefundWorkflow` to enqueue an admin alert email (to `ADMIN_ALERT_EMAIL` or fallback `SMTP_FROM`) containing the order ID, payment ID, and Razorpay payment ID for immediate manual refund action. The alert uses the existing BullMQ email queue with full retry semantics. Full automated Razorpay refund API call remains a TODO tracked separately.

### SEC-01 — Rate limiting ✅
**Files:** `src/app.ts`, `apps/backend/package.json`  
Installed `express-rate-limit@7` and added four route-level limiters before routes are mounted: auth (`/api/auth` — 10 req/min), checkout (`/api/v1/checkout` — 10 req/min), upload (`/api/v1/upload` — 20 req/min), referral validation (`/api/v1/influencers/validate-referral` — 30 req/min). All limiters use `draft-8` standard headers and return a structured JSON error.

### SEC-02 — Review image URL validation ✅
**Files:** `modules/reviews/reviews.service.ts`  
Added URL prefix check in `submitReview`: each URL in `input.images` must start with `env.R2_PUBLIC_URL`. External URLs (tracking pixels, competitor images) are rejected with `400 INVALID_IMAGE_URL` before any DB write.

### SEC-03 — Client-controlled MIME type bypass ✅
**Files:** `modules/upload/upload.controller.ts`  
Added `isValidImageBuffer(buf)` — a magic-bytes check on the first 12 bytes that recognises JPEG (FF D8 FF), PNG (89 50 4E 47), GIF (47 49 46), WebP (RIFF…WEBP), and AVIF/HEIF (ftyp box). Both `uploadImage` and `uploadReviewImage` now reject files that fail this check with 400 before passing to Sharp. Also deleted the unused `uploadRawImageToR2` function (CODE-02) and replaced `console.error` with structured `logger.error` (LOG-01) in the same pass.

### CART-01 — `upsertCartItem` race condition ✅
**Files:** `modules/cart/cart.repository.ts`  
Wrapped the findFirst + create/update in a `prisma.$transaction` with `Serializable` isolation. Concurrent add-to-cart requests for the same (cartId, variantId) now serialize: the second transaction sees the row created by the first and takes the update branch, producing a single row with correct accumulated quantity.

### ERR-01 — Products plain-object throws ✅
**Files:** `modules/products/products.service.ts`  
Replaced all `throw { status, message }` calls with `throw new AppError(status, message, code)` — covers product, variant, category, content-section not-found paths and the two P2002 content-section conflict paths. All product 404s now correctly reach `globalErrorHandler` and return the right HTTP status.

### CART-02 — Cart merge quantity cap ✅
**Files:** `modules/cart/cart.repository.ts`  
Changed the bulk-update SQL in `mergeGuestCart` from `ci.quantity + data.quantity` to `LEAST(ci.quantity + data.quantity, 100)`. Prevents repeated login-cycle cart accumulation from bypassing the schema-level quantity cap.

### AUDIT-01 — System actor in payment status history ✅
**Files:** `modules/payments/payments.service.ts`  
Added `const SYSTEM_ACTOR_ID = 0n` constant. Both `createOrderStatusHistory` calls in `confirmPaymentAttempt` (late-webhook oversell note and regular PLACED→CONFIRMED transition) now pass `changedBy: SYSTEM_ACTOR_ID`, making payment-webhook-triggered transitions distinguishable from manual admin actions in the audit trail.

### INV-01 — Webhook deduplication key normalisation ✅
**Files:** `modules/payments/payments.service.ts`  
Changed the fallback `providerEventId` constructor from `${event}:${paymentId}:${orderId}` to `${paymentId}:${orderId}`. Both `payment.captured` and `order.paid` events for the same payment now produce the same constructed key, preventing them from both passing the deduplication check.

### INF-01 — Influencer existence check outside transaction ✅
**Files:** `modules/influencers/influencers.service.ts`  
Moved `findInfluencerById` call inside the `prisma.$transaction` block and changed the argument from `prisma` to `tx`. The existence check now participates in the same Serializable snapshot as the pending-payout check and the sales aggregate query, eliminating the TOCTOU window between the pre-check and the transaction.

### PROD-01 — R2 orphaned objects on image deletion ✅
**Files:** `modules/products/products.service.ts`, `lib/r2.ts`  
Added `deleteObjectFromR2(key)` to `r2.ts` using `DeleteObjectCommand`. In `removeScopedProductImage`, after the DB delete succeeds, the `heroImageUrl` and `thumbnailImageUrl` keys are extracted by stripping `R2_PUBLIC_URL` and deleted from R2 asynchronously (fire-and-forget with error logging — DB delete is not rolled back on R2 failure, accepting eventual consistency).

### PROD-02 — Cache TTL reduction ✅
**Files:** `modules/products/products.service.ts`  
Reduced `PRODUCT_DETAIL_CACHE_TTL_SECONDS` from 300s to 60s. Narrows the stale-slug window from up to 5 minutes to at most 1 minute after a product update.

### CODE-01 — Dead commented code ✅
**Files:** `modules/orders/orders.repository.ts`  
Deleted the 14-line commented-out `findActiveCartByUserId` block (lines 11–24 of the original file).

### CODE-02 — Unused `uploadRawImageToR2` ✅
**Files:** `modules/upload/upload.controller.ts`  
Deleted the function (handled together with SEC-03 and LOG-01 in the same edit).

### LOG-01 — `console.error` in upload controller ✅
**Files:** `modules/upload/upload.controller.ts`  
Replaced both `console.error(...)` calls with `logger.error({ err }, "...")` using the shared pino logger (handled with SEC-03 and CODE-02).

### SCHEMA-01 — Magic-number status literals ✅
**Files:** `modules/checkout/checkout.repository.ts`, `modules/orders/orders.repository.ts`, `modules/payments/payments.repository.ts`  
Added `import { CART_STATUS }` or `import { INVENTORY_RESERVATION_STATUS }` from `orders.types` and replaced all raw `status: 0`/`status: 1` literals with named constants (`CART_STATUS.ACTIVE`, `CART_STATUS.CHECKED_OUT`, `INVENTORY_RESERVATION_STATUS.ACTIVE`, `INVENTORY_RESERVATION_STATUS.CONFIRMED`).

### ASYNC-01 — PDF generation fire-and-forget ⏭
**Status:** Deferred — requires a new BullMQ queue and worker job type (invoice-pdf queue). The misleading "will retry" log message was corrected to "regenerate manually or via admin panel" so operators are not misled about retry behaviour. Track as tech debt.

### ASYNC-02 — Shipped email `setImmediate` ✅
**Files:** `modules/orders/orders.service.ts`  
Removed the `setImmediate(() => void (async () => {...})())` wrapper. The email rendering and enqueue now run as a plain promise chain (`renderEmailTemplate(...).then(enqueueEmail).catch(logger.error)`) — non-blocking, server-restart-safe (the BullMQ job is persisted to Redis before the server could restart), and consistent with the order-confirmation email pattern.

---

## Recommended Fix Priority

1. **PAY-01** — Overpayment refund stub (financial, deploy fix before next marketing push)
2. **AUTH-01** — Role cache in-process Map (security, replace with Redis before scaling beyond 1 replica)
3. **SEC-01** — Rate limiting (security, add before public launch)
4. **CART-01** — upsertCartItem race condition (data integrity, add DB unique constraint)
5. **SEC-02** — Review image URL validation (security, one-line prefix check)
6. **ERR-01** — Products plain-object throws (correctness, all 404s currently return 500)
7. **ASYNC-02** — Shipped email fire-and-forget (reliability, move to queue)
8. **PROD-01** — R2 orphaned objects (cost, implement cleanup)
