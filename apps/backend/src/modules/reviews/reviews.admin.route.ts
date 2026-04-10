import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import {
  adminCreateMetric,
  adminAddReviewMetric,
  adminAssignMetric,
  adminRemoveMetric,
  adminModerateReview,
  adminDeleteReview,
} from "./reviews.controller";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN REVIEW ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/admin/reviews/metrics:
 *   post:
 *     tags:
 *       - Admin - Reviews
 *     summary: Create a review metric definition
 *     description: >
 *       Creates a new metric that can be assigned to products for structured
 *       reviews. Example: "Brightening" with unit PERCENT.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               minValue:
 *                 type: integer
 *                 default: 0
 *               maxValue:
 *                 type: integer
 *                 default: 100
 *               unit:
 *                 type: string
 *                 enum: [PERCENT, RATING]
 *                 default: PERCENT
 *     responses:
 *       201:
 *         description: Metric created
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 */
router.post("/metrics", requireAuth, requireRole("admin"), adminCreateMetric);

/**
 * @openapi
 * /api/v1/admin/reviews/products/{productId}/metrics:
 *   post:
 *     tags:
 *       - Admin - Reviews
 *     summary: Assign a metric to a product
 *     description: >
 *       Links a review metric to a product so users can rate that metric
 *       when reviewing the product. **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [metricId]
 *             properties:
 *               metricId:
 *                 type: string
 *               displayOrder:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Metric assigned
 *       404:
 *         description: Product or metric not found
 *       409:
 *         description: Metric already assigned
 */
router.post(
  "/products/:productId/metrics",
  requireAuth,
  requireRole("admin"),
  adminAssignMetric,
);

/**
 * @openapi
 * /api/v1/admin/reviews/products/{productId}/add-review-metric:
 *   post:
 *     tags:
 *       - Admin - Reviews
 *     summary: Create metric and assign it to a product in one call
 *     description: >
 *       Upserts a metric by name and maps it to the product with display order.
 *       Useful for quickly attaching product-specific review metrics.
 *       **Requires admin role.**
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               minValue:
 *                 type: integer
 *                 default: 0
 *               maxValue:
 *                 type: integer
 *                 default: 100
 *               unit:
 *                 type: string
 *                 enum: [PERCENT, RATING]
 *                 default: PERCENT
 *               displayOrder:
 *                 type: integer
 *                 default: 0
 *     responses:
 *       201:
 *         description: Metric upserted and assigned to product
 */
router.post(
  "/products/:productId/add-review-metric",
  requireAuth,
  requireRole("admin"),
  adminAddReviewMetric,
);

/**
 * @openapi
 * /api/v1/admin/reviews/products/{productId}/metrics/{metricId}:
 *   delete:
 *     tags:
 *       - Admin - Reviews
 *     summary: Remove a metric from a product
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: metricId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Metric removed
 *       404:
 *         description: Assignment not found
 */
router.delete(
  "/products/:productId/metrics/:metricId",
  requireAuth,
  requireRole("admin"),
  adminRemoveMetric,
);

/**
 * @openapi
 * /api/v1/admin/reviews/{reviewId}/moderate:
 *   patch:
 *     tags:
 *       - Admin - Reviews
 *     summary: Approve or reject a review
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isApproved]
 *             properties:
 *               isApproved:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Review updated
 *       404:
 *         description: Review not found
 */
router.patch(
  "/:reviewId/moderate",
  requireAuth,
  requireRole("admin"),
  adminModerateReview,
);

/**
 * @openapi
 * /api/v1/admin/reviews/{reviewId}:
 *   delete:
 *     tags:
 *       - Admin - Reviews
 *     summary: Delete a review
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Review deleted
 *       404:
 *         description: Review not found
 */
router.delete(
  "/:reviewId",
  requireAuth,
  requireRole("admin"),
  adminDeleteReview,
);

export default router;
