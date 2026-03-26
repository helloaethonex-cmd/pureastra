import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware";
import {
  confirmPayment,
  createOrderPaymentAttempt,
} from "./payments.controller";

const router = Router();

router.post("/orders/:id/payments", requireAuth, createOrderPaymentAttempt);
router.post("/payments/:id/confirm", confirmPayment);

export default router;

