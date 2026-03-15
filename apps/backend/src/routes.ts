import { Router } from "express";
import usersRoute from "./modules/users/users.route";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

router.use("/users", usersRoute);

export default router;
