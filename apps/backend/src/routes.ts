import { Router } from "express";
import usersRoute from "./modules/users/users.route";
import productsRoute from "./modules/products/products.route";
import cartRoute from "./modules/cart/cart.route";
import addressRoute from "./modules/address/address.route";
import authRoute from "./modules/auth/auth.route";
import ordersRoute from "./modules/orders/orders.route";
import paymentsRoute from "./modules/payments/payments.route";
import uploadRoute from "./modules/upload/upload.route";
import wishlistRoute from "./modules/wishlist/wishlist.route";
import checkoutRoute from "./modules/checkout/checkout.route";
import reviewsRoute from "./modules/reviews/reviews.route";

// Admin routes
import ordersAdminRoute from "./modules/orders/orders.admin.route";
import reviewsAdminRoute from "./modules/reviews/reviews.admin.route";
import influencersAdminRoute from "./modules/influencers/influencers.admin.route";
import influencersRoute from "./modules/influencers/influencers.route";
import { invoiceUserRouter, invoiceAdminRouter } from "./modules/invoices/invoices.route";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

/**
 * @swagger
 * /api/v1/debug-sentry:
 *   get:
 *     summary: Test Sentry error tracking (Development only)
 *     description: Throws an intentional error to verify Sentry is capturing exceptions. Remove in production.
 *     tags:
 *       - Debug
 *     responses:
 *       500:
 *         description: Intentional error thrown for Sentry testing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */
router.get("/debug-sentry", (req, res) => {
  throw new Error("Sentry test error - This is intentional!");
});

// Customer routes
router.use("/users", usersRoute);
router.use("/products", productsRoute);
router.use("/cart", cartRoute);
router.use("/addresses", addressRoute);
router.use("/auth", authRoute);
router.use("/orders", ordersRoute);
router.use("/", paymentsRoute);
router.use("/upload", uploadRoute);
router.use("/wishlist", wishlistRoute);
router.use("/checkout", checkoutRoute);
router.use("/reviews", reviewsRoute);
router.use("/orders", invoiceUserRouter);

// Admin routes
router.use("/admin/orders", ordersAdminRoute);
router.use("/admin/orders", invoiceAdminRouter);
router.use("/admin/reviews", reviewsAdminRoute);
router.use("/admin/influencers", influencersAdminRoute);

// Influencer public routes
router.use("/influencers", influencersRoute);

export default router;
