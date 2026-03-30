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

// Admin routes
import ordersAdminRoute from "./modules/orders/orders.admin.route";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
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

// Admin routes
router.use("/admin/orders", ordersAdminRoute);

export default router;
