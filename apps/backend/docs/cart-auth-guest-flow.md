# Cart Auth and Guest Flow

## Purpose
This document defines the exact cart behavior for authenticated users and guests, including required headers, endpoint behavior, and error cases.

## Scope
- Backend module: `src/modules/cart`
- Auth middleware: `src/modules/auth/auth.middleware.ts`
- Frontend API client: `apps/frontend/src/services/api.ts`

## Core Rules
1. Authenticated requests are identified by Better Auth session cookie.
2. Guest requests must provide `x-session-id` (or `sessionId` query param for `GET /cart`).
3. Mixed guest/auth endpoints use `optionalAuth`:
   - If cookie session exists, backend uses user cart.
   - If not, backend falls back to guest cart resolution.
4. Item update/delete and cart clear are authenticated-only and scoped to the caller's active cart.

## Cart Status Model
- `0`: `ACTIVE` (editable current cart)
- `1`: `CHECKED_OUT` (historical cart after order placement)
- `2`: `ABANDONED` (inactive/merged guest cart)

## Endpoint Behavior

### `GET /api/v1/cart`
- Middleware: `optionalAuth`
- Authenticated:
  - resolves by `userId + status=ACTIVE`
  - creates new active cart if missing
- Guest:
  - requires `x-session-id` header or `sessionId` query
  - resolves by `sessionId + status=ACTIVE`
  - creates new active cart if missing
- Errors:
  - `400 SESSION_ID_REQUIRED` if guest request has no session identifier

Example guest request:
```http
GET /api/v1/cart
x-session-id: guest-abc-123
```

Example authenticated request:
```http
GET /api/v1/cart
Cookie: better-auth.session_token=...
```

### `POST /api/v1/cart/items`
- Middleware: `optionalAuth`
- Body:
```json
{
  "productVariantId": "5",
  "quantity": 2
}
```
- Authenticated:
  - writes item to authenticated user's active cart
- Guest:
  - requires `x-session-id`
  - writes item to guest active cart
- Behavior:
  - if variant already exists in target cart, quantity is incremented
  - `priceSnapshot` is updated from current variant price
- Errors:
  - `400` invalid payload or missing guest session id
  - `404` product variant not found/deleted

### `PATCH /api/v1/cart/items/:itemId`
- Middleware: `requireAuth`
- Body:
```json
{
  "quantity": 3
}
```
- Behavior:
  - updates quantity only if item belongs to caller's `ACTIVE` cart
- Errors:
  - `401` if not authenticated
  - `404 CART_ITEM_NOT_FOUND` if item is not in caller's active cart

### `DELETE /api/v1/cart/items/:itemId`
- Middleware: `requireAuth`
- Behavior:
  - removes item only if item belongs to caller's `ACTIVE` cart
- Errors:
  - `401` if not authenticated
  - `404 CART_ITEM_NOT_FOUND` if item is not in caller's active cart

### `DELETE /api/v1/cart`
- Middleware: `requireAuth`
- Behavior:
  - clears all items in caller's `ACTIVE` cart
  - no cart creation side effect
  - if no active cart exists, returns success no-op
- Response:
```json
{
  "message": "Cart cleared"
}
```

### `POST /api/v1/cart/merge`
- Middleware: `requireAuth`
- Body:
```json
{
  "sessionId": "guest-abc-123"
}
```
- Behavior:
  - moves items from guest active cart to caller's active cart
  - increments quantities for duplicate variants
  - marks guest cart as `ABANDONED`
- Errors:
  - `401` unauthenticated
  - `404` guest cart missing or empty

## Security Guarantees
1. Item mutation endpoints (`PATCH/DELETE /cart/items/:itemId`) are ownership-scoped by:
   - `cart.userId == req.user.id`
   - `cart.status == ACTIVE`
2. `DELETE /cart` is authenticated and only affects caller's active cart.
3. Guest operations are isolated by explicit session identifier.

## Known Frontend Integration Requirement
For guest usage, frontend must always attach `x-session-id` to:
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`

If missing, backend returns:
```json
{
  "error": "Session ID is required for guest cart operations",
  "code": "SESSION_ID_REQUIRED"
}
```

## Edge Cases Matrix
1. Logged-in user with valid cookie, no `x-session-id`:
   - Works (resolved as authenticated user cart)
2. Guest user, missing `x-session-id`:
   - `400 SESSION_ID_REQUIRED`
3. Authenticated user tries to patch/delete another user's cart item:
   - `404 CART_ITEM_NOT_FOUND`
4. Authenticated user clears cart with no active cart:
   - `200` no-op response
5. Product variant removed/deactivated before add:
   - `404 Product variant not found`

## Operational Notes
1. Repeated `GET /cart` `400` logs usually indicate frontend guest requests without `x-session-id`.
2. Cart query retries for this endpoint should remain disabled client-side to avoid 4xx log spam.
