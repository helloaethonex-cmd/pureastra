import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { getMe } from "./users.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/users/me:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current authenticated user
 *     description: >
 *       Returns the full profile of the user who owns the current session,
 *       including their assigned role. Requires a valid session cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: The authenticated user's profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: "1"
 *               publicId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *               email: "aarav@pureastra.com"
 *               phone: "+919876543210"
 *               name: "Aarav Shah"
 *               firstName: "Aarav"
 *               lastName: "Shah"
 *               image: "https://cdn.pureastra.com/avatars/aarav.jpg"
 *               isActive: true
 *               emailVerified: true
 *               phoneVerified: false
 *               role:
 *                 id: "2"
 *                 name: "admin"
 *                 createdAt: "2025-01-01T00:00:00.000Z"
 *                 updatedAt: "2025-01-01T00:00:00.000Z"
 *               createdAt: "2025-01-01T00:00:00.000Z"
 *               updatedAt: "2025-06-01T12:00:00.000Z"
 *       401:
 *         description: No valid session found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 */
router.get("/me", requireAuth, getMe);

/**
 * @openapi
 * /api/v1/users/admin:
 *   get:
 *     tags:
 *       - Users
 *     summary: Admin-only health probe
 *     description: >
 *       A protected route that verifies the caller holds the `admin` role.
 *       Useful as a permission smoke-test during development.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Caller is authenticated and has the admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageResponse'
 *             example:
 *               message: "Admin route"
 *       401:
 *         description: User is not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Unauthorized"
 *       403:
 *         description: User is authenticated but does not have the admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Forbidden"
 */
router.get("/admin", requireAuth, requireRole("admin"), (req, res) => {
    res.json({ message: "Admin route" });
})

export default router;