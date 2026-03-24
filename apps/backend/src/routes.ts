import { Router } from "express";
import usersRoute from "./modules/users/users.route";
import productsRoute from "./modules/products/products.route";
import cartRoute from "./modules/cart/cart.route";
import addressRoute from "./modules/address/address.route";
import authRoute from "./modules/auth/auth.route";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/users", usersRoute);
router.use("/products", productsRoute);
router.use("/cart", cartRoute);
router.use("/addresses", addressRoute);
router.use("/auth", authRoute);

export default router;
