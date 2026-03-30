import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  createWishlistItem,
  deleteWishlistItem,
  listWishlistItems,
  moveWishlistItem,
} from "./wishlist.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/wishlist:
 *   get:
 *     tags:
 *       - Wishlist
 *     summary: List my wishlist items
 *     description: >
 *       Returns all wishlist items for the authenticated user (single default wishlist model).
 *       Results are ordered by `createdAt` descending (newest first).
 *       Items are returned even if product/variant becomes inactive/deleted, and include
 *       `isAvailable` so UI can show unavailable state instead of silently dropping items.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wishlist items fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "12"
 *                   userId:
 *                     type: string
 *                     example: "5"
 *                   productVariantId:
 *                     type: string
 *                     example: "42"
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-03-30T18:20:41.231Z"
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2026-03-30T18:20:41.231Z"
 *                   isAvailable:
 *                     type: boolean
 *                     example: true
 *                   productVariant:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "42"
 *                       variantName:
 *                         type: string
 *                         nullable: true
 *                         example: "Blue / M"
 *                       sku:
 *                         type: string
 *                         nullable: true
 *                         example: "TSHIRT-BLU-M"
 *                       price:
 *                         type: string
 *                         nullable: true
 *                         example: "1299.00"
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       deletedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       product:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "10"
 *                           uuid:
 *                             type: string
 *                             format: uuid
 *                             example: "d7c9318f-f8f9-4b9b-b497-6459be4fdf85"
 *                           name:
 *                             type: string
 *                             example: "Cotton T-Shirt"
 *                           slug:
 *                             type: string
 *                             nullable: true
 *                             example: "cotton-tshirt"
 *                           brand:
 *                             type: string
 *                             nullable: true
 *                             example: "Pureastra"
 *                           isActive:
 *                             type: boolean
 *                             example: true
 *                           deletedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             example: null
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "7"
 *                             imageUrl:
 *                               type: string
 *                               nullable: true
 *                               example: "https://cdn.example.com/products/10/hero.jpg"
 *                             position:
 *                               type: integer
 *                               nullable: true
 *                               example: 0
 *             example:
 *               - id: "12"
 *                 userId: "5"
 *                 productVariantId: "42"
 *                 createdAt: "2026-03-30T18:20:41.231Z"
 *                 updatedAt: "2026-03-30T18:20:41.231Z"
 *                 isAvailable: true
 *                 productVariant:
 *                   id: "42"
 *                   variantName: "Blue / M"
 *                   sku: "TSHIRT-BLU-M"
 *                   price: "1299.00"
 *                   isActive: true
 *                   deletedAt: null
 *                   product:
 *                     id: "10"
 *                     uuid: "d7c9318f-f8f9-4b9b-b497-6459be4fdf85"
 *                     name: "Cotton T-Shirt"
 *                     slug: "cotton-tshirt"
 *                     brand: "Pureastra"
 *                     isActive: true
 *                     deletedAt: null
 *                   images:
 *                     - id: "7"
 *                       imageUrl: "https://cdn.example.com/products/10/hero.jpg"
 *                       position: 0
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 */
router.get("/", requireAuth, listWishlistItems);

/**
 * @openapi
 * /api/v1/wishlist/items:
 *   post:
 *     tags:
 *       - Wishlist
 *     summary: Add item to wishlist (idempotent)
 *     description: >
 *       Adds a `productVariantId` to the authenticated user's wishlist.
 *       If the same variant already exists in wishlist, the existing item is returned
 *       (idempotent behavior; no duplicates are created).
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productVariantId
 *             properties:
 *               productVariantId:
 *                 type: string
 *                 example: "42"
 *           example:
 *             productVariantId: "42"
 *     responses:
 *       201:
 *         description: Wishlist item created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "12"
 *                 userId:
 *                   type: string
 *                   example: "5"
 *                 productVariantId:
 *                   type: string
 *                   example: "42"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       200:
 *         description: Item already existed in wishlist (idempotent add)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "12"
 *                 userId:
 *                   type: string
 *                   example: "5"
 *                 productVariantId:
 *                   type: string
 *                   example: "42"
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Validation error (invalid payload)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid request payload"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Product variant not found / inactive / deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Product variant not found"
 *                 code:
 *                   type: string
 *                   example: "VARIANT_NOT_FOUND"
 */
router.post("/items", requireAuth, createWishlistItem);

/**
 * @openapi
 * /api/v1/wishlist/items/{productVariantId}:
 *   delete:
 *     tags:
 *       - Wishlist
 *     summary: Remove item from wishlist (idempotent)
 *     description: >
 *       Removes a variant from wishlist. If the item does not exist,
 *       the endpoint still returns success (idempotent remove).
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productVariantId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product variant ID to remove
 *         example: "42"
 *     responses:
 *       200:
 *         description: Wishlist item removed (or already absent)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Wishlist item removed"
 *       400:
 *         description: Validation error (invalid path param)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid request payload"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 */
router.delete("/items/:productVariantId", requireAuth, deleteWishlistItem);

/**
 * @openapi
 * /api/v1/wishlist/items/{productVariantId}/move-to-cart:
 *   post:
 *     tags:
 *       - Wishlist
 *     summary: Move wishlist item to cart
 *     description: >
 *       Adds quantity `1` of the specified variant to the authenticated user's active cart,
 *       then removes the item from wishlist.
 *       Edge cases:
 *       - If wishlist item is missing, returns 404.
 *       - If variant is missing/deleted before cart add, returns 404.
 *       - If wishlist item exists but product/variant is unavailable, returns 409.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productVariantId
 *         required: true
 *         schema:
 *           type: string
 *         example: "42"
 *     responses:
 *       200:
 *         description: Item moved to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item moved to cart"
 *       400:
 *         description: Validation error (invalid path param)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid request payload"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Unauthorized"
 *       404:
 *         description: Wishlist item not found, or variant disappeared during cart add
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Wishlist item not found"
 *                 code:
 *                   type: string
 *                   example: "WISHLIST_ITEM_NOT_FOUND"
 *             examples:
 *               wishlistMissing:
 *                 value:
 *                   error: "Wishlist item not found"
 *                   code: "WISHLIST_ITEM_NOT_FOUND"
 *               variantMissingAtMove:
 *                 value:
 *                   error: "Product variant not found"
 *                   code: "MOVE_TO_CART_FAILED"
 *       409:
 *         description: Wishlist item exists but is unavailable to add to cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Wishlist item is unavailable and cannot be moved to cart"
 *                 code:
 *                   type: string
 *                   example: "WISHLIST_ITEM_UNAVAILABLE"
 *       500:
 *         description: Unexpected internal error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 */
router.post("/items/:productVariantId/move-to-cart", requireAuth, moveWishlistItem);

export default router;
