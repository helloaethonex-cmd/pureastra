import { Router } from "express";
import usersRoute from "./modules/users/users.route";
import productsRoute from "./modules/products/products.route";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/users", usersRoute);
router.use("/products", productsRoute);

export default router;
