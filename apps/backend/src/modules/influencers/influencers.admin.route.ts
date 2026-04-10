import { Router } from "express";
import { requireAuth, requireRole } from "../auth/auth.middleware";
import {
  createInfluencer,
  listInfluencers,
  getInfluencer,
  updateInfluencerStatus,
  updateCommissionRate,
  updateDashboardAccess,
  listSales,
  updateSaleStatus,
  recordPayout,
  listPayouts,
  updatePayoutStatus,
} from "./influencers.controller";

const router = Router();

// All routes require admin role
const adminGuard = [requireAuth, requireRole("admin")];

// ─── Influencer CRUD ────────────────────────────────────────────────────────
router.post("/", ...adminGuard, createInfluencer);
router.get("/", ...adminGuard, listInfluencers);
router.get("/:id", ...adminGuard, getInfluencer);
router.patch("/:id/status", ...adminGuard, updateInfluencerStatus);
router.patch("/:id/commission", ...adminGuard, updateCommissionRate);
router.patch("/:id/dashboard-access", ...adminGuard, updateDashboardAccess);

// ─── Sales ─────────────────────────────────────────────────────────────────
router.get("/:id/sales", ...adminGuard, listSales);
router.patch("/sales/:saleId/status", ...adminGuard, updateSaleStatus);

// ─── Payouts ───────────────────────────────────────────────────────────────
router.post("/:id/payouts", ...adminGuard, recordPayout);
router.get("/:id/payouts", ...adminGuard, listPayouts);
router.patch("/payouts/:payoutId/status", ...adminGuard, updatePayoutStatus);

export default router;
