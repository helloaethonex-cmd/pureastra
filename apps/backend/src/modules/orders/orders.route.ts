import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import { createOrder } from "./orders.controller";

const router = Router();

router.post("/", requireAuth, createOrder);

export default router;

