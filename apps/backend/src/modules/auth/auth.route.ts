import { Router } from "express";
import { forgotPassword } from "./auth.controller";

const router = Router();

/**
 * @openapi
 * /api/v1/auth/forgot-password:
 *   post:
 *     tags:
 *       - Auth
 *     summary: Request password reset email
 *     description: >
 *       Sends a password reset link if the account exists. Always returns a generic
 *       success response to avoid user enumeration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               redirectTo:
 *                 type: string
 *                 format: uri
 *                 description: Optional frontend reset page URL
 *     responses:
 *       200:
 *         description: Generic success response
 */
router.post("/forgot-password", forgotPassword);

export default router;

