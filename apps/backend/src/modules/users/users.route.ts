import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import { getMe } from "./users.controller";

const router = Router();

router.get("/me", requireAuth, getMe);

router.get("/admin", requireAuth, requireRole("admin"), (req, res) => {
    res.json({ message: "Admin route" });
})

export default router;