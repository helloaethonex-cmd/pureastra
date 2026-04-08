import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  createReview,
  getReviews,
  getReviewMetrics,
  getReviewSummary,
} from "./reviews.controller";

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC / USER REVIEW ROUTES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @openapi
 * /api/v1/reviews:
 *   post:
 *     tags:
 *       - Reviews
 *     summary: Submit a product review
 *     description: >
 *       Creates a review for a product. One review per user per product.
 *       Automatically detects if the user has purchased the product and
 *       sets the verified purchase flag. Optionally accepts metric responses
 *       if the product has review metrics configured. **Requires authentication.**
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, rating]
 *             properties:
 *               productId:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               comment:
 *                 type: string
 *                 maxLength: 5000
 *               metrics:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     metricId:
 *                       type: string
 *                     value:
 *                       type: integer
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       409:
 *         description: User already reviewed this product
 */
router.post("/", requireAuth, createReview);

/**
 * @openapi
 * /api/v1/reviews/products/{productId}:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: List product reviews
 *     description: >
 *       Returns a paginated list of approved reviews for a product.
 *       Includes user info, images, and metric responses.
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, highest, lowest]
 *           default: newest
 *     responses:
 *       200:
 *         description: Paginated list of reviews
 */
router.get("/products/:productId", getReviews);

/**
 * @openapi
 * /api/v1/reviews/products/{productId}/metrics:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: Get review metrics for a product
 *     description: >
 *       Returns the list of review metrics configured for a product.
 *       Frontend uses this to render the metric input form.
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of review metrics
 */
router.get("/products/:productId/metrics", getReviewMetrics);

/**
 * @openapi
 * /api/v1/reviews/products/{productId}/summary:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: Get review summary for a product
 *     description: >
 *       Returns the aggregate review data: total reviews, average rating,
 *       and average values for each metric.
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review summary
 */
router.get("/products/:productId/summary", getReviewSummary);

export default router;
