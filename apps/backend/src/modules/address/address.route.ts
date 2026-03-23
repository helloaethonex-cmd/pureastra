import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  listAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "./address.controller";

const router = Router();

// All address routes require authentication
router.use(requireAuth);

// ─────────────────────────────────────────────────────────────────────────────
// ADDRESS ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/addresses:
 *   get:
 *     tags:
 *       - Addresses
 *     summary: List user addresses
 *     description: >
 *       Returns all saved addresses for the authenticated user, ordered by
 *       default first then most recently created.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Array of addresses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Address'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     tags:
 *       - Addresses
 *     summary: Create a new address
 *     description: >
 *       Saves a new address for the authenticated user. If `isDefault` is
 *       `true`, existing default addresses are unset automatically.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAddressBody'
 *           example:
 *             addressType: "SHIPPING"
 *             fullName: "Aarav Shah"
 *             phone: "+919876543210"
 *             line1: "42, MG Road"
 *             line2: "Bandra West"
 *             city: "Mumbai"
 *             state: "Maharashtra"
 *             postalCode: "400050"
 *             country: "INDIA"
 *             isDefault: true
 *     responses:
 *       201:
 *         description: Newly created address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
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
 */
router.get("/", listAddresses);
router.post("/", createAddress);

/**
 * @openapi
 * /api/v1/addresses/{id}:
 *   get:
 *     tags:
 *       - Addresses
 *     summary: Get an address
 *     description: Returns a single address by ID. Only the owner can access it.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric address ID
 *         example: "3"
 *     responses:
 *       200:
 *         description: Address detail
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Address belongs to a different user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   patch:
 *     tags:
 *       - Addresses
 *     summary: Update an address
 *     description: >
 *       Partially updates an address. Only the owner can update it.
 *       If `isDefault` is flipped to `true`, previous defaults are cleared.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric address ID
 *         example: "3"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAddressBody'
 *           example:
 *             phone: "+919999999999"
 *             postalCode: "400051"
 *     responses:
 *       200:
 *         description: Updated address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
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
 *       403:
 *         description: Forbidden — address belongs to another user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   delete:
 *     tags:
 *       - Addresses
 *     summary: Delete an address
 *     description: Permanently removes an address. Only the owner can delete it.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric address ID
 *         example: "3"
 *     responses:
 *       200:
 *         description: Address deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Address deleted successfully"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", getAddress);
router.patch("/:id", updateAddress);
router.delete("/:id", deleteAddress);

/**
 * @openapi
 * /api/v1/addresses/{id}/default:
 *   patch:
 *     tags:
 *       - Addresses
 *     summary: Set address as default
 *     description: >
 *       Marks the specified address as the user's default, and unsets any
 *       previous default. Only the owner can update it.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric address ID
 *         example: "3"
 *     responses:
 *       200:
 *         description: Updated address now marked as default
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Address not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/default", setDefaultAddress);

export default router;
