import { Router } from "express";
import { optionalAuth, requireAuth } from "../auth/auth.middleware";
import {
  getCart,
  addItem,
  patchItem,
  deleteItem,
  emptyCart,
  mergeGuestCart,
} from "./cart.controller";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// CART ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/cart:
 *   get:
 *     tags:
 *       - Cart
 *     summary: Get active cart
 *     description: >
 *       Returns the current active cart. If the caller is authenticated the
 *       cart is looked up by `userId`; otherwise by `sessionId` provided via
 *       the `x-session-id` request header or `sessionId` query param.
 *       For guest requests, `sessionId` is required. Authentication is resolved
 *       from session cookies when present (optional auth).
 *       A new cart is created automatically if none exists.
 *     parameters:
 *       - in: header
 *         name: x-session-id
 *         schema:
 *           type: string
 *         description: Guest session identifier (used when unauthenticated)
 *         example: "guest-abc-123"
 *     responses:
 *       200:
 *         description: Active cart with items
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *             examples:
 *               authenticatedCart:
 *                 summary: Authenticated user's active cart
 *                 value:
 *                   id: "101"
 *                   userId: "42"
 *                   sessionId: null
 *                   status: 0
 *                   items: []
 *                   createdAt: "2026-04-03T06:00:00.000Z"
 *                   updatedAt: "2026-04-03T06:00:00.000Z"
 *               guestCart:
 *                 summary: Guest session cart
 *                 value:
 *                   id: "102"
 *                   userId: null
 *                   sessionId: "guest-abc-123"
 *                   status: 0
 *                   items: []
 *                   createdAt: "2026-04-03T06:00:00.000Z"
 *                   updatedAt: "2026-04-03T06:00:00.000Z"
 *       400:
 *         description: Missing session ID for guest request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Session ID is required for guest cart operations"
 *               code: "SESSION_ID_REQUIRED"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", optionalAuth, getCart);

/**
 * @openapi
 * /api/v1/cart:
 *   delete:
 *     tags:
 *       - Cart
 *     summary: Clear cart
 *     description: >
 *       Removes all items from the authenticated user's active cart.
 *       If no active cart exists, this is treated as a successful no-op.
 *       **Requires authentication.**
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared (or already empty)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Cart cleared"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/", optionalAuth, emptyCart);

// ─────────────────────────────────────────────────────────────────────────────
// CART ITEM ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/cart/items:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Add item to cart
 *     description: >
 *       Adds a product variant to the active cart. If the variant already
 *       exists in the cart the quantities are summed. The cart is resolved
 *       automatically (see GET /cart). Works for both authenticated users and
 *       guest sessions. For guest requests, `x-session-id` is required.
 *       Authentication is resolved from session cookies when present (optional auth).
 *     parameters:
 *       - in: header
 *         name: x-session-id
 *         schema:
 *           type: string
 *         description: Guest session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddCartItemBody'
 *           example:
 *             productVariantId: "5"
 *             quantity: 2
 *     responses:
 *       201:
 *         description: Cart item created or updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 *             example:
 *               id: "501"
 *               quantity: 2
 *               priceSnapshot: "299.00"
 *               productVariant:
 *                 id: "5"
 *                 variantName: "250ml"
 *                 product:
 *                   id: "11"
 *                   name: "Botanical Repair Shampoo"
 *                   slug: "botanical-repair-shampoo"
 *       400:
 *         description: Validation error or missing session ID for guest request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidQuantity:
 *                 value:
 *                   error: "Invalid request payload"
 *               missingGuestSession:
 *                 value:
 *                   error: "Session ID is required for guest cart operations"
 *                   code: "SESSION_ID_REQUIRED"
 *       404:
 *         description: Product variant not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Product variant not found"
 */
router.post("/items", optionalAuth, addItem);

/**
 * @openapi
 * /api/v1/cart/items/{itemId}:
 *   patch:
 *     tags:
 *       - Cart
 *     summary: Update cart item quantity
 *     description: >
 *       Sets the quantity of an existing cart item to the provided value.
 *       **Requires authentication.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric cart item ID
 *         example: "12"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartItemBody'
 *           example:
 *             quantity: 3
 *     responses:
 *       200:
 *         description: Updated cart item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartItem'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Cart item not found in user's active cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Cart item not found"
 *               code: "CART_ITEM_NOT_FOUND"
 *
 *   delete:
 *     tags:
 *       - Cart
 *     summary: Remove item from cart
 *     description: Permanently removes a single item from the cart. **Requires authentication.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric cart item ID
 *         example: "12"
 *     responses:
 *       200:
 *         description: Item removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Item removed from cart"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Cart item not found in user's active cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Cart item not found"
 *               code: "CART_ITEM_NOT_FOUND"
 */
router.patch("/items/:itemId", optionalAuth, patchItem);
router.delete("/items/:itemId", optionalAuth, deleteItem);

// ─────────────────────────────────────────────────────────────────────────────
// MERGE ROUTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/cart/merge:
 *   post:
 *     tags:
 *       - Cart
 *     summary: Merge guest cart into user cart
 *     description: >
 *       After a user logs in, call this endpoint to merge their guest
 *       session-based cart into their authenticated user cart.
 *       Existing variant quantities in the user cart are incremented; new
 *       variants are appended. The guest cart is then set to ABANDONED.
 *       **Requires authentication.**
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MergeCartBody'
 *           example:
 *             sessionId: "guest-abc-123"
 *     responses:
 *       200:
 *         description: Merged user cart
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Guest cart not found or empty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/merge", requireAuth, mergeGuestCart);

export default router;
